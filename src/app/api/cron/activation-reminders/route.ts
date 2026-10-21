import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { sendEmail } from "@/lib/email/send";
import { activationReminderEmail } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Orders shipped 3 to 30 days ago whose cards are still unclaimed get one
// reminder. The 30-day floor keeps a long-forgotten order from being emailed
// the first time this runs.
const REMIND_AFTER_DAYS = 3;
const GIVE_UP_AFTER_DAYS = 30;
const BATCH_SIZE = 50;

const daysAgoIso = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// Vercel Cron calls this daily (vercel.json) and sends CRON_SECRET as a
// bearer token. Uses the service-role client: there is no signed-in user, and
// the orders and tags it reads are admin-only under RLS.
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return new NextResponse("Unauthorized", { status: 401 });

  const supabase = createAdminClient();

  const { data: orders, error } = await supabase
    .from("card_orders")
    .select("id, full_name, email, quantity")
    .in("status", ["shipped", "delivered"])
    .is("activation_reminder_sent_at", null)
    .not("email", "is", null)
    .lt("shipped_at", daysAgoIso(REMIND_AFTER_DAYS))
    .gt("shipped_at", daysAgoIso(GIVE_UP_AFTER_DAYS))
    .limit(BATCH_SIZE);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!orders?.length) return NextResponse.json({ sent: 0, skipped: 0, failed: 0 });

  const { data: unclaimed } = await supabase
    .from("tags")
    .select("order_id")
    .in(
      "order_id",
      orders.map((o) => o.id),
    )
    .eq("claimed", false);
  const unclaimedByOrder = new Map<string, number>();
  for (const t of unclaimed ?? []) {
    if (t.order_id) unclaimedByOrder.set(t.order_id, (unclaimedByOrder.get(t.order_id) ?? 0) + 1);
  }

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const order of orders) {
    const stillUnclaimed = unclaimedByOrder.get(order.id) ?? 0;
    // Nothing left to activate: stamp it so it drops out of the next query.
    if (stillUnclaimed === 0) {
      await supabase
        .from("card_orders")
        .update({ activation_reminder_sent_at: new Date().toISOString() })
        .eq("id", order.id);
      skipped++;
      continue;
    }

    const result = await sendEmail({
      to: order.email!,
      ...activationReminderEmail({
        fullName: order.full_name,
        reference: `KP-${order.id.slice(0, 6).toUpperCase()}`,
        cardCount: stillUnclaimed,
        guideUrl: `${siteUrl}/guide`,
      }),
    });

    // Only a delivered send is recorded, so a failure is retried tomorrow.
    if (result.ok) {
      await supabase
        .from("card_orders")
        .update({ activation_reminder_sent_at: new Date().toISOString() })
        .eq("id", order.id);
      sent++;
    } else {
      failed++;
    }
  }

  return NextResponse.json({ sent, skipped, failed });
}
