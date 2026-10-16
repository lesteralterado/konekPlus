import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <h1 className="mb-1 text-2xl font-semibold text-brand-900">Sign in</h1>
      <p className="mb-6 text-sm text-slate-500">
        Manage your Konek+ profile and cards.
      </p>
      {/* Set by /auth/confirm when an email link is expired or already used. */}
      {error === "link_expired" && (
        <p role="status" className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          That link has expired or was already used. Sign in, or request a new password reset link.
        </p>
      )}
      <LoginForm next={next && next.startsWith("/") ? next : "/dashboard"} />
    </main>
  );
}
