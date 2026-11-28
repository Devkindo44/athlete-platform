import { Suspense } from "react";
import Link from "next/link";
import { getDictionary, resolveLocale } from "@/features/i18n/dictionaries";
import { LanguageSwitcher } from "@/features/i18n/components/language-switcher";

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = getDictionary(locale);

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-bold">Athlete Platform</h1>
        <Suspense fallback={<div className="h-7 w-24 rounded border bg-gray-100" />}>
          <LanguageSwitcher currentLocale={locale} />
        </Suspense>
      </header>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link href={`/${locale}/competitions`} className="underline font-medium">
          {t.nav.competitions}
        </Link>
        <Link href="/dashboard" className="underline">
          {t.nav.dashboard}
        </Link>
        <Link href="/soutenir" className="underline">
          {t.nav.support}
        </Link>
      </nav>
    </main>
  );
}