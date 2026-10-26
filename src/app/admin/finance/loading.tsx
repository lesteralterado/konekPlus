import { Bone, LoadingShell } from "@/components/skeleton";

// Finance while its numbers load — same shape as the real page.
export default function Loading() {
  return (
    <LoadingShell>
      <Bone className="h-8 w-36" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-3xl bg-white p-4 sm:p-5">
            <Bone className="h-3 w-20" />
            <Bone className="mt-3 h-7 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        <Bone className="h-44 w-full rounded-3xl" />
        <Bone className="h-44 w-full rounded-3xl" />
      </div>
      <Bone className="h-64 w-full rounded-3xl" />
    </LoadingShell>
  );
}
