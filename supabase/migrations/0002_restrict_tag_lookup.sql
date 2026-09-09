-- Fixes a real information-disclosure bug in 0001: `tags_public` was a plain
-- view granted to anon/authenticated with no per-row restriction, so anyone
-- holding the public anon/publishable key could run
-- `select * from tags_public` with no filter and enumerate every
-- provisioned code, including unclaimed ones — letting an attacker claim
-- cards before they're ever physically tapped, which defeats the whole
-- "possession of the code = possession of the card" security model.
--
-- Replaces it with a SECURITY DEFINER function that only ever answers for
-- one tag_id at a time, so a lookup requires already knowing a specific
-- code (from the card itself) rather than being able to list them all.

revoke select on public.tags_public from anon, authenticated;
drop view if exists public.tags_public;

create or replace function public.tag_status(p_tag_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select claimed from public.tags where tag_id = p_tag_id;
$$;

grant execute on function public.tag_status(text) to anon, authenticated;
