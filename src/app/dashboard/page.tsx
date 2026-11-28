import Link from "next/link";
import { db } from "@/prisma/db";
import { requireSession } from "@/features/auth/rbac";
import { getMyAthleteProfiles } from "@/features/athlete-profile/queries";
import {
  AthleteProfileForm,
  type AthleteProfileFormInitialData,
} from "@/features/athlete-profile/components/athlete-profile-form";
import { SubscriptionPlans } from "@/features/billing/components/subscription-plans";

const PROFILE_ROLES = ["ATHLETE", "COACH", "ADMIN"] as const;

type DashboardPageProps = {
  searchParams: Promise<{
    edit?: string;
    new?: string;
    subscription?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await requireSession();
  const userId = Number(session.user.id);

  const canManageProfile = PROFILE_ROLES.includes(
    session.user.role as (typeof PROFILE_ROLES)[number]
  );
  const canAccessCoachZone =
    session.user.role === "COACH" || session.user.role === "ADMIN";

  const resolvedSearchParams = await searchParams;
  const profiles = canManageProfile ? await getMyAthleteProfiles() : [];

  const dbUser = await db.orm.public.User
    .where({ id: userId })
    .first();
  const subscription = await db.orm.public.Subscription
    .where({ userId })
    .first();

  const isSubActive =
    subscription &&
    (subscription.status === "ACTIVE" || subscription.status === "TRIALING") &&
    (!subscription.currentPeriodEnd ||
      new Date(subscription.currentPeriodEnd) > new Date());

  const currentTier: "FREE" | "GOLD" | "PREMIUM" = isSubActive
    ? (subscription.tier as "FREE" | "GOLD" | "PREMIUM")
    : "FREE";

  const requestedEditId = resolvedSearchParams.edit
    ? Number(resolvedSearchParams.edit)
    : null;
  const isCreatingNew = resolvedSearchParams.new === "1";

  const selectedProfile = isCreatingNew
    ? null
    : requestedEditId && Number.isInteger(requestedEditId)
    ? profiles.find((p) => Number(p.id) === requestedEditId) ?? profiles[0] ?? null
    : profiles[0] ?? null;

  const initialData: AthleteProfileFormInitialData | null = selectedProfile
    ? {
        id: Number(selectedProfile.id),
        sport: selectedProfile.sport,
        level: selectedProfile.level,
        goal: selectedProfile.goal,
        bio: selectedProfile.bio,
      }
    : null;

  return (
    <main className="p-8 space-y-8 max-w-6xl mx-auto">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/competitions" className="underline">
              Compétitions &amp; Médias
            </Link>
            <Link href="/soutenir" className="underline">
              Soutenir (Dons)
            </Link>
            {canAccessCoachZone && (
              <Link
                href="/coach-zone"
                className="underline text-gray-700 hover:text-black"
              >
                Espace Coach &amp; Admin →
              </Link>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Connecté en tant que <strong>{session.user.email}</strong> (Rôle :{" "}
          <code>{session.user.role}</code> · Niveau :{" "}
          <strong>{currentTier}</strong>)
        </p>
      </header>

      {resolvedSearchParams.subscription === "success" && (
        <p className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          Merci ! Votre abonnement est en cours de synchronisation.
        </p>
      )}
      {resolvedSearchParams.subscription === "canceled" && (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          La procédure d&apos;abonnement a été annulée.
        </p>
      )}

      <SubscriptionPlans
        currentTier={currentTier}
        currentStatus={subscription?.status ?? null}
        hasStripeCustomer={Boolean(dbUser?.stripeCustomerId)}
      />

      {canManageProfile ? (
        <div className="grid gap-8 md:grid-cols-2 items-start">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">
                Mes disciplines ({profiles.length})
              </h2>
              <Link
                href="/dashboard?new=1"
                className="rounded border px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
              >
                + Nouvelle discipline
              </Link>
            </div>

            {profiles.length === 0 ? (
              <p className="text-sm text-gray-600">
                Aucune discipline enregistrée pour le moment. Utilisez le
                formulaire pour créer votre premier profil sportif.
              </p>
            ) : (
              <ul className="space-y-3">
                {profiles.map((profile) => {
                  const isSelected =
                    !isCreatingNew &&
                    selectedProfile &&
                    Number(selectedProfile.id) === Number(profile.id);

                  return (
                    <li
                      key={profile.id}
                      className={`rounded border p-4 space-y-1 ${
                        isSelected ? "border-black bg-gray-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{profile.sport}</span>
                        <Link
                          href={`/dashboard?edit=${profile.id}`}
                          className="text-xs underline text-gray-700 hover:text-black"
                        >
                          Modifier
                        </Link>
                      </div>
                      <p className="text-xs text-gray-600">
                        Niveau : {profile.level ?? "Non renseigné"}
                      </p>
                      {profile.goal && (
                        <p className="text-xs text-gray-600">
                          Objectif : {profile.goal}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">
              {initialData
                ? `Modifier : ${initialData.sport}`
                : "Ajouter une discipline"}
            </h2>
            <AthleteProfileForm initialData={initialData} />
          </section>
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          Votre compte possède actuellement le rôle <code>MEMBER</code>. Passez
          au rôle <code>ATHLETE</code> pour configurer un profil sportif.
        </p>
      )}
    </main>
  );
}