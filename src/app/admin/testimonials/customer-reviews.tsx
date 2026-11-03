import { formatDate } from "@/lib/format-date";
import { createClient } from "@/lib/supabase/server";
import { StarIcon } from "../icons";
import { CARD, PANEL } from "../ui/kit";
import { StatusPill } from "../ui/status";
import { ReviewActions } from "./review-actions";

const when = formatDate;

// Reviews card owners sent from their dashboard (0030), waiting for you or
// already handled. A review only reaches the website when you publish it;
// it's sent with the customer's agreement to that.
export async function CustomerReviews() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("customer_reviews")
    .select("*")
    .order("status", { ascending: false }) // "new" before "approved"
    .order("created_at", { ascending: false })
    .limit(30);
  const rows = reviews ?? [];
  if (!rows.length) return null;

  // The photo each review carries (if any), a signed link to it, and whether
  // the testimonial made from the review is live.
  const photoIds = rows.map((r) => r.photo_id).filter((id): id is string => !!id);
  const testimonialIds = rows.map((r) => r.testimonial_id).filter((id): id is string => !!id);
  const [{ data: photos }, { data: testimonials }] = await Promise.all([
    photoIds.length
      ? supabase
          .from("customer_photos")
          .select("id, status, consent_social, consent_website, photo_path, website_photo_path")
          .in("id", photoIds)
      : { data: [] },
    testimonialIds.length
      ? supabase.from("landing_testimonials").select("id, published").in("id", testimonialIds)
      : { data: [] },
  ]);
  const photoById = new Map((photos ?? []).map((p) => [p.id, p]));
  const liveById = new Map((testimonials ?? []).map((t) => [t.id, t.published]));

  const paths = (photos ?? []).map((p) => p.photo_path).filter((p): p is string => !!p);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage.from("customer-photos").createSignedUrls(paths, 600);
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
    }
  }

  const toPublish = rows.filter((r) => r.status === "new").length;

  return (
    <section aria-label="Customer reviews" className={PANEL}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-brand-900">Customer reviews</h2>
        {toPublish > 0 && <StatusPill tone="amber" label={`${toPublish} to publish`} />}
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Sent from the customer&apos;s dashboard, with their OK to show it on the website. Nothing
        goes live until you publish it.
      </p>

      <div className="flex flex-col gap-3 md:gap-0 md:divide-y md:divide-slate-100">
        {rows.map((review) => {
          const photo = review.photo_id ? photoById.get(review.photo_id) : undefined;
          const photoUrl = photo?.photo_path ? urls.get(photo.photo_path) : undefined;
          // A photo can go up with the review only if the customer allowed it
          // for the website, it still exists, and it isn't up already.
          const photoCanGoUp =
            review.status === "new" &&
            !!photo &&
            photo.status !== "withdrawn" &&
            photo.consent_website &&
            !photo.website_photo_path &&
            !!photoUrl;
          const live = review.testimonial_id ? liveById.get(review.testimonial_id) : undefined;

          return (
            <article
              key={review.id}
              className={`${CARD} md:rounded-none md:px-0 md:py-4 md:shadow-none md:ring-0`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-brand-900">{review.display_name}</span>
                <span className="flex items-center gap-0.5 text-accent-500" aria-label={`${review.rating} of 5`}>
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <StarIcon key={i} filled className="h-3.5 w-3.5" />
                  ))}
                </span>
                {review.status === "new" ? (
                  <StatusPill tone="amber" label="New" />
                ) : (
                  <StatusPill tone={live ? "green" : "grey"} label={live ? "On website" : "Approved"} />
                )}
                <span className="ml-auto text-xs text-slate-400">{when(review.created_at)}</span>
              </div>
              <p className="mt-2 text-[15px] text-slate-700 md:text-sm">“{review.message}”</p>
              {review.card_order_id && (
                <p className="mt-1 text-xs text-slate-400">
                  Order KP-{review.card_order_id.slice(0, 6).toUpperCase()}
                </p>
              )}

              {photo && (
                <div className="mt-3 flex items-center gap-3">
                  {photoUrl ? (
                    // Signed, short-lived link to a private bucket — plain <img>
                    // on purpose (next/image would try to cache/optimise it).
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl}
                      alt={`${review.display_name} with their card`}
                      className="size-14 shrink-0 rounded-xl bg-slate-200 object-cover"
                    />
                  ) : (
                    <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-slate-200 px-1 text-center text-[10px] font-medium text-slate-400">
                      {photo.status === "withdrawn" ? "Deleted" : "No file"}
                    </span>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusPill tone="grey" label="Photo attached" />
                    {photo.consent_website && <StatusPill tone="green" label="Photo: website OK" />}
                    {photo.consent_social && <StatusPill tone="green" label="Photo: social OK" />}
                    {photo.website_photo_path && <StatusPill tone="teal" label="Photo on website" />}
                  </div>
                </div>
              )}

              {review.status === "new" && (
                <div className="mt-3">
                  <ReviewActions reviewId={review.id} imageUrl={photoCanGoUp ? photoUrl : undefined} />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
