"use server";

import { cookies, headers } from "next/headers";
import { db } from "@/prisma/db";
import { requireSession } from "@/features/auth/rbac";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  resolveLocale,
  type Locale,
} from "./dictionaries";

async function tryGetSession() {
  try {
    return await requireSession();
  } catch {
    return null;
  }
}

export async function getCurrentLocale(routeLocale?: string): Promise<Locale> {
  if (routeLocale) {
    return resolveLocale(routeLocale);
  }

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  if (fromCookie) {
    return resolveLocale(fromCookie);
  }

  const session = await tryGetSession();
  if (session?.user?.id) {
    const dbUser = await db.orm.public.User
      .where({ id: Number(session.user.id) })
      .first();
    if (dbUser?.preferredLocale) {
      return resolveLocale(dbUser.preferredLocale);
    }
  }

  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language");
  if (acceptLanguage) {
    const primary = acceptLanguage.split(",")[0]?.trim();
    return resolveLocale(primary);
  }

  return DEFAULT_LOCALE;
}

export async function setPreferredLocaleAction(nextLocale: Locale): Promise<void> {
  const locale = resolveLocale(nextLocale);
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const session = await tryGetSession();
  if (session?.user?.id) {
    await db.orm.public.User
      .where({ id: Number(session.user.id) })
      .update({ preferredLocale: locale });
  }
}