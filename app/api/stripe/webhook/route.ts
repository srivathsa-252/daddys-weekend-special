import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const pi = event.data.object as Stripe.PaymentIntent;

  if (event.type === "payment_intent.succeeded") {
    // Guard against duplicate events — don't overwrite REFUNDED status
    await prisma.order.updateMany({
      where: {
        stripePaymentIntentId: pi.id,
        paymentStatus: { notIn: ["PAID", "REFUNDED"] },
      },
      data: { paymentStatus: "PAID" },
    });
  }

  if (event.type === "payment_intent.payment_failed") {
    await prisma.order.updateMany({
      where: {
        stripePaymentIntentId: pi.id,
        paymentStatus: { notIn: ["PAID", "REFUNDED"] },
      },
      data: { paymentStatus: "FAILED" },
    });
  }

  return NextResponse.json({ received: true });
}
