import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

// Service-role client. Bypasses RLS entirely. Used by
// scripts/generate-tags.ts (batch tag provisioning) via a plain `tsx`
// process outside Next's bundler, and by the secret-guarded cron route
// src/app/api/cron/activation-reminders, which has no signed-in user. Never
// import this from pages or server actions (request-handling code should go
// through the RLS-scoped clients in ./server.ts and ./client.ts instead).
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
