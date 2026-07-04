import "server-only";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary, type Locale } from "./dictionaries";

export const LOCALE_COOKIE = "visaops_locale";
export const SUPPORTED_LOCALES: Locale[] = ["en", "pt", "es"];

/**
 * Resolve the active locale: explicit cookie choice first, then the signed-in
 * user's saved preference, then English.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }
  try {
    const user = await getCurrentUser();
    if (user?.locale && SUPPORTED_LOCALES.includes(user.locale as Locale)) {
      return user.locale as Locale;
    }
  } catch {
    // no session (public pages), fall through
  }
  return "en";
}

export async function getDict() {
  return getDictionary(await getLocale());
}
