-- Payment tracking for card orders.
--
-- * The amount is locked when an admin CONFIRMS the order (the price agreed
--   with the customer) — never on insert, so a visitor can't name a price.
-- * payment_status: unpaid → proof_submitted (customer sent GCash proof on
--   /track) → paid; COD orders go unpaid → with_courier (auto on delivery)
--   → paid when the courier's remittance arrives. refunded for reversals.
-- * GCash proof screenshots live in a PRIVATE bucket: anyone may upload
--   (same anon-insert model as the feedback bucket, 0014), only admins can
--   read, via short-lived signed URLs.

alter table public.card_orders
  add column amount_due_php integer check (amount_due_php is null or amount_due_php >= 0),
  add column discount_pct smallint check (discount_pct is null or discount_pct between 0 and 100),
  add column payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'proof_submitted', 'with_courier', 'paid', 'refunded')),
  add column amount_received_php integer
    check (amount_received_php is null or amount_received_php >= 0),
  add column paid_at timestamptz,
  add column paid_confirmed_by uuid references auth.users (id) on delete set null,
  add column gcash_reference text
    check (gcash_reference is null or char_length(gcash_reference) <= 40),
  add column payment_proof_path text
    check (payment_proof_path is null or char_length(payment_proof_path) <= 200),
  add column proof_submitted_at timestamptz,
  add column payment_note text check (payment_note is null or char_length(payment_note) <= 300);

create index card_orders_payment_status_idx on public.card_orders (payment_status);

-- Visitors can still only create a plain 'new', unpaid order with no money
-- fields filled in.
drop policy "Anyone can place an order" on public.card_orders;
create policy "Anyone can place an order"
  on public.card_orders for insert with check (
    status = 'new'
    and payment_status = 'unpaid'
    and amount_due_php is null
    and discount_pct is null
    and amount_received_php is null
    and paid_at is null
    and paid_confirmed_by is null
    and gcash_reference is null
    and payment_proof_path is null
    and proof_submitted_at is null
    and payment_note is null
  );

-- ---------------------------------------------------------------------------
-- lookup_order: now also returns what the customer needs to pay.
-- ---------------------------------------------------------------------------
drop function if exists public.lookup_order(text, text);

create function public.lookup_order(p_reference text, p_phone text)
returns table (
  status text,
  finish text,
  quantity smallint,
  courier text,
  tracking_number text,
  created_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  payment_method text,
  payment_status text,
  amount_due_php integer,
  payment_note text
)
language sql
security definer
set search_path = public
stable
as $$
  select o.status, o.finish, o.quantity, o.courier, o.tracking_number,
         o.created_at, o.shipped_at, o.delivered_at,
         o.payment_method, o.payment_status, o.amount_due_php, o.payment_note
  from public.card_orders o
  where upper(left(o.id::text, 6)) = upper(regexp_replace(coalesce(p_reference, ''), '^KP-', '', 'i'))
    and length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 7
    and right(regexp_replace(o.phone, '\D', '', 'g'), 7)
      = right(regexp_replace(p_phone, '\D', '', 'g'), 7)
  limit 1;
$$;

grant execute on function public.lookup_order(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- submit_payment_proof: the customer's side of GCash payment, from /track.
-- Same reference + phone match as lookup_order. Only for confirmed (amount
-- locked), unpaid GCash orders. Returns the order id, or null on any miss.
-- ---------------------------------------------------------------------------
create or replace function public.submit_payment_proof(
  p_reference text,
  p_phone text,
  p_gcash_ref text,
  p_proof_path text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_ref text := nullif(btrim(coalesce(p_gcash_ref, '')), '');
  v_path text := nullif(btrim(coalesce(p_proof_path, '')), '');
begin
  if v_ref is null or char_length(v_ref) > 40 then
    return null;
  end if;
  if v_path is not null and (char_length(v_path) > 200 or v_path !~ '^[a-f0-9-]{36}\.(jpg|jpeg|png|webp|heic)$') then
    return null;
  end if;

  select o.id into v_id
  from public.card_orders o
  where upper(left(o.id::text, 6)) = upper(regexp_replace(coalesce(p_reference, ''), '^KP-', '', 'i'))
    and length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 7
    and right(regexp_replace(o.phone, '\D', '', 'g'), 7)
      = right(regexp_replace(p_phone, '\D', '', 'g'), 7)
    and o.payment_method = 'gcash'
    and o.payment_status = 'unpaid'
    and o.amount_due_php is not null
    and o.status in ('confirmed', 'preparing', 'shipped', 'delivered')
  limit 1;

  if v_id is null then
    return null;
  end if;

  update public.card_orders
  set gcash_reference = v_ref,
      payment_proof_path = v_path,
      proof_submitted_at = now(),
      payment_status = 'proof_submitted',
      payment_note = null
  where id = v_id;

  return v_id;
end;
$$;

grant execute on function public.submit_payment_proof(text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Private bucket for GCash screenshots.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

create policy "Anyone can upload payment proof"
  on storage.objects for insert with check (bucket_id = 'payment-proofs');
create policy "Admins can view payment proofs"
  on storage.objects for select using (bucket_id = 'payment-proofs' and public.is_admin());
