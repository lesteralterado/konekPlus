import { Bone, LoadingShell } from "@/components/skeleton";

// Renewals while they load — same shape as the real page.
export default function Loading() {
  return (
    <LoadingShell>
      <Bone className="h-8 w-44" />
      <Bone className="h-40 w-full rounded-3xl" />
      <Bone className="h-64 w-full rounded-3xl" />
    </LoadingShell>
  );
}
