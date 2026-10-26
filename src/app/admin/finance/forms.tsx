"use client";

import { useActionState, useState } from "react";
import { BILL_CATEGORY, EXPENSE_CATEGORY } from "@/lib/finance";
import type { FinanceBill, FinanceSettings } from "@/lib/types";
import { addBill, logExpense, updateSettings, type FinanceFormState } from "./actions";

const INPUT =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-base focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 md:text-sm";

const SUBMIT =
  "rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60";

const INITIAL: FinanceFormState = { error: null, resetToken: 0 };

function FormError({ state }: { state: FinanceFormState }) {
  return state.error ? <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p> : null;
}

export function LogExpenseForm({ bills, today }: { bills: FinanceBill[]; today: string }) {
  const [state, formAction, pending] = useActionState(logExpense, INITIAL);
  const [billId, setBillId] = useState("");

  return (
    <form key={state.resetToken} action={formAction} className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm text-slate-600 sm:col-span-2">
        For a bill
        <select
          name="bill_id"
          value={billId}
          onChange={(e) => setBillId(e.target.value)}
          className={`${INPUT} mt-1`}
        >
          <option value="">— Not a bill (card stock, ads, fees…) —</option>
          {bills.map((b) => (
            <option key={b.id} value={b.id}>
              {b.vendor}
            </option>
          ))}
        </select>
      </label>
      {!billId && (
        <>
          <select name="category" defaultValue="cogs" className={INPUT} aria-label="Category">
            {Object.entries(EXPENSE_CATEGORY).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            name="description"
            required
            maxLength={120}
            placeholder="What was it? e.g. 50 blank NFC cards"
            className={INPUT}
          />
        </>
      )}
      <input
        name="amount_php"
        required
        inputMode="decimal"
        placeholder="₱ that left the account"
        className={INPUT}
      />
      <input name="paid_on" type="date" required defaultValue={today} className={INPUT} aria-label="Paid on" />
      <div className="flex justify-end sm:col-span-2">
        <button type="submit" disabled={pending} className={SUBMIT}>
          {pending ? "Saving…" : "Log expense"}
        </button>
      </div>
      <FormError state={state} />
    </form>
  );
}

export function AddBillForm() {
  const [state, formAction, pending] = useActionState(addBill, INITIAL);

  return (
    <form key={state.resetToken} action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input name="vendor" required maxLength={60} placeholder="Who you pay, e.g. Resend" className={INPUT} />
      <select name="category" defaultValue="ktlo" className={INPUT} aria-label="Category">
        {Object.entries(BILL_CATEGORY).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <select name="currency" defaultValue="USD" className={`${INPUT} w-auto`} aria-label="Currency">
          <option value="USD">$</option>
          <option value="PHP">₱</option>
        </select>
        <input name="amount" required inputMode="decimal" placeholder="Amount" className={INPUT} />
      </div>
      <select name="billing_interval" defaultValue="monthly" className={INPUT} aria-label="Billed">
        <option value="monthly">Every month</option>
        <option value="yearly">Every year</option>
      </select>
      <input name="note" maxLength={200} placeholder="Note (optional)" className={`${INPUT} sm:col-span-2`} />
      <div className="flex justify-end sm:col-span-2">
        <button type="submit" disabled={pending} className={SUBMIT}>
          {pending ? "Adding…" : "Add bill"}
        </button>
      </div>
      <FormError state={state} />
    </form>
  );
}

export function SettingsForm({ settings }: { settings: FinanceSettings }) {
  const [state, formAction, pending] = useActionState(updateSettings, INITIAL);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm text-slate-600">
        Reserve balance now (₱)
        <input
          name="reserve_balance_php"
          inputMode="decimal"
          defaultValue={Number(settings.reserve_balance_php)}
          className={`${INPUT} mt-1`}
        />
      </label>
      <label className="text-sm text-slate-600">
        Set aside per card sold (₱)
        <input
          name="reserve_per_card_php"
          inputMode="numeric"
          defaultValue={settings.reserve_per_card_php}
          className={`${INPUT} mt-1`}
        />
      </label>
      <label className="text-sm text-slate-600">
        Target (months of server bills)
        <input
          name="reserve_target_months"
          inputMode="numeric"
          defaultValue={settings.reserve_target_months}
          className={`${INPUT} mt-1`}
        />
      </label>
      <label className="text-sm text-slate-600">
        Budget rate (₱ per $1)
        <input
          name="usd_php_rate"
          inputMode="decimal"
          defaultValue={Number(settings.usd_php_rate)}
          className={`${INPUT} mt-1`}
        />
      </label>
      <div className="flex justify-end sm:col-span-2">
        <button type="submit" disabled={pending} className={SUBMIT}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      <FormError state={state} />
    </form>
  );
}
