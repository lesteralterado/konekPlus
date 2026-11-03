import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { SignInNotice } from "../login/sign-in-notice";
import { SiteChrome } from "../site-chrome";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password — Konek+",
};

export default async function ForgotPasswordPage() {
  const t = (await getDictionary()).auth;

  return (
    <SiteChrome>
      <div className="mx-auto w-full max-w-sm px-6 py-12 sm:py-16">
        <h1 className="mb-1 text-2xl font-semibold text-brand-900">{t.reset.title}</h1>
        <p className="mb-6 text-sm text-slate-500">{t.reset.subtitle}</p>
        <SignInNotice t={t} compact />
        <ForgotPasswordForm t={t} />
      </div>
    </SiteChrome>
  );
}
