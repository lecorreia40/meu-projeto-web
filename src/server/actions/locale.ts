"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, SUPPORTED_LOCALES } from "@/lib/i18n/locale";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/** Persist the chosen locale in a cookie, and on the user record if signed in. */
export async function setLocaleAction(locale: string) {
  const safe = SUPPORTED_LOCALES.includes(locale as never) ? locale : "en";
  const store = await cookies();
  store.set(LOCALE_COOKIE, safe, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const user = await getCurrentUser();
  if (user) {
    await db.user.update({ where: { id: user.id }, data: { locale: safe } });
  }
}
