import { Bone, LoadingShell } from "@/components/skeleton";

// Photos while the list loads — same shape as the real page.
export default function Loading() {
  return (
    <LoadingShell>
      <Bone className="h-8 w-32" />
      <Bone className="h-10 w-full rounded-full" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-[22px] bg-white p-4">
          <Bone className="size-16 rounded-xl" />
          <div className="flex-1">
            <Bone className="h-4 w-1/2" />
            <Bone className="mt-3 h-3 w-3/4" />
          </div>
        </div>
      ))}
    </LoadingShell>
  );
}
