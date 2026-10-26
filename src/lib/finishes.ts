// The Konek+ card product line — the one place to change a finish, price,
// or discount. Read by the landing-page card deck, the order form, the
// order server action, and the admin orders page, so a price shown is
// always the price charged.
//
// Charm prices (₱899 not ₱900): the left digit drops a bracket — ₱1,199
// reads as "one-thousand-something", not "twelve hundred".
export const FINISHES = [
  { id: "obsidian", name: "Obsidian", pricePhp: 899 },
  { id: "frost", name: "Frost", pricePhp: 999 },
  { id: "titanium", name: "Titanium", pricePhp: 1199 },
  { id: "linen", name: "Linen", pricePhp: 1399 },
  { id: "aurora", name: "Aurora", pricePhp: 1499 },
] as const;

export type FinishId = (typeof FINISHES)[number]["id"];

// The middle option gets the "Most popular" badge — people lean toward the
// centre of a range (compromise effect), and it's the centre card in the deck.
export const POPULAR_FINISH: FinishId = "titanium";

// Highest tier first. Team / bulk orders.
export const BULK_TIERS = [
  { minQty: 10, pct: 15 },
  { minQty: 5, pct: 10 },
] as const;

export const MAX_QUANTITY = 100;

// What one card costs us to make and send (blank NFC card, printing,
// packaging, delivery). An estimate — real cost is ₱300–600 — so use the
// top of the range: break-even figures on /admin/finance should err safe.
export const EST_UNIT_COST_PHP = 600;

export function isFinishId(value: string): value is FinishId {
  return FINISHES.some((f) => f.id === value);
}

export function finishById(id: FinishId) {
  return FINISHES.find((f) => f.id === id)!;
}

export type Quote = {
  unitPhp: number;
  subtotalPhp: number;
  discountPct: number;
  totalPhp: number;
};

export function quote(finishId: FinishId, quantity: number): Quote {
  const unitPhp = finishById(finishId).pricePhp;
  const subtotalPhp = unitPhp * quantity;
  const discountPct = BULK_TIERS.find((t) => quantity >= t.minQty)?.pct ?? 0;
  const totalPhp = Math.round(subtotalPhp * (1 - discountPct / 100));
  return { unitPhp, subtotalPhp, discountPct, totalPhp };
}

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export function formatPrice(pricePhp: number): string {
  return peso.format(pricePhp);
}

export const LOWEST_PRICE_PHP = Math.min(...FINISHES.map((f) => f.pricePhp));
