# Konek+ card lifecycle (developer view)

How a card goes from an order to a live profile, and which code does each step.

## 1. The short answer

A card ships **blank**. The NFC chip holds only a URL, `https://<site>/t/<code>` (7 characters, base-54, no `0 O 1 I l`). It carries no customer data.

The customer must **activate** it on the first tap, using a 6-digit **PIN printed on the sleeve** (never on the chip, never in email). Activation creates or links their account and binds the tag to their profile. After that, the same URL shows their profile to anyone who taps.

## 2. Actors and data

| Thing | Where | Notes |
|---|---|---|
| Order | `card_orders` | `status`: new, contacted, confirmed, preparing, shipped, delivered, fulfilled (legacy), cancelled. `payment_method`: cod, gcash, cash (meet-up). Also `courier`, `tracking_number`, `shipped_at`, `delivered_at`, `user_id` (set at activation), `activation_reminder_sent_at`. |
| Order payment | `card_orders` (0020/0021) | `amount_due_php` + `discount_pct` are **locked when the order is confirmed**; before that, `quote()` in `src/lib/finishes.ts` gives an estimate. `payment_status`: unpaid, proof_submitted, with_courier, paid, refunded. `amount_received_php`, `paid_at`, `paid_via` (cash/gcash/bank/courier), `gcash_reference`, `payment_proof_path` (private bucket `payment-proofs`), `payment_note`. |
| Card (tag) | `tags` | PK `tag_id` is the URL code. `order_id`, `activation_pin_hash` (bcrypt), `pin_attempts`, `pin_locked_until`, `claimed`, `profile_id`, `enabled`, `written_at`, `shipped_at`, `activated_at`, `tag_uid`. |
| Profile | `profiles` | One per user (`user_id` unique). Many tags can point at one profile. `show_email` / `show_phone` (0022) are the owner's "On card" switches. Never readable in bulk: public reads go through `get_public_profile(tag_id)`. |
| Views | `tag_views` | One row per real (non-owner) tap, rate-limited per card + visitor. |

Writes to `tags` go through SECURITY DEFINER RPCs (`claim_tag`, `assign_tags_to_order`, `verify_tag_pin`, `set_tag_enabled`, `reset_tag_pin`) or admin-only RLS.

Migrations:

| Migration | Adds |
|---|---|
| `0017` | order cards, PIN, `lookup_order` |
| `0018` | `verify_tag_pin` |
| `0019` | reminder column |
| `0020` | payments, `submit_payment_proof` |
| `0021` | Cash, `paid_via`, `reset_tag_pin`, `tag_pin_state` |
| `0022` | security: `get_public_*`, privacy switches, storage limits, `rate_limit_hit`, `purge_old_data` |

## 3. End-to-end flow

