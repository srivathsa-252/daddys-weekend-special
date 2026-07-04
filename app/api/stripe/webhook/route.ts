import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const order = await prisma.order.findUnique({
      where: { stripePaymentIntentId: pi.id },
    });
    if (order && order.paymentStatus !== "PAID") {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "PAID" },
      });
    }
  } else if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const order = await prisma.order.findUnique({
      where: { stripePaymentIntentId: pi.id },
    });
    if (order && order.paymentStatus === "PENDING") {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
