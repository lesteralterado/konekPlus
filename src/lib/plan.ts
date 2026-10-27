import type { Profile, ProfileTemplate } from "@/lib/types";

// Basic vs Pro (0024). The public card RPCs enforce this in the database;
// these helpers keep the dashboard saying the same thing and stop owners
// saving what their plan won't show.
//
// Basic (free forever): profile, links, testimonials, editing anytime, the
// Classic style and up to BASIC_PORTFOLIO_LIMIT projects on the card.
// Pro: every style, unlimited portfolio, daily tap analytics.

export const BASIC_TEMPLATE: ProfileTemplate = "classic";
export const BASIC_PORTFOLIO_LIMIT = 3;

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
