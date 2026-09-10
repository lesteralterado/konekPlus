-- Adds a safe aggregate-only stat for the public marketing homepage. Unlike
-- 0001's dropped tags_public view, this never exposes individual tag_ids —
-- only a total count — so it can't be used to enumerate/guess card codes
-- the way that view could (see 0002's fix).

create or replace function public.claimed_tag_count()
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*) from public.tags where claimed = true;
$$;

grant execute on function public.claimed_tag_count() to anon, authenticated;
