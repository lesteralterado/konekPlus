import { redirect } from "next/navigation";
import {
  getDeviceId,
  isDeviceVerificationEnabled,
  maskEmail,
  safeNextPath,
  type PinNotice,
} from "@/lib/device-verification";
import { createClient } from "@/lib/supabase/server";
import { VerifyDeviceForm } from "./verify-device-form";

export const dynamic = "force-dynamic";

const NOTICE_TEXT: Record<PinNotice, string> = {
  rate_limited: "A code was requested less than a minute ago — use that one, or request a new code in a moment.",
  send_failed: "We couldn't send your code just now. Wait a minute, then tap “Resend code”.",
};

export default async function VerifyDevicePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; notice?: string }>;
}) {
  const { next, notice: noticeParam } = await searchParams;
  const safeNext = safeNextPath(next);
  const notice = noticeParam === "rate_limited" || noticeParam === "send_failed" ? noticeParam : null;

  // Feature switched off (see isDeviceVerificationEnabled) — nothing to verify.
  if (!isDeviceVerificationEnabled()) redirect(safeNext);

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
      <p className="text-sm text-slate-500">
        You&apos;re signing in on a new device.{" "}
        {notice ? (
          <>We&apos;ll email the code to</>
        ) : (
          <>We emailed a 6-digit code to</>
        )}{" "}
        <span className="font-semibold text-brand-900">{user.email ? maskEmail(user.email) : "your email"}</span>.
      </p>
      {!notice && (
        <p className="mt-2 text-xs text-slate-400">
          Can&apos;t find it? Check your spam or promotions folder. The code expires in 10 minutes.
        </p>
      )}
      {notice && (
        <p role="status" className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {NOTICE_TEXT[notice]}
        </p>
      )}
      <div className="mt-6">
        <VerifyDeviceForm next={safeNext} startCooldown={!notice} />
      </div>
    </main>
  );
}
