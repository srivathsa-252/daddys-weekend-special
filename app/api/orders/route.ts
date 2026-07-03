import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ratelimit";
import { sanitize } from "@/lib/sanitize";
import { getIP } from "@/lib/utils";
import { checkoutSchema } from "@/utils/validators";

export async function GET(req: NextRequest) {
  const ip = getIP(req);
  const { success } = await checkRateLimit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { menuItem: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const { success } = await checkRateLimit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { customerName, customerEmail, customerPhone, addressLine1, city, postcode, items } = parsed.data;

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: items.map((i) => i.menuItemId) },
      isAvailable: true,
    },
  });

  if (menuItems.length !== items.length) {
    return NextResponse.json(
      { error: "One or more items are unavailable. Please refresh your cart." },
      { status: 400 }
    );
  }

  const total = items.reduce((sum, item) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;
    return sum + Number(menuItem.price) * item.quantity;
  }, 0);

  const order = await prisma.order.create({
    data: {
      customerName: sanitize(customerName),
      customerEmail: sanitize(customerEmail),
      customerPhone: sanitize(customerPhone),
      addressLine1: sanitize(addressLine1),
      city: sanitize(city),
      postcode: sanitize(postcode),
      total,
      status: "PENDING",
      paymentStatus: "PENDING",
      items: {
        create: items.map((item) => {
          const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;
          return {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: menuItem.price,
          };
        }),
      },
    },
  });

  return NextResponse.json({ orderId: order.id });
}
