import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TestimonialRow } from "./testimonial-row";

export const dynamic = "force-dynamic";

export default async function TestimonialsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) redirect("/dashboard");

  // Owners bypass the "approved = true" restriction under RLS (see
  // 0014_feedback.sql), so this sees pending testimonials too — unlike the
  // public /t/[tag_id] page, which only ever queries approved ones.
  const { data: testimonials } = await supabase
    .from("profile_testimonials")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link
        href="/dashboard"
        className="text-sm font-semibold text-slate-500 transition hover:text-brand-700"
      >
        ← Back to your profile
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-brand-900">
        Testimonials
      </h1>
      <p className="mt-1 text-slate-500">
        Visitors can leave feedback on your public profile. Approve the ones
        you want shown — nothing goes live without your say-so.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {(testimonials ?? []).map((t) => (
          <TestimonialRow key={t.id} testimonial={t} />
        ))}
        {(testimonials ?? []).length === 0 && (
          <p className="rounded-3xl bg-white p-6 text-center text-slate-400 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)]">
            No testimonials yet.
          </p>
        )}
      </div>
    </main>
  );
}
