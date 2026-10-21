import { CheckIcon, CopyIcon } from "../icons";

// How to write a keychain with the free NFC Tools app (iOS/Android) — the
// replacement for the Konek+ Staff app. Open while there's work to do.
const STEPS: { title: React.ReactNode; detail: string }[] = [
  { title: <>Tap <b>Copy link</b> on a keychain below</>, detail: "The link is cleaned and ready to paste." },
  {
    title: <>Open <b>NFC Tools</b> → <b>Write</b> → <b>Add a record</b> → <b>URL / URI</b></>,
    detail: "Paste the link, then tap ✓ / OK.",
  },
  {
    title: <>Tap <b>Write</b>, hold the keychain to the phone</>,
    detail: "iPhone: top of the phone. Android: middle of the back. Wait for the vibration.",
  },
  {
    title: <>Test it: tap the keychain on a phone</>,
    detail: "Close NFC Tools first. The right profile should open.",
  },
  {
    title: <>Tap <b>Works</b> — or <b>Failed</b> and write it again</>,
    detail: "When every keychain works, “Mark ready for handover” appears.",
  },
];

export function NfcGuide({ open }: { open: boolean }) {
  return (
    <details
      open={open}
      className="group rounded-3xl bg-white p-5 shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)] sm:p-6"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-900 text-white">
          <CopyIcon className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold text-brand-900">How to write a keychain</span>
          <span className="block text-sm text-slate-500">With the free NFC Tools app</span>
        </span>
        <span className="text-sm font-semibold text-brand-700 group-open:hidden">Show</span>
        <span className="hidden text-sm font-semibold text-brand-700 group-open:inline">Hide</span>
      </summary>

      <ol className="mt-4 flex flex-col gap-3">
        {STEPS.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
              {i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[15px] text-slate-800">{s.title}</p>
              <p className="text-sm text-slate-500">{s.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-4 flex gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
        <CheckIcon className="mt-0.5 size-4 shrink-0" />
        <span>
          Optional, after it works: NFC Tools → <b>Other</b> → <b>Lock tag</b> stops anyone from
          overwriting it. Locking is permanent.
        </span>
      </p>
    </details>
  );
}
