# Konek+ security guide

For whoever runs Konek+: what's public, what's protected, where the secrets live, and what to do
if something goes wrong. Last full review: October 2026 (migration `0022_security_hardening`).

## What is public, and what isn't

| Data | Who can see it | How |
|---|---|---|
| A card's profile (name, title, photo, links, bio) | Anyone **holding that card's link** | `get_public_profile(tag_id)` only, one card at a time, and only while the card is switched **on** |
| A profile's email / phone | Same, **unless the owner switched it off** in the dashboard ("On card" toggles) | `show_email` / `show_phone` |
| Internal account IDs (`user_id`) | Nobody outside the database | never returned by public functions |
| Orders, payments, addresses, keychain orders, feedback, leads | **Admins only** | Row-level security, `is_admin()` |
| GCash payment screenshots, feedback screenshots | **Admins only** | Private buckets, 10-minute signed links |
| Avatars, portfolio images | Anyone with the exact image URL | Public buckets; **listing all files is not allowed** |
| Card PINs, login codes | Nobody: only hashes are stored | bcrypt / sha256 |

Profiles can **not** be listed or downloaded in bulk. Before `0022`, anyone could fetch every
customer's profile with one request to `/rest/v1/profiles`. That's fixed.

## Built-in protections

- **Rate limits per visitor** (`src/lib/rate-limit.ts`): orders 5/h, keychain orders 5/h, feedback
  10/h, testimonials 5/h, order tracking 15 per 10 min, payment proof 5/h, login 10 per 10 min,
  sign-up 10/h, password reset 5/h, PIN checks 20 per 10 min, card views counted max 30/h. Visitors
  over the limit see "Too many tries — please wait a few minutes." IPs are never stored, only a
  keyed hash.
- **Card PINs:** 5 wrong tries pause a card for 15 minutes.
- **Uploads:** images only, 4–5 MB maximum, per bucket.
- **Security headers** on every page: no framing (clickjacking), no MIME sniffing, strict referrer,
  HTTPS-only (HSTS), and a Content-Security-Policy in *report-only* mode.
- **Errors:** visitors see plain messages; database details go to the server log only.
- **Data retention** (daily cron, `purge_old_data`):
  - payment screenshots deleted 90 days after the order is paid
  - resolved-feedback screenshots after 180 days
  - expired login codes after 1 day
  - card-view logs after 400 days

## Where the secrets live

All are **Vercel → Settings → Environment Variables** (and `.env.local` on your own computer,
which is never committed).

| Secret | What it unlocks | Rotate where |
|---|---|---|
| `SUPABASE_SECRET_KEY` | **Everything** in the database (bypasses all rules) | Supabase → Project Settings → API Keys → roll the secret key |
| `RESEND_API_KEY` | Sending email as Konek+ | resend.com → API Keys |
| `CRON_SECRET` | Triggering the daily job | Make a new random value in Vercel |
| `RATE_LIMIT_SECRET` | Rate-limit counter keys | New random value (counters just reset) |
| `GOOGLE_CLIENT_SECRET` | YouTube connect | Google Cloud Console → Credentials |

The **publishable** Supabase key (`NEXT_PUBLIC_…`) is meant to be public. Protection comes from the
database rules, not from hiding it.

To make a random secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

After rotating any secret, **redeploy** on Vercel so the new value is used.

## If you suspect a leak

1. **Rotate** the secret that may be exposed (table above), then redeploy.
2. **Look**: Supabase → Logs (API and Postgres) for unusual reads, and Vercel → Logs for spikes.
3. **Contain**: switch off affected cards from the admin, and revoke sessions in Supabase → Auth if
   accounts may be compromised.
4. **Tell people**: under the Philippine Data Privacy Act (RA 10173), a breach of personal data
   that may harm people must be reported to the **National Privacy Commission** and the affected
   people within **72 hours** of discovering it. Keep notes of what happened and when.
5. **Fix and re-check** (monthly checklist below).

## Monthly checklist (about 10 minutes)

- [ ] Supabase → Advisors → **Security**: anything new? (Expected: only intended public functions
      remain.)
- [ ] `npm audit --omit=dev`: no high or critical.
- [ ] Supabase → Auth: **leaked password protection** on, minimum password length 8 or more.
- [ ] Browser console on the live site: any CSP reports? Once clean for a few weeks, change
      `Content-Security-Policy-Report-Only` to `Content-Security-Policy` in `next.config.ts`.
- [ ] Remove admins who no longer need access (`private.admin_users`).

## For developers

- **New tables:** RLS is on by default. Add policies deliberately, and **never** add a `select`
  policy that lets `anon` read personal data in bulk. Expose one-record lookups through a
  `SECURITY DEFINER` function that takes an unguessable key, and grant only what's needed.
- **New `SECURITY DEFINER` functions** that need a signed-in user:
  `revoke execute … from anon, public; grant execute … to authenticated;`
- **New public forms:** call `rateLimit("…")` from `src/lib/rate-limit.ts`, and return friendly
  errors, never `error.message` from the database.
- **New uploads:** a private bucket unless the file is meant to be public, with
  `file_size_limit` and `allowed_mime_types` set.
- `createAdminClient()` (service role) is for the cron route and scripts only, never pages or
  actions.
