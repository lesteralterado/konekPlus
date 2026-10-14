import { MIN_TESTIMONIALS } from "@/app/_landing/testimonials";
import { createClient } from "@/lib/supabase/server";
import { StarIcon } from "../icons";
import { deleteTestimonial, setTestimonialPublished } from "./actions";
import { AddTestimonialForm } from "./add-form";

export const dynamic = "force-dynamic";

const CARD = "rounded-3xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-6";

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold text-brand-900">Testimonials</h1>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            live ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {live
            ? `Live on the homepage · ${publishedCount} published`
            : `${publishedCount} of ${MIN_TESTIMONIALS} published — the homepage section appears at ${MIN_TESTIMONIALS}`}
        </span>
      </div>

      <section className={CARD}>
        <h2 className="text-sm font-semibold text-brand-900">Add a testimonial</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          Only add quotes the customer agreed to have published, in their own words. New ones start
          as drafts.
        </p>
        <AddTestimonialForm />
      </section>

      <section className={CARD}>
        <div className="flex flex-col divide-y divide-slate-100">
          {(items ?? []).map((item) => (
            <div key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-brand-900">{item.author_name}</span>
                  {item.author_role && <span className="text-sm text-slate-500">{item.author_role}</span>}
                  <span className="flex items-center gap-0.5 text-accent-500">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <StarIcon key={i} filled className="h-3.5 w-3.5" />
                    ))}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">“{item.quote}”</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <form action={setTestimonialPublished.bind(null, item.id, !item.published)}>
                  <button
                    type="submit"
                    className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                  >
                    {item.published ? "Unpublish" : "Publish"}
                  </button>
                </form>
                <form action={deleteTestimonial.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
          {(items ?? []).length === 0 && (
            <p className="py-8 text-center text-slate-400">No testimonials yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
