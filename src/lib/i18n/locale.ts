import { cookies, headers } from "next/headers";

export type Locale = "en" | "fil";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "konek_locale";
const LOCALES: Locale[] = ["en", "fil"];

function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as string[]).includes(value);
}

// Server-only. Resolution order: an explicit cookie (set by
// src/lib/i18n/actions.ts via the language switcher) always wins; with no
// cookie yet, a first-visit guess from the browser's Accept-Language header
// defaults Filipino-preferring visitors to "fil" without forcing a route or
// redirect; otherwise DEFAULT_LOCALE.
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieValue)) return cookieValue;

  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  if (/\b(fil|tl)\b/i.test(acceptLanguage)) return "fil";

  return DEFAULT_LOCALE;
}
