import { quote } from "@/lib/finishes";
import type { CardOrder } from "@/lib/types";

// Fields that lock an order's price, if it isn't locked yet. Applied when an
// admin confirms the order (the price agreed with the customer) and as a
// fallback when an order skips "confirmed" (shipped or paid straight away).
export function lockAmount(order: {
  finish: CardOrder["finish"];
  quantity: number;
  amount_due_php: number | null;
}): { amount_due_php?: number; discount_pct?: number } {
  if (order.amount_due_php !== null) return {};
  const q = quote(order.finish, order.quantity);
  return { amount_due_php: q.totalPhp, discount_pct: q.discountPct };
}

// What the order costs: the locked amount once confirmed, otherwise a live
// estimate from today's price config.
export function amountFor(order: Pick<CardOrder, "finish" | "quantity" | "amount_due_php">) {
  if (order.amount_due_php !== null) return { php: order.amount_due_php, estimate: false };
  return { php: quote(order.finish, order.quantity).totalPhp, estimate: true };
}
