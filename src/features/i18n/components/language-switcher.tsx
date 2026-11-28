"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  SUPPORTED_LOCALES,
  type Locale,
} from "@/features/i18n/dictionaries";
import { setPreferredLocaleAction } from "@/features/i18n/server";

const LOCALE_LABELS: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  es: "ES",
};

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleSelect(nextLocale: Locale) {
    if (nextLocale === currentLocale) return;

    startTransition(async () => {
      await setPreferredLocaleAction(nextLocale);

      const segments = pathname.split("/").filter(Boolean);
      if (
        segments.length > 0 &&
        (SUPPORTED_LOCALES as readonly string[]).includes(segments[0])
      ) {
        segments[0] = nextLocale;
      } else {
        segments.unshift(nextLocale);
      }

      router.push(`/${segments.join("/")}`);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label="Language switcher"
      className="inline-flex items-center rounded border p-0.5 text-xs"
    >
      {SUPPORTED_LOCALES.map((loc) => (
        <button
          key={loc}
          type="button"
          disabled={isPending}
          onClick={() => handleSelect(loc)}
          className={`rounded px-2 py-1 font-medium transition ${
            currentLocale === loc
              ? "bg-black text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}