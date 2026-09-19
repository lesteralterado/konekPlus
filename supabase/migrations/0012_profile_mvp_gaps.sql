-- Adds the clear MVP gaps from the Konek+ product brief: bio/tagline, a
-- single custom CTA button, a labeled multi-link list (replacing the single
-- "website" social entry), and a portfolio project gallery.

alter table public.profiles
  add column tagline text,
  add column bio text,
  add column cta_label text,
  add column cta_url text,
  add column links jsonb not null default '[]'::jsonb;

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  project_url text,
  tech text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index portfolio_items_profile_id_idx on public.portfolio_items (profile_id);
alter table public.portfolio_items enable row level security;

-- Reuses the existing private.has_claimed_tag()/private.owns_profile()
-- helpers from 0003_fix_profiles_tags_rls_recursion.sql — same pattern as
-- profiles' own RLS, no new helper functions needed.
create policy "Portfolio items are viewable via a claimed tag"
  on public.portfolio_items for select using (private.has_claimed_tag(profile_id));
create policy "Owners can manage their own portfolio items"
  on public.portfolio_items for all
  using (private.owns_profile(profile_id)) with check (private.owns_profile(profile_id));
create policy "Admins can view all portfolio items"
  on public.portfolio_items for select using (public.is_admin());

-- New storage bucket, same public-read/owner-write shape as `avatars`
-- (0001_init.sql), keyed by {user_id}/{filename}.
insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true)
  on conflict (id) do nothing;
create policy "Portfolio images are publicly accessible"
  on storage.objects for select using (bucket_id = 'portfolio');
create policy "Users can manage their own portfolio images"
  on storage.objects for all
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);

-- One-time backfill: any existing socials.website becomes the first entry
-- in the new links list, then is dropped from socials (superseded by Links).
update public.profiles
  set links = jsonb_build_array(jsonb_build_object('label', 'Website', 'url', socials->>'website')),
      socials = socials - 'website'
  where coalesce(socials->>'website', '') <> '';
