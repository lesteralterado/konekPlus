-- Retention for customer photos (0026): the private original is deleted 12
-- months after it was taken, as the privacy policy and the consent text
-- promise (PHOTO_RETENTION_MONTHS in src/lib/photo-consent.ts — keep the two
-- in step). The row stays as the consent and freebie record, with the path
-- cleared and purged_at set.
--
-- purge_old_data() only DETACHES: it returns the (bucket, path) pairs and the
-- daily cron (src/app/api/cron/activation-reminders/route.ts) deletes the
-- files with the service-role client. The cron already deletes whatever
-- bucket the function names, so it needs no change.
--
-- The rest of the function is unchanged from 0025.

create index customer_photos_purge_idx
  on public.customer_photos (created_at)
  where photo_path is not null;

create or replace function public.purge_old_data()
returns table (bucket text, path text)
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.login_verifications where expires_at < now() - interval '1 day';
  delete from public.tag_views where viewed_at < now() - interval '400 days';
  delete from private.rate_limits where bucket_start < now() - interval '1 day';

  -- Capture the old paths first (UPDATE ... RETURNING would give the new,
  -- null value), then detach them.
  return query
    with old as (
      select o.id, o.payment_proof_path as p
      from public.card_orders o
      where o.payment_proof_path is not null
        and o.payment_status = 'paid'
        and o.paid_at < now() - interval '90 days'
    ),
    detached as (
      update public.card_orders c set payment_proof_path = null
      from old where c.id = old.id
    )
    select 'payment-proofs'::text, old.p from old;

  return query
    with old as (
      select r.id, r.proof_path as p
      from public.plan_payments r
      where r.proof_path is not null
        and r.status in ('paid', 'rejected')
        and coalesce(r.paid_at, r.created_at) < now() - interval '90 days'
    ),
    detached as (
      update public.plan_payments r set proof_path = null
      from old where r.id = old.id
    )
    select 'payment-proofs'::text, old.p from old;

  -- Customer photos: private originals older than 12 months. (The column is
  -- called p, like the blocks above: "path" would clash with the function's
  -- own output column.)
  return query
    with old as (
      select h.id, h.photo_path as p
      from public.customer_photos h
      where h.photo_path is not null
        and h.created_at < now() - interval '12 months'
    ),
    detached as (
      update public.customer_photos h
        set photo_path = null, purged_at = now()
      from old where h.id = old.id
    )
    select 'customer-photos'::text, old.p from old;

  -- Feedback rows may hold a legacy public URL or a bare path; the cron
  -- normalises either to a path.
  return query
    with old as (
      select f.id, f.screenshot_url as p
      from public.feedback f
      where f.screenshot_url is not null
        and f.status = 'resolved'
        and f.created_at < now() - interval '180 days'
    ),
    detached as (
      update public.feedback f set screenshot_url = null
      from old where f.id = old.id
    )
    select 'feedback'::text, old.p from old;
end;
$$;

revoke execute on function public.purge_old_data() from anon, authenticated, public;
