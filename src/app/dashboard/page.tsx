import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddTagForm } from "./add-tag-form";
import { ProfileForm } from "./profile-form";
import { signOut } from "./actions";
import { ChevronRightIcon, CreditCardIcon, LogOutIcon } from "./icons";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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

  const { data: tags } = profile
    ? await supabase
        .from("tags")
        .select("tag_id, claimed_at, created_at")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: true })
    : { data: null };

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-900">Your profile</h1>
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition hover:text-brand-700"
          >
            <LogOutIcon />
          </button>
        </form>
      </div>

      {!profile ? (
        <p className="rounded-3xl bg-white px-4 py-8 text-center text-slate-500 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)]">
          No profile yet — tap one of your Konek+ cards to set it up.
        </p>
      ) : (
        <ProfileForm profile={profile} />
      )}

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-8">
        <h2 className="mb-4 text-lg font-semibold text-brand-900">
          Your cards
        </h2>

        {tags && tags.length > 0 ? (
          <div className="mb-6 flex gap-3 overflow-x-auto pb-1">
            {tags.map((tag) => (
              <Link
                key={tag.tag_id}
                href={`/t/${tag.tag_id}`}
                className="group relative flex w-28 shrink-0 flex-col items-center gap-2 rounded-2xl bg-brand-50/60 p-4 text-center transition hover:bg-brand-50"
              >
                <ChevronRightIcon className="absolute right-2 top-2 h-4 w-4 text-slate-300 transition group-hover:text-brand-500" />
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-700 shadow-sm">
                  <CreditCardIcon />
                </span>
                <span className="w-full truncate font-mono text-xs font-semibold text-slate-700">
                  {tag.tag_id}
                </span>
                <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                  Linked
                </span>
                <span className="-mt-1.5 text-[11px] text-slate-500">
                  {tag.claimed_at
                    ? new Date(tag.claimed_at).toLocaleDateString()
                    : "—"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mb-6 rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No cards linked yet — tap a card, or add one below by its code.
          </p>
        )}

        <h3 className="mb-3 text-sm font-medium text-slate-600">
          Got a new card? Add it without tapping it:
        </h3>
        <AddTagForm />
      </section>
    </main>
  );
}
