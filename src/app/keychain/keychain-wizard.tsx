"use client";

import { useMemo, useState } from "react";
import {
  buildFacebookUrl,
  buildInstagramUrl,
  buildTikTokUrl,
  extractHandle,
} from "@/lib/socials";
import type { KeychainPlatform } from "@/lib/types";
import {
  type KeychainSubmissionItem,
  submitKeychainOrder,
} from "./actions";
import {
  CheckIcon,
  ChevronLeftIcon,
  FacebookIcon,
  InstagramIcon,
  KeychainIcon,
  TikTokIcon,
  XIcon,
} from "./icons";

const PLATFORMS: {
  id: KeychainPlatform;
  label: string;
  host: string;
  icon: (props: { className?: string }) => React.ReactNode;
  build: (input: string) => string;
  placeholder: string;
}[] = [
  {
    id: "facebook",
    label: "Facebook",
    host: "facebook.com",
    icon: FacebookIcon,
    build: buildFacebookUrl,
    placeholder: "https://facebook.com/yourprofile or just your username",
  },
  {
    id: "instagram",
    label: "Instagram",
    host: "instagram.com",
    icon: InstagramIcon,
    build: buildInstagramUrl,
    placeholder: "https://instagram.com/yourhandle or just @yourhandle",
  },
  {
    id: "tiktok",
    label: "TikTok",
    host: "tiktok.com",
    icon: TikTokIcon,
    build: buildTikTokUrl,
    placeholder: "https://tiktok.com/@yourhandle or just @yourhandle",
  },
];

function platformOf(id: KeychainPlatform) {
  return PLATFORMS.find((p) => p.id === id)!;
}

function hostMatches(url: string, host: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === host || hostname.endsWith(`.${host}`);
  } catch {
    return false;
  }
}

type Step =
  | { kind: "select" }
  | { kind: "link" }
  | { kind: "review" }
  | { kind: "done"; orderId: string };

const cardClass =
  "rounded-3xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-6";
const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500";

