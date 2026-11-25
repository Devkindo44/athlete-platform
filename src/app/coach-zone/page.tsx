import Link from "next/link";
import { requireRole } from "@/features/auth/rbac";
import { getAllAthleteProfilesWithUsers } from "@/features/athlete-profile/queries";

export default async function CoachZonePage() {
  const session = await requireRole(["COACH", "ADMIN"]);
  const profiles = await getAllAthleteProfilesWithUsers();

  return (
    <main className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm underline text-gray-600 hover:text-black"
        >
          ← Retour au tableau de bord
        </Link>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Espace Coach & Admin</h1>
        <p className="text-sm text-gray-600">
          Connecté en tant que <strong>{session.user.email}</strong> (Rôle :{" "}
          <code>{session.user.role}</code>)
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Profils athlètes</h2>
          <span className="text-sm text-gray-500">
            {profiles.length} profil{profiles.length > 1 ? "s" : ""}
          </span>
        </div>

        {profiles.length === 0 ? (
          <p className="text-sm text-gray-600">
            Aucun profil athlète enregistré pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium">Athlète</th>
                  <th className="px-4 py-3 font-medium">Discipline</th>
                  <th className="px-4 py-3 font-medium">Niveau</th>
                  <th className="px-4 py-3 font-medium">Objectif</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3 font-medium">Fiche</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/coach-zone/${profile.id}`}
                        className="font-medium underline hover:text-gray-700"
                      >
                        {profile.athleteName}
                      </Link>
                      {profile.athleteEmail && (
                        <div className="text-xs text-gray-500">
                          {profile.athleteEmail}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{profile.sport}</td>
                    <td className="px-4 py-3">{profile.level ?? "—"}</td>
                    <td className="px-4 py-3">{profile.goal ?? "—"}</td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      {profile.bio ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/coach-zone/${profile.id}`}
                        className="text-xs font-medium underline text-gray-700 hover:text-black"
                      >
                        Voir →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}