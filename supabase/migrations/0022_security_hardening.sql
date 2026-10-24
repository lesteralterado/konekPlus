-- Security hardening (see docs/SECURITY.md). Run AFTER 0021.
--
-- 1. Profiles / portfolio / testimonials could be bulk-downloaded by anyone
--    with the public API key (GET /rest/v1/profiles?select=*), including
--    cards the owner had switched off. Public reads now go through per-card
--    RPCs that need the card code, respect the on/off switch and the owner's
--    privacy toggles, and never return user_id.
-- 2. Functions that need a signed-in user are no longer callable by anon.
-- 3. Storage: size + image-type limits, no public file listing, feedback
--    screenshots private.
-- 4. Rate-limit counter for public forms.
-- 5. Data retention helper used by the daily cron.

-- ---------------------------------------------------------------------------
-- 1. Public profile data, one card at a time
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column show_email boolean not null default true,
  add column show_phone boolean not null default true;

-- A switched-off card must hide its profile everywhere, including the
-- testimonial insert policy that still uses this helper.
create or replace function private.has_claimed_tag(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tags
    where profile_id = p_profile_id and claimed = true and enabled = true
  );
$$;

drop policy if exists "Public profiles are viewable via a claimed tag" on public.profiles;
drop policy if exists "Portfolio items are viewable via a claimed tag" on public.portfolio_items;
drop policy if exists "Approved testimonials are viewable via a claimed tag" on public.profile_testimonials;

create or replace function public.get_public_profile(p_tag_id text)
returns table (
  id uuid,
  full_name text,
  job_title text,
  company text,
  email text,
  phone text,
  socials jsonb,
  avatar_url text,
  template text,
  tagline text,
  bio text,
  cta_label text,
  cta_url text,
  links jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.job_title, p.company,
         case when p.show_email then p.email end,
         case when p.show_phone then p.phone end,
         p.socials, p.avatar_url, p.template, p.tagline, p.bio,
         p.cta_label, p.cta_url, p.links, p.updated_at
  from public.tags t
  join public.profiles p on p.id = t.profile_id
  where t.tag_id = p_tag_id and t.claimed = true and t.enabled = true
  limit 1;
$$;

create or replace function public.get_public_portfolio(p_tag_id text)
returns setof public.portfolio_items
language sql
stable
security definer
set search_path = public
as $$
  select i.*
  from public.tags t
  join public.portfolio_items i on i.profile_id = t.profile_id
  where t.tag_id = p_tag_id and t.claimed = true and t.enabled = true
  order by i.sort_order asc, i.created_at desc;
$$;

create or replace function public.get_public_testimonials(p_tag_id text)
returns setof public.profile_testimonials
language sql
stable
security definer
set search_path = public
as $$
  select r.*
  from public.tags t
  join public.profile_testimonials r on r.profile_id = t.profile_id
  where t.tag_id = p_tag_id and t.claimed = true and t.enabled = true and r.approved = true
  order by r.created_at desc;
$$;

grant execute on function public.get_public_profile(text) to anon, authenticated;
grant execute on function public.get_public_portfolio(text) to anon, authenticated;
grant execute on function public.get_public_testimonials(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Functions that need a signed-in user: not callable anonymously
-- ---------------------------------------------------------------------------
revoke execute on function public.assign_tags_to_order(uuid, int) from anon, public;
revoke execute on function public.set_tag_enabled(text, boolean) from anon, public;
revoke execute on function public.store_login_pin() from anon, public;
revoke execute on function public.verify_login_pin(text, text) from anon, public;
revoke execute on function public.is_device_trusted(text) from anon, public;
revoke execute on function public.claim_tag(text, text) from anon, public;
revoke execute on function public.reset_tag_pin(text) from anon, public;
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;

grant execute on function public.assign_tags_to_order(uuid, int) to authenticated;
grant execute on function public.set_tag_enabled(text, boolean) to authenticated;
grant execute on function public.store_login_pin() to authenticated;
grant execute on function public.verify_login_pin(text, text) to authenticated;
grant execute on function public.is_device_trusted(text) to authenticated;
grant execute on function public.claim_tag(text, text) to authenticated;
grant execute on function public.reset_tag_pin(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Storage
-- ---------------------------------------------------------------------------
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif']
where id in ('avatars', 'portfolio');

update storage.buckets
set public = false,
    file_size_limit = 4194304,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
where id = 'feedback';

-- Public buckets serve files by URL without a SELECT policy; these policies
-- only added the ability to LIST every file.
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Portfolio images are publicly accessible" on storage.objects;
drop policy if exists "Feedback screenshots are publicly accessible" on storage.objects;

-- Avatar upload uses upsert, which needs to see the owner's own file.
create policy "Users can view their own avatar files"
  on storage.objects for select
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text);

create policy "Admins can view feedback screenshots"
  on storage.objects for select
  using (bucket_id = 'feedback' and public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Rate limiting for public forms. Keys are HMACs of (action, IP) made on
--    the server, so a caller can't target someone else's counter.
-- ---------------------------------------------------------------------------
create table if not exists private.rate_limits (
  key text not null,
  bucket_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, bucket_start)
);

create or replace function public.rate_limit_hit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bucket timestamptz;
  v_hits int;
begin
  if p_key is null or char_length(p_key) > 128 or p_max < 1 or p_window_seconds < 1 then
    return true;
  end if;
  v_bucket := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into private.rate_limits (key, bucket_start, hits)
  values (p_key, v_bucket, 1)
  on conflict (key, bucket_start) do update set hits = private.rate_limits.hits + 1
  returning hits into v_hits;

  return v_hits <= p_max;
end;
$$;

grant execute on function public.rate_limit_hit(text, int, int) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Retention. Called daily by the cron route (service role). Returns the
--    storage paths it detached so the cron can delete the files.
-- ---------------------------------------------------------------------------
create or replace function public.purge_old_data()
returns table (bucket text, path text)
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.login_verifications where expires_at < now() - interval '1 day';
  delete from public.tag_views where viewed_at < now() - interval '400 days';
  delete from private.rate_limits where bucket_start < now() - interval '1 day';

  -- Capture the old paths first (UPDATE ... RETURNING would give the new,
  -- null value), then detach them.
  return query
    with old as (
      select o.id, o.payment_proof_path as p
      from public.card_orders o
      where o.payment_proof_path is not null
        and o.payment_status = 'paid'
        and o.paid_at < now() - interval '90 days'
    ),
    detached as (
      update public.card_orders c set payment_proof_path = null
      from old where c.id = old.id
    )
    select 'payment-proofs'::text, old.p from old;

  -- Feedback rows may hold a legacy public URL or a bare path; the cron
  -- normalises either to a path.
  return query
    with old as (
      select f.id, f.screenshot_url as p
      from public.feedback f
      where f.screenshot_url is not null
        and f.status = 'resolved'
        and f.created_at < now() - interval '180 days'
    ),
    detached as (
      update public.feedback f set screenshot_url = null
      from old where f.id = old.id
    )
    select 'feedback'::text, old.p from old;
end;
$$;

revoke execute on function public.purge_old_data() from anon, authenticated, public;
