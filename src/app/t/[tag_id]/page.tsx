import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/locale";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import type { Locale } from "@/lib/i18n/locale";
import { LanguageSwitcher } from "@/app/language-switcher";
import { ClaimForm } from "./claim-form";
import { ProfileTemplateView } from "./templates";

export const dynamic = "force-dynamic";

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

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag_id: string }>;
}) {
  const { tag_id } = await params;
  const supabase = await createClient();
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  const { data: status } = await supabase.rpc("tag_status", {
    p_tag_id: tag_id,
  });

  switch (status) {
    case null:
    case undefined:
      return <InvalidCard t={dict.tagStatus} locale={locale} />;
    case "unclaimed":
      return (
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
          <LanguageSwitcher locale={locale} className="mb-4 justify-center" />
          <ClaimForm tagId={tag_id} dict={dict.claimForm} />
        </main>
      );
    case "disabled":
      return <CardUnavailable t={dict.tagStatus} locale={locale} />;
  }

  const { data: profileId } = await supabase.rpc("get_tag_profile", {
    p_tag_id: tag_id,
  });
  if (!profileId) {
    // Lost a race between the two reads above — someone else claimed it,
    // or the owner disabled it, in between.
    return <InvalidCard t={dict.tagStatus} locale={locale} />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) {
    return <InvalidCard t={dict.tagStatus} locale={locale} />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.user_id;

  // Only count real visitors tapping the card, not the owner previewing
  // their own — scheduled via after() so it never delays the response.
  if (!isOwner) {
    after(() => supabase.rpc("record_tag_view", { p_tag_id: tag_id }));
  }

  const { data: portfolioItems } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("profile_id", profile.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  // RLS only returns approved rows to non-owners (see 0014_feedback.sql);
  // the owner sees everything including pending ones from /dashboard/testimonials.
  const { data: testimonials } = await supabase
    .from("profile_testimonials")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("approved", true)
    .order("created_at", { ascending: false });

  return (
    <ProfileTemplateView
      profile={profile}
      tagId={tag_id}
      isOwner={isOwner}
      portfolioItems={portfolioItems ?? []}
      testimonials={testimonials ?? []}
      locale={locale}
      dict={dict.profile}
    />
  );
}
