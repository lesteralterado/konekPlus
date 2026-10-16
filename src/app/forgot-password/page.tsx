import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <h1 className="mb-1 text-2xl font-semibold text-brand-900">Reset your password</h1>
      <p className="mb-6 text-sm text-slate-500">
        Enter the email you sign in with and we&apos;ll send you a link to choose a new password.
      </p>
      <ForgotPasswordForm />
    </main>
  );
}
