import { Bone, LoadingShell } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-md px-6 py-14">
      <LoadingShell>
        <Bone className="h-8 w-48" />
        <Bone className="h-10 w-full" />
        <Bone className="h-10 w-full" />
        <Bone className="h-11 w-full" />
      </LoadingShell>
    </div>
  );
}
