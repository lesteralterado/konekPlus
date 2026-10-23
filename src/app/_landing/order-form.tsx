"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  BULK_TIERS,
  formatPrice,
  MAX_QUANTITY,
  quote,
  type FinishId,
} from "@/lib/finishes";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import type { PaymentMethod } from "@/lib/types";
import { FINISH_STYLES } from "./card-deck";
import { CHOOSE_FINISH_EVENT } from "./choose-finish";
import { ShieldCheckIcon, WalletIcon } from "./icons";
import { placeOrder, type OrderFormState } from "./order-actions";

export type FinishOption = { id: FinishId; name: string; price: string; tagline: string };

type Props = {
  t: Dictionary["home"]["order"];
  finishes: FinishOption[];
  popularId: FinishId;
  popularLabel: string;
  perCardLabel: string;
};

const LABEL = "mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500";
const INPUT =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";
// The real <input type="radio"> is visually hidden; the label shows focus.
const OPTION_FOCUS = "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600";

const TIERS_ASCENDING = [...BULK_TIERS].sort((a, b) => a.minQty - b.minQty);
const INITIAL_STATE: OrderFormState = { status: "idle" };

function clampQuantity(n: number) {
  return Math.min(MAX_QUANTITY, Math.max(1, Math.round(n) || 1));
}

// Remounted via `key` after a successful order, which resets every field
// and the action state together.
export function OrderForm(props: Props) {
  const [formKey, setFormKey] = useState(0);
  return <OrderFormInner key={formKey} {...props} onReset={() => setFormKey((k) => k + 1)} />;
}

