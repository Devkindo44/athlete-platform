import Link from "next/link";
import { requireSession } from "@/features/auth/rbac";
import { getMyAthleteProfiles } from "@/features/athlete-profile/queries";
import {
  AthleteProfileForm,
  type AthleteProfileFormInitialData,
} from "@/features/athlete-profile/components/athlete-profile-form";

const PROFILE_ROLES = ["ATHLETE", "COACH", "ADMIN"] as const;

type DashboardPageProps = {
  searchParams: Promise<{
    edit?: string;
    new?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await requireSession();
  const canManageProfile = PROFILE_ROLES.includes(
    session.user.role as (typeof PROFILE_ROLES)[number]
  );
  const canAccessCoachZone =
    session.user.role === "COACH" || session.user.role === "ADMIN";

  const resolvedSearchParams = await searchParams;
  const profiles = canManageProfile ? await getMyAthleteProfiles() : [];

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
    <main className="p-8 space-y-8">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          {canAccessCoachZone && (
            <Link
              href="/coach-zone"
              className="text-sm underline text-gray-700 hover:text-black"
            >
              Accéder à l&apos;espace Coach &amp; Admin →
            </Link>
          )}
        </div>
        <p className="text-sm text-gray-600">
          Connecté en tant que <strong>{session.user.email}</strong> (Rôle :{" "}
          <code>{session.user.role}</code>)
        </p>
      </header>

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