```
CUSTOMER                         SYSTEM / ADMIN
--------                         --------------
1 Orders on landing page  ---->  placeOrder (_landing/order-actions.ts)
  (COD, GCash or Cash)           insert card_orders (status=new, unpaid)
                                 after(): confirmation email -> customer
                                 after(): alert email -> ORDER_ALERT_EMAIL
                                 reference = KP-<first 6 of uuid>

                                 ADMIN /admin/orders
2                                confirm with the customer -> confirmed
                                   (locks amount_due_php) -> preparing
                                 "Assign N cards + PINs"
                                   -> RPC assign_tags_to_order
                                   picks N unassigned+unclaimed tags,
                                   sets order_id, stores bcrypt(PIN),
                                   returns code+PIN ONCE -> print slip
                                 (tags must already exist: /admin/tags
                                  provision)
                                 write each chip with the NFC Tools app:
                                   Copy link (or Copy all), write, test
                                   tap, then "Written ✓" (tags.written_at)
                                 lost slip? 🔑 New PIN -> RPC reset_tag_pin
                                 put the PIN slip in the sleeve, pack

3                                COD/GCash: "Ship" (courier + tracking)
                                   markShipped: status=shipped, shipped_at,
                                   tags.shipped_at, after(): shipped email
                                 Cash: Preparing -> "Hand over" (delivered)
  /track (reference + phone) <-- lookup_order RPC: status timeline +
                                 amount due. GCash: send reference +
                                 screenshot (submit_payment_proof)

  PAYMENT (drawer on each admin order):
    proof_submitted -> Verify -> Confirm paid / send back with a reason
    unpaid          -> Mark paid (+ received via: Cash/GCash/Bank/Courier)
    delivered COD   -> with_courier -> "Remittance received"
    paid            -> Undo / Refunded

4 CARD ARRIVES. Customer taps phone on card (or scans QR / types URL)
  -> GET /t/<code>                       src/app/t/[tag_id]/page.tsx
     tag_status(code) (never cached):
       null       -> InvalidCard
       disabled   -> CardUnavailable
       active     -> public profile (step 6)
       unclaimed  -> activation (step 5)

5 ACTIVATION (unclaimed tag)
  a. tag_needs_pin(code) true -> PinStep (claim-form.tsx + pin-input.tsx:
     six boxes, paste/autofill, submits itself)
  b. verifyTagPin -> RPC verify_tag_pin (rate-limited per visitor)
       zero rows -> tag_pin_state(code) explains why:
         "N tries left" / "paused for M min" / "already activated"
       5 wrong tries -> locked 15 min (pin_attempts, pin_locked_until)
       right -> returns the order's name/email/phone for prefill
  c. signup form (prefilled) OR "I have an account" login
       signUpAndClaim:       auth.signUp -> insert profiles -> rpc claim_tag
       linkExistingAndClaim: signIn -> rpc claim_tag
     claim_tag(code, pin): re-checks the PIN under a row lock, sets
       claimed, profile_id, claimed_at, activated_at, resets attempts,
       sets card_orders.user_id. Atomic: one winner on a race.
  d. new account: after() sends welcomeEmail
  e. refreshCard(code) clears the public-card cache, then
     redirectAfterClaim -> /t/<code>?activated=1
       (device-verification detour if DEVICE_VERIFICATION=on)
  f. owner sees the "You're live" banner; dashboard shows a setup checklist

6 EVERY LATER TAP (anyone)
  /t/<code> -> getPublicCard (src/lib/public-card.ts):
    get_public_profile + get_public_portfolio + get_public_testimonials
    via the cookie-free client, cached 60s (tags card:<code> and
    profile:<id>; cleared on claim, on/off, reset, testimonial approval
    and profile edits). Only while the card is switched on; email/phone
    are blank if the owner hid them. vCard at /t/<code>/vcard (same RPC).
  record_tag_view via after(), unless the viewer is the owner.

7 DAILY CRON  /api/cron/activation-reminders   (vercel.json, 01:00 UTC)
  Bearer CRON_SECRET, service-role client.
  a. Orders shipped 3-30 days ago with unclaimed cards and no reminder
     yet get an email; stamped only after a successful send.
  b. purge_old_data(): expired login codes, old views and rate-limit
     rows; payment screenshots 90 days after paid and resolved-feedback
     screenshots after 180 days (files deleted from storage).

8 ONGOING OWNERSHIP  /dashboard
  Opens on a read-only preview (profile-summary.tsx) + "View my card".
  Edit (profile-form.tsx): photo sheet (phone camera / desktop webcam /
  file / remove), "On card" switches for phone + email, sticky
  Save/Cancel with a discard drawer. Template / portfolio / testimonials.
  Add another card with code + PIN (addTagByCode -> claim_tag). Switch a
  lost card off (set_tag_enabled). Admin can resetTag (unclaim).
```

## 4. Edge cases and what the code does

