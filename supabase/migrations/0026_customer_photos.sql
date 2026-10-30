-- Optional photos with customers at handover, taken with their consent.
--
-- * One row per photo. The consent is stored on the same row, with the
--   version of the wording the customer saw, three independent scopes
--   (the private handover record is required; social media and website
--   are each optional) and who recorded it.
-- * The freebie for agreeing is tracked here too: pending until it is
--   handed over. One freebie per order, so a second photo can't earn
--   another. Withdrawing consent never takes a given freebie back.
-- * Photos live in the PRIVATE customer-photos bucket, read by admins
--   through short-lived signed URLs (same model as payment-proofs, 0020).
--   Nothing here is public: a later step makes a separate, cropped public
--   copy only for photos whose owner agreed to website use.
-- * Withdrawing deletes the file and clears photo_path; the row stays as
--   the consent and freebie record. 'card_selfie' / 'pending_review' are
--   for customers sending their own photo (a later step) and are not used
--   yet.

create table public.customer_photos (
  id uuid primary key default gen_random_uuid(),
  source text not null
    check (source in ('keychain_handover', 'card_handover', 'card_selfie')),
  keychain_order_id uuid references public.keychain_orders (id) on delete cascade,
  card_order_id uuid references public.card_orders (id) on delete cascade,
  -- <order id>/<uuid>.jpg inside the customer-photos bucket.
  photo_path text check (
    photo_path is null or photo_path ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.jpg$'
  ),
  purged_at timestamptz,
  consent_text_version smallint not null,
  consent_social boolean not null default false,
  consent_website boolean not null default false,
  consent_recorded_by text not null check (consent_recorded_by in ('staff', 'customer')),
  consented_at timestamptz not null default now(),
  taken_by uuid references auth.users (id) on delete set null default auth.uid(),
  status text not null default 'active'
    check (status in ('pending_review', 'active', 'withdrawn')),
  withdrawn_at timestamptz,
  freebie_status text not null default 'none'
    check (freebie_status in ('none', 'pending', 'given', 'declined')),
  freebie_note text check (freebie_note is null or char_length(freebie_note) <= 200),
  freebie_given_at timestamptz,
  freebie_given_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (num_nonnulls(keychain_order_id, card_order_id) = 1)
);

create index customer_photos_keychain_order_id_idx on public.customer_photos (keychain_order_id);
create index customer_photos_card_order_id_idx on public.customer_photos (card_order_id);
create index customer_photos_taken_by_idx on public.customer_photos (taken_by);
create index customer_photos_freebie_given_by_idx on public.customer_photos (freebie_given_by);

-- One pending-or-given freebie per order.
create unique index customer_photos_one_freebie_keychain_idx
  on public.customer_photos (keychain_order_id)
  where freebie_status in ('pending', 'given');
create unique index customer_photos_one_freebie_card_idx
  on public.customer_photos (card_order_id)
  where freebie_status in ('pending', 'given');

alter table public.customer_photos enable row level security;

create policy "Admins manage customer photos"
  on public.customer_photos for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Private bucket: JPEG only (the app downsizes every photo to ~250 KB before
-- upload), admin-only for upload, read and delete.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('customer-photos', 'customer-photos', false, 1572864, array['image/jpeg'])
on conflict (id) do nothing;

create policy "Admins can upload customer photos"
  on storage.objects for insert
  with check (bucket_id = 'customer-photos' and public.is_admin());
create policy "Admins can view customer photos"
  on storage.objects for select
  using (bucket_id = 'customer-photos' and public.is_admin());
create policy "Admins can delete customer photos"
  on storage.objects for delete
  using (bucket_id = 'customer-photos' and public.is_admin());
