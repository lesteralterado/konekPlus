import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

// Anonymous, cookie-free client for public pages that read data without a
// user session (e.g. the marketing homepage's aggregate stats). Unlike
// ./server.ts, this never touches next/headers, so pages using it can still
// be statically generated / revalidated on a timer instead of forced into
// per-request dynamic rendering.
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
}
