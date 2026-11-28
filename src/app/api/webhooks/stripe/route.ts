import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/prisma/db";
import { getStripe, mapStripePriceToTier } from "@/features/billing/stripe";

function mapStripeSubStatus(
  status: Stripe.Subscription.Status
): "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
      return "CANCELED";
    default:
      return "INCOMPLETE";
  }
}

async function syncSubscriptionRecord(sub: Stripe.Subscription, userIdHint?: number) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const firstItem = sub.items.data[0];
  const priceId = firstItem?.price?.id ?? null;
  const periodEndUnix = firstItem?.current_period_end ?? null;
  const currentPeriodEnd = periodEndUnix
    ? new Date(periodEndUnix * 1000)
    : null;

  let userId = userIdHint ?? Number(sub.metadata?.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    const user = await db.orm.public.User
      .where({ stripeCustomerId: customerId })
      .first();
    if (!user) return;
    userId = Number(user.id);
  }

  const tier =
    sub.status === "canceled" ? "FREE" : mapStripePriceToTier(priceId);
  const status = mapStripeSubStatus(sub.status);

  const existingSub = await db.orm.public.Subscription
    .where({ userId })
    .first();

  if (existingSub) {
    await db.orm.public.Subscription
      .where({ id: existingSub.id })
      .update({
        tier,
        status,
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId,
        currentPeriodEnd,
        cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      });
  } else {
    await db.orm.public.Subscription.create({
      userId,
      tier,
      status,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      currentPeriodEnd,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    });
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET manquant" },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Signature Stripe absente" },
      { status: 400 }
    );
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.metadata?.kind === "donation" && session.metadata.donationId) {
        const donationId = Number(session.metadata.donationId);
        if (Number.isInteger(donationId) && donationId > 0) {
          await db.orm.public.Donation
            .where({ id: donationId })
            .update({
              status: "SUCCEEDED",
              donorEmail: session.customer_details?.email ?? undefined,
              stripePaymentIntentId:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : undefined,
              stripeSubscriptionId:
                typeof session.subscription === "string"
                  ? session.subscription
                  : undefined,
            });
        }
      }

      if (session.mode === "subscription" && typeof session.subscription === "string") {
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        await syncSubscriptionRecord(sub, Number(session.metadata?.userId));
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscriptionRecord(sub);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

      if (customerId) {
        const user = await db.orm.public.User
          .where({ stripeCustomerId: customerId })
          .first();
        if (user) {
          const existingSub = await db.orm.public.Subscription
            .where({ userId: Number(user.id) })
            .first();
          if (existingSub) {
            await db.orm.public.Subscription
              .where({ id: existingSub.id })
              .update({ status: "PAST_DUE" });
          }
        }
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}