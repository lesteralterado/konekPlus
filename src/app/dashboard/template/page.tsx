import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATES, TEMPLATE_LABELS } from "@/app/t/[tag_id]/templates";
import type { ProfileTemplate } from "@/lib/types";
import { UseTemplateButton } from "./use-template-button";

export const dynamic = "force-dynamic";

const TEMPLATE_DESCRIPTIONS: Record<ProfileTemplate, string> = {
  classic: "Clean and dependable — a banner photo, centered avatar, and full-width actions.",
  editorial: "Your photo as the hero, name overlaid magazine-style, sleek icon actions below.",
  minimal: "Small centered portrait, one hero action, everything else tucked into a quiet icon row.",
};

export default async function TemplatePickerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/dashboard");

  const { data: firstTag } = await supabase
    .from("tags")
    .select("tag_id")
    .eq("profile_id", profile.id)
    .limit(1)
    .maybeSingle();
  const previewTagId = firstTag?.tag_id ?? "preview";

  const { data: portfolioItems } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("profile_id", profile.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/dashboard"
        className="text-sm font-semibold text-slate-500 transition hover:text-brand-700"
      >
        ← Back to your profile
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-brand-900">
        Choose your style
      </h1>
      <p className="mt-1 text-slate-500">
        This is a live preview using your real profile — pick the one that
        feels most like you. Every card you own updates instantly.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {(Object.keys(TEMPLATES) as ProfileTemplate[]).map((key) => {
          const Template = TEMPLATES[key];
          const isActive = profile.template === key;
          return (
            <div
              key={key}
              data-template={key}
              className={`flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] ring-2 transition ${
                isActive ? "ring-brand-500" : "ring-transparent"
              }`}
            >
              <div className="relative h-[440px] overflow-hidden bg-slate-100">
                <div className="pointer-events-none absolute left-1/2 top-3 w-[380px] origin-top -translate-x-1/2 scale-[0.56]">
                  <Template
                    profile={profile}
                    tagId={previewTagId}
                    isOwner={false}
                    portfolioItems={portfolioItems ?? []}
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-100 to-transparent" />
              </div>

              <div className="flex flex-1 flex-col gap-3 p-5">
                <div>
                  <h2 className="font-bold text-brand-900">
                    {TEMPLATE_LABELS[key]}
                  </h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                    {TEMPLATE_DESCRIPTIONS[key]}
                  </p>
                </div>
                <div className="mt-auto">
                  <UseTemplateButton template={key} isActive={isActive} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
