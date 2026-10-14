"use client";

import { useState, type ReactNode } from "react";
import { formatPrice, LOWEST_PRICE_PHP } from "@/lib/finishes";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { ArrowRightIcon } from "./icons";

// Paper cards are typically printed and sold by the box; a reprint (new
// title, number, logo) makes the rest of the old box useless.
const BOX = 100;

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  hint?: ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="text-lg font-bold tabular-nums text-brand-900">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-2 w-full cursor-pointer accent-brand-600"
      />
      {hint && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function CostCalculator({ t }: { t: Dictionary["home"]["calculator"] }) {
  const [perMonth, setPerMonth] = useState(50);
  const [costPerCard, setCostPerCard] = useState(5);
  const [reprints, setReprints] = useState(1);

  const paperYear = (perMonth * 12 + reprints * BOX) * costPerCard;
  const konek = LOWEST_PRICE_PHP;
  const savings = paperYear - konek;
  const paybackMonths = konek / (paperYear / 12);
  const largest = Math.max(paperYear, konek);

  return (
    <section className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">{t.kicker}</span>
          <h2 className="mt-4 text-3xl font-semibold text-balance text-brand-900 sm:text-4xl">{t.heading}</h2>
          <p className="mt-4 text-slate-500">{t.body}</p>

          <div className="mt-10 flex flex-col gap-7">
            <Slider
              label={t.perMonthLabel}
              value={perMonth}
              display={String(perMonth)}
              min={10}
              max={300}
              step={10}
              onChange={setPerMonth}
            />
            <Slider
              label={t.costPerCardLabel}
              value={costPerCard}
              display={formatPrice(costPerCard)}
              min={1}
              max={20}
              step={1}
              onChange={setCostPerCard}
            />
            <Slider
              label={t.reprintsLabel}
              value={reprints}
              display={String(reprints)}
              min={0}
              max={4}
              step={1}
              onChange={setReprints}
              hint={format(t.reprintsHint, { box: BOX })}
            />
          </div>
        </div>

        <div className="rounded-4xl bg-white p-6 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-8">
          {[
            { label: t.paperLabel, sub: t.paperSub, amount: paperYear, bar: "bg-slate-300" },
            { label: t.konekLabel, sub: t.konekSub, amount: konek, bar: "bg-brand-600" },
          ].map((row) => (
            <div key={row.label} className="mb-6 last:mb-0">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-semibold text-brand-900">{row.label}</span>
                <span className="text-xl font-bold tabular-nums text-brand-900">{formatPrice(row.amount)}</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${row.bar} transition-[width] duration-500 ease-out motion-reduce:transition-none`}
                  style={{ width: `${Math.max(2, (row.amount / largest) * 100)}%` }}
                />
              </div>
              <span className="mt-1.5 block text-xs text-slate-400">{row.sub}</span>
            </div>
          ))}

          <div className="mt-8 border-t border-slate-100 pt-6">
            {savings > 0 ? (
              <>
                <p className="text-2xl font-bold text-brand-600">
                  {format(t.savings, { amount: formatPrice(savings) })}
                </p>
                <p className="mt-2 inline-block rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
                  {paybackMonths < 1 ? t.paybackUnderMonth : format(t.payback, { months: Math.ceil(paybackMonths) })}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-600">{t.noSavings}</p>
            )}
            <p className="mt-4 text-sm text-slate-500">
              {format(t.perDay, { amount: `₱${(konek / 365).toFixed(2)}` })}
            </p>

            <a
              href="#order"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent-500 py-2.5 pl-5 pr-2.5 text-sm font-semibold text-brand-900 transition hover:bg-accent-500/90"
            >
              {t.cta}
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-900 text-accent-500">
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </span>
            </a>
            <p className="mt-4 text-xs text-slate-400">{t.disclaimer}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
