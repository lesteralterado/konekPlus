import Link from "next/link";
import type { Profile } from "@/lib/types";

// Nudges new owners through the few things that make a card worth tapping.
// Disappears once everything is done, so it never nags an established profile.
export function SetupChecklist({
  profile,
  firstTagId,
}: {
  profile: Profile;
  firstTagId: string | null;
}) {
  const hasSocial = Object.values(profile.socials ?? {}).some(Boolean);
  const items = [
    { label: "Add a profile photo", done: !!profile.avatar_url },
    { label: "Add your job title and company", done: !!profile.job_title && !!profile.company },
    { label: "Write a short tagline or bio", done: !!profile.tagline || !!profile.bio },
    { label: "Add a link or social profile", done: profile.links.length > 0 || hasSocial },
  ];
  if (items.every((i) => i.done)) return null;

  const doneCount = items.filter((i) => i.done).length;

  return (
    <section className="mb-4 rounded-3xl bg-brand-50/70 p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold text-brand-900">Get your card ready</h2>
        <span className="text-xs font-medium text-brand-700">
          {doneCount} of {items.length} done
        </span>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5 text-sm">
        {items.map((i) => (
          <li
            key={i.label}
            className={i.done ? "text-slate-400 line-through" : "text-slate-700"}
          >
            {i.done ? "✓ " : "○ "}
            {i.label}
          </li>
        ))}
      </ul>
      {firstTagId && (
        <Link
          href={`/t/${firstTagId}`}
          className="mt-4 inline-block rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
        >
          Preview my card
        </Link>
      )}
    </section>
  );
}
