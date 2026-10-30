"use client";

import { useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { showToast } from "@/components/toast";
import { CameraIcon } from "@/app/dashboard/icons";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { getCroppedImage } from "@/lib/crop-image";
import {
  approvePhoto,
  publishPhotoToWebsite,
  rejectPhoto,
  setFreebie,
  withdrawPhoto,
  type PhotoResult,
} from "./actions";
import { openHandoverPhoto, type PhotoTarget } from "./handover-photo";

const chip =
  "ios-press inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-semibold disabled:opacity-60";
const primaryButton =
  "ios-press h-12.5 w-full rounded-full bg-brand-900 text-[17px] font-semibold text-white disabled:opacity-60";
const secondaryButton =
  "ios-press h-12.5 w-full rounded-full bg-white text-[17px] font-semibold text-slate-600 ring-1 ring-slate-200 disabled:opacity-60";

// "Add photo": for an order handed over earlier, or when the customer comes
// back. Opens the same consent → photo sheet as the handover itself.
export function AddPhotoButton({ target }: { target: PhotoTarget }) {
  return (
    <button
      type="button"
      onClick={() => openHandoverPhoto(target)}
      className={`${chip} gap-1.5 bg-white text-brand-700 ring-1 ring-brand-200`}
    >
      <CameraIcon className="size-4" />
      Add photo with customer
    </button>
  );
}

// Run a server action from a sheet, keeping its error inline (a toast only
// says "done") and closing on success.
function useSheetAction(onDone: () => void, doneMessage: string) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<PhotoResult>) {
    startTransition(async () => {
      const result = await action();
      setError(result.error);
      if (!result.error) {
        showToast(doneMessage);
        onDone();
      }
    });
  }
  return { pending, error, run, clearError: () => setError(null) };
}

function FreebieSheet({ photoId, onClose }: { photoId: string; onClose: () => void }) {
  const [note, setNote] = useState("");
  const { pending, error, run } = useSheetAction(onClose, "Freebie recorded");

  return (
    <div className="pb-2">
      <p className="text-[15px] text-slate-600">
        What did you give? Optional, but handy later (e.g. “keychain charm”, “sticker”).
      </p>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={200}
        placeholder="e.g. sticker pack"
        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
      />
      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex flex-col gap-2.5 pb-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setFreebie(photoId, "given", note))}
          className={primaryButton}
        >
          {pending ? "Saving…" : "Mark given"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setFreebie(photoId, "declined", note))}
          className={secondaryButton}
        >
          Customer didn’t want it
        </button>
      </div>
    </div>
  );
}

function WithdrawSheet({ photoId, onClose }: { photoId: string; onClose: () => void }) {
  const { pending, error, run } = useSheetAction(onClose, "Photo withdrawn");

  return (
    <div className="pb-2">
      <p className="text-[15px] leading-relaxed text-slate-600">
        This deletes the photo from storage and records that the customer withdrew consent. If it
        was already posted on social media, take that post down yourself. A freebie already given
        stays given.
      </p>
      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex flex-col gap-2.5 pb-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => withdrawPhoto(photoId))}
          className="ios-press h-12.5 w-full rounded-full bg-red-500 text-[17px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Working…" : "Delete photo"}
        </button>
        <button type="button" onClick={onClose} className={secondaryButton}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const field =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

// Crop the photo to a circle-ready square, add the customer's own words, and
// create a DRAFT testimonial (published separately, from /admin/testimonials).
// The crop is made in the browser from the private photo's signed link; the
// private original itself never goes public.
function WebsiteSheet({
  photoId,
  imageUrl,
  defaultName,
  onClose,
}: {
  photoId: string;
  imageUrl: string;
  defaultName: string;
  onClose: () => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [name, setName] = useState(defaultName);
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState("5");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!area) return;
    startTransition(async () => {
      try {
        const blob = await getCroppedImage(imageUrl, area, 512);
        const form = new FormData();
        form.set("photo_id", photoId);
        form.set("author_name", name);
        form.set("author_role", role);
        form.set("quote", quote);
        form.set("rating", rating);
        form.set("photo", new File([blob], "crop.jpg", { type: "image/jpeg" }));
        const result = await publishPhotoToWebsite(form);
        if (result.error) {
          setError(result.error);
          return;
        }
        showToast("Draft testimonial created");
        onClose();
      } catch {
        setError("We couldn't prepare the photo. Please try again.");
      }
    });
  }

  return (
    <div className="pb-2">
      <p className="text-[15px] text-slate-600">
        This customer agreed to website use. Crop the photo, then add what they said — the quote
        needs their OK too, so type it as they said it. You publish it from Testimonials.
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

      <div className="mt-3 flex flex-col gap-2.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="Name to show (first name is fine)"
          aria-label="Name to show"
          className={field}
        />
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          maxLength={120}
          placeholder="Role, e.g. Realtor · Makati (optional)"
          aria-label="Role"
          className={field}
        />
        <textarea
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          maxLength={400}
          rows={3}
          placeholder="Their words, exactly as they said them"
          aria-label="Their words"
          className={field}
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Stars they gave
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className={`${field} w-auto`}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} ★
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex flex-col gap-2.5 pb-1">
        <button
          type="button"
          disabled={pending || !area || !name.trim() || !quote.trim()}
          onClick={submit}
          className={primaryButton}
        >
          {pending ? "Creating…" : "Create draft testimonial"}
        </button>
        <button type="button" onClick={onClose} className={secondaryButton}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function RejectSheet({ photoId, onClose }: { photoId: string; onClose: () => void }) {
  const { pending, error, run } = useSheetAction(onClose, "Photo rejected");

  return (
    <div className="pb-2">
      <p className="text-[15px] leading-relaxed text-slate-600">
        This deletes the photo so the customer can send another. Use it for a photo that isn&apos;t
        them with their card, or isn&apos;t usable. Nothing was published or promised yet.
      </p>
      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex flex-col gap-2.5 pb-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => rejectPhoto(photoId))}
          className="ios-press h-12.5 w-full rounded-full bg-red-500 text-[17px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Working…" : "Reject photo"}
        </button>
        <button type="button" onClick={onClose} className={secondaryButton}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// A photo the customer sent themselves, waiting for a look.