function OrderFormInner({
  t,
  finishes,
  popularId,
  popularLabel,
  perCardLabel,
  onReset,
}: Props & { onReset: () => void }) {
  const [state, formAction, pending] = useActionState(placeOrder, INITIAL_STATE);
  const [finish, setFinish] = useState<FinishId>(popularId);
  const [quantity, setQuantity] = useState(1);
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [submittedPhone, setSubmittedPhone] = useState("");
  const phoneRef = useRef<HTMLInputElement>(null);

  // "Choose this finish" on the card deck pre-selects it here.
  useEffect(() => {
    const onChoose = (e: Event) => setFinish((e as CustomEvent<FinishId>).detail);
    window.addEventListener(CHOOSE_FINISH_EVENT, onChoose);
    return () => window.removeEventListener(CHOOSE_FINISH_EVENT, onChoose);
  }, []);

  const q = quote(finish, quantity);
  const savings = q.subtotalPhp - q.totalPhp;

  if (state.status === "success") {
    return (
      <div className="mx-auto max-w-xl rounded-4xl bg-brand-900 p-8 text-center text-white sm:p-12">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-500 text-brand-900">
          <ShieldCheckIcon className="h-7 w-7" />
        </span>
        <h3 className="mt-5 text-2xl font-semibold">{t.successTitle}</h3>
        <p className="mt-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold">
          {state.quantity} × {finishes.find((f) => f.id === state.finish)?.name} ·{" "}
          {formatPrice(quote(state.finish, state.quantity).totalPhp)}
        </p>
        <p className="mt-4 text-white/70">
          {format(t.successBody, { reference: state.reference, phone: submittedPhone })}
        </p>
        <Link
          href="/track"
          className="mt-6 inline-block rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-brand-900 transition hover:brightness-95"
        >
          {t.trackOrder}
        </Link>
        <br />
        <button
          type="button"
          onClick={onReset}
          className="mt-8 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/10"
        >
          {t.orderAnother}
        </button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={() => setSubmittedPhone(phoneRef.current?.value ?? "")}
      className="grid gap-8 lg:grid-cols-2 lg:gap-12"
    >
      {/* ---- Left: what you're buying ---- */}
      <div className="flex flex-col gap-8">
        <fieldset>
          <legend className={LABEL}>{t.finishLabel}</legend>
          <div className="grid gap-2">
            {finishes.map((f) => {
              const style = FINISH_STYLES[f.id];
              const selected = f.id === finish;
              return (
                <label
                  key={f.id}
                  className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-3 transition ${OPTION_FOCUS} ${
                    selected
                      ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="finish"
                    value={f.id}
                    checked={selected}
                    onChange={() => setFinish(f.id)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`h-9 w-16 shrink-0 rounded-md shadow-sm ${style.face}`}
                    style={style.style}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-brand-900">
                      {f.name}
                      {f.id === popularId && (
                        <span className="whitespace-nowrap rounded-full bg-accent-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-900">
                          {popularLabel}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-slate-500">{f.tagline}</span>
                  </span>
                  <span className="font-semibold text-brand-900">{f.price}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <span className={LABEL}>{t.quantityLabel}</span>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-slate-200 bg-white">
              <button
                type="button"
                aria-label={t.decrease}
                disabled={quantity <= 1}
                onClick={() => setQuantity((n) => clampQuantity(n - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full text-lg text-brand-900 transition hover:bg-slate-100 disabled:opacity-30"
              >
                −
              </button>
              <input
                name="quantity"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_QUANTITY}
                value={quantity}
                onChange={(e) => setQuantity(clampQuantity(Number(e.target.value)))}
                aria-label={t.quantityLabel}
                className="w-14 border-0 bg-transparent text-center text-base font-semibold text-brand-900 [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                aria-label={t.increase}
                disabled={quantity >= MAX_QUANTITY}
                onClick={() => setQuantity((n) => clampQuantity(n + 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full text-lg text-brand-900 transition hover:bg-slate-100 disabled:opacity-30"
              >
                +
              </button>
            </div>
            {/* Tier chips double as shortcuts — a nudge toward team orders. */}
            {TIERS_ASCENDING.map((tier) => {
              const active = q.discountPct === tier.pct;
              return (
                <button
                  key={tier.minQty}
                  type="button"
                  onClick={() => setQuantity(Math.max(quantity, tier.minQty))}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-brand-600 text-white"
                      : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                  }`}
                >
                  {format(t.tier, { qty: tier.minQty, pct: tier.pct })}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl bg-slate-50 p-5">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              {formatPrice(q.unitPhp)} {perCardLabel} × {quantity}
            </span>
            {savings > 0 && <s className="text-slate-400">{formatPrice(q.subtotalPhp)}</s>}
          </div>
          <div className="mt-3 flex items-end justify-between gap-4">
            <span className="text-sm font-semibold text-brand-900">{t.total}</span>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={q.totalPhp}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-3xl font-bold tracking-tight text-brand-900"
              >
                {formatPrice(q.totalPhp)}
              </motion.span>
            </AnimatePresence>
          </div>
          {savings > 0 && (
            <p className="mt-2 text-right text-sm font-semibold text-brand-600">
              {format(t.youSave, { amount: formatPrice(savings) })}
            </p>
          )}
        </div>
      </div>

      {/* ---- Right: who and how ---- */}
      <div className="flex flex-col gap-5">
        <fieldset>
          <legend className={LABEL}>{t.paymentLabel}</legend>
          <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-3">
            {(
              [
                ["cod", t.paymentCod],
                ["gcash", t.paymentGcash],
                ["cash", t.paymentCash],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-center text-sm font-semibold leading-tight transition ${OPTION_FOCUS} ${
                  payment === value
                    ? "border-brand-600 bg-brand-50 text-brand-900 ring-1 ring-brand-600"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value={value}
                  checked={payment === value}
                  onChange={() => setPayment(value)}
                  className="sr-only"
                />
                <WalletIcon className="h-4 w-4" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <label>
          <span className={LABEL}>{t.nameLabel}</span>
          <input name="full_name" required maxLength={120} autoComplete="name" className={INPUT} />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label>
            <span className={LABEL}>{t.phoneLabel}</span>
            <input
              ref={phoneRef}
              name="phone"
              type="tel"
              required
              maxLength={30}
              autoComplete="tel"
              placeholder="09XX XXX XXXX"
              className={INPUT}
            />
          </label>
          <label>
            <span className={LABEL}>{t.emailLabel}</span>
            <input name="email" type="email" required maxLength={200} autoComplete="email" className={INPUT} />
          </label>
        </div>
        <label>
          {/* Cash = meet-up / pick-up, so ask where rather than a full address. */}
          <span className={LABEL}>{payment === "cash" ? t.meetupLabel : t.addressLabel}</span>
          <textarea
            name="address"
            required
            rows={2}
            maxLength={500}
            autoComplete={payment === "cash" ? "off" : "street-address"}
            className={INPUT}
          />
          {payment === "cash" && <span className="mt-1 block text-xs text-slate-500">{t.meetupHint}</span>}
        </label>
        <label>
          <span className={LABEL}>{t.notesLabel}</span>
          <textarea
            name="notes"
            rows={2}
            maxLength={1000}
            placeholder={t.notesPlaceholder}
            className={INPUT}
          />
        </label>

        {/* Honeypot — see src/app/feedback-actions.ts. */}
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] h-px w-px opacity-0"
        />

        {state.status === "error" && (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {t.errors[state.error]}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-full bg-accent-500 px-6 py-4 text-base font-bold text-brand-900 shadow-lg shadow-accent-500/25 transition hover:bg-accent-500/90 disabled:opacity-60"
        >
          {pending ? t.submitting : format(t.submit, { total: formatPrice(q.totalPhp) })}
        </button>

        {/* Risk reversal, right where hesitation peaks. */}
        <ul className="flex flex-col gap-2 text-sm text-slate-500">
          <li className="flex items-center gap-2">
            <ShieldCheckIcon className="h-4 w-4 shrink-0 text-brand-600" />
            {t.guarantee}
          </li>
          <li className="flex items-center gap-2">
            <WalletIcon className="h-4 w-4 shrink-0 text-brand-600" />
            {t.noPaymentNow}
          </li>
        </ul>
      </div>
    </form>
  );
}
