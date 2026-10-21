-- Marks that the "activate your card" reminder email went out for an order,
-- so the daily cron (src/app/api/cron/activation-reminders) sends at most one
-- per order. Written only by that cron via the service-role client.
alter table public.card_orders
  add column activation_reminder_sent_at timestamptz;
