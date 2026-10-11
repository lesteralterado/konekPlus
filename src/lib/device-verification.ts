import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { Resend } from "resend";

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

// Sends the 6-digit login PIN to the account's email. The PIN is generated
// server-side in Postgres (store_login_pin() in
// supabase/migrations/0009_device_verification.sql) and only ever reaches
// this function already-generated — this function never invents or
// receives a client-suppliable PIN.
//
// Resend fallback: RESEND_API_KEY isn't configured yet in this project.
// Missing config must NOT skip the security gate — the PIN is still
// generated/stored/required either way. When Resend isn't configured, this
// logs the plaintext PIN to the server console instead of emailing it.
// DEV-ONLY OUTPUT — this is intentional, not a leftover to clean up; it
// stops firing the moment RESEND_API_KEY / RESEND_FROM_EMAIL are set.
export async function sendLoginPinEmail(
  email: string,
  pin: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.log(
      `[device-verification] RESEND_API_KEY not configured — login PIN for ${email}: ${pin}`,
    );
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Your Konek+ sign-in code",
    text: `Your Konek+ verification code is ${pin}. It expires in 10 minutes.\n\nIf you didn't try to sign in, you can safely ignore this email.`,
  });

  if (error) {
    // Fail loud: a caller that swallows this leaves the user stuck on
    // /verify-device with a code that never arrived and no clue why.
    throw new Error(`Failed to send login PIN email: ${error.message}`);
  }
}
