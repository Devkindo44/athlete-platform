"use client";

import { useState, useTransition } from "react";
import { createDonationCheckoutSession } from "@/features/billing/actions";

const PRESET_AMOUNTS = [10, 25, 50, 100];

export function DonationForm() {
  const [amount, setAmount] = useState<number>(25);
  const [currency, setCurrency] = useState<string>("eur");
  const [frequency, setFrequency] = useState<"ONE_TIME" | "MONTHLY">("ONE_TIME");
  const [donorName, setDonorName] = useState<string>("");
  const [donorEmail, setDonorEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await createDonationCheckoutSession({
        amountEurOrUnit: amount,
        currency,
        frequency,
        donorName,
        donorEmail,
        message,
        isAnonymous,
        isPublicOnWall: true,
      });

      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }

      window.location.assign(res.url);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded border p-6 space-y-4">
      <h2 className="text-lg font-semibold">Faire un don</h2>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFrequency("ONE_TIME")}
          className={`flex-1 rounded border py-2 text-xs font-medium ${
            frequency === "ONE_TIME" ? "bg-black text-white" : "bg-white"
          }`}
        >
          Don ponctuel
        </button>
        <button
          type="button"
          onClick={() => setFrequency("MONTHLY")}
          className={`flex-1 rounded border py-2 text-xs font-medium ${
            frequency === "MONTHLY" ? "bg-black text-white" : "bg-white"
          }`}
        >
          Soutien mensuel
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {PRESET_AMOUNTS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(preset)}
            className={`rounded border py-2 text-sm font-medium ${
              amount === preset ? "border-black bg-gray-100" : ""
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label htmlFor="donation-amount" className="block text-xs font-medium mb-1">
            Montant libre
          </label>
          <input
            id="donation-amount"
            type="number"
            min={1}
            step="1"
            required
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="donation-currency" className="block text-xs font-medium mb-1">
            Devise
          </label>
          <select
            id="donation-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
          >
            <option value="eur">EUR (€)</option>
            <option value="usd">USD ($)</option>
            <option value="gbp">GBP (£)</option>
            <option value="cad">CAD ($)</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="donor-name" className="block text-xs font-medium mb-1">
          Votre nom ou pseudo
        </label>
        <input
          id="donor-name"
          type="text"
          disabled={isAnonymous}
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          placeholder="Ex. Camille R."
          className="w-full rounded border px-3 py-2 text-sm disabled:bg-gray-100"
        />
      </div>

      <div>
        <label htmlFor="donor-email" className="block text-xs font-medium mb-1">
          Email (pour confirmation / reçu)
        </label>
        <input
          id="donor-email"
          type="email"
          value={donorEmail}
          onChange={(e) => setDonorEmail(e.target.value)}
          placeholder="camille@exemple.fr"
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="donor-message" className="block text-xs font-medium mb-1">
          Message d&apos;encouragement (optionnel)
        </label>
        <textarea
          id="donor-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Bon courage pour la prochaine compétition !"
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-700">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
        />
        Masquer mon identité (don anonyme)
      </label>

      {errorMessage && (
        <p className="text-xs text-red-600" role="alert">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending
          ? "Redirection vers Stripe..."
          : frequency === "MONTHLY"
          ? `Soutenir avec ${amount} ${currency.toUpperCase()} / mois`
          : `Envoyer un don de ${amount} ${currency.toUpperCase()}`}
      </button>
    </form>
  );
}