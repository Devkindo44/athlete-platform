import Link from "next/link";
import { resolveLocale } from "@/features/i18n/dictionaries";
import { getDictionary, formatMessage } from "@/features/i18n/dictionaries";
import {
  getPublishedCompetitionsWithMedia,
  getViewerAccessTier,
} from "@/features/media/service";

export default async function LocalizedCompetitionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = getDictionary(locale);

  const { tier: viewerTier, role: viewerRole } = await getViewerAccessTier();
  const competitions = await getPublishedCompetitionsWithMedia(locale);

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">{t.competitions.title}</h1>
          <p className="text-sm text-gray-600">
            {t.competitions.activeTier} : <strong>{viewerTier}</strong>
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href={`/${locale}/dashboard`} className="underline">
            {t.nav.dashboard}
          </Link>
          <Link href={`/${locale}/soutenir`} className="underline">
            {t.nav.support}
          </Link>
        </div>
      </header>

      {competitions.length === 0 ? (
        <p className="text-sm text-gray-600">{t.competitions.empty}</p>
      ) : (
        <div className="space-y-6">
          {competitions.map((comp) => (
            <article key={comp.id} className="rounded border p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="text-xs uppercase font-semibold text-gray-500">
                    {comp.sport} · {comp.location} ·{" "}
                    {new Date(comp.eventDate).toLocaleDateString(locale)}
                  </span>
                  <h2 className="text-xl font-bold">{comp.title}</h2>
                </div>
                <span className="rounded bg-gray-100 px-2.5 py-1 text-xs font-medium">
                  {comp.accessTier}
                </span>
              </div>

              {comp.resultSummary && (
                <p className="text-sm text-gray-700">
                  <strong>{t.competitions.result} :</strong>{" "}
                  {comp.resultSummary}
                </p>
              )}

              {comp.isLocked ? (
                <div className="rounded bg-amber-50 border border-amber-200 p-4 flex items-center justify-between gap-4">
                  <p className="text-sm text-amber-900">
                    {t.competitions.lockedNotice} <strong>{comp.accessTier}</strong>.
                  </p>
                  <Link
                    href={`/${locale}/dashboard`}
                    className="rounded bg-black px-3 py-1.5 text-xs font-medium text-white"
                  >
                    {t.competitions.unlockCta}
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
                      {t.competitions.streamLink}
                    </a>
                  )}
                  {comp.externalUrl && (
                    <a
                      href={comp.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-gray-700"
                    >
                      {t.competitions.externalLink}
                    </a>
                  )}
                </div>
              )}

              {comp.media.length > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <h3 className="text-sm font-semibold">
                    {t.competitions.associatedMedia}
                  </h3>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {comp.media.map((m) => (
                      <li
                        key={m.id}
                        className="rounded border p-3 text-sm space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{m.title}</span>
                          <span className="text-xs text-gray-500">
                            {m.type} · {m.accessTier}
                          </span>
                        </div>
                        {m.isLocked ? (
                          <p className="text-xs text-amber-700">
                            {formatMessage(t.competitions.lockedMedia, {
                              tier: m.accessTier,
                            })}
                          </p>
                        ) : (
                          m.playbackUrl && (
                            <a
                              href={m.playbackUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs underline text-blue-700"
                            >
                              {t.competitions.openMedia}
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