function ReviewButtons({ photoId, onReject }: { photoId: string; onReject: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function approve() {
    startTransition(async () => {
      const result = await approvePhoto(photoId);
      setError(result.error);
      if (!result.error) showToast("Photo approved");
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={approve}
        className={`${chip} bg-emerald-100 text-emerald-800`}
      >
        {pending ? "Approving…" : "Approve"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onReject}
        className={`${chip} bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600`}
      >
        Reject
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </>
  );
}

// What can still be done to one photo: approve or reject one the customer
// sent, otherwise record the freebie, put it on the website (if the customer
// agreed), or withdraw it.
export function PhotoActions({
  photoId,
  freebiePending,
  withdrawn,
  imageUrl,
  websiteReady,
  defaultName,
  reviewPending = false,
  leftoverFiles = false,
}: {
  photoId: string;
  freebiePending: boolean;
  withdrawn: boolean;
  // Signed link to the private photo, for the website crop.
  imageUrl?: string;
  // Agreed to website use, still active, and not on the website yet.
  websiteReady: boolean;
  defaultName: string;
  // A customer-sent photo awaiting review.
  reviewPending?: boolean;
  // Withdrawn, but a file is still stored (a customer's own withdrawal that
  // couldn't finish deleting). Withdrawing again finishes the job.
  leftoverFiles?: boolean;
}) {
  const [sheet, setSheet] = useState<"freebie" | "withdraw" | "website" | "reject" | null>(null);
  const close = () => setSheet(null);
  if (withdrawn && !leftoverFiles) return null;

  if (withdrawn) {
    return (
      <>
        <button
          type="button"
          onClick={() => setSheet("withdraw")}
          className={`${chip} bg-red-50 text-red-600`}
        >
          Delete leftover file
        </button>
        <Sheet open={sheet === "withdraw"} onClose={close} title="Delete leftover file?" closeLabel="Close" scopeClass="admin-ui">
          {sheet === "withdraw" && <WithdrawSheet photoId={photoId} onClose={close} />}
        </Sheet>
      </>
    );
  }

  if (reviewPending) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <ReviewButtons photoId={photoId} onReject={() => setSheet("reject")} />
        </div>
        <Sheet open={sheet === "reject"} onClose={close} title="Reject photo?" closeLabel="Close" scopeClass="admin-ui">
          {sheet === "reject" && <RejectSheet photoId={photoId} onClose={close} />}
        </Sheet>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {websiteReady && imageUrl && (
          <button
            type="button"
            onClick={() => setSheet("website")}
            className={`${chip} bg-brand-50 text-brand-700`}
          >
            Use on website
          </button>
        )}
        {freebiePending && (
          <button
            type="button"
            onClick={() => setSheet("freebie")}
            className={`${chip} bg-amber-100 text-amber-800`}
          >
            Record freebie
          </button>
        )}
        <button
          type="button"
          onClick={() => setSheet("withdraw")}
          className={`${chip} bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600`}
        >
          Withdraw
        </button>
      </div>

      <Sheet
        open={sheet === "freebie"}
        onClose={close}
        title="Freebie"
        closeLabel="Close"
        scopeClass="admin-ui"
      >
        {sheet === "freebie" && <FreebieSheet photoId={photoId} onClose={close} />}
      </Sheet>
      <Sheet
        open={sheet === "website"}
        onClose={close}
        title="Use on website"
        closeLabel="Close"
        scopeClass="admin-ui"
      >
        {sheet === "website" && imageUrl && (
          <WebsiteSheet
            photoId={photoId}
            imageUrl={imageUrl}
            defaultName={defaultName}
            onClose={close}
          />
        )}
      </Sheet>
      <Sheet
        open={sheet === "withdraw"}
        onClose={close}
        title="Withdraw photo?"
        closeLabel="Close"
        scopeClass="admin-ui"
      >
        {sheet === "withdraw" && <WithdrawSheet photoId={photoId} onClose={close} />}
      </Sheet>
    </>
  );
}
