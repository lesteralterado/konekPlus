-- Tracks each real (claimed + enabled) card view so the marketing page can
-- show genuine "taps served" activity, replacing the last hardcoded
-- placeholder stat. Same posture as every other public-facing piece of this
-- schema: no raw table access for anon/authenticated, writes only through a
-- SECURITY DEFINER function, and the read side (recent_tag_view_count)
-- exposes only an aggregate — never individual tag_ids or timestamps — so
-- it can't be used to profile who viewed what or enumerate cards, same bar
-- 0002/0007 hold to.

create table public.tag_views (
  id bigint generated always as identity primary key,
  tag_id text not null references public.tags (tag_id),
  viewed_at timestamptz not null default now()
);

create index tag_views_viewed_at_idx on public.tag_views (viewed_at);

alter table public.tag_views enable row level security;
-- No select/insert policies for anon/authenticated — same "writes and
-- reads only through RPCs" posture as `tags` itself (see 0001's comment).

-- Silently no-ops for any tag_id that isn't currently claimed + enabled,
-- so probing random/garbage codes (or a disabled card) can't pollute the
-- stat or be used to fingerprint which codes are live.
create or replace function public.record_tag_view(p_tag_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tag_views (tag_id)
  select p_tag_id
  from public.tags
  where tag_id = p_tag_id and claimed = true and enabled = true;
end;
$$;

grant execute on function public.record_tag_view(text) to anon, authenticated;

-- Rolling 30-day window rather than calendar-month, so the homepage stat
-- is always "recent activity" instead of resetting to near-zero on the 1st.
create or replace function public.recent_tag_view_count()
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*) from public.tag_views
  where viewed_at >= now() - interval '30 days';
$$;

grant execute on function public.recent_tag_view_count() to anon, authenticated;
