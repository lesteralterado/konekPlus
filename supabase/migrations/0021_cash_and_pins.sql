-- Cash (meet-up / pick-up) as a third payment method, "received via" on
-- every payment, an admin PIN reset for lost sleeve slips, and a public
-- PIN-state check so activation can say *why* a PIN failed.

-- ---------------------------------------------------------------------------
-- Cash payment method
-- ---------------------------------------------------------------------------
alter table public.card_orders drop constraint card_orders_payment_method_check;
alter table public.card_orders add constraint card_orders_payment_method_check
  check (payment_method in ('cod', 'gcash', 'cash'));

-- ---------------------------------------------------------------------------
-- How the money actually arrived (can differ from the chosen method, e.g. a
-- GCash customer who paid cash face-to-face).
-- ---------------------------------------------------------------------------
alter table public.card_orders
  add column paid_via text check (paid_via is null or paid_via in ('cash', 'gcash', 'bank', 'courier'));

update public.card_orders
set paid_via = case payment_method when 'gcash' then 'gcash' when 'cod' then 'courier' else 'cash' end
where payment_status = 'paid' and paid_via is null;

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
    and paid_via is null
    and gcash_reference is null
    and payment_proof_path is null
    and proof_submitted_at is null
    and payment_note is null
  );

-- ---------------------------------------------------------------------------
-- reset_tag_pin: new sleeve PIN for an unclaimed card (lost/smudged slip).
-- Same generator as assign_tags_to_order (0017); the old PIN stops working.
-- Plaintext is returned once, only the bcrypt hash is stored.
-- ---------------------------------------------------------------------------
create or replace function public.reset_tag_pin(p_tag_id text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_pin text;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  v_pin := lpad(
    ((('x' || encode(gen_random_bytes(4), 'hex'))::bit(32)::bigint & 2147483647) % 1000000)::text,
    6, '0'
  );

  update public.tags
    set activation_pin_hash = crypt(v_pin, gen_salt('bf')),
        pin_attempts = 0,
        pin_locked_until = null
    where tag_id = p_tag_id and claimed = false;

  if not found then
    raise exception 'card not found or already activated';
  end if;

  return v_pin;
end;
$$;

grant execute on function public.reset_tag_pin(text) to authenticated;

-- ---------------------------------------------------------------------------
-- tag_pin_state: why a PIN attempt failed. Reveals no more than tag_status()
-- already does publicly (claimed or not), plus tries left / lock minutes.
-- ---------------------------------------------------------------------------
create or replace function public.tag_pin_state(p_tag_id text)
returns table (state text, attempts_left int, locked_minutes int)
language sql
security definer
set search_path = public
stable
as $$
  select
    case
      when t.claimed then 'claimed'
      when t.activation_pin_hash is null then 'no_pin'
      when t.pin_locked_until is not null and t.pin_locked_until > now() then 'locked'
      else 'ok'
    end,
    greatest(0, 5 - t.pin_attempts),
    case
      when t.pin_locked_until is not null and t.pin_locked_until > now()
        then ceil(extract(epoch from (t.pin_locked_until - now())) / 60)::int
      else 0
    end
  from public.tags t
  where t.tag_id = p_tag_id;
$$;

grant execute on function public.tag_pin_state(text) to anon, authenticated;
