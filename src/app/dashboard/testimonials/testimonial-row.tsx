"use client";

import { useTransition } from "react";
import { StarIcon } from "@/app/dashboard/icons";
import type { ProfileTestimonial } from "@/lib/types";
import { deleteTestimonial, setTestimonialApproved } from "./actions";

export function TestimonialRow({ testimonial }: { testimonial: ProfileTestimonial }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-brand-900">
            {testimonial.author_name || "Anonymous"}
          </p>
          <span className="mt-0.5 flex items-center gap-0.5 text-accent-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon key={i} filled={i < testimonial.rating} className="h-3.5 w-3.5" />
            ))}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            testimonial.approved
              ? "bg-brand-50 text-brand-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {testimonial.approved ? "Live on profile" : "Pending"}
        </span>
      </div>
      <p className="text-sm text-slate-600">{testimonial.message}</p>
      <div className="mt-1 flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() =>
              setTestimonialApproved(testimonial.id, !testimonial.approved),
            )
          }
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
            testimonial.approved
              ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
              : "bg-brand-600 text-white hover:bg-brand-700"
          }`}
        >
          {testimonial.approved ? "Unpublish" : "Approve"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!confirm("Delete this testimonial?")) return;
            startTransition(() => deleteTestimonial(testimonial.id));
          }}
          className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
