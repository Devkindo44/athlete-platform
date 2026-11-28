import { db } from "@/prisma/db";
import { requireSession } from "@/features/auth/rbac";
import { DEFAULT_LOCALE, resolveLocale } from "@/features/i18n/dictionaries";

export type ViewerAccessTier = "FREE" | "GOLD" | "PREMIUM";
export type ContentAccessTier = "PUBLIC" | "GOLD" | "PREMIUM";

const TIER_RANK: Record<ViewerAccessTier, number> = {
  FREE: 0,
  GOLD: 1,
  PREMIUM: 2,
};

const REQUIRED_RANK: Record<ContentAccessTier, number> = {
  PUBLIC: 0,
  GOLD: 1,
  PREMIUM: 2,
};

export function canAccessTier(
  viewerTier: ViewerAccessTier,
  requiredTier: ContentAccessTier,
  role?: string | null
): boolean {
  if (role === "ADMIN" || role === "COACH" || role === "ATHLETE") {
    return true;
  }
  return TIER_RANK[viewerTier] >= REQUIRED_RANK[requiredTier];
}

export async function getViewerAccessTier(): Promise<{
  tier: ViewerAccessTier;
  role: string | null;
}> {
  try {
    const session = await requireSession();
    const userId = Number(session.user.id);
    const role = session.user.role ?? null;

    if (role === "ADMIN" || role === "COACH" || role === "ATHLETE") {
      return { tier: "PREMIUM", role };
    }

    const sub = await db.orm.public.Subscription
      .where({ userId })
      .first();

    const isActive =
      sub &&
      (sub.status === "ACTIVE" || sub.status === "TRIALING") &&
      (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > new Date());

    return {
      tier: isActive ? (sub.tier as ViewerAccessTier) : "FREE",
      role,
    };
  } catch {
    return { tier: "FREE", role: null };
  }
}

export async function getPublishedCompetitionsWithMedia(
  localeInput?: string
) {
  const locale = resolveLocale(localeInput ?? DEFAULT_LOCALE);
  const { tier: viewerTier, role } = await getViewerAccessTier();

  const competitions = await db.orm.public.Competition
    .where({ isPublished: true })
    .all();
  const mediaAssets = await db.orm.public.MediaAsset
    .where({ isPublished: true })
    .all();
  const translations = await db.orm.public.MediaTranslation.all();

  const translationsByMedia = new Map<
    number,
    Array<{
      locale: string;
      title: string;
      description: string | null;
      playbackUrl?: string | null;
    }>
  >();

  for (const tr of translations) {
    const mediaId = Number(tr.mediaId);
    const list = translationsByMedia.get(mediaId) ?? [];
    list.push({
      locale: tr.locale,
      title: tr.title,
      description: tr.description,
    });
    translationsByMedia.set(mediaId, list);
  }

  return competitions
    .sort(
      (a, b) =>
        new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
    )
    .map((comp) => {
      const compTier = (comp.accessTier ?? "PUBLIC") as ContentAccessTier;
      const isLocked = !canAccessTier(viewerTier, compTier, role);

      const compMedia = mediaAssets
        .filter((m) => Number(m.competitionId) === Number(comp.id))
        .map((m) => {
          const mTier = (m.accessTier ?? "PUBLIC") as ContentAccessTier;
          const mediaLocked = !canAccessTier(viewerTier, mTier, role);
          const trList = translationsByMedia.get(Number(m.id)) ?? [];
          const matched =
            trList.find((t) => t.locale === locale) ??
            trList.find((t) => t.locale === DEFAULT_LOCALE) ??
            trList[0];

          return {
            id: Number(m.id),
            type: m.type,
            accessTier: mTier,
            isLocked: mediaLocked,
            title: matched?.title ?? `Média #${m.id}`,
            description: matched?.description ?? null,
            playbackUrl: mediaLocked ? null : m.playbackUrl,
          };
        });

      return {
        id: Number(comp.id),
        slug: comp.slug,
        title: comp.title,
        sport: comp.sport,
        location: comp.location,
        eventDate: comp.eventDate,
        resultSummary: comp.resultSummary,
        accessTier: compTier,
        isLocked,
        streamUrl: isLocked ? null : comp.streamUrl,
        externalUrl: isLocked ? null : comp.externalUrl,
        media: compMedia,
      };
    });
}