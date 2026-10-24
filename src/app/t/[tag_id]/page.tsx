import type { Viewport } from "next";
import { headers } from "next/headers";
import { after } from "next/server";
import QRCode from "qrcode";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/locale";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import type { Locale } from "@/lib/i18n/locale";
import { LanguageSwitcher } from "@/app/language-switcher";
import { ClaimForm } from "./claim-form";
import { ProfileTemplateView } from "./templates";

export const dynamic = "force-dynamic";

// Safari's toolbar tint follows the profile's light/dark surface (.profile-ui).
// viewportFit "cover" makes env(safe-area-inset-*) real for the sticky bar.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  viewportFit: "cover",
};

// The URL the visitor actually used (correct on preview deploys and custom
// domains), falling back to SITE_URL. Encoded in the share sheet QR.
async function getProfileUrl(tagId: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const origin = host
    ? `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`
    : (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${origin}/t/${encodeURIComponent(tagId)}`;
}

function InvalidCard({ t, locale }: { t: Dictionary["tagStatus"]; locale: Locale }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <LanguageSwitcher locale={locale} className="mb-2" />
      <h1 className="text-2xl font-semibold text-slate-800">{t.invalidCardTitle}</h1>
      <p className="max-w-sm text-slate-500">{t.invalidCardBody}</p>
    </main>
  );
}

function CardUnavailable({ t, locale }: { t: Dictionary["tagStatus"]; locale: Locale }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <LanguageSwitcher locale={locale} className="mb-2" />
      <h1 className="text-2xl font-semibold text-slate-800">{t.unavailableTitle}</h1>
      <p className="max-w-sm text-slate-500">{t.unavailableBody}</p>
    </main>
  );
}

function ActivatedBanner({
  t,
  tagId,
}: {
  t: Dictionary["claimForm"];
  tagId: string;
}) {
  return (
    <div
      role="status"
      className="fixed inset-x-3 top-3 z-50 mx-auto max-w-md rounded-2xl bg-emerald-600 p-4 text-white shadow-lg"
    >
      <p className="font-semibold">{t.activatedTitle}</p>
      <p className="mt-0.5 text-sm text-emerald-50">{t.activatedBody}</p>
      <div className="mt-3 flex gap-2 text-sm font-medium">
        <a href="/dashboard" className="rounded-full bg-white px-4 py-1.5 text-emerald-700">
          {t.activatedDashboard}
        </a>
        <a
          href={`/t/${encodeURIComponent(tagId)}`}
          className="rounded-full bg-emerald-700 px-4 py-1.5"
        >
          {t.activatedClose}
        </a>
      </div>
    </div>
  );
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag_id: string }>;
  searchParams: Promise<{ activated?: string }>;
}) {
  const { tag_id } = await params;
  const { activated } = await searchParams;
  const supabase = await createClient();
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  const { data: status } = await supabase.rpc("tag_status", {
    p_tag_id: tag_id,
  });

  switch (status) {
    case null:
    case undefined:
      return <InvalidCard t={dict.tagStatus} locale={locale} />;
    case "unclaimed": {
      const { data: needsPin } = await supabase.rpc("tag_needs_pin", {
        p_tag_id: tag_id,
      });
      return (
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
          <LanguageSwitcher locale={locale} className="mb-4 justify-center" />
          <ClaimForm
            tagId={tag_id}
            needsPin={needsPin === true}
            dict={dict.claimForm}
          />
        </main>
      );
    }
    case "disabled":
      return <CardUnavailable t={dict.tagStatus} locale={locale} />;
  }

  // Public fields only, for this one card, and only while it's switched on
  // (get_public_profile, 0022) — profiles can't be listed or bulk-read.
  const { data: publicRows } = await supabase.rpc("get_public_profile", {
    p_tag_id: tag_id,
  });
  const profile = publicRows?.[0];
  if (!profile) {
    // Lost a race with the status read above — claimed or switched off in between.
    return <InvalidCard t={dict.tagStatus} locale={locale} />;
  }

  // user_id is never public, so compare against the signed-in user's own
  // profile (readable under "Users can view their own profile").
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: ownProfile } = user
    ? await supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle()
    : { data: null };
  const isOwner = ownProfile?.id === profile.id;

  // Only count real visitors tapping the card, not the owner previewing
  // their own — scheduled via after() so it never delays the response.
  // Per card + visitor cap, so refreshing (or a script) can't inflate the stats.
  if (!isOwner && (await rateLimit("tagView", tag_id))) {
    after(() => supabase.rpc("record_tag_view", { p_tag_id: tag_id }));
  }

  // Same per-card gate; testimonials are approved-only (owners review
  // pending ones in /dashboard/testimonials).
  const [{ data: portfolioItems }, { data: testimonials }] = await Promise.all([
    supabase.rpc("get_public_portfolio", { p_tag_id: tag_id }),
    supabase.rpc("get_public_testimonials", { p_tag_id: tag_id }),
  ]);

  const profileUrl = await getProfileUrl(tag_id);
  // Navy on white with high error correction (room for the centre avatar
  // badge) — stays scannable even when the page is in dark mode.
  const qrSvg = await QRCode.toString(profileUrl, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "H",
    color: { dark: "#0b2b3c", light: "#ffffff" },
  });

  return (
    <>
      {isOwner && activated === "1" && (
        <ActivatedBanner t={dict.claimForm} tagId={tag_id} />
      )}
      <ProfileTemplateView
        profile={profile}
        tagId={tag_id}
        isOwner={isOwner}
        portfolioItems={portfolioItems ?? []}
        testimonials={testimonials ?? []}
        locale={locale}
        dict={dict.profile}
        profileUrl={profileUrl}
        qrSvg={qrSvg}
      />
    </>
  );
}
