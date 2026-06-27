import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import {
  orderConfirmedTemplate,
  orderCancelledTemplate,
  partnerAssignedTemplate,
  outForDeliveryTemplate,
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

  let body: { action: string };
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
    const updated = await prisma.order.update({
      where: { id },
      data: { status: "CONFIRMED" },
    });

    sendEmail(
      order.customerEmail,
      "Your Order is Confirmed 🎉",
      orderConfirmedTemplate({
        customerName: order.customerName,
        orderId: order.id,
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
    const updated = await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    sendEmail(
      order.customerEmail,
      "Your Order Has Been Cancelled",
      orderCancelledTemplate({
        customerName: order.customerName,
        orderId: order.id,
        refunded: false,
      })
    ).catch((err) => console.error("Cancel email failed for order", id, err));

    return NextResponse.json(updated);
  }

  if (body.action === "ASSIGN_PARTNER") {
    const updated = await prisma.order.update({
      where: { id },
      data: { status: "PARTNER_ASSIGNED" },
    });

    sendEmail(
      order.customerEmail,
      "A Delivery Partner Has Been Assigned to Your Order",
      partnerAssignedTemplate({ customerName: order.customerName, orderId: order.id })
    ).catch((err) => console.error("Partner assigned email failed for order", id, err));

    return NextResponse.json(updated);
  }

  if (body.action === "OUT_FOR_DELIVERY") {
    const updated = await prisma.order.update({
      where: { id },
      data: { status: "OUT_FOR_DELIVERY" },
    });

    sendEmail(
      order.customerEmail,
      "Your Order is Out for Delivery! 🚗",
      outForDeliveryTemplate({ customerName: order.customerName, orderId: order.id })
    ).catch((err) => console.error("Out for delivery email failed for order", id, err));

    return NextResponse.json(updated);
  }

  if (body.action === "MARK_DELIVERED") {
    const updated = await prisma.order.update({
      where: { id },
      data: { status: "DELIVERED" },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
