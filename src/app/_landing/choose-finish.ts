import type { FinishId } from "@/lib/finishes";

// The card deck's "Choose this finish" link tells the order form which
// finish to pre-select. The link itself is a plain #order anchor, so the
// scroll is handled natively (or by Lenis on desktop) — this only carries
// the choice.
export const CHOOSE_FINISH_EVENT = "konek:choose-finish";

export function announceFinishChoice(id: FinishId) {
  window.dispatchEvent(new CustomEvent<FinishId>(CHOOSE_FINISH_EVENT, { detail: id }));
}
