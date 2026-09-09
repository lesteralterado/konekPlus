import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Every /admin page and Server Action calls this first. Unlike the previous
// ADMIN_EMAILS env-var check, "is this user an admin" is now answered by the
// database (private.admin_users, via the is_admin() RPC — see
// supabase/migrations/0005_admin_rls.sql), the same source of truth the RLS
// policies use. That means even a route that forgets to call this is still
// protected: the RLS-scoped client it queries with will only ever see what
// the database allows an admin (or nobody) to see.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/dashboard");

  return user;
}
