import Link from "next/link";
import {
  getPublishedCompetitionsWithMedia,
  getViewerAccessTier,
} from "@/features/media/service";

export default async function CompetitionsPage() {
  const { tier: viewerTier, role: viewerRole } = await getViewerAccessTier();
  const competitions = await getPublishedCompetitionsWithMedia("fr");

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Compétitions &amp; Médias</h1>
          <p className="text-sm text-gray-600">
            Niveau d&apos;accès actif : <strong>{viewerTier}</strong>
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="underline">
            Tableau de bord &amp; Abonnements
          </Link>
          <Link href="/soutenir" className="underline">
            Soutenir (Dons)
          </Link>
        </div>
      </header>

      {competitions.length === 0 ? (
        <p className="text-sm text-gray-600">
          Aucune compétition publiée pour le moment.
        </p>
      ) : (
        <div className="space-y-6">
          {competitions.map((comp) => (
            <article key={comp.id} className="rounded border p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="text-xs uppercase font-semibold text-gray-500">
                    {comp.sport} · {comp.location} ·{" "}
                    {new Date(comp.eventDate).toLocaleDateString("fr-FR")}
                  </span>
                  <h2 className="text-xl font-bold">{comp.title}</h2>
                </div>
                <span className="rounded bg-gray-100 px-2.5 py-1 text-xs font-medium">
                  Accès : {comp.accessTier}
                </span>
              </div>

              {comp.resultSummary && (
                <p className="text-sm text-gray-700">
                  <strong>Résultat :</strong> {comp.resultSummary}
                </p>
              )}

              {comp.isLocked ? (
                <div className="rounded bg-amber-50 border border-amber-200 p-4 flex items-center justify-between gap-4">
                  <p className="text-sm text-amber-900">
                    Contenu réservé au niveau <strong>{comp.accessTier}</strong>.
                  </p>
                  <Link
                    href="/dashboard"
                    className="rounded bg-black px-3 py-1.5 text-xs font-medium text-white"
                  >
                    Débloquer l&apos;accès
                  </Link>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 text-sm">
                  {comp.streamUrl && (
                    <a
                      href={comp.streamUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-medium"
                    >
                      Voir le streaming / replay →
                    </a>
                  )}
                  {comp.externalUrl && (
                    <a
                      href={comp.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-gray-700"
                    >
                      Lien officiel de la compétition →
                    </a>
                  )}
                </div>
              )}

              {comp.media.length > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <h3 className="text-sm font-semibold">Médias associés</h3>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {comp.media.map((m) => (
                      <li key={m.id} className="rounded border p-3 text-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{m.title}</span>
                          <span className="text-xs text-gray-500">
                            {m.type} · {m.accessTier}
                          </span>
                        </div>
                        {m.isLocked ? (
                          <p className="text-xs text-amber-700">
                            Verrouillé (niveau {m.accessTier} requis)
                          </p>
                        ) : (
                          m.playbackUrl && (
                            <a
                              href={m.playbackUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs underline text-blue-700"
                            >
                              Ouvrir le média →
                            </a>
                          )
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}