-- Fixes a real bug found during live testing: `infinite recursion detected
-- in policy for relation "profiles"` (Postgres error 42P17).
--
-- The profiles "viewable via a claimed tag" policy queries `tags`, which
-- triggers tags' own RLS, whose "owners can view their own linked tags"
-- policy queries `profiles` again — an infinite loop between the two
-- tables' policies. Every read of a public profile (the core `/t/[tag_id]`
-- route) was hitting this.
--
-- Fix: move both cross-table checks into SECURITY DEFINER functions in a
-- private (non-API-exposed) schema. A SECURITY DEFINER function runs as its
-- owner and bypasses RLS on the tables it touches internally, so calling it
-- from a policy no longer re-triggers the other table's RLS. See
-- .claude/skills/supabase-postgres-best-practices/references/security-rls-performance.md
-- ("Use security definer functions for complex checks").

create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.owns_profile(p_profile_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = p_profile_id and user_id = (select auth.uid())
  );
$$;

revoke execute on function private.owns_profile(uuid) from public;
grant execute on function private.owns_profile(uuid) to authenticated;

create or replace function private.has_claimed_tag(p_profile_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.tags
    where profile_id = p_profile_id and claimed = true
  );
$$;

revoke execute on function private.has_claimed_tag(uuid) from public;
grant execute on function private.has_claimed_tag(uuid) to anon, authenticated;

drop policy "Public profiles are viewable via a claimed tag" on public.profiles;
create policy "Public profiles are viewable via a claimed tag"
  on public.profiles for select
  using (private.has_claimed_tag(id));

drop policy "Owners can view their own linked tags" on public.tags;
create policy "Owners can view their own linked tags"
  on public.tags for select
  using (profile_id is not null and private.owns_profile(profile_id));