- **Wrong or guessed PIN:** `claim_tag` and `verify_tag_pin` return false / zero rows (not an error), so the attempt counter commits. The form then asks `tag_pin_state` for the reason. It reveals no more than `tag_status` already does publicly.
- **Tag with no PIN** (legacy or hand-made): no PIN step, and it claims as before. `tag_needs_pin` returns false.
- **Stranger sees an unclaimed URL:** gets only the PIN screen. The order's contact details come back only after a correct PIN.
- **Two people claim at once:** `claim_tag` selects the tag `FOR UPDATE`, so the second caller gets false.
- **Email confirmation ON in Supabase:** `signUpAndClaim` gets no session, so it asks the customer to confirm their email, then tap the card again and re-enter the PIN. A known rough edge, not resolved.
- **Lost sleeve / PIN:** the admin taps 🔑 **New PIN** on the card inside the order (`reset_tag_pin`, unclaimed cards only). The old PIN stops working, attempts and the lock reset, and the new PIN is shown once.
- **Lost or stolen card after activation:** the owner switches it off in the dashboard, and the admin can `resetTag` to unclaim it. `resetTag` only clears `claimed`, `profile_id` and `claimed_at`, so the tag keeps its order link and its PIN; use New PIN before re-issuing it.
- **Card switched off:** `get_public_profile` returns nothing, so the profile is hidden everywhere, including the vCard and the testimonial form.
- **Email not configured:** `sendEmail` never throws. In dev it logs to the console; in production it returns `not_configured`. Customer emails need a verified Resend domain.
- **Order with no email** (placed before email became required): no shipped or reminder email, and the admin button reads "Mark shipped".

## 5. Developer map

- **Order intake:** `src/app/_landing/order-form.tsx`, `order-actions.ts`
- **Admin fulfilment:**
  - `src/app/admin/orders/`: `page`, `actions`, `assign-cards`, `card-chips`, `new-pin`, `next-step`, `ship-order`, `status-select`
  - `src/app/admin/tags/*`
  - `src/lib/provision-tags.ts`, `src/lib/short-code.ts`, `src/lib/card-link.ts`
- **Payments:** `src/app/admin/orders/payment-actions.ts`, `payment-step.tsx`, `src/lib/order-amount.ts`, `src/app/track/payment-panel.tsx`
- **Activation:** `src/app/t/[tag_id]/`: `page`, `claim-form`, `pin-input`, `actions`
- **Public card:** `src/lib/public-card.ts`, `src/lib/card-cache.ts`
- **Dashboard:** `src/app/dashboard/`: `page`, `profile-summary`, `profile-form`, `photo-sheet`, `camera-capture`, `actions`
- **Tracking:** `src/app/track/*`, `src/lib/couriers.ts`
- **Email:** `src/lib/email/send.ts`, `templates.ts`
- **Cron:** `src/app/api/cron/activation-reminders/route.ts`, `vercel.json`
- **Security:** `src/lib/rate-limit.ts`, `docs/SECURITY.md`
- **Metrics:** `src/app/admin/activation-funnel.tsx`
- **Guide copy:** `src/app/guide/guide-section.tsx`, `src/lib/i18n/dictionaries/*`
- **Env:**
  - email: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ORDER_ALERT_EMAIL`
  - app: `SITE_URL`, `DEVICE_VERIFICATION`
  - secrets: `CRON_SECRET`, `SUPABASE_SECRET_KEY`, `RATE_LIMIT_SECRET`
  - GCash: `GCASH_ACCOUNT_NAME`, `GCASH_ACCOUNT_NUMBER`

## 6. Known gaps

- The email-confirmation dead end (see section 4).
- No vanity slug, so replacing a card changes the URL.
- `/track` and the new emails are English only.
- No in-app NFC writing: chips are written with the NFC Tools app (Copy link / Copy all in admin).
- Courier tracking URLs (`src/lib/couriers.ts`) are unverified.
- The welcome email goes only to new accounts, not to existing users linking another card.
