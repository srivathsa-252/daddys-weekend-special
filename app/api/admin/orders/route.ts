import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import {
  orderConfirmedTemplate,
  orderCancelledTemplate,
  partnerAssignedTemplate,
  orderDeliveredTemplate,
} from "@/emails/templates";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const limit = searchParams.get("limit");

  const where: Record<string, unknown> = {};
  if (status && status !== "ALL") where.status = status;
  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { menuItem: true } } },
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: Math.min(parseInt(limit, 10), 100) } : {}),
  });

  return NextResponse.json(orders);
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Order ID required" }, { status: 400 });

  let body: { action: string; partnerName?: string; partnerPhone?: string; estimatedDelivery?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { menuItem: true } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (body.action === "CONFIRM") {
    if (order.paymentStatus !== "PAID") {
      return NextResponse.json(
        { error: "Cannot confirm an order that has not been paid." },
        { status: 400 }
      );
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: "CONFIRMED" },
    });

    sendEmail(
      order.customerEmail,
      `Your Order ${order.orderNumber ? `#${String(order.orderNumber).padStart(4, "0")}` : ""} is Confirmed 🎉`,
      orderConfirmedTemplate({
        customerName: order.customerName,
        orderNumber: order.orderNumber!,
        items: order.items.map((i) => ({
          name: i.menuItem?.name ?? "Item",
          quantity: i.quantity,
          price: Number(i.price),
        })),
        total: Number(order.total),
      })
    ).catch((err) => console.error("Confirm email failed for order", id, err));

    return NextResponse.json(updated);
  }

  if (body.action === "CANCEL") {
    let refunded = false;

    // Issue Stripe refund if the order was already paid
    if (order.paymentStatus === "PAID" && order.stripePaymentIntentId) {
      try {
        await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId });
        refunded = true;
      } catch (err) {
        console.error("Stripe refund failed for order", id, err);
        return NextResponse.json(
          { error: "Refund failed. Please issue it manually in Stripe dashboard." },
          { status: 500 }
        );
      }
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: "CANCELLED",
        paymentStatus: refunded ? "REFUNDED" : order.paymentStatus,
      },
    });

    sendEmail(
      order.customerEmail,
      "Your Order Has Been Cancelled",
      orderCancelledTemplate({
        customerName: order.customerName,
        orderNumber: order.orderNumber!,
        refunded,
      })
    ).catch((err) => console.error("Cancel email failed for order", id, err));

    return NextResponse.json(updated);
  }

  if (body.action === "ASSIGN_PARTNER") {
    const { partnerName, partnerPhone, estimatedDelivery } = body;
    if (!partnerName || !partnerPhone || !estimatedDelivery) {
      return NextResponse.json({ error: "Partner name, phone, and estimated delivery are required" }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: "PARTNER_ASSIGNED",
        partnerName,
        partnerPhone,
        estimatedDelivery,
      },
    });

    sendEmail(
      order.customerEmail,
      "Your Delivery Partner is On the Way! 🚗",
      partnerAssignedTemplate({
        customerName: order.customerName,
        orderNumber: order.orderNumber!,
        partnerName,
        partnerPhone,
        estimatedDelivery,
      })
    ).catch((err) => console.error("Partner assigned email failed for order", id, err));

    return NextResponse.json(updated);
  }

  if (body.action === "MARK_DELIVERED") {
    const updated = await prisma.order.update({
      where: { id },
      data: { status: "DELIVERED" },
    });

    sendEmail(
      order.customerEmail,
      "Your Order Has Been Delivered! 🎉",
      orderDeliveredTemplate({
        customerName: order.customerName,
        orderNumber: order.orderNumber!,
      })
    ).catch((err) => console.error("Delivered email failed for order", id, err));

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
