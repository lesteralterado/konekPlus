import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { SiteChrome } from "../site-chrome";
import { LoginForm } from "./login-form";
import { NoCardLinks, SignInNotice } from "./sign-in-notice";

export const metadata: Metadata = {
  title: "Sign in — Konek+",
  description: "Sign in to manage your Konek+ profile and cards. For Konek+ card owners.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const [{ next, error }, dict] = await Promise.all([searchParams, getDictionary()]);
  const t = dict.auth;

  return (
    <SiteChrome>
      <div className="mx-auto w-full max-w-sm px-6 py-12 sm:py-16">
        <h1 className="mb-1 text-2xl font-semibold text-brand-900">{t.title}</h1>
        <p className="mb-6 text-sm text-slate-500">{t.subtitle}</p>
        {/* Set by /auth/confirm when an email link is expired or already used. */}
        {error === "link_expired" && (
          <p role="status" className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t.linkExpired}
          </p>
        )}
        <SignInNotice t={t} />
        <LoginForm next={next && next.startsWith("/") ? next : "/dashboard"} t={t} />
        <NoCardLinks t={t} />
      </div>
    </SiteChrome>
  );
}
