import Stripe from "stripe";

let instance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!instance) {
    instance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-06-24.dahlia",
    });
  }
  return instance;
}
