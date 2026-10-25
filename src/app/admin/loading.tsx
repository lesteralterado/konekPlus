import { Bone, LoadingShell } from "@/components/skeleton";

// Admin home while its counts load — same shape as the real dashboard.
export default function Loading() {
  return (
    <LoadingShell>
      <Bone className="h-8 w-44" />
      <div className="overflow-hidden rounded-[22px] bg-white p-4 md:max-w-md">
        <Bone className="h-5 w-3/4" />
        <Bone className="mt-3 h-5 w-2/3" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-3xl bg-white p-4 sm:p-5">
            <Bone className="h-3 w-20" />
            <Bone className="mt-3 h-7 w-24" />
          </div>
        ))}
      </div>
      <Bone className="h-48 w-full rounded-3xl" />
    </LoadingShell>
  );
}
