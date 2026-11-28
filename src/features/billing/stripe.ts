import Stripe from "stripe";
import { db } from "@/prisma/db";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Variable d'environnement STRIPE_SECRET_KEY manquante.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2026-02-25.clover",
    });
  }

  return stripeClient;
}

export type PaidTier = "GOLD" | "PREMIUM";

export function getPriceIdForTier(tier: PaidTier, interval: "month" | "year"): string {
  const map: Record<`${PaidTier}_${"month" | "year"}`, string | undefined> = {
    GOLD_month: process.env.STRIPE_PRICE_GOLD_MONTHLY,
    GOLD_year: process.env.STRIPE_PRICE_GOLD_YEARLY,
    PREMIUM_month: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    PREMIUM_year: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
  };

  const priceId = map[`${tier}_${interval}`];
  if (!priceId) {
    throw new Error(`Price ID Stripe non configuré pour ${tier} (${interval}).`);
  }
  return priceId;
}

export function mapStripePriceToTier(priceId?: string | null): "FREE" | "GOLD" | "PREMIUM" {
  if (!priceId) return "FREE";
  if (
    priceId === process.env.STRIPE_PRICE_PREMIUM_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PREMIUM_YEARLY
  ) {
    return "PREMIUM";
  }
  if (
    priceId === process.env.STRIPE_PRICE_GOLD_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_GOLD_YEARLY
  ) {
    return "GOLD";
  }
  return "FREE";
}

export async function getOrCreateStripeCustomer(user: {
  id: number;
  email: string;
  name?: string | null;
  stripeCustomerId?: string | null;
}): Promise<string> {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: String(user.id) },
  });

  await db.orm.public.User
    .where({ id: user.id })
    .update({ stripeCustomerId: customer.id });

  return customer.id;
}