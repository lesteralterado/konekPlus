// Every date and time shown in the app goes through here, always in Philippine
// time. Pages are drawn on the server (Vercel runs on UTC), so a bare
// toLocaleString() prints UTC: an order placed at 6:02 PM in Manila used to
// show as 10:02 AM, and anything between midnight and 8 AM Manila landed on
// the previous day. Passing the zone explicitly gives the same answer on the
// server, in the browser and on any phone, so nothing flashes or mismatches
// when the page hydrates.
export const APP_TIME_ZONE = "Asia/Manila";

const LOCALE = "en-PH";

const dateTime = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: APP_TIME_ZONE,
});

const date = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeZone: APP_TIME_ZONE,
});

const shortDate = new Intl.DateTimeFormat(LOCALE, {
  month: "short",
  day: "numeric",
  timeZone: APP_TIME_ZONE,
});

// "Nov 2": for lists where the year is obvious. To format a plain
// YYYY-MM-DD day, pass `${day}T00:00:00+08:00` (midnight Manila).
export function formatShortDate(value: string | Date): string {
  return shortDate.format(new Date(value));
}

// "Nov 2, 2026, 6:02 PM"
export function formatDateTime(value: string | Date): string {
  return dateTime.format(new Date(value));
}

// "Nov 2, 2026"
export function formatDate(value: string | Date): string {
  return date.format(new Date(value));
}

// The calendar day (YYYY-MM-DD) a moment falls on in Manila: for grouping
// things "by day" the way people there would count them.
export function manilaDayKey(value: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(new Date(value));
}
