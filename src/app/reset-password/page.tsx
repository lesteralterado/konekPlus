import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-password-form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <h1 className="mb-1 text-2xl font-semibold text-brand-900">Choose a new password</h1>
      {user ? (
        <>
          <p className="mb-6 text-sm text-slate-500">
            For <span className="font-semibold text-brand-900">{user.email}</span>.
          </p>
          <ResetPasswordForm />
        </>
      ) : (
        <>
          <p className="mb-6 text-sm text-slate-500">
            This reset link has expired or was already used.
          </p>
          <Link
            href="/forgot-password"
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-center font-medium text-white transition hover:bg-brand-700"
          >
            Request a new link
          </Link>
        </>
      )}
    </main>
  );
}
