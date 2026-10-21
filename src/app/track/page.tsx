import type { Metadata } from "next";
import { SiteChrome } from "../site-chrome";
import { TrackForm } from "./track-form";

export const metadata: Metadata = {
  title: "Track your order — Konek+",
  description: "See where your Konek+ card order is, using your order reference and mobile number.",
};

export default function TrackPage() {
  return (
    <SiteChrome>
      <div className="mx-auto max-w-md px-6 py-14 sm:py-20">
        <h1 className="text-2xl font-semibold text-brand-900">Track your order</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">
          Use the reference from your confirmation (it starts with KP-) and the mobile number you
          ordered with.
        </p>
        <TrackForm />
      </div>
    </SiteChrome>
  );
}
