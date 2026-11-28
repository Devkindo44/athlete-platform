export const SUPPORTED_LOCALES = ["fr", "en", "es"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE_NAME = "athlete_locale";

export function isValidLocale(value?: string | null): value is Locale {
  if (!value) return false;
  return (SUPPORTED_LOCALES as readonly string[]).includes(value.toLowerCase());
}

export function resolveLocale(value?: string | null): Locale {
  if (!value) return DEFAULT_LOCALE;
  const normalized = value.toLowerCase();
  if (isValidLocale(normalized)) return normalized;
  const prefix = normalized.split("-")[0];
  if (isValidLocale(prefix)) return prefix;
  return DEFAULT_LOCALE;
}

const dictionaries = {
  fr: {
    nav: {
      dashboard: "Tableau de bord",
      competitions: "Compétitions & Médias",
      support: "Soutenir",
      coachZone: "Espace Coach",
      moderation: "Modération",
    },
    competitions: {
      title: "Compétitions & Médias",
      activeTier: "Niveau d'accès actif",
      empty: "Aucune compétition publiée pour le moment.",
      result: "Résultat",
      lockedNotice: "Contenu réservé au niveau",
      unlockCta: "Débloquer l'accès",
      streamLink: "Voir le streaming / replay →",
      externalLink: "Lien officiel de la compétition →",
      associatedMedia: "Médias associés",
      lockedMedia: "Verrouillé (niveau {tier} requis)",
      openMedia: "Ouvrir le média →",
    },
    billing: {
      title: "Abonnements Fan",
      currentLevel: "Niveau actuel",
      monthly: "Mensuel",
      yearly: "Annuel",
      goldTitle: "🥈 Fan Gold",
      premiumTitle: "🥇 Fan Premium",
      managePortal: "Ouvrir le portail Stripe",
    },
    donations: {
      title: "Soutenir le projet sportif",
      subtitle: "Participez aux frais de préparation, déplacements et équipements.",
      oneTime: "Don ponctuel",
      monthly: "Soutien mensuel",
      wallTitle: "Wall of Supporters",
      submitOneTime: "Envoyer un don de {amount} {currency}",
      submitMonthly: "Soutenir avec {amount} {currency} / mois",
    },
  },
  en: {
    nav: {
      dashboard: "Dashboard",
      competitions: "Competitions & Media",
      support: "Support",
      coachZone: "Coach Zone",
      moderation: "Moderation",
    },
    competitions: {
      title: "Competitions & Media",
      activeTier: "Active access tier",
      empty: "No published competitions yet.",
      result: "Result",
      lockedNotice: "Content restricted to tier",
      unlockCta: "Unlock access",
      streamLink: "Watch stream / replay →",
      externalLink: "Official competition link →",
      associatedMedia: "Associated media",
      lockedMedia: "Locked ({tier} tier required)",
      openMedia: "Open media →",
    },
    billing: {
      title: "Fan Subscriptions",
      currentLevel: "Current tier",
      monthly: "Monthly",
      yearly: "Yearly",
      goldTitle: "🥈 Fan Gold",
      premiumTitle: "🥇 Fan Premium",
      managePortal: "Open Stripe Portal",
    },
    donations: {
      title: "Support the Athlete",
      subtitle: "Contribute to training camps, travel, and equipment.",
      oneTime: "One-time donation",
      monthly: "Monthly support",
      wallTitle: "Wall of Supporters",
      submitOneTime: "Donate {amount} {currency}",
      submitMonthly: "Support with {amount} {currency} / month",
    },
  },
  es: {
    nav: {
      dashboard: "Panel",
      competitions: "Competiciones y Medios",
      support: "Apoyar",
      coachZone: "Zona Coach",
      moderation: "Moderación",
    },
    competitions: {
      title: "Competiciones y Medios",
      activeTier: "Nivel de acceso activo",
      empty: "No hay competiciones publicadas por el momento.",
      result: "Resultado",
      lockedNotice: "Contenido reservado al nivel",
      unlockCta: "Desbloquear acceso",
      streamLink: "Ver transmisión / repetición →",
      externalLink: "Enlace oficial de la competición →",
      associatedMedia: "Medios asociados",
      lockedMedia: "Bloqueado (nivel {tier} requerido)",
      openMedia: "Abrir medio →",
    },
    billing: {
      title: "Suscripciones Fan",
      currentLevel: "Nivel actual",
      monthly: "Mensual",
      yearly: "Anual",
      goldTitle: "🥈 Fan Gold",
      premiumTitle: "🥇 Fan Premium",
      managePortal: "Abrir portal Stripe",
    },
    donations: {
      title: "Apoyar el proyecto deportivo",
      subtitle: "Colabora con los gastos de preparación, viajes y equipamiento.",
      oneTime: "Donación puntual",
      monthly: "Apoyo mensual",
      wallTitle: "Wall of Supporters",
      submitOneTime: "Donar {amount} {currency}",
      submitMonthly: "Apoyar con {amount} {currency} / mes",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: string): Dictionary {
  return dictionaries[resolveLocale(locale)];
}

export function formatMessage(
  template: string,
  params: Record<string, string | number>
): string {
  return Object.entries(params).reduce(
    (acc, [key, val]) => acc.replaceAll(`{${key}}`, String(val)),
    template
  );
}