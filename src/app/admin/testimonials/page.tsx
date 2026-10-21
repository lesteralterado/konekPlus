import { MIN_TESTIMONIALS } from "@/app/_landing/testimonials";
import { createClient } from "@/lib/supabase/server";
import { EyeIcon, EyeOffIcon, StarIcon, TrashIcon } from "../icons";
import { ConfirmButton, Fab } from "../ui/drawers";
import { CARD, EmptyState, PANEL } from "../ui/kit";
import { StatusPill } from "../ui/status";
import { deleteTestimonial, setTestimonialPublished } from "./actions";
import { AddTestimonialForm } from "./add-form";

export const dynamic = "force-dynamic";

const ADD_HINT =
  "Only add quotes the customer agreed to have published, in their own words. New ones start as drafts.";

export default async function AdminTestimonialsPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("landing_testimonials")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const publishedCount = (items ?? []).filter((i) => i.published).length;
  const live = publishedCount >= MIN_TESTIMONIALS;

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[28px] font-bold tracking-tight text-brand-900 md:text-2xl md:font-semibold">
          Testimonials
        </h1>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
            live ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
          title={`The homepage section appears at ${MIN_TESTIMONIALS} published`}
        >
          <span className={`size-2 rounded-full ${live ? "bg-emerald-500" : "bg-amber-500"}`} />
          {live ? `Live · ${publishedCount}` : `${publishedCount}/${MIN_TESTIMONIALS} to go live`}
        </span>
      </div>

      {/* Desktop: inline form. Phones: behind the + button. */}
      <section className="hidden rounded-3xl bg-white p-6 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] md:block">
        <h2 className="text-sm font-semibold text-brand-900">Add a testimonial</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">{ADD_HINT}</p>
        <AddTestimonialForm />
      </section>
      <Fab label="Add testimonial">
        <p className="mb-4 text-sm text-slate-500">{ADD_HINT}</p>
        <AddTestimonialForm />
      </Fab>

      <section className={PANEL}>
        <div className="flex flex-col gap-3 md:gap-0 md:divide-y md:divide-slate-100">
          {(items ?? []).map((item) => (
            <article
              key={item.id}
              className={`${CARD} flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6 md:rounded-none md:px-0 md:py-4 md:shadow-none md:ring-0`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-brand-900">{item.author_name}</span>
                  {item.author_role && <span className="text-sm text-slate-500">{item.author_role}</span>}
                  <span className="flex items-center gap-0.5 text-accent-500" aria-label={`${item.rating} of 5`}>
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <StarIcon key={i} filled className="h-3.5 w-3.5" />
                    ))}
                  </span>
                  <StatusPill
                    tone={item.published ? "green" : "grey"}
                    label={item.published ? "Published" : "Draft"}
                  />
                </div>
                <p className="mt-2 text-[15px] text-slate-700 md:text-sm">“{item.quote}”</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form action={setTestimonialPublished.bind(null, item.id, !item.published)} className="flex-1 md:flex-none">
                  <button
                    type="submit"
                    className="ios-press flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-brand-50 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-100 md:h-auto md:py-1.5 md:text-xs"
                  >
                    {item.published ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                    {item.published ? "Unpublish" : "Publish"}
                  </button>
                </form>
                <ConfirmButton
                  title="Delete testimonial?"
                  message={`“${item.quote.slice(0, 80)}${item.quote.length > 80 ? "…" : ""}” — ${item.author_name}. This can’t be undone.`}
                  confirmLabel="Delete"
                  triggerLabel={`Delete testimonial from ${item.author_name}`}
                  triggerClassName="ios-press grid size-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 md:size-8"
                  onConfirm={deleteTestimonial.bind(null, item.id)}
                >
                  <TrashIcon className="size-4" />
                </ConfirmButton>
              </div>
            </article>
          ))}
          {(items ?? []).length === 0 && <EmptyState>No testimonials yet.</EmptyState>}
        </div>
      </section>
    </div>
  );
}
