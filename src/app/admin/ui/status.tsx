import type {
  CardOrderStatus,
  FeedbackStatus,
  KeychainOrderStatus,
  PaymentStatus,
} from "@/lib/types";

// One colour language for every status in admin, so a glance at the dot
// says what to do without reading: amber = needs you, teal = in progress,
// sky = on the road, green = done, grey = off/cancelled, red = problem.
export type Tone = "amber" | "teal" | "sky" | "green" | "grey" | "red";

export const TONE_DOT: Record<Tone, string> = {
  amber: "bg-amber-500",
  teal: "bg-brand-600",
  sky: "bg-sky-500",
  green: "bg-emerald-500",
  grey: "bg-slate-400",
  red: "bg-red-500",
};

export const TONE_PILL: Record<Tone, string> = {
  amber: "bg-amber-50 text-amber-700",
  teal: "bg-brand-50 text-brand-700",
  sky: "bg-sky-50 text-sky-700",
  green: "bg-emerald-50 text-emerald-700",
  grey: "bg-slate-100 text-slate-500",
  red: "bg-red-50 text-red-600",
};

export const ORDER_STATUS: Record<CardOrderStatus, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "amber" },
  contacted: { label: "Contacted", tone: "teal" },
  confirmed: { label: "Confirmed", tone: "teal" },
  preparing: { label: "Preparing", tone: "teal" },
  shipped: { label: "Shipped", tone: "sky" },
  delivered: { label: "Delivered", tone: "green" },
  fulfilled: { label: "Fulfilled", tone: "green" },
  cancelled: { label: "Cancelled", tone: "grey" },
};

export const KEYCHAIN_STATUS: Record<KeychainOrderStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "grey" },
  social_links_submitted: { label: "Verify links", tone: "amber" },
  links_verified: { label: "Verified", tone: "teal" },
  ready_for_programming: { label: "To program", tone: "teal" },
  programming: { label: "Programming", tone: "teal" },
  nfc_programmed: { label: "Programmed", tone: "teal" },
  nfc_tested: { label: "Tested", tone: "teal" },
  qc_passed: { label: "QC passed", tone: "teal" },
  ready_for_handover: { label: "Hand over", tone: "amber" },
  handed_over: { label: "Handed over", tone: "green" },
  completed: { label: "Completed", tone: "green" },
};

export const FEEDBACK_STATUS: Record<FeedbackStatus, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "amber" },
  reviewed: { label: "Reviewed", tone: "teal" },
  resolved: { label: "Resolved", tone: "green" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: Tone }> = {
  unpaid: { label: "Unpaid", tone: "grey" },
  proof_submitted: { label: "To verify", tone: "amber" },
  with_courier: { label: "With courier", tone: "sky" },
  paid: { label: "Paid", tone: "green" },
  refunded: { label: "Refunded", tone: "grey" },
};

// Unpaid only becomes "needs you" (amber) once the order is confirmed and
// the customer has been asked to pay.
export function paymentTone(status: PaymentStatus, orderStatus: CardOrderStatus): Tone {
  if (status === "unpaid" && !["new", "contacted", "cancelled"].includes(orderStatus)) {
    return "amber";
  }
  return PAYMENT_STATUS[status].tone;
}

export function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_PILL[tone]}`}
    >
      <span className={`size-1.5 rounded-full ${TONE_DOT[tone]}`} aria-hidden="true" />
      {label}
    </span>
  );
}
