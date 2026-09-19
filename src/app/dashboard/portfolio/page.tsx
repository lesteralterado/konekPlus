import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddProjectForm } from "./add-project-form";
import { DeletePortfolioButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
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

  const { data: items } = await supabase
    .from("portfolio_items")
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
        Portfolio
      </h1>
      <p className="mt-1 text-slate-500">
        Showcase your best work — it shows up as a project gallery on your
        public profile.
      </p>

      <div className="mt-6">
        <AddProjectForm />
      </div>

      {items && items.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative overflow-hidden rounded-3xl bg-white shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)]"
            >
              <DeletePortfolioButton itemId={item.id} />
              {item.image_url && (
                <div className="relative h-40 w-full bg-slate-100">
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-bold text-brand-900">{item.title}</h3>
                {item.tech && (
                  <p className="mt-0.5 text-xs font-medium text-brand-600">
                    {item.tech}
                  </p>
                )}
                {item.description && (
                  <p className="mt-1.5 text-sm text-slate-500">
                    {item.description}
                  </p>
                )}
                {item.project_url && (
                  <a
                    href={item.project_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm font-semibold text-brand-700 hover:underline"
                  >
                    View project →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
