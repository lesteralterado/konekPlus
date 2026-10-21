-- Step 1 of activation: check the sleeve PIN on its own, before the signup
-- form is shown, and hand back the name/email/phone from the order that
-- produced this card so the profile form can be prefilled.
--
-- The order's contact details are only returned for a correct PIN, so
-- someone who merely sees an unclaimed /t/<code> URL learns nothing. Wrong
-- guesses count against the same 5-tries / 15-minute lockout as claim_tag()
-- (0017); claim_tag() still re-checks the PIN, so this is a convenience step
-- and not the security boundary. Zero rows means wrong PIN, locked, already
-- claimed or no PIN on this tag — deliberately indistinguishable.
create or replace function public.verify_tag_pin(p_tag_id text, p_pin text)
returns table (full_name text, email text, phone text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_tag public.tags%rowtype;
begin
  select * into v_tag from public.tags
    where tag_id = p_tag_id and claimed = false
    for update;

  if not found or v_tag.activation_pin_hash is null then
    return;
  end if;

  if v_tag.pin_locked_until is not null and v_tag.pin_locked_until > now() then
    return;
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
    return;
  end if;

  return query
    select o.full_name, o.email, o.phone
    from public.card_orders o
    where o.id = v_tag.order_id;

  if not found then
    -- PIN is right but the tag has no order: still a success, nothing to prefill.
    return query select null::text, null::text, null::text;
  end if;
end;
$$;

grant execute on function public.verify_tag_pin(text, text) to anon, authenticated;
