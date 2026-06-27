import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/ratelimit";
import { sanitize } from "@/lib/sanitize";
import { getIP } from "@/lib/utils";
import { checkoutSchema } from "@/utils/validators";

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

  // Validate menu items exist and are available
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

  // Compute total from server-side prices (never trust client)
  const total = items.reduce((sum, item) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;
    return sum + Number(menuItem.price) * item.quantity;
  }, 0);

  const totalCents = Math.round(total * 100);

  // Create Stripe PaymentIntent
  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "gbp",
      automatic_payment_methods: { enabled: true },
      metadata: { customerEmail: sanitize(customerEmail) },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Stripe error";
    console.error("[payment-intent] Stripe error:", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Create Order + OrderItems in DB
  let order;
  try {
    order = await prisma.order.create({
      data: {
        customerName: sanitize(customerName),
        customerEmail: sanitize(customerEmail),
        customerPhone: sanitize(customerPhone),
        total: total,
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database error";
    console.error("[payment-intent] DB error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    orderId: order.id,
  });
}
