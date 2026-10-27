-- Pro renewals, paid by GCash and checked by a person (same model as card
-- orders, 0020).
--
-- * The owner pays, then submits the GCash reference (and optionally a
--   screenshot) from their dashboard: one plan_payments row, status
--   proof_submitted. One pending renewal per profile at a time.
-- * An admin checks it against the GCash account and calls
--   confirm_plan_payment(), which marks it paid and extends Pro in one step,
--   or rejects it with a note the owner sees.
-- * amount_due_php is what the dashboard showed the owner. It's recorded,
--   not trusted: the admin enters what actually arrived.
-- * Screenshots share the private payment-proofs bucket, named plan-<uuid>,
--   and are deleted 90 days after payment like card-order proofs.

create table public.plan_payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  term text not null check (term in ('monthly', 'yearly')),
  months smallint not null,
  amount_due_php integer not null check (amount_due_php > 0),
  gcash_reference text not null check (char_length(gcash_reference) between 1 and 40),
  proof_path text check (
    proof_path is null or proof_path ~ '^plan-[a-f0-9-]{36}\.(jpg|jpeg|png|webp|heic)$'
  ),
  status text not null default 'proof_submitted'
    check (status in ('proof_submitted', 'paid', 'rejected')),
  amount_received_php integer check (amount_received_php is null or amount_received_php >= 0),
  admin_note text check (admin_note is null or char_length(admin_note) <= 300),
  paid_at timestamptz,
  confirmed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check ((term = 'monthly' and months = 1) or (term = 'yearly' and months = 12))
);

create unique index plan_payments_one_pending_idx
  on public.plan_payments (profile_id) where status = 'proof_submitted';
create index plan_payments_profile_id_idx on public.plan_payments (profile_id);
create index plan_payments_user_id_idx on public.plan_payments (user_id);
create index plan_payments_status_idx on public.plan_payments (status);
create index plan_payments_paid_at_idx on public.plan_payments (paid_at);
create index plan_payments_confirmed_by_idx on public.plan_payments (confirmed_by);

alter table public.plan_payments enable row level security;

create policy "Owners see their renewals"
  on public.plan_payments for select
  using (user_id = auth.uid() or public.is_admin());

-- Owners can only file a fresh, unchecked renewal for their own profile.
create policy "Owners submit renewals"
  on public.plan_payments for insert with check (
    user_id = auth.uid()
    and profile_id in (select p.id from public.profiles p where p.user_id = auth.uid())
    and status = 'proof_submitted'
    and amount_received_php is null
    and admin_note is null
    and paid_at is null
    and confirmed_by is null
  );

create policy "Admins update renewals"
  on public.plan_payments for update
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Reminder bookkeeping: when the last "Pro is ending" email went out. Owners
-- can't touch it (or their plan) from their own row.
-- ---------------------------------------------------------------------------
alter table public.profiles add column pro_reminder_sent_at timestamptz;

create or replace function private.guard_profile_plan()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.pro_until := null;
      new.founding := false;
      new.pro_reminder_sent_at := null;
    else
      new.pro_until := old.pro_until;
      new.founding := old.founding;
      new.pro_reminder_sent_at := old.pro_reminder_sent_at;
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- confirm_plan_payment: admin only. Marks the renewal paid and adds its
-- months to Pro — from today if Pro already ended, otherwise on top of what's
-- left. Returns the new Pro end, or null if it wasn't pending.
-- ---------------------------------------------------------------------------
create or replace function public.confirm_plan_payment(p_id uuid, p_amount_received int)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.plan_payments%rowtype;
  v_until timestamptz;
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;
  if p_amount_received is null or p_amount_received < 0 then
    raise exception 'amount received is required';
  end if;

  select * into v from public.plan_payments where id = p_id for update;
  if not found or v.status <> 'proof_submitted' then
    return null;
  end if;

  update public.profiles
    set pro_until = greatest(coalesce(pro_until, now()), now()) + make_interval(months => v.months),
        pro_reminder_sent_at = null
    where id = v.profile_id
    returning pro_until into v_until;

  update public.plan_payments
    set status = 'paid',
        paid_at = now(),
        confirmed_by = auth.uid(),
        amount_received_php = p_amount_received,
        admin_note = null
    where id = p_id;

  return v_until;
end;
$$;

revoke execute on function public.confirm_plan_payment(uuid, int) from anon, public;
grant execute on function public.confirm_plan_payment(uuid, int) to authenticated;

-- ---------------------------------------------------------------------------
-- purge_old_data: unchanged, plus renewal screenshots 90 days after payment.
-- ---------------------------------------------------------------------------
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
