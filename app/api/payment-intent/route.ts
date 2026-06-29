import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/ratelimit";
import { sanitize } from "@/lib/sanitize";
import { getIP } from "@/lib/utils";
import { checkoutSchema } from "@/utils/validators";

async function generateOrderNumber(): Promise<number> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const existing = await prisma.order.findFirst({
      where: { orderNumber: num },
      select: { id: true },
    });
    if (!existing) return num;
  }
  throw new Error("Unable to generate unique order number");
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const { success } = await checkRateLimit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
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

  const { customerName, customerEmail, customerPhone, items } = parsed.data;

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

  // Recompute total server-side — never trust client prices
  const total = items.reduce((sum, item) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;
    return sum + Number(menuItem.price) * item.quantity;
  }, 0);

  const amountInPence = Math.round(total * 100);
  const orderNumber = await generateOrderNumber();

  const paymentIntent = await getStripe().paymentIntents.create({
    amount: amountInPence,
    currency: "gbp",
    receipt_email: sanitize(customerEmail),
    metadata: {
      customerName: sanitize(customerName),
      customerEmail: sanitize(customerEmail),
      orderNumber: String(orderNumber),
    },
  });

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName: sanitize(customerName),
      customerEmail: sanitize(customerEmail),
      customerPhone: sanitize(customerPhone),
      total,
      status: "PENDING",
      paymentStatus: "PENDING",
      stripePaymentIntentId: paymentIntent.id,
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

  // Add orderId to metadata so webhook can correlate without a DB lookup by PI id
  await getStripe().paymentIntents.update(paymentIntent.id, {
    metadata: { ...paymentIntent.metadata, orderId: order.id },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    orderId: order.id,
  });
}
