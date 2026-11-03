-- Reviews from card owners: after activating a card from an order, the
-- dashboard asks (once, as a pop-up, then as a card) how it's going. The review
-- — stars, a message and the name to show — goes to an admin inbox; it only
-- appears on the website when an admin publishes it, and only because the
-- customer ticked that they agree (the review form can't be sent without it).
--
-- * One review per customer. Rejecting or withdrawing DELETES the row (their
--   words aren't kept once they're not going to be shown), so they can write
--   another.
-- * An optional photo is a normal customer_photos row (0029) with its own
--   consent choices; the review just points at it (photo_id).
-- * Customers have no policy on the table itself, only the three functions.
-- * profiles.review_prompt_seen_at: so the pop-up opens once, not every visit.
--   (Owners can edit their own profile row, so they can set it themselves —
--   harmless: it only decides whether their own pop-up opens.)

alter table public.profiles add column review_prompt_seen_at timestamptz;

create table public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_order_id uuid references public.card_orders (id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  message text not null check (char_length(message) between 1 and 400),
  display_name text not null check (char_length(display_name) between 1 and 80),
  consent_text_version smallint not null,
  photo_id uuid references public.customer_photos (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'approved')),
  testimonial_id uuid references public.landing_testimonials (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index customer_reviews_one_per_user_idx on public.customer_reviews (user_id);
create index customer_reviews_card_order_id_idx on public.customer_reviews (card_order_id);
create index customer_reviews_photo_id_idx on public.customer_reviews (photo_id);
create index customer_reviews_testimonial_id_idx on public.customer_reviews (testimonial_id);
create index customer_reviews_status_idx on public.customer_reviews (status);

alter table public.customer_reviews enable row level security;

create policy "Admins manage customer reviews"
  on public.customer_reviews for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- my_review_prompt: what the dashboard shows. The caller's review, if they've
-- sent one; otherwise whether they can: they've activated a card from an order.
-- ---------------------------------------------------------------------------
create or replace function public.my_review_prompt()
returns table (eligible boolean, review_id uuid, status text, published boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v record;
begin
  if auth.uid() is null then
    return;
  end if;

  select r.id, r.status, lt.published into v
  from public.customer_reviews r
  left join public.landing_testimonials lt on lt.id = r.testimonial_id
  where r.user_id = auth.uid()
  limit 1;

  if found then
    return query select false, v.id, v.status, coalesce(v.published, false);
    return;
  end if;

  return query
    select exists (
      select 1
      from public.tags t
      join public.profiles pr on pr.id = t.profile_id
      where pr.user_id = auth.uid() and t.claimed and t.order_id is not null
    ), null::uuid, null::text, null::boolean;
end;
$$;

revoke execute on function public.my_review_prompt() from anon, public;
grant execute on function public.my_review_prompt() to authenticated;

-- ---------------------------------------------------------------------------
-- submit_customer_review: returns the new id, or null when anything doesn't
-- check out (bad values, no activated card from an order, already reviewed, or
-- a photo that isn't theirs).
-- ---------------------------------------------------------------------------
create or replace function public.submit_customer_review(
  p_rating int,
  p_message text,
  p_display_name text,
  p_text_version int,
  p_photo_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order uuid;
  v_id uuid;
  v_message text := btrim(coalesce(p_message, ''));
  v_name text := btrim(coalesce(p_display_name, ''));
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if p_rating is null or p_rating not between 1 and 5
     or char_length(v_message) not between 1 and 400
     or char_length(v_name) not between 1 and 80 then
    return null;
  end if;

  select t.order_id into v_order
  from public.tags t
  join public.profiles pr on pr.id = t.profile_id
  where pr.user_id = auth.uid() and t.claimed and t.order_id is not null
  order by t.claimed_at
  limit 1;
  if v_order is null then
    return null;
  end if;

  if exists (select 1 from public.customer_reviews r where r.user_id = auth.uid()) then
    return null;
  end if;

  if p_photo_id is not null and not exists (
    select 1 from public.customer_photos p
    where p.id = p_photo_id
      and p.source = 'card_selfie'
      and p.taken_by = auth.uid()
      and p.status <> 'withdrawn'
  ) then
    return null;
  end if;

  insert into public.customer_reviews (
    user_id, card_order_id, rating, message, display_name, consent_text_version, photo_id
  ) values (
    auth.uid(), v_order, p_rating::smallint, v_message, v_name,
    coalesce(p_text_version, 1)::smallint, p_photo_id
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.submit_customer_review(int, text, text, int, uuid) from anon, public;
grant execute on function public.submit_customer_review(int, text, text, int, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- withdraw_customer_review: the owner takes their review back. Their words
-- come off the website (the testimonial is deleted) and the row is deleted.
-- Returns the attached photo's id so the app can withdraw that too.
-- ---------------------------------------------------------------------------
create or replace function public.withdraw_customer_review(p_id uuid)
returns table (photo_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.customer_reviews%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v
  from public.customer_reviews r
  where r.id = p_id and r.user_id = auth.uid()
  for update;
  if not found then
    return;
  end if;

  if v.testimonial_id is not null then
    delete from public.landing_testimonials lt where lt.id = v.testimonial_id;
  end if;
  delete from public.customer_reviews r where r.id = p_id;

  return query select v.photo_id;
end;
$$;

revoke execute on function public.withdraw_customer_review(uuid) from anon, public;
grant execute on function public.withdraw_customer_review(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- withdraw_customer_photo (from 0029), now aware of reviews: a testimonial
-- that is ALSO someone's written review keeps its words and stays as it was —
-- only the photo comes off it. A testimonial that exists only for a photo is
-- still unpublished.
-- ---------------------------------------------------------------------------
create or replace function public.withdraw_customer_photo(p_id uuid, p_clear boolean default false)
returns table (photo_path text, website_photo_path text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.customer_photos%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v
  from public.customer_photos p
  where p.id = p_id and p.source = 'card_selfie' and p.taken_by = auth.uid()
  for update;
  if not found then
    return;
  end if;

  update public.landing_testimonials lt
    set photo_url = null,
        published = case
          when exists (select 1 from public.customer_reviews r where r.testimonial_id = lt.id)
            then lt.published
          else false
        end,
        customer_photo_id = case
          when exists (select 1 from public.customer_reviews r where r.testimonial_id = lt.id)
            then null
          else lt.customer_photo_id
        end
    where lt.customer_photo_id = p_id;

  update public.customer_photos p
    set status = 'withdrawn',
        withdrawn_at = coalesce(p.withdrawn_at, now()),
        photo_path = case when p_clear then null else p.photo_path end,
        website_photo_path = case when p_clear then null else p.website_photo_path end
    where p.id = p_id;

  return query select v.photo_path, v.website_photo_path;
end;
$$;

revoke execute on function public.withdraw_customer_photo(uuid, boolean) from anon, public;
grant execute on function public.withdraw_customer_photo(uuid, boolean) to authenticated;