export function KeychainWizard() {
  const [step, setStep] = useState<Step>({ kind: "select" });
  const [confirmed, setConfirmed] = useState<KeychainSubmissionItem[]>([]);
  const [checked, setChecked] = useState<Set<KeychainPlatform>>(new Set());
  const [queue, setQueue] = useState<KeychainPlatform[]>([]);
  const [linkValue, setLinkValue] = useState("");
  const [labelValue, setLabelValue] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState<KeychainPlatform | null>(null);

  const confirmedPlatforms = useMemo(
    () => new Set(confirmed.map((c) => c.platform)),
    [confirmed],
  );
  const availablePlatforms = PLATFORMS.filter((p) => !confirmedPlatforms.has(p.id));
  const totalKeychains = confirmed.length + checked.size;

  function toggleChecked(id: KeychainPlatform) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startLinkStep() {
    const list = Array.from(checked);
    if (list.length === 0) return;
    setQueue(list.slice(1));
    setChecked(new Set());
    setLinkValue("");
    setLabelValue("");
    setLinkError(null);
    setCurrentPlatform(list[0]);
    setStep({ kind: "link" });
  }

  function confirmLink() {
    if (!currentPlatform) return;
    const platform = platformOf(currentPlatform);
    const trimmed = linkValue.trim();
    if (!trimmed) {
      setLinkError("Paste your profile link or username.");
      return;
    }
    const url = platform.build(trimmed);
    if (!hostMatches(url, platform.host)) {
      setLinkError(`That doesn't look like a ${platform.label} link.`);
      return;
    }

    setConfirmed((prev) => [
      ...prev,
      {
        platform: platform.id,
        profileUrl: url,
        accountLabel: labelValue.trim() || extractHandle(platform.id, url),
      },
    ]);

    const next = queue[0] ?? null;
    if (next) {
      setQueue((prev) => prev.slice(1));
      setCurrentPlatform(next);
      setLinkValue("");
      setLabelValue("");
      setLinkError(null);
    } else {
      setCurrentPlatform(null);
      setStep({ kind: "review" });
    }
  }

  function removeConfirmed(platform: KeychainPlatform) {
    setConfirmed((prev) => prev.filter((c) => c.platform !== platform));
  }

  async function handleSubmit() {
    if (!customerName.trim()) {
      setSubmitError("Enter your name.");
      return;
    }
    if (!contactPhone.trim() && !contactEmail.trim()) {
      setSubmitError("Add a phone number or email so we can reach you.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const result = await submitKeychainOrder({
      customerName,
      contactPhone,
      contactEmail,
      items: confirmed,
    });
    setSubmitting(false);
    if (result.error || !result.orderId) {
      setSubmitError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    setStep({ kind: "done", orderId: result.orderId });
  }

  if (step.kind === "done") {
    return (
      <div className={`${cardClass} flex flex-col items-center gap-3 text-center`}>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <CheckIcon className="h-7 w-7" />
        </span>
        <h1 className="text-xl font-semibold text-brand-900">
          Your social media links have been submitted successfully.
        </h1>
        <p className="text-sm text-slate-500">
          Your Konek+ Keychains are now being prepared.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <KeychainIcon className="h-6 w-6" />
        </span>
        <h1 className="mt-1 text-2xl font-semibold text-brand-900">
          Konek+ Social Media Keychain
        </h1>
        <p className="max-w-sm text-sm text-slate-500">
          Choose the social media accounts you want to connect to your Konek+
          Keychain.
        </p>
      </div>

      {step.kind === "select" && (
        <div className={cardClass}>
          <div className="flex flex-col divide-y divide-slate-100">
            {PLATFORMS.map((p) => {
              const alreadyAdded = confirmedPlatforms.has(p.id);
              const isChecked = checked.has(p.id);
              return (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 py-3.5 first:pt-0 last:pb-0 ${
                    alreadyAdded ? "opacity-50" : "cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={alreadyAdded}
                    onChange={() => toggleChecked(p.id)}
                    className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <p.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-800">
                    {p.label}
                  </span>
                  {alreadyAdded && (
                    <span className="text-xs font-medium text-brand-700">Added</span>
                  )}
                </label>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-sm text-slate-500">
              {totalKeychains} Keychain{totalKeychains === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={startLinkStep}
              disabled={checked.size === 0}
              className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue
            </button>
          </div>

          {confirmed.length > 0 && (
            <button
              type="button"
              onClick={() => setStep({ kind: "review" })}
              className="mt-3 w-full text-center text-sm font-medium text-brand-700 hover:underline"
            >
              Back to summary ({confirmed.length} added)
            </button>
          )}
        </div>
      )}

      {step.kind === "link" && currentPlatform && (
        <div className={cardClass}>
          <button
            type="button"
            onClick={() => setStep({ kind: confirmed.length > 0 ? "review" : "select" })}
            className="mb-4 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-700"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back
          </button>

          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              {(() => {
                const Icon = platformOf(currentPlatform).icon;
                return <Icon className="h-5 w-5" />;
              })()}
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {platformOf(currentPlatform).label}
              </p>
              <h2 className="text-sm font-semibold text-brand-900">
                Find your {platformOf(currentPlatform).label} account
              </h2>
            </div>
          </div>

          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
            Paste your profile link
          </label>
          <input
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            placeholder={platformOf(currentPlatform).placeholder}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-slate-400">
            Can&apos;t find your account? Just paste your profile link — that
            always works.
          </p>

          <label className="mb-1 mt-4 block text-xs font-medium uppercase tracking-wide text-slate-400">
            Display name (optional)
          </label>
          <input
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            placeholder="e.g. Juan Dela Cruz"
            className={inputClass}
          />

          {linkError && <p className="mt-3 text-sm text-red-600">{linkError}</p>}

          <button
            type="button"
            onClick={confirmLink}
            className="mt-5 w-full rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Confirm account
          </button>
        </div>
      )}

      {step.kind === "review" && (
        <>
          <div className={cardClass}>
            <h2 className="mb-3 text-sm font-semibold text-brand-900">
              Your Konek+ Keychains
            </h2>
            <ul className="flex flex-col divide-y divide-slate-100">
              {confirmed.map((item) => {
                const platform = platformOf(item.platform);
                return (
                  <li key={item.platform} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                      <platform.icon className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {platform.label}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {item.accountLabel || item.profileUrl}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeConfirmed(item.platform)}
                      aria-label={`Remove ${platform.label}`}
                      className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>

            {availablePlatforms.length > 0 && (
              <button
                type="button"
                onClick={() => setStep({ kind: "select" })}
                className="mt-3 w-full rounded-full border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-500 hover:border-brand-300 hover:text-brand-700"
              >
                + Add another social media
              </button>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
              <span className="text-slate-500">Total</span>
              <span className="font-semibold text-brand-900">
                {confirmed.length} Keychain{confirmed.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="mb-3 text-sm font-semibold text-brand-900">Your details</h2>
            <div className="flex flex-col gap-3">
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full name"
                className={inputClass}
              />
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                type="tel"
                placeholder="Phone number"
                className={inputClass}
              />
              <input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                type="email"
                placeholder="Email (optional if you gave a phone number)"
                className={inputClass}
              />
            </div>

            {submitError && <p className="mt-3 text-sm text-red-600">{submitError}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || confirmed.length === 0}
              className="mt-5 w-full rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
