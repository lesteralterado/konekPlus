-- Customer photos on the website's testimonials — only for customers who
-- agreed to website use (customer_photos.consent_website, 0026).
--
-- * The private original never goes public. When an admin turns it into a
--   testimonial, a SQUARE CROP is uploaded to the separate, public
--   testimonial-photos bucket and a DRAFT landing testimonial is created
--   with the customer's own words. An admin still publishes it.
-- * customer_photos.website_photo_path remembers that public copy so
--   withdrawing consent can delete it; landing_testimonials.customer_photo_id
--   links the testimonial back, so withdrawing can also unpublish it.
-- * Public pages must not select customer_photo_id (it names a private
--   record): the homepage lists explicit columns.

alter table public.customer_photos
  add column website_photo_path text
    check (website_photo_path is null or website_photo_path ~ '^[a-f0-9-]{36}\.jpg$');

alter table public.landing_testimonials
  add column photo_url text check (photo_url is null or char_length(photo_url) <= 500),
  add column customer_photo_id uuid references public.customer_photos (id) on delete set null;

create index landing_testimonials_customer_photo_id_idx
  on public.landing_testimonials (customer_photo_id);

-- ---------------------------------------------------------------------------
-- Public bucket for the cropped copies: ~512px JPEG (the crop is ~60-100 KB).
-- Public files are served by URL without a SELECT policy, but admins need to
-- see them to replace or delete them, and nobody can list the bucket.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('testimonial-photos', 'testimonial-photos', true, 524288, array['image/jpeg'])
on conflict (id) do nothing;

create policy "Admins can upload testimonial photos"
  on storage.objects for insert
  with check (bucket_id = 'testimonial-photos' and public.is_admin());
create policy "Admins can view testimonial photos"
  on storage.objects for select
  using (bucket_id = 'testimonial-photos' and public.is_admin());
create policy "Admins can delete testimonial photos"
  on storage.objects for delete
  using (bucket_id = 'testimonial-photos' and public.is_admin());
