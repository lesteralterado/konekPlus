import type { BillCategory, ExpenseCategory, FinanceBill } from "@/lib/types";

// The money maths behind /admin/finance. Pure functions only, so the page
// stays a thin read-and-render.

export const BILL_CATEGORY: Record<BillCategory, string> = {
  ktlo: "Servers",
  dev: "Dev tools",
  marketing: "Marketing",
  other: "Other",
};

export const EXPENSE_CATEGORY: Record<ExpenseCategory, string> = {
  ...BILL_CATEGORY,
  cogs: "Card stock",
  fees: "Fees",
};

export function isBillCategory(v: string): v is BillCategory {
  return v in BILL_CATEGORY;
}

export function isExpenseCategory(v: string): v is ExpenseCategory {
  return v in EXPENSE_CATEGORY;
}

// A bill as pesos per month: USD at the budget rate, yearly spread over 12.
export function monthlyPhp(
  bill: Pick<FinanceBill, "amount" | "currency" | "billing_interval">,
  usdPhpRate: number,
): number {
  const php = Number(bill.amount) * (bill.currency === "USD" ? usdPhpRate : 1);
  return bill.billing_interval === "yearly" ? php / 12 : php;
}

export type ManilaMonth = {
  key: string; // YYYY-MM
  label: string; // "October 2026"
  startIso: string; // for timestamptz columns
  endIso: string;
  startDate: string; // YYYY-MM-DD, for date columns
  endDate: string; // first day of the next month (exclusive)
  prevKey: string;
  nextKey: string;
};

function addMonths(y: number, m: number, delta: number): [number, number] {
  const total = y * 12 + (m - 1) + delta;
  return [Math.floor(total / 12), (total % 12) + 1];
}

const pad = (n: number) => String(n).padStart(2, "0");

// The current month in Philippine time.
export function currentManilaMonthKey(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  return `${y}-${m}`;
}

// A Philippine-time calendar month from "YYYY-MM"; anything else (or
// nothing) means the current month.
export function manilaMonth(key?: string): ManilaMonth {
  const valid = key && /^\d{4}-(0[1-9]|1[0-2])$/.test(key) ? key : currentManilaMonthKey();
  const [y, m] = valid.split("-").map(Number);
  const [ny, nm] = addMonths(y, m, 1);
  const [py, pm] = addMonths(y, m, -1);
  const startDate = `${y}-${pad(m)}-01`;
  const endDate = `${ny}-${pad(nm)}-01`;
  return {
    key: valid,
    label: new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("en-PH", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
    startIso: new Date(`${startDate}T00:00:00+08:00`).toISOString(),
    endIso: new Date(`${endDate}T00:00:00+08:00`).toISOString(),
    startDate,
    endDate,
    prevKey: `${py}-${pad(pm)}`,
    nextKey: `${ny}-${pad(nm)}`,
  };
}

// Cards that must be sold to cover a monthly cost; null when each card
// loses money (margin ≤ 0), since no volume would ever cover it.
export function breakEvenCards(monthlyCostPhp: number, marginPerCardPhp: number): number | null {
  if (marginPerCardPhp <= 0) return null;
  return Math.ceil(monthlyCostPhp / marginPerCardPhp);
}
