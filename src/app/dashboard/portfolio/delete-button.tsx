"use client";

import { useTransition } from "react";
import { deletePortfolioItem } from "./actions";

export function DeletePortfolioButton({ itemId }: { itemId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Remove this project from your portfolio?")) return;
        startTransition(() => deletePortfolioItem(itemId));
      }}
      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 disabled:opacity-60"
      aria-label="Delete project"
      title="Delete project"
    >
      {isPending ? "…" : "×"}
    </button>
  );
}
