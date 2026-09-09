import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EnabledToggle } from "../../tags/enabled-toggle";
import { ResetButton } from "../../tags/reset-button";
import { ArrowLeftIcon, CreditCardIcon } from "../../icons";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: profile }, { data: tags }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("tags")
      .select("tag_id, claimed_at, created_at, enabled")
      .eq("profile_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!profile) notFound();

  const socials = Object.entries(profile.socials ?? {}).filter(([, url]) => url);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/customers"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to customers
      </Link>

      <section className="rounded-3xl bg-white p-6 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)]">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-brand-100">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt=""
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-brand-700">
                {(profile.full_name ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-brand-900">
              {profile.full_name || "Unnamed profile"}
            </h1>
            {(profile.job_title || profile.company) && (
              <p className="text-sm text-slate-500">
                {[profile.job_title, profile.company].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Email
            </dt>
            <dd className="mt-0.5 text-sm text-slate-700">{profile.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Phone
            </dt>
            <dd className="mt-0.5 text-sm text-slate-700">{profile.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Profile updated
            </dt>
            <dd className="mt-0.5 text-sm text-slate-700">
              {new Date(profile.updated_at).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Socials
            </dt>
            <dd className="mt-0.5 text-sm text-slate-700">
              {socials.length > 0
                ? socials.map(([label, url]) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="mr-3 capitalize text-brand-700 hover:underline"
                    >
                      {label}
                    </a>
                  ))
                : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)]">
        <h2 className="mb-4 text-sm font-semibold text-brand-900">
          Linked cards ({tags?.length ?? 0})
        </h2>
        {tags && tags.length > 0 ? (
          <ul className="flex flex-col divide-y divide-slate-100">
            {tags.map((tag) => (
              <li key={tag.tag_id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <CreditCardIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <Link
                      href={`/t/${tag.tag_id}`}
                      className="font-mono text-sm text-slate-700 hover:text-brand-700"
                    >
                      {tag.tag_id}
                    </Link>
                    <p className="text-xs text-slate-400">
                      Linked{" "}
                      {tag.claimed_at ? new Date(tag.claimed_at).toLocaleDateString() : "—"}
                      {!tag.enabled && (
                        <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                          Disabled
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <EnabledToggle tagId={tag.tag_id} enabled={tag.enabled} />
                  <ResetButton tagId={tag.tag_id} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No cards linked.</p>
        )}
      </section>
    </div>
  );
}
