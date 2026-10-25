import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Who is signed in, for code that only needs the user's id. Uses
// getClaims(), which verifies the session JWT's signature locally when the
// project uses asymmetric JWT signing keys (no network trip), and falls back
// to asking Supabase Auth otherwise — unlike getUser(), which always calls
// the Auth server. React cache() makes it run once per request even when a
// layout, page and helpers all ask. Use getUser() only when you need the
// full, freshly-fetched user object (e.g. its email for sending a code).
export const getAuthUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  return typeof sub === "string" ? sub : null;
});

// Same once-per-request treatment for the admin check (is_admin RPC).
export const isCurrentUserAdmin = cache(async (): Promise<boolean> => {
  if (!(await getAuthUserId())) return false;
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_admin");
  return data === true;
});
