import type { Profile, ProfileTemplate, ProTerm } from "@/lib/types";

// Basic vs Pro (0024). The public card RPCs enforce this in the database;
// these helpers keep the dashboard saying the same thing and stop owners
// saving what their plan won't show.
//
// Basic (free forever): profile, links, testimonials, editing anytime, the
// Classic style and up to BASIC_PORTFOLIO_LIMIT projects on the card.
// Pro: every style, unlimited portfolio, daily tap analytics.

export const BASIC_TEMPLATE: ProfileTemplate = "classic";
export const BASIC_PORTFOLIO_LIMIT = 3;

// Pro renewal after the included year. Shown on the landing FAQ and terms,
// so a price here is the price promised.
export const PRO_PRICE_PHP = { yearly: 499, monthly: 59 } as const;
export const PRO_INCLUDED_MONTHS = 12;

// What each renewal option buys (months must match plan_payments' check, 0025).
export const PRO_TERMS: Record<ProTerm, { months: number; pricePhp: number; label: string }> = {
  yearly: { months: 12, pricePhp: PRO_PRICE_PHP.yearly, label: "1 year" },
  monthly: { months: 1, pricePhp: PRO_PRICE_PHP.monthly, label: "1 month" },
};

export function isProTerm(value: string): value is ProTerm {
  return value in PRO_TERMS;
}

// Owners can renew any time; the dashboard nudges harder inside this window.
export const RENEW_NUDGE_DAYS = 30;

export function daysLeft(proUntil: string | null, now = Date.now()): number | null {
  if (!proUntil) return null;
  return Math.ceil((new Date(proUntil).getTime() - now) / 86_400_000);
}

export function isPro(profile: Pick<Profile, "pro_until">, now = Date.now()): boolean {
  return !!profile.pro_until && new Date(profile.pro_until).getTime() > now;
}

export function canUseTemplate(profile: Pick<Profile, "pro_until">, template: ProfileTemplate) {
  return template === BASIC_TEMPLATE || isPro(profile);
}

export function formatPlanDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
}
