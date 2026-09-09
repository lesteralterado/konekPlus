"use client";

import { useActionState } from "react";
import { provisionBatch, type ProvisionState } from "./actions";
import { DownloadIcon, PlusIcon } from "../icons";

const initialState: ProvisionState = { error: null, codes: [] };

const inputClass =
  "rounded-2xl bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200";

export function ProvisionForm({ siteUrl }: { siteUrl: string }) {
  const [state, formAction, pending] = useActionState(
    provisionBatch,
    initialState,
  );

  function downloadCsv() {
    const rows = state.codes.map((code) => `${code},${siteUrl}/t/${code}`);
    const csv = ["tag_id,url", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tag-batch-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Count
          </label>
          <input
            name="count"
            type="number"
            min={1}
            max={500}
            defaultValue={20}
            required
            className={`${inputClass} w-24`}
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Note (optional)
          </label>
          <input
            name="note"
            placeholder="e.g. Q1 retail batch"
            className={`${inputClass} w-full`}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 rounded-2xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
        >
          <PlusIcon className="h-4 w-4" />
          {pending ? "Provisioning…" : "Provision"}
        </button>
      </form>

      {state.error && (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      )}

      {state.codes.length > 0 && (
        <div className="mt-4 rounded-2xl bg-brand-50/60 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-brand-900">
              {state.codes.length} codes generated
            </p>
            <button
              type="button"
              onClick={downloadCsv}
              className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-brand-700 shadow-sm hover:bg-brand-50"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              Download CSV
            </button>
          </div>
          <div className="mt-2 max-h-40 overflow-y-auto font-mono text-xs text-slate-600">
            {state.codes.join(", ")}
          </div>
        </div>
      )}
    </div>
  );
}
