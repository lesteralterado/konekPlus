# Konek+

[![Konek+ preview](https://res.cloudinary.com/dhxi75eld/image/upload/v1789060850/KonekPlus_rm1wht.png)](https://konek-plus.vercel.app)

NFC digital business card app. Tap an unclaimed card to set up a profile;
every tap after that shows the public profile. One profile can own many
cards — edit once, every card stays current. See the architecture brief in
this repo's history / your notes for the full product spec.

## Stack

Next.js (App Router) · Tailwind CSS · Supabase (Postgres, Auth, Storage) ·
Vercel.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the schema migration.** Open the SQL Editor in your project and run
   the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   (or use the Supabase CLI: `supabase link` then `supabase db push`). This
   creates `profiles`, `tags`, the `tags_public` view, the `get_tag_profile`
   / `claim_tag` RPCs, RLS policies, and the `avatars` storage bucket.
3. **Disable email confirmation** (Authentication -> Sign In / Providers ->
   Email -> turn off "Confirm email"). Without this, a new signup during the
   claim flow won't get an active session immediately, so the tag can't be
   claimed in one step. Turn it back on later if you want verified emails —
   you'll need to adjust the claim flow in `src/app/t/[tag_id]/actions.ts`
   to handle the pending-confirmation state.
4. **Copy env vars**: `cp .env.local.example .env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from
   Project Settings -> API Keys (publishable key). `SUPABASE_SECRET_KEY` is
   only needed for the provisioning script below.
5. **Run it**: `npm run dev`, then visit `/t/<any-code>` — since no tags
   are provisioned yet, this correctly shows the "not recognized" page. Seed
   one manually to try the claim flow:
   ```sql
   insert into public.tags (tag_id) values ('test123');
   ```
   then visit `/t/test123`.

## Provisioning a batch of physical cards (Stage 6)

```bash
npm run generate-tags -- --count=50
```

Generates 50 unique short codes, inserts them as unclaimed rows via the
service-role client, and writes `tag-batch-<timestamp>.csv` with
`tag_id,url` columns — feed the `url` column into whatever tool writes the
NDEF URI record onto each physical NTAG213/215/216 card. Needs
`SUPABASE_SECRET_KEY` and `SITE_URL` set in `.env.local` (use your
production domain, not localhost, once you're provisioning real cards).

## Project structure

- `src/proxy.ts` — refreshes the Supabase session cookie on every request
  and gates `/dashboard` behind login. (Renamed from `middleware.ts` in
  Next.js 16 — see `node_modules/next/dist/docs/.../proxy.md`.)
- `src/lib/supabase/` — `client.ts` (browser), `server.ts` (Server
  Components/Actions, cookie-based), `admin.ts` (service-role, scripts only).
- `src/app/t/[tag_id]/` — the core route: claim flow (unclaimed) or public
  profile (claimed), plus the `.vcf` download route.
- `src/app/dashboard/` — protected owner dashboard: edit profile, upload
  avatar, list linked cards, add a card by code.
- `supabase/migrations/0001_init.sql` — schema, RLS, and the two
  `SECURITY DEFINER` RPCs every write to `tags` goes through.
- `scripts/generate-tags.ts` — Stage 6 batch provisioning.

## Deploy

Push to a Git repo and import into Vercel; set the same env vars there
(`SUPABASE_SECRET_KEY` only if you'll run the provisioning script from CI —
otherwise keep it out of Vercel and run that script locally/from a trusted
machine).
