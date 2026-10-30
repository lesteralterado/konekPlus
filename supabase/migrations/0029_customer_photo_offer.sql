-- Card owners sending their own photo from the dashboard (for orders that
-- arrived by courier, where nobody is there to take one).
--
-- * The customer's file goes to the private customer-photos bucket under their
--   OWN folder (<user id>/<uuid>.jpg); policies below let them add, see and
--   delete only that folder, and cap it at 5 files so the bucket can't be
--   filled by calling the storage API directly.
-- * submit_customer_photo() records it as a 'card_selfie' awaiting review. The
--   freebie is NOT set here: an admin approves the photo first (and the app's
--   own switch decides whether a freebie is tracked), so a direct call to this
--   function can only ever add something to the review queue.
-- * Everything else about a photo stays admin-only: customers have no policy on
--   customer_photos itself, only these three functions.
-- * Withdrawing is two calls so a failure can't leave a file that looks gone:
--   withdraw_customer_photo(id, false) marks it withdrawn and takes the
--   testimonial off the website (and returns the file paths to delete);
--   withdraw_customer_photo(id, true) then clears the paths once the files are
--   deleted. A withdrawn row that still has a path is finished from /admin/photos.

-- Does the caller own the public website copy named p_name ("<photo id>.jpg")?
-- A function, because a policy can't read customer_photos directly (customers
-- have no policy on it).
create or replace function public.owns_website_photo(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.customer_photos p
    where p.source = 'card_selfie'
      and p.taken_by = auth.uid()
      and p.id::text || '.jpg' = p_name
  );
$$;

revoke execute on function public.owns_website_photo(text) from anon, public;
grant execute on function public.owns_website_photo(text) to authenticated;

create policy "Owners can view their own customer photos"
  on storage.objects for select
  using (bucket_id = 'customer-photos' and (storage.foldername(name))[1] = (auth.uid())::text);

create policy "Owners can upload their own customer photo"
  on storage.objects for insert
  with check (
    bucket_id = 'customer-photos'
    and (storage.foldername(name))[1] = (auth.uid())::text
    and (
      select count(*) from storage.objects o
      where o.bucket_id = 'customer-photos'
        and (storage.foldername(o.name))[1] = (auth.uid())::text
    ) < 5
  );

create policy "Owners can delete their own customer photos"
  on storage.objects for delete
  using (bucket_id = 'customer-photos' and (storage.foldername(name))[1] = (auth.uid())::text);

-- Withdrawing a photo that an admin put on the website: the owner can remove
-- their own public copy.
create policy "Owners can view their own website photo"
  on storage.objects for select
  using (bucket_id = 'testimonial-photos' and public.owns_website_photo(name));

create policy "Owners can delete their own website photo"
  on storage.objects for delete
  using (bucket_id = 'testimonial-photos' and public.owns_website_photo(name));

-- ---------------------------------------------------------------------------
-- my_photo_offer: what the dashboard shows. The caller's current photo (not
-- withdrawn) if there is one, else whether they can send one: a claimed card
-- from an order that has no photo yet (a staff-taken one counts).
-- ---------------------------------------------------------------------------
create or replace function public.my_photo_offer()
returns table (eligible boolean, photo_id uuid, status text, freebie_status text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile uuid;
  v_photo record;
begin
  if auth.uid() is null then
    return;
  end if;

  select pr.id into v_profile from public.profiles pr where pr.user_id = auth.uid();
  if v_profile is null then
    return;
  end if;

  select p.id, p.status, p.freebie_status into v_photo
  from public.customer_photos p
  where p.source = 'card_selfie'
    and p.taken_by = auth.uid()
    and p.status <> 'withdrawn'
  order by p.created_at desc
  limit 1;

  if found then
    return query select false, v_photo.id, v_photo.status, v_photo.freebie_status;
    return;
  end if;

  return query
    select exists (
      select 1 from public.tags t
      where t.profile_id = v_profile
        and t.claimed
        and t.order_id is not null
        and not exists (
          select 1 from public.customer_photos p where p.card_order_id = t.order_id
        )
    ), null::uuid, null::text, null::text;
end;
$$;

revoke execute on function public.my_photo_offer() from anon, public;
grant execute on function public.my_photo_offer() to authenticated;

-- ---------------------------------------------------------------------------
-- submit_customer_photo: record an uploaded file as the caller's photo, for
-- their earliest claimed card's order that has none. Returns the new id, or
-- null when anything doesn't check out (wrong folder, no such file, no
-- eligible order).
-- ---------------------------------------------------------------------------
create or replace function public.submit_customer_photo(
  p_path text,
  p_consent_social boolean,
  p_consent_website boolean,
  p_text_version int
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid;
  v_order uuid;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if p_path is null
     or split_part(p_path, '/', 1) <> auth.uid()::text
     or p_path !~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.jpg$' then
    return null;
  end if;

  select pr.id into v_profile from public.profiles pr where pr.user_id = auth.uid();
  if v_profile is null then
    return null;
  end if;

  if not exists (
    select 1 from storage.objects o where o.bucket_id = 'customer-photos' and o.name = p_path
  ) then
    return null;
  end if;

  select t.order_id into v_order
  from public.tags t
  where t.profile_id = v_profile
    and t.claimed
    and t.order_id is not null
    and not exists (
      select 1 from public.customer_photos p where p.card_order_id = t.order_id
    )
  order by t.claimed_at
  limit 1;
  if v_order is null then
    return null;
  end if;

  insert into public.customer_photos (
    source, card_order_id, photo_path, consent_text_version, consent_social,
    consent_website, consent_recorded_by, taken_by, status, freebie_status
  ) values (
    'card_selfie', v_order, p_path, coalesce(p_text_version, 1)::smallint,
    coalesce(p_consent_social, false), coalesce(p_consent_website, false),
    'customer', auth.uid(), 'pending_review', 'none'
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.submit_customer_photo(text, boolean, boolean, int) from anon, public;
grant execute on function public.submit_customer_photo(text, boolean, boolean, int) to authenticated;

-- ---------------------------------------------------------------------------
-- withdraw_customer_photo: the owner takes their own photo back.
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

  -- Off the website at once.
  update public.landing_testimonials lt
    set published = false, photo_url = null
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
