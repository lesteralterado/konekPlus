// The Konek+ card product line — the one place to change a finish's name or
// price. Read by the landing-page card deck (and the order form, later).
export const FINISHES = [
  { id: "obsidian", name: "Obsidian", pricePhp: 900 },
  { id: "frost", name: "Frost", pricePhp: 989 },
  { id: "titanium", name: "Titanium", pricePhp: 1200 },
  { id: "linen", name: "Linen", pricePhp: 1400 },
  { id: "aurora", name: "Aurora", pricePhp: 1500 },
] as const;

export type FinishId = (typeof FINISHES)[number]["id"];

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export function formatPrice(pricePhp: number): string {
  return peso.format(pricePhp);
}
