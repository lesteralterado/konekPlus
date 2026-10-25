import "server-only";
import { redirect } from "next/navigation";
import { getAuthUserId, isCurrentUserAdmin } from "@/lib/auth";

// Every /admin page and Server Action calls this first. Unlike the previous
// ADMIN_EMAILS env-var check, "is this user an admin" is now answered by the
// database (private.admin_users, via the is_admin() RPC — see
// supabase/migrations/0005_admin_rls.sql), the same source of truth the RLS
// policies use. That means even a route that forgets to call this is still
// protected: the RLS-scoped client it queries with will only ever see what
// the database allows an admin (or nobody) to see.
//
// Both checks are cached per request (src/lib/auth.ts), so a layout + page
// + action calling this costs one token check and one RPC, not three each.
export async function requireAdmin(): Promise<{ id: string }> {
  const userId = await getAuthUserId();
  if (!userId) redirect("/login?next=/admin");

  if (!(await isCurrentUserAdmin())) redirect("/dashboard");

  return { id: userId };
}
