import type { CustomerPhoto } from "@/lib/types";
import { StatusPill } from "../ui/status";
import { AddPhotoButton, PhotoActions } from "./photo-actions";
import type { PhotoTarget } from "./handover-photo";

const when = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

// One photo: thumbnail, what the customer agreed to, the freebie, and what
// can still be done. Shared by the per-order panel and the /admin/photos list.
export function PhotoRow({
  photo,
  url,
  customerName,
}: {
  photo: CustomerPhoto;
  // Signed link, when the file still exists.
  url?: string;
  customerName: string;
}) {
  const withdrawn = photo.status === "withdrawn";
  return (
    <div className="flex items-start gap-3">
      {url ? (
        // Signed, short-lived link to a private bucket — plain <img> on
        // purpose (next/image would try to cache/optimise it).
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`${customerName} with their order`} className="size-16 shrink-0 rounded-xl bg-slate-200 object-cover" />
      ) : (
        <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-slate-200 px-1 text-center text-[10px] font-medium text-slate-400">
          {withdrawn ? "Deleted" : photo.purged_at ? "Expired" : "No file"}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {withdrawn ? (
            <StatusPill tone="red" label={`Withdrawn ${photo.withdrawn_at ? when(photo.withdrawn_at) : ""}`.trim()} />
          ) : (
            <>
              <StatusPill tone="grey" label="Private record" />
              {photo.consent_social && <StatusPill tone="green" label="Social OK" />}
              {photo.consent_website && <StatusPill tone="green" label="Website OK" />}
              {photo.website_photo_path && <StatusPill tone="teal" label="On website" />}
            </>
          )}
          {photo.freebie_status === "pending" && <StatusPill tone="amber" label="Freebie to give" />}
          {photo.freebie_status === "given" && <StatusPill tone="green" label="Freebie given" />}
          {photo.freebie_status === "declined" && <StatusPill tone="grey" label="Freebie declined" />}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {when(photo.created_at)}
          {photo.freebie_note && ` · ${photo.freebie_note}`}
        </p>
        <div className="mt-2">
          <PhotoActions
            photoId={photo.id}
            freebiePending={photo.freebie_status === "pending"}
            withdrawn={withdrawn}
            imageUrl={url}
            websiteReady={photo.consent_website && photo.status === "active" && !photo.website_photo_path}
            defaultName={customerName}
          />
        </div>
      </div>
    </div>
  );
}

// The customer photos on one order, plus the "Add photo" button for an order
// handed over in person that has none yet (or has another to add).
export function PhotoPanel({
  photos,
  urls,
  target,
  canAdd,
}: {
  photos: CustomerPhoto[];
  urls: Map<string, string>;
  target: PhotoTarget;
  canAdd: boolean;
}) {
  if (!photos.length && !canAdd) return null;

  return (
    <div className="mt-3 rounded-2xl bg-slate-50 p-3 md:mt-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Photo with customer
      </p>

      {photos.map((photo) => (
        <div key={photo.id} className="mt-2">
          <PhotoRow
            photo={photo}
            url={photo.photo_path ? urls.get(photo.photo_path) : undefined}
            customerName={target.customerName}
          />
        </div>
      ))}

      {canAdd && (
        <div className={photos.length ? "mt-3" : "mt-2"}>
          <AddPhotoButton target={target} />
        </div>
      )}
    </div>
  );
}
