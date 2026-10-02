-- Product feedback: anyone (anon or authenticated) can submit; only admins
-- can read/update. Same write-only-for-anon posture as tag_views (0008).
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category text not null check (category in ('bug','feature','general')),
  message text not null check (char_length(message) between 1 and 2000),
  rating smallint check (rating between 1 and 5),
  screenshot_url text,
  page_path text,
  status text not null default 'new' check (status in ('new','reviewed','resolved')),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "Anyone can submit feedback"
  on public.feedback for insert with check (true);
create policy "Admins can view feedback"
  on public.feedback for select using (public.is_admin());
create policy "Admins can update feedback"
  on public.feedback for update using (public.is_admin()) with check (public.is_admin());

-- Opaque, non-user-scoped paths ({feedback-row-uuid}/{filename}) since the
-- submitter may be anonymous — unlike avatars/portfolio, this bucket can't
-- key off auth.uid(). Anyone can upload; nobody can collide with another
-- submission's file because the prefix is a fresh random uuid per
-- submission, generated client-side before upload.
insert into storage.buckets (id, name, public) values ('feedback', 'feedback', true)
  on conflict (id) do nothing;
create policy "Feedback screenshots are publicly accessible"
  on storage.objects for select using (bucket_id = 'feedback');
create policy "Anyone can upload a feedback screenshot"
  on storage.objects for insert with check (bucket_id = 'feedback');

create or replace function public.average_feedback_rating()
returns numeric language sql stable security definer set search_path = public as $$
  select round(avg(rating)::numeric, 1) from public.feedback where rating is not null;
$$;
create or replace function public.feedback_rating_count()
returns bigint language sql stable security definer set search_path = public as $$
  select count(*) from public.feedback where rating is not null;
$$;
grant execute on function public.average_feedback_rating() to anon, authenticated;
grant execute on function public.feedback_rating_count() to anon, authenticated;


-- Profile testimonials: a visitor can leave a rating/message for a claimed
-- tag's profile; only visible publicly once the owner approves it.
create table public.profile_testimonials (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  author_name text,
  rating smallint not null check (rating between 1 and 5),
  message text not null check (char_length(message) between 1 and 500),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index profile_testimonials_profile_id_idx on public.profile_testimonials (profile_id);
alter table public.profile_testimonials enable row level security;

create policy "Anyone can submit a testimonial for a claimed tag"
  on public.profile_testimonials for insert with check (private.has_claimed_tag(profile_id));
create policy "Approved testimonials are viewable via a claimed tag"
  on public.profile_testimonials for select
  using (approved = true and private.has_claimed_tag(profile_id));
create policy "Owners can manage their own testimonials"
  on public.profile_testimonials for all
  using (private.owns_profile(profile_id)) with check (private.owns_profile(profile_id));
create policy "Admins can view all testimonials"
  on public.profile_testimonials for select using (public.is_admin());

-- Same bug class that hit is_admin() (initial build) and owns_profile()
-- (0013): Postgres evaluates every permissive policy applicable to a
-- command (to OR them together), so if ANY policy calls a function anon
-- lacks EXECUTE on, the whole query throws instead of just failing that
-- one policy branch. Grant defensively for both helpers rather than wait
-- to discover it live again.
grant execute on function private.has_claimed_tag(uuid) to anon;
grant execute on function private.owns_profile(uuid) to anon;
