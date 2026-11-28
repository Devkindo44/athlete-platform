"use client";

import { useState, useTransition } from "react";
import {
  createCustomerPortalSession,
  createSubscriptionCheckoutSession,
} from "@/features/billing/actions";

type SubscriptionPlansProps = {
  currentTier: "FREE" | "GOLD" | "PREMIUM";
  currentStatus: string | null;
  hasStripeCustomer: boolean;
};

export function SubscriptionPlans({
  currentTier,
  currentStatus,
  hasStripeCustomer,
}: SubscriptionPlansProps) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubscribe(tier: "GOLD" | "PREMIUM") {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await createSubscriptionCheckoutSession({ tier, interval });
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      window.location.assign(res.url);
    });
  }

  function handleOpenPortal() {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await createCustomerPortalSession();
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      window.location.assign(res.url);
    });
  }

  return (
    <section className="rounded border p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Abonnements Fan</h2>
          <p className="text-sm text-gray-600">
            Niveau actuel : <strong>{currentTier}</strong>
            {currentStatus ? ` (${currentStatus})` : ""}
          </p>
        </div>

        <div className="inline-flex rounded border p-1 text-xs">
          <button
            type="button"
            onClick={() => setInterval("month")}
            className={`rounded px-3 py-1 font-medium ${
              interval === "month" ? "bg-black text-white" : "text-gray-700"
            }`}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setInterval("year")}
            className={`rounded px-3 py-1 font-medium ${
              interval === "year" ? "bg-black text-white" : "text-gray-700"
            }`}
          >
            Annuel
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base">🥈 Fan Gold</h3>
            <span className="text-xs rounded bg-amber-100 text-amber-900 px-2 py-0.5 font-medium">
              {interval === "month" ? "Mensuel" : "Annuel"}
            </span>
          </div>
          <ul className="text-xs text-gray-700 space-y-1 list-disc pl-4">
            <li>Vidéos backstage, photos HD &amp; interviews privées</li>
            <li>Accès prioritaire aux annonces de compétitions</li>
            <li>Badge Gold dans les commentaires</li>
          </ul>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSubscribe("GOLD")}
            className="w-full rounded bg-black px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {isPending ? "Redirection..." : "Passer à Fan Gold"}
          </button>
        </article>

        <article className="rounded border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base">🥇 Fan Premium</h3>
            <span className="text-xs rounded bg-yellow-100 text-yellow-900 px-2 py-0.5 font-medium">
              {interval === "month" ? "Mensuel" : "Annuel"}
            </span>
          </div>
          <ul className="text-xs text-gray-700 space-y-1 list-disc pl-4">
            <li>Compétitions complètes en streaming / replay</li>
            <li>Sessions live Q&amp;A privées &amp; analyses d&apos;entraînement</li>
            <li>Badge Premium &amp; accès anticipé aux événements</li>
          </ul>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSubscribe("PREMIUM")}
            className="w-full rounded bg-black px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {isPending ? "Redirection..." : "Passer à Fan Premium"}
          </button>
        </article>
      </div>

      {hasStripeCustomer && (
        <div className="pt-2 border-t flex items-center justify-between gap-4">
          <span className="text-xs text-gray-600">
            Gérer votre moyen de paiement, facture ou résiliation :
          </span>
          <button
            type="button"
            disabled={isPending}
            onClick={handleOpenPortal}
            className="rounded border px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Ouvrir le portail Stripe
          </button>
        </div>
      )}

      {errorMessage && (
        <p className="text-xs text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </section>
  );
}