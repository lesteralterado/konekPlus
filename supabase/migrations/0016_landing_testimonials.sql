-- Testimonials shown on the marketing homepage. Curated by admins from
-- customers who agreed to be quoted — deliberately separate from both
-- `feedback` (0014: no names, never consented to publication) and
-- `profile_testimonials` (0014: about an individual card owner, not about
-- Konek+). The public sees published rows only; admins manage everything.
create table public.landing_testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (char_length(author_name) between 1 and 80),
  author_role text check (author_role is null or char_length(author_role) <= 120),
  quote text not null check (char_length(quote) between 1 and 400),
  rating smallint not null default 5 check (rating between 1 and 5),
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index landing_testimonials_published_idx
  on public.landing_testimonials (published, sort_order, created_at);

alter table public.landing_testimonials enable row level security;

create policy "Published testimonials are public"
  on public.landing_testimonials for select
  using (published = true or public.is_admin());
create policy "Admins can add testimonials"
  on public.landing_testimonials for insert with check (public.is_admin());
create policy "Admins can update testimonials"
  on public.landing_testimonials for update
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete testimonials"
  on public.landing_testimonials for delete using (public.is_admin());
