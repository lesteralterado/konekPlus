"use client";

import { useState, useTransition } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Sheet } from "@/components/sheet";
import { showToast } from "@/components/toast";
import { getCroppedImage } from "@/lib/crop-image";
import { publishReview, rejectReview, type ReviewResult } from "./actions";

const chip =
  "ios-press inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-semibold disabled:opacity-60";
const primaryButton =
  "ios-press h-12.5 w-full rounded-full bg-brand-900 text-[17px] font-semibold text-white disabled:opacity-60";
const secondaryButton =
  "ios-press h-12.5 w-full rounded-full bg-white text-[17px] font-semibold text-slate-600 ring-1 ring-slate-200 disabled:opacity-60";

// Crop the customer's photo to a circle-ready square and publish the review
// with it. The crop is made in the browser from the private photo's signed
// link; the original never goes public.
function CropSheet({
  reviewId,
  imageUrl,
  onClose,
}: {
  reviewId: string;
  imageUrl: string;
  onClose: () => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!area) return;
    startTransition(async () => {
      try {
        const blob = await getCroppedImage(imageUrl, area, 512);
        const form = new FormData();
        form.set("review_id", reviewId);
        form.set("photo", new File([blob], "crop.jpg", { type: "image/jpeg" }));
        const result = await publishReview(form);
        if (result.error) {
          setError(result.error);
          return;
        }
        showToast("Published with photo");
        onClose();
      } catch {
        setError("We couldn't prepare the photo. Please try again.");
      }
    });
  }

  return (
    <div className="pb-2">
      <p className="text-[15px] text-slate-600">
        This customer agreed to website use of their photo. Crop it, and the review goes live with
        it.
      </p>
      <div className="relative mt-3 h-64 w-full overflow-hidden rounded-2xl bg-slate-900">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_visible, pixels) => setArea(pixels)}
        />
      </div>
      <input
        type="range"
        min={1}
        max={3}
        step={0.01}
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
        aria-label="Zoom"
        className="mt-3 w-full accent-brand-600"
      />
      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex flex-col gap-2.5 pb-1">
        <button type="button" disabled={pending || !area} onClick={submit} className={primaryButton}>
          {pending ? "Publishing…" : "Publish with photo"}
        </button>
        <button type="button" onClick={onClose} className={secondaryButton}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function RejectSheet({ reviewId, onClose }: { reviewId: string; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function reject() {
    startTransition(async () => {
      const result: ReviewResult = await rejectReview(reviewId);
      setError(result.error);
      if (!result.error) {
        showToast("Review rejected");
        onClose();
      }
    });
  }

  return (
    <div className="pb-2">
      <p className="text-[15px] leading-relaxed text-slate-600">
        This deletes the review so the customer can write another. A photo they attached stays in
        Photos, where you can approve or reject it separately.
      </p>
      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex flex-col gap-2.5 pb-1">
        <button
          type="button"
          disabled={pending}
          onClick={reject}
          className="ios-press h-12.5 w-full rounded-full bg-red-500 text-[17px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Working…" : "Reject review"}
        </button>
        <button type="button" onClick={onClose} className={secondaryButton}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// What can be done with a review waiting for you: put it on the website (with
// the customer's photo, if they agreed to that), or reject it.
export function ReviewActions({
  reviewId,
  imageUrl,
}: {
  reviewId: string;
  // Signed link to the customer's photo — only when it can go on the website.
  imageUrl?: string;
}) {
  const [sheet, setSheet] = useState<"crop" | "reject" | null>(null);
  const close = () => setSheet(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function publish() {
    startTransition(async () => {
      const form = new FormData();
      form.set("review_id", reviewId);
      const result = await publishReview(form);
      setError(result.error);
      if (!result.error) showToast("Review published");
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={publish}
          className={`${chip} bg-emerald-100 text-emerald-800`}
        >
          {pending ? "Publishing…" : "Publish"}
        </button>
        {imageUrl && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setSheet("crop")}
            className={`${chip} bg-brand-50 text-brand-700`}
          >
            Publish with photo
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => setSheet("reject")}
          className={`${chip} bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600`}
        >
          Reject
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </div>

      <Sheet open={sheet === "crop"} onClose={close} title="Publish with photo" closeLabel="Close" scopeClass="admin-ui">
        {sheet === "crop" && imageUrl && (
          <CropSheet reviewId={reviewId} imageUrl={imageUrl} onClose={close} />
        )}
      </Sheet>
      <Sheet open={sheet === "reject"} onClose={close} title="Reject review?" closeLabel="Close" scopeClass="admin-ui">
        {sheet === "reject" && <RejectSheet reviewId={reviewId} onClose={close} />}
      </Sheet>
    </>
  );
}
