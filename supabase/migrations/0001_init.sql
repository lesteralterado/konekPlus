-- Konek+ schema: profiles (one per owner) + tags (many per profile), RLS,
-- and the two SECURITY DEFINER RPCs that every write to `tags` must go
-- through (see brief §3-4). Run with `supabase db push` / `supabase
-- migration up`, or paste into the Supabase SQL editor.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) unique,
  full_name text,
  job_title text,
  company text,
  phone text,
  email text,
  socials jsonb not null default '{}'::jsonb,
  avatar_url text,
  updated_at timestamptz not null default now()
);

create table public.tags (
  tag_id text primary key,
  claimed boolean not null default false,
  profile_id uuid references public.profiles (id),
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index tags_profile_id_idx on public.tags (profile_id);

-- ---------------------------------------------------------------------------
-- Public view: only what a scan is allowed to see before a tag is claimed.
-- No policy grants anon/authenticated select on the base `tags` table, so
-- profile_id and claimed_at never reach an unauthenticated client directly.
-- ---------------------------------------------------------------------------

create view public.tags_public as
  select tag_id, claimed from public.tags;

grant select on public.tags_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.tags enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Public profiles are viewable via a claimed tag"
  on public.profiles for select
  using (
    exists (
      select 1 from public.tags
      where tags.profile_id = profiles.id and tags.claimed = true
    )
  );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owners can view their own linked tags"
  on public.tags for select
  using (
    profile_id is not null
    and profile_id = (select id from public.profiles where user_id = auth.uid())
  );

-- No insert/update/delete policies on `tags` for anon/authenticated: claiming
-- and linking only happen through claim_tag() below. Batch provisioning
-- (inserting new unclaimed rows) only happens through the service-role
-- client in scripts/generate-tags.ts, which bypasses RLS entirely.

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Resolves a claimed tag to its profile, without ever exposing raw `tags`
-- columns to the client. Returns null for both "doesn't exist" and
-- "exists but unclaimed" — callers distinguish those via tags_public first.
create or replace function public.get_tag_profile(p_tag_id text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select profile_id from public.tags where tag_id = p_tag_id and claimed = true;
$$;

grant execute on function public.get_tag_profile(text) to anon, authenticated;

-- Atomically links a tag to the caller's own profile. Used identically by:
-- new-owner signup (after the profile row is created), an existing owner
-- logging in to link another card, and the dashboard's "add a card by code".
-- The `where claimed = false` makes double-claims (two tabs racing on the
-- same tag) resolve to exactly one winner instead of a lost update.
create or replace function public.claim_tag(p_tag_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_rows int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select id into v_profile_id from public.profiles where user_id = auth.uid();

  if v_profile_id is null then
    raise exception 'no profile found for current user';
  end if;

  update public.tags
    set claimed = true,
        profile_id = v_profile_id,
        claimed_at = now()
    where tag_id = p_tag_id and claimed = false;

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

grant execute on function public.claim_tag(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: avatars bucket, publicly readable, writable only in the owner's
-- own folder (path convention: {user_id}/{filename}).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
