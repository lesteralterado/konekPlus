import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/toast";
import { requireAdmin } from "@/lib/admin-auth";
import { appIconUrl } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { HandoverPhotoHost } from "./photos/handover-photo";
import { AdminNav } from "./ui/admin-nav";

// Installable on a phone's home screen ("Add to Home Screen"), opening
// full-screen like a native app. See src/app/konek-admin.webmanifest.
export const metadata: Metadata = {
  title: "Konek+ Admin",
  manifest: "/konek-admin.webmanifest",
  appleWebApp: { capable: true, title: "Konek+ Admin", statusBarStyle: "default" },
  icons: { apple: appIconUrl(180) },
};

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  // Makes env(safe-area-inset-*) real so the bottom tab bar clears the
  // iPhone home indicator.
  viewportFit: "cover",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Badges on the Orders tab (new orders + GCash proofs to verify) and the
  // Feedback row — what's waiting on someone. Fetched in parallel with the
  // admin check: the counts are admin-only under RLS (a non-admin just gets
  // 0s), and requireAdmin() still redirects before anything renders.
  const supabase = await createClient();
  const [, { count: newOrders }, { count: toVerify }, { count: newFeedback }] = await Promise.all([
    requireAdmin(),
    supabase.from("card_orders").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase
      .from("card_orders")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "proof_submitted"),
    supabase.from("feedback").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  return (
    <div className="admin-ui flex min-h-full flex-1 flex-col bg-slate-50 md:flex-row">
      <AdminNav newOrders={(newOrders ?? 0) + (toVerify ?? 0)} newFeedback={newFeedback ?? 0} />
      <main className="min-w-0 flex-1 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8 md:py-8">
        {children}
      </main>
      <Toaster scopeClass="admin-ui" />
      <HandoverPhotoHost />
    </div>
  );
}
