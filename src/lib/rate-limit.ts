import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Per-IP limits for public forms (rate_limit_hit, 0022). The counter key is
// an HMAC of action + IP made here on the server — the raw IP is never
// stored, and nobody calling the RPC directly can target another visitor's
// counter without the secret.
//
// Fails OPEN: if the database call errors (or 0022 isn't applied yet) the
// request goes through, so a limiter hiccup never takes the site down.

export const LIMITS = {
  order: { max: 5, windowSec: 3600 },
  keychainOrder: { max: 5, windowSec: 3600 },
  feedback: { max: 10, windowSec: 3600 },
  testimonial: { max: 5, windowSec: 3600 },
  track: { max: 15, windowSec: 600 },
  paymentProof: { max: 5, windowSec: 3600 },
  customerPhoto: { max: 5, windowSec: 3600 },
  login: { max: 10, windowSec: 600 },
  signup: { max: 10, windowSec: 3600 },
  forgotPassword: { max: 5, windowSec: 3600 },
  pinCheck: { max: 20, windowSec: 600 },
  tagView: { max: 30, windowSec: 3600 },
} as const;

export type LimitName = keyof typeof LIMITS;

export const RATE_LIMITED_MESSAGE = "Too many tries — please wait a few minutes and try again.";

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function secret(): string {
  return (
    process.env.RATE_LIMIT_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "konek-dev"
  );
}

// true = allowed. `scope` narrows the counter further (e.g. per card for views).
export async function rateLimit(name: LimitName, scope = ""): Promise<boolean> {
  try {
    const { max, windowSec } = LIMITS[name];
    const key = createHmac("sha256", secret())
      .update(`${name}|${scope}|${await clientIp()}`)
      .digest("hex");
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("rate_limit_hit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSec,
    });
    if (error) return true;
    return data !== false;
  } catch {
    return true;
  }
}
