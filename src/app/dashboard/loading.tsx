import { Bone, LoadingShell } from "@/components/skeleton";

// Dashboard while the profile loads: photo + name header, then cards.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <LoadingShell>
        <div className="flex items-center gap-4">
          <Bone className="size-16 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Bone className="h-6 w-1/2" />
            <Bone className="h-4 w-1/3" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-3xl bg-white p-5">
            <Bone className="h-4 w-1/3" />
            <Bone className="mt-3 h-10 w-full" />
            <Bone className="mt-2 h-10 w-full" />
          </div>
        ))}
      </LoadingShell>
    </main>
  );
}
