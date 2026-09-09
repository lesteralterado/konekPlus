import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <h1 className="mb-1 text-2xl font-semibold text-brand-900">Sign in</h1>
      <p className="mb-6 text-sm text-slate-500">
        Manage your Konek+ profile and cards.
      </p>
      <LoginForm next={next && next.startsWith("/") ? next : "/dashboard"} />
    </main>
  );
}
