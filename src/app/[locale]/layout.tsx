import { Suspense } from "react";
import type { Metadata } from "next";
import {
  DEFAULT_LOCALE,
  resolveLocale,
  SUPPORTED_LOCALES,
} from "@/features/i18n/dictionaries";
import { LanguageSwitcher } from "@/features/i18n/components/language-switcher";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);

  const languages = Object.fromEntries(
    SUPPORTED_LOCALES.map((loc) => [loc, `${SITE_URL}/${loc}`])
  );

  return {
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        ...languages,
        "x-default": `${SITE_URL}/${DEFAULT_LOCALE}`,
      },
    },
  };
}

async function LocaleShell({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);

  return (
    <div lang={locale} className="min-h-screen flex flex-col">
      <div className="border-b px-6 py-2 flex items-center justify-end bg-gray-50">
        <Suspense fallback={<div className="h-7 w-24 rounded border bg-gray-100" />}>
          <LanguageSwitcher currentLocale={locale} />
        </Suspense>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LocaleShell params={params}>{children}</LocaleShell>
    </Suspense>
  );
}