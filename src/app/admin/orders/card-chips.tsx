"use client";

import { useOptimistic, useTransition } from "react";
import { copyText, showToast } from "@/components/toast";
import { cardUrl } from "@/lib/card-link";
import { CheckIcon, CopyIcon, RotateIcon } from "../icons";
import { ConfirmButton } from "../ui/drawers";
import { setTagWritten } from "../tags/actions";

// The cards assigned to an order, ready to write with NFC Tools: each link
// with Copy + "Written ✓", progress, and Copy all (one link per line).
export function CardChips({
  origin,
  cards,
}: {
  origin: string;
  cards: { tagId: string; writtenAt: string | null }[];
}) {
  const links = cards.map((c) => cardUrl(origin, c.tagId));
  const [written, setWritten] = useOptimistic(
    new Set(cards.filter((c) => c.writtenAt).map((c) => c.tagId)),
  );
  const done = cards.filter((c) => written.has(c.tagId)).length;
  const host = origin.replace(/^https?:\/\//, "");

  return (
    <div className="mt-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
      <div className="flex items-center gap-2">
        <p className="flex-1 text-sm font-semibold text-slate-700">
          Cards · {done} of {cards.length} written
        </p>
        {cards.length > 1 && (
          <button
            type="button"
            onClick={() => copyText(links.join("\n"), `${links.length} links copied`)}
            title={`Copy all links (${host})`}
            className="ios-press flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-semibold text-brand-700 ring-1 ring-slate-200"
          >
            <CopyIcon className="size-4" />
            Copy all
          </button>
        )}
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-label="Cards written"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={cards.length}
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width]"
          style={{ width: `${cards.length ? (done / cards.length) * 100 : 0}%` }}
        />
      </div>

      <ul className="mt-2 flex flex-col divide-y divide-slate-200/70">
        {cards.map((c, i) => (
          <CardRow
            key={c.tagId}
            tagId={c.tagId}
            link={links[i]}
            written={written.has(c.tagId)}
            onWritten={(value) => {
              const next = new Set(written);
              if (value) next.add(c.tagId);
              else next.delete(c.tagId);
              setWritten(next);
            }}
          />
        ))}
      </ul>
    </div>
  );
}

function CardRow({
  tagId,
  link,
  written,
  onWritten,
}: {
  tagId: string;
  link: string;
  written: boolean;
  onWritten: (value: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center gap-2 py-2">
      <button
        type="button"
        onClick={() => copyText(link, "Link copied — paste it in NFC Tools")}
        className="ios-press min-w-0 flex-1 text-left"
        aria-label={`Copy link for ${tagId}`}
      >
        <span className="block font-mono text-sm font-semibold text-slate-800">{tagId}</span>
        <span className="block break-all font-mono text-xs text-slate-500">{link}</span>
      </button>
      <button
        type="button"
        onClick={() => copyText(link, "Link copied — paste it in NFC Tools")}
        aria-label={`Copy link for ${tagId}`}
        title="Copy link"
        className="ios-press grid size-11 shrink-0 place-items-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200"
      >
        <CopyIcon className="size-4.5" />
      </button>
      {written ? (
        <ConfirmButton
          title={`Redo ${tagId}?`}
          message="Marks this card as not written, so you can write and test it again."
          confirmLabel="Mark not written"
          destructive={false}
          triggerLabel={`${tagId} written — redo`}
          triggerClassName="ios-press flex h-11 shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-3 text-sm font-semibold text-emerald-700"
          onConfirm={async () => {
            await setTagWritten(tagId, false);
            showToast("Marked not written");
          }}
        >
          <CheckIcon className="size-4" />
          <RotateIcon className="size-3.5 opacity-60" />
        </ConfirmButton>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              onWritten(true);
              await setTagWritten(tagId, true);
              showToast(`${tagId} written`);
            })
          }
          className="ios-press flex h-11 shrink-0 items-center gap-1 rounded-full bg-emerald-500 px-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          <CheckIcon className="size-4" />
          Written
        </button>
      )}
    </li>
  );
}
