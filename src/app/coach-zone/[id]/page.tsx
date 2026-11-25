import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/features/auth/rbac";
import { getAthleteProfileById } from "@/features/athlete-profile/queries";

type AthleteDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AthleteDetailPage({
  params,
}: AthleteDetailPageProps) {
  await requireRole(["COACH", "ADMIN"]);

  const { id } = await params;
  const profileId = Number(id);

  if (!Number.isInteger(profileId) || profileId <= 0) {
    notFound();
  }

  const profile = await getAthleteProfileById(profileId);

  if (!profile) {
    notFound();
  }

  return (
    <main className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Link
          href="/coach-zone"
          className="text-sm underline text-gray-600 hover:text-black"
        >
          ← Retour à la liste des athlètes
        </Link>
        <span className="text-xs rounded bg-gray-100 px-2 py-1 font-mono">
          Profil #{profile.id}
        </span>
      </div>

      <header className="space-y-1 border-b pb-4">
        <h1 className="text-2xl font-bold">{profile.athleteName}</h1>
        {profile.athleteEmail && (
          <p className="text-sm text-gray-600">{profile.athleteEmail}</p>
        )}
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded border p-4 space-y-1">
          <div className="text-xs uppercase tracking-wide text-gray-500">
            Discipline sportive
          </div>
          <div className="font-medium">{profile.sport}</div>
        </div>

        <div className="rounded border p-4 space-y-1">
          <div className="text-xs uppercase tracking-wide text-gray-500">
            Niveau
          </div>
          <div className="font-medium">{profile.level ?? "Non renseigné"}</div>
        </div>

        <div className="rounded border p-4 space-y-1 sm:col-span-2">
          <div className="text-xs uppercase tracking-wide text-gray-500">
            Objectif principal
          </div>
          <div className="font-medium">{profile.goal ?? "Non renseigné"}</div>
        </div>
      </section>

      <section className="rounded border p-4 space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Présentation & Notes
        </h2>
        <p className="text-sm whitespace-pre-line text-gray-800">
          {profile.bio ?? "Aucune note renseignée par l'athlète."}
        </p>
      </section>
    </main>
  );
}