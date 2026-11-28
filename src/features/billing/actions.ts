"use server";

import { db } from "@/prisma/db";
import { requireSession } from "@/features/auth/rbac";
import {
  getOrCreateStripeCustomer,
  getPriceIdForTier,
  getStripe,
  type PaidTier,
} from "./stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const SUPPORTED_CURRENCIES = new Set(["eur", "usd", "gbp", "cad"]);

export type CheckoutActionResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createSubscriptionCheckoutSession(input: {
  tier: PaidTier;
  interval: "month" | "year";
}): Promise<CheckoutActionResult> {
  const session = await requireSession();
  const userId = Number(session.user.id);

  const dbUser = await db.orm.public.User
    .where({ id: userId })
    .first();

  if (!dbUser) {
    return { ok: false, error: "Utilisateur introuvable." };
  }

  try {
    const customerId = await getOrCreateStripeCustomer(dbUser);
    const priceId = getPriceIdForTier(input.tier, input.interval);
    const stripe = getStripe();

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/dashboard?subscription=success`,
      cancel_url: `${APP_URL}/dashboard?subscription=canceled`,
      metadata: {
        kind: "subscription",
        userId: String(dbUser.id),
        tier: input.tier,
      },
      subscription_data: {
        metadata: {
          userId: String(dbUser.id),
          tier: input.tier,
        },
      },
    });

    if (!checkout.url) {
      return { ok: false, error: "Impossible d'initialiser la session Stripe." };
    }

    return { ok: true, url: checkout.url };
  } catch (err) {
    console.error("createSubscriptionCheckoutSession error:", err);
    return { ok: false, error: "Erreur lors de la création de l'abonnement." };
  }
}

export async function createCustomerPortalSession(): Promise<CheckoutActionResult> {
  const session = await requireSession();
  const userId = Number(session.user.id);

  const dbUser = await db.orm.public.User
    .where({ id: userId })
    .first();

  if (!dbUser?.stripeCustomerId) {
    return { ok: false, error: "Aucun abonnement actif à gérer." };
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    return_url: `${APP_URL}/dashboard`,
  });

  return { ok: true, url: portal.url };
}

export async function createDonationCheckoutSession(input: {
  amountEurOrUnit: number;
  currency?: string;
  frequency: "ONE_TIME" | "MONTHLY";
  donorName?: string;
  donorEmail?: string;
  message?: string;
  isAnonymous?: boolean;
  isPublicOnWall?: boolean;
  campaignSlug?: string;
}): Promise<CheckoutActionResult> {
  const amountCents = Math.round(Number(input.amountEurOrUnit) * 100);
  if (!Number.isFinite(amountCents) || amountCents < 100) {
    return { ok: false, error: "Le montant minimum du don est de 1,00." };
  }

  const currency = (input.currency ?? "eur").toLowerCase();
  if (!SUPPORTED_CURRENCIES.has(currency)) {
    return { ok: false, error: "Devise non prise en charge." };
  }

  const stripe = getStripe();
  const isRecurring = input.frequency === "MONTHLY";
  const donorName = input.isAnonymous
    ? "Supporter anonyme"
    : (input.donorName ?? "").trim() || null;
  const donorEmail = (input.donorEmail ?? "").trim() || null;
  const message = (input.message ?? "").trim() || null;
  const isPublicOnWall = input.isPublicOnWall ?? true;
  const campaignSlug = (input.campaignSlug ?? "").trim() || null;

  const createdDonation = await db.orm.public.Donation.create({
    donorName,
    donorEmail,
    amountCents,
    currency,
    frequency: input.frequency,
    status: "PENDING",
    message,
    isAnonymous: Boolean(input.isAnonymous),
    isPublicOnWall,
    campaignSlug,
  });

  const checkout = await stripe.checkout.sessions.create({
    mode: isRecurring ? "subscription" : "payment",
    customer_email: donorEmail ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amountCents,
          ...(isRecurring ? { recurring: { interval: "month" } } : {}),
          product_data: {
            name: isRecurring
              ? "Soutien mensuel à l'athlète"
              : "Don de soutien à l'athlète",
            description: campaignSlug ? `Campagne : ${campaignSlug}` : undefined,
          },
        },
      },
    ],
    success_url: `${APP_URL}/soutenir?donation=success`,
    cancel_url: `${APP_URL}/soutenir?donation=canceled`,
    metadata: {
      kind: "donation",
      donationId: String(createdDonation.id),
      frequency: input.frequency,
    },
  });

  if (!checkout.url) {
    return { ok: false, error: "Impossible de créer la session de don." };
  }

  return { ok: true, url: checkout.url };
}