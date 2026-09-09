-- Lets an owner disable/enable an individual linked tag from their
-- dashboard without unclaiming it — the lost/stolen-card and privacy use
-- case: turn a card's public profile off without losing the profile_id
-- link, so re-enabling later needs no re-claim. No new RLS write policy is
-- added on `public.tags` — per 0001's comment, writes to `tags` only ever
-- go through SECURITY DEFINER RPCs, by design, fail-closed; this migration
-- keeps that invariant.
--
-- get_tag_profile() now treats a disabled tag the same as an unclaimed
-- one (both resolve to "no profile"), so /t/[tag_id]/vcard needs no code
-- change — it already 404s off a null get_tag_profile() result. The
-- public /t/[tag_id] page *does* need to tell "disabled" apart from
-- "doesn't exist"/"unclaimed" so it can show honest copy instead of the
-- generic "isn't recognized" message (which would wrongly invite a
-- finder to contact support about a card that isn't actually broken) —
-- so tag_status()'s return type changes from boolean to
-- 'unclaimed' | 'disabled' | 'active' | null. Postgres can't change a
-- function's return type via CREATE OR REPLACE, hence the DROP below.

alter table public.tags
  add column enabled boolean not null default true;

drop function if exists public.tag_status(text);

create or replace function public.tag_status(p_tag_id text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select case
    when not claimed then 'unclaimed'
    when claimed and not enabled then 'disabled'
    else 'active'
  end
  from public.tags
  where tag_id = p_tag_id;
$$;

grant execute on function public.tag_status(text) to anon, authenticated;

create or replace function public.get_tag_profile(p_tag_id text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select profile_id from public.tags
  where tag_id = p_tag_id and claimed = true and enabled = true;
$$;

grant execute on function public.get_tag_profile(text) to anon, authenticated;

-- set_tag_enabled: the only write path for the new column. Mirrors
-- claim_tag()'s shape (SECURITY DEFINER, explicit auth.uid() check,
-- returns whether a row was updated rather than raising on "not
-- found"/"not yours" so a malicious authenticated caller can't use the
-- return value to probe which tag_ids exist or who owns them). Ownership
-- is enforced via private.owns_profile() (from 0003) rather than
-- re-inlining the profiles-by-user_id lookup claim_tag does — claim_tag
-- inlines it because it's assigning a *new* profile_id to an unclaimed
-- row (nothing to own yet); this function checks an *existing* row's
-- profile_id against the caller, which is exactly what owns_profile()
-- already exists for.
create or replace function public.set_tag_enabled(p_tag_id text, p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.tags
    set enabled = p_enabled
    where tag_id = p_tag_id
      and profile_id is not null
      and private.owns_profile(profile_id);

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

grant execute on function public.set_tag_enabled(text, boolean) to authenticated;
