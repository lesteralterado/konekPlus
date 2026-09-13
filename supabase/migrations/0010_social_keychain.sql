-- Konek+ Social Media Keychain: a separate product line from the NFC
-- calling card above (brief §16) — no redirect/profile system, no remote
-- disable. The physical NFC tag stores the customer's actual social media
-- URL directly, so Konek+ never controls the destination after handover.
-- This migration only models the order pipeline: submission -> programming
-- -> QC -> handover.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per customer submission (brief §8-9). Contact fields are nullable
-- since the customer flow only ever collects one of phone/email, not both.
create table public.keychain_orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  contact_phone text,
  contact_email text,
  -- Full vocabulary from brief §18. In practice 'programming' / 'nfc_programmed'
  -- / 'nfc_tested' / 'qc_passed' live at the per-item grain below (an order's
  -- items can be at different stages), so this column only ever moves through
  -- social_links_submitted -> links_verified -> ready_for_programming ->
  -- ready_for_handover -> handed_over -> completed. The other values are kept
  -- in the constraint for parity with the spec and future use.
  status text not null default 'pending' check (status in (
    'pending',
    'social_links_submitted',
    'links_verified',
    'ready_for_programming',
    'programming',
    'nfc_programmed',
    'nfc_tested',
    'qc_passed',
    'ready_for_handover',
    'handed_over',
    'completed'
  )),
  handed_over_at timestamptz,
  handed_over_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

-- One row per physical keychain (brief §19 — one selected platform = one
-- keychain). Each tracks its own NFC programming + QC lifecycle
-- independently, since items in the same order can be at different stages.
create table public.keychain_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.keychain_orders (id) on delete cascade,
  platform text not null check (platform in ('facebook', 'instagram', 'tiktok')),
  account_label text,
  profile_url text not null,
  nfc_status text not null default 'pending_programming' check (nfc_status in (
    'pending_programming', 'programming', 'programmed', 'tested', 'failed'
  )),
  tag_uid text,
  programmed_at timestamptz,
  programmed_by uuid references auth.users (id),
  tested_at timestamptz,
  qc_passed boolean not null default false,
  qc_passed_at timestamptz,
  qc_passed_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index keychain_items_order_id_idx on public.keychain_items (order_id);
create index keychain_orders_status_idx on public.keychain_orders (status);

-- ---------------------------------------------------------------------------
-- RLS: fails closed like tag_batches (0004) — nobody via anon/authenticated
-- by default. Admin access is the same is_admin() policy pattern as
-- 0005_admin_rls.sql, and it's what both clients that manage production use:
-- the web admin dashboard *and* the Flutter staff app hit this over the
-- regular RLS-scoped client (a service-role key never ships in a distributed
-- mobile binary), so the database is the only place enforcing "staff only".
-- ---------------------------------------------------------------------------

alter table public.keychain_orders enable row level security;
alter table public.keychain_items enable row level security;

create policy "Admins can view keychain orders"
  on public.keychain_orders for select
  using (public.is_admin());

create policy "Admins can update keychain orders"
  on public.keychain_orders for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can view keychain items"
  on public.keychain_items for select
  using (public.is_admin());

create policy "Admins can update keychain items"
  on public.keychain_items for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Customer submission RPC
-- ---------------------------------------------------------------------------

-- Anonymous, no login (brief §2 — one common QR code, not per-customer).
-- Goes through a single SECURITY DEFINER RPC rather than an anon insert RLS
-- policy — same convention as claim_tag() in 0001_init: one auditable entry
-- point, and it inserts the order + every item atomically in one round trip
-- instead of racing separate inserts under RLS.
create or replace function public.submit_keychain_order(
  p_customer_name text,
  p_contact_phone text,
  p_contact_email text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_platform text;
  v_url text;
  v_label text;
begin
  if trim(coalesce(p_customer_name, '')) = '' then
    raise exception 'Customer name is required';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one social media account is required';
  end if;

  insert into public.keychain_orders (customer_name, contact_phone, contact_email, status)
  values (
    trim(p_customer_name),
    nullif(trim(coalesce(p_contact_phone, '')), ''),
    nullif(trim(coalesce(p_contact_email, '')), ''),
    'social_links_submitted'
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_platform := v_item ->> 'platform';
    v_url := v_item ->> 'profile_url';
    v_label := nullif(trim(coalesce(v_item ->> 'account_label', '')), '');

    if v_platform not in ('facebook', 'instagram', 'tiktok') then
      raise exception 'Unsupported platform: %', v_platform;
    end if;
    -- Light sanity check only — staff explicitly verify each link as a
    -- pipeline step (§18 "LINKS VERIFIED"), so this just blocks empty/junk
    -- submissions rather than fully validating the URL shape.
    if v_url is null or trim(v_url) = '' or v_url !~* '^https://' then
      raise exception 'Invalid profile URL for %', v_platform;
    end if;

    insert into public.keychain_items (order_id, platform, account_label, profile_url)
    values (v_order_id, v_platform, v_label, trim(v_url));
  end loop;

  return v_order_id;
end;
$$;

grant execute on function public.submit_keychain_order(text, text, text, jsonb) to anon, authenticated;
