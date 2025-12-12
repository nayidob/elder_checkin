import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

let cachedStripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (cachedStripe) return cachedStripe;

  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable");
  }

  cachedStripe = new Stripe(stripeSecretKey);
  return cachedStripe;
}

export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

