import { redirect } from "next/navigation";
import { getDeviceId, safeNextPath } from "@/lib/device-verification";
import { createClient } from "@/lib/supabase/server";
import { VerifyDeviceForm } from "./verify-device-form";

export const dynamic = "force-dynamic";

export default async function VerifyDevicePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = safeNextPath(next);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const deviceId = await getDeviceId();
  if (!deviceId) {
    // No device cookie at all — cookies are blocked, or this is a stale
    // pre-feature session that somehow reached here without going through
    // proxy.ts's backstop first. Bounce through /login, which sets the
    // cookie (see login/actions.ts) and restarts the flow properly.
    redirect(`/login?next=${encodeURIComponent(safeNext)}`);
  }

  // Idempotent: landing here directly with an already-trusted device (e.g.
  // a stale bookmark, or a page refresh after success) just continues on.
  const { data: trusted } = await supabase.rpc("is_device_trusted", {
    p_device_id: deviceId,
  });
  if (trusted) redirect(safeNext);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <h1 className="mb-1 text-2xl font-semibold text-brand-900">
        Verify it&apos;s you
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Enter the 6-digit code we emailed you. Didn&apos;t get one? Request a
        code below.
      </p>
      <VerifyDeviceForm next={safeNext} />
    </main>
  );
}
