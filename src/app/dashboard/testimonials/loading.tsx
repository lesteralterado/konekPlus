import { DetailSkeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <DetailSkeleton />
    </main>
  );
}
