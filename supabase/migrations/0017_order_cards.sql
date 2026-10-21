-- Links shipped cards to the order that produced them and adds an
-- activation PIN (printed on the sleeve, never on the chip) so a stranger
-- who sees an unclaimed /t/<code> URL can't claim it before the customer.
--
-- Writes to `tags` still only go through SECURITY DEFINER RPCs (0001/0006).
-- Tags without a PIN (legacy or hand-made) keep claiming exactly as before.
--
-- The order status check keeps the legacy values (contacted / fulfilled) so
-- the existing admin page keeps working until the new statuses are wired up.

-- ---------------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------------

alter table public.tags
  add column order_id uuid references public.card_orders (id) on delete set null,
  add column activation_pin_hash text,
  add column pin_attempts smallint not null default 0,
  add column pin_locked_until timestamptz,
  add column tag_uid text,
  add column written_at timestamptz,
  add column shipped_at timestamptz,
  add column activated_at timestamptz;

create index tags_order_id_idx on public.tags (order_id) where order_id is not null;

-- ---------------------------------------------------------------------------
-- card_orders
-- ---------------------------------------------------------------------------

alter table public.card_orders
  add column user_id uuid references auth.users (id) on delete set null,
  add column courier text check (courier is null or char_length(courier) <= 60),
  add column tracking_number text
    check (tracking_number is null or char_length(tracking_number) <= 100),
  add column shipped_at timestamptz,
  add column delivered_at timestamptz;

alter table public.card_orders drop constraint card_orders_status_check;
alter table public.card_orders add constraint card_orders_status_check
  check (status in (
    'new', 'contacted', 'fulfilled', 'cancelled',
    'confirmed', 'preparing', 'shipped', 'delivered'
  ));

-- ---------------------------------------------------------------------------
-- tag_needs_pin: lets the claim page know whether to ask for a PIN. Boolean
-- only, per tag_id, so it can't be used to list tags (same posture as 0002).
-- ---------------------------------------------------------------------------

create or replace function public.tag_needs_pin(p_tag_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select activation_pin_hash is not null
  from public.tags
  where tag_id = p_tag_id and claimed = false;
$$;

grant execute on function public.tag_needs_pin(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- claim_tag(tag, pin): same atomic claim as 0001, plus the PIN check.
-- A wrong PIN returns false (not an exception) so the attempt counter
-- commits; 5 misses lock the tag for 15 minutes. Wrong PIN, locked and
-- already-claimed all look the same to the caller.
-- ---------------------------------------------------------------------------

drop function if exists public.claim_tag(text);

create or replace function public.claim_tag(p_tag_id text, p_pin text default null)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_profile_id uuid;
  v_tag public.tags%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select id into v_profile_id from public.profiles where user_id = auth.uid();

  if v_profile_id is null then
    raise exception 'no profile found for current user';
  end if;

  select * into v_tag from public.tags
    where tag_id = p_tag_id and claimed = false
    for update;

  if not found then
    return false;
  end if;

  if v_tag.activation_pin_hash is not null then
    if v_tag.pin_locked_until is not null and v_tag.pin_locked_until > now() then
      return false;
    end if;

    if p_pin is null
       or crypt(p_pin, v_tag.activation_pin_hash) <> v_tag.activation_pin_hash then
      update public.tags
        set pin_attempts = pin_attempts + 1,
            pin_locked_until = case
              when pin_attempts + 1 >= 5 then now() + interval '15 minutes'
              else pin_locked_until
            end
        where tag_id = p_tag_id;
      return false;
    end if;
  end if;

  update public.tags
    set claimed = true,
        profile_id = v_profile_id,
        claimed_at = now(),
        activated_at = now(),
        pin_attempts = 0,
        pin_locked_until = null
    where tag_id = p_tag_id;

  if v_tag.order_id is not null then
    update public.card_orders
      set user_id = auth.uid()
      where id = v_tag.order_id and user_id is null;
  end if;

  return true;
end;
$$;

grant execute on function public.claim_tag(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- assign_tags_to_order: admin picks N unassigned, unclaimed tags for an
-- order and gets a fresh PIN for each. Plaintext PINs are returned once
-- (for printing the sleeve slip) and only the bcrypt hash is stored.
-- ---------------------------------------------------------------------------

create or replace function public.assign_tags_to_order(p_order_id uuid, p_count int)
returns table (tag_id text, pin text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_ids text[];
  v_id text;
  v_pin text;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if p_count < 1 or p_count > 100 then
    raise exception 'count must be between 1 and 100';
  end if;

  if not exists (select 1 from public.card_orders where id = p_order_id) then
    raise exception 'order not found';
  end if;

  select array_agg(t.tag_id) into v_ids from (
    select t2.tag_id from public.tags t2
    where t2.order_id is null
      and t2.claimed = false
      and t2.activation_pin_hash is null
    order by t2.created_at
    limit p_count
    for update skip locked
  ) t;

  if v_ids is null or array_length(v_ids, 1) < p_count then
    raise exception 'not enough unassigned tags (provision more first)';
  end if;

  foreach v_id in array v_ids loop
    v_pin := lpad(
      ((('x' || encode(gen_random_bytes(4), 'hex'))::bit(32)::bigint & 2147483647) % 1000000)::text,
      6, '0'
    );

    update public.tags
      set order_id = p_order_id,
          activation_pin_hash = crypt(v_pin, gen_salt('bf')),
          pin_attempts = 0,
          pin_locked_until = null
      where public.tags.tag_id = v_id;

    tag_id := v_id;
    pin := v_pin;
    return next;
  end loop;
end;
$$;

grant execute on function public.assign_tags_to_order(uuid, int) to authenticated;

-- ---------------------------------------------------------------------------
-- lookup_order: public order tracking by reference (KP-XXXXXX) + phone.
-- Requires both to match; returns nothing otherwise, so it can't be used
-- to confirm that a reference exists. Only status fields come back.
-- ---------------------------------------------------------------------------

create or replace function public.lookup_order(p_reference text, p_phone text)
returns table (
  status text,
  finish text,
  quantity smallint,
  courier text,
  tracking_number text,
  created_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select o.status, o.finish, o.quantity, o.courier, o.tracking_number,
         o.created_at, o.shipped_at, o.delivered_at
  from public.card_orders o
  where upper(left(o.id::text, 6)) = upper(regexp_replace(coalesce(p_reference, ''), '^KP-', '', 'i'))
    and length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 7
    and right(regexp_replace(o.phone, '\D', '', 'g'), 7)
      = right(regexp_replace(p_phone, '\D', '', 'g'), 7)
  limit 1;
$$;

grant execute on function public.lookup_order(text, text) to anon, authenticated;
