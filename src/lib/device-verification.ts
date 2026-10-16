import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/email/send";
import type { createClient } from "@/lib/supabase/server";
import { loginCodeEmail } from "@/lib/email/templates";

export const DEVICE_COOKIE_NAME = "konek_device_id";

// 400 days: the practical ceiling most browsers honor for Set-Cookie
// Max-Age. Deliberately much longer than the 30-day trust window in
// trusted_devices — the cookie is just a stable per-browser label, not the
// thing granting access (trusted_until in the DB is), so there's nothing to
// gain from expiring it early, and doing so would just force a browser
// that's still legitimately trusted to mint a *new*, unrecognized
// device_id and re-verify for no security reason.
const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

export const DEVICE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: DEVICE_COOKIE_MAX_AGE,
};

// Opaque per-browser id — not a secret in the sense of proving anything by
// itself, but it does need to be unguessable: an attacker who already has a
// victim's password (the whole threat model here) could otherwise skip
// verification by guessing the device_id of a browser that's already
// trusted. 256 bits of CSPRNG output; don't shrink this.
export function randomDeviceId(): string {
  return randomBytes(32).toString("base64url");
}

// Read-only — safe to call from a Server Component (page.tsx). Never mints
// a new id; by the time /verify-device renders, either a Server Action
// (login/claim) or proxy.ts's backstop has already set one.
export async function getDeviceId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(DEVICE_COOKIE_NAME)?.value;
}

// Read-or-mint. Only call this from a Server Action or Route Handler —
// unlike src/lib/supabase/server.ts's setAll, this is deliberately NOT
// wrapped in try/catch. If it's ever called from a Server Component render,
// it should throw loudly rather than silently mint an id that never
// persists (which would otherwise manifest as an inexplicable redirect loop
// to /verify-device that never resolves).
export async function getOrCreateDeviceId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(DEVICE_COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = randomDeviceId();
  store.set(DEVICE_COOKIE_NAME, id, DEVICE_COOKIE_OPTIONS);
  return id;
}

// Guards against an open redirect via the `next` param used throughout this
// flow (and shared by /login's own `next`). Rejects anything that isn't a
// same-origin path — including protocol-relative URLs like "//evil.com",
// which pass a naive `.startsWith("/")` check but browsers treat as
// scheme-relative to a different host.
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

// The new-device code step is switched on with DEVICE_VERIFICATION=on.
//
// It's OFF until Konek+ has a verified sending domain in Resend: without
// one, Resend can only deliver to the Resend account owner's own inbox, so
// every real customer on a new device would be told "we emailed you a
// code" and never get it — i.e. locked out. Off means a correct password is
// enough, exactly as before this feature existed. The device cookie keeps
// being issued either way, so switching it on later needs no migration.
// Turn it on the day the domain is verified (see .env.local.example).
export function isDeviceVerificationEnabled(): boolean {
  return process.env.DEVICE_VERIFICATION === "on";
}

// "lester@gmail.com" -> "l•••••@gmail.com" — enough for someone to know
// which inbox to check, without printing their full address on screen.
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local[0]}${"•".repeat(Math.max(2, Math.min(local.length - 1, 6)))}@${domain}`;
}

// Sends the 6-digit login PIN to the account's email. The PIN is generated
// server-side in Postgres (store_login_pin() in
// supabase/migrations/0009_device_verification.sql) and only ever reaches
// this function already-generated — this function never invents or
// receives a client-suppliable PIN. Returns whether it actually sent, so
// the caller can tell the user the truth (see sendEmail()).
export async function sendLoginPinEmail(email: string, pin: string): Promise<boolean> {
  const result = await sendEmail({ to: email, ...loginCodeEmail(pin) });
  return result.ok;
}

export type PinNotice = "rate_limited" | "send_failed";

// Issues + emails a PIN and returns where to send the user. Never throws:
// if the PIN couldn't be issued (60s cooldown) or emailed, the user still
// lands on /verify-device, but with a notice explaining why there's no
// email — instead of being told "we emailed you" when nothing was sent.
export async function issueLoginPinAndGetVerifyUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string,
  next: string,
): Promise<string> {
  const { data: pin } = await supabase.rpc("store_login_pin");
  let notice: PinNotice | null = null;
  if (!pin) notice = "rate_limited";
  else if (!(await sendLoginPinEmail(email, pin))) notice = "send_failed";

  const params = new URLSearchParams({ next });
  if (notice) params.set("notice", notice);
  return `/verify-device?${params}`;
}
