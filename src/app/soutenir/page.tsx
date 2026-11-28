import Link from "next/link";
import { db } from "@/prisma/db";
import { DonationForm } from "@/features/donations/components/donation-form";

type SoutenirPageProps = {
  searchParams: Promise<{ donation?: string }>;
};

export default async function SoutenirPage({ searchParams }: SoutenirPageProps) {
  const resolvedParams = await searchParams;

  const donations = await db.orm.public.Donation
    .where({ status: "SUCCEEDED", isPublicOnWall: true })
    .all();

  const sortedDonations = [...donations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Soutenir le projet sportif</h1>
          <p className="text-sm text-gray-600">
            Participez aux frais de préparation, déplacements et équipements.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/competitions" className="underline">
            Compétitions &amp; Médias
          </Link>
          <Link href="/dashboard" className="underline">
            Tableau de bord
          </Link>
        </div>
      </header>

      {resolvedParams.donation === "success" && (
        <p className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          Merci infiniment pour votre soutien ! Votre don a bien été pris en compte.
        </p>
      )}
      {resolvedParams.donation === "canceled" && (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Le paiement du don a été annulé.
        </p>
      )}

      <div className="grid gap-8 md:grid-cols-2 items-start">
        <DonationForm />

        <section className="rounded border p-6 space-y-4">
          <h2 className="text-lg font-semibold">
            Wall of Supporters ({sortedDonations.length})
          </h2>

          {sortedDonations.length === 0 ? (
            <p className="text-sm text-gray-600">
              Soyez le premier supporter à laisser un message d&apos;encouragement.
            </p>
          ) : (
            <ul className="space-y-3">
              {sortedDonations.map((d) => {
                const formattedAmount = (d.amountCents / 100).toFixed(2);
                const displayName = d.isAnonymous
                  ? "Supporter anonyme"
                  : d.donorName ?? "Supporter";

                return (
                  <li key={d.id} className="rounded border p-3 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{displayName}</span>
                      <span className="font-mono text-xs">
                        {formattedAmount} {d.currency.toUpperCase()}
                        {d.frequency === "MONTHLY" ? " / mois" : ""}
                      </span>
                    </div>
                    {d.message && (
                      <p className="text-xs text-gray-700 italic">
                        &laquo; {d.message} &raquo;
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}