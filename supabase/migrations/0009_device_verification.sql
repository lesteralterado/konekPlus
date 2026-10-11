-- New-device login verification: defense in depth against a stolen/guessed
-- password alone being enough to reach /dashboard from an attacker's own
-- browser. On top of (not instead of) password auth — see src/proxy.ts's
-- header comment for why this has to be enforced there, not just in the
-- login Server Actions (Supabase's session is fully valid the instant
-- signInWithPassword succeeds; there's no "half-authenticated" state to
-- hook into on the Supabase side).
--
-- Two design decisions here are NOT how a first draft of this usually looks,
-- both closing real bypasses:
--
-- 1. store_login_pin() generates the PIN itself, in Postgres, using
--    pgcrypto's CSPRNG, and returns the plaintext for the caller to email.
--    It does NOT take a p_pin argument. Every RPC granted to `authenticated`
--    is reachable directly via /rest/v1/rpc/<name> by any signed-in client,
--    not just through this app's Server Actions — so if the client could
--    supply p_pin, an attacker who already has a victim's password (exactly
--    who this feature defends against) could set their own known PIN and
--    immediately "verify" it, skipping the email step entirely.
--
-- 2. login_verifications is keyed by user_id alone (one pending PIN per
--    account, system-wide), not by (user_id, device_id). device_id is a
--    client-supplied cookie value with no server-side binding — keying the
--    cooldown/attempt-limit by device_id would let an attacker defeat both
--    by simply minting a fresh device_id on every request (each gets its
--    own independent 60s cooldown and 5-attempt budget). Keyed by user_id,
--    there's exactly one rate-limit bucket per account to exhaust.
--    verify_login_pin() correspondingly trusts whatever device_id the
--    successful-verification request is currently carrying, rather than
--    requiring it to match whichever device originally requested the code
--    — that's correct behavior anyway (the user reads the code by email,
--    then types it into whichever browser they're actually on).
--
-- pgcrypto is already enabled (0001_init.sql) but installed in the
-- `extensions` schema on this project, not `public` — every pgcrypto call
-- below is schema-qualified accordingly.

create table public.trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  device_id text not null,
  label text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  trusted_until timestamptz not null
);

create unique index trusted_devices_user_device_idx
  on public.trusted_devices (user_id, device_id);

alter table public.trusted_devices enable row level security;
-- No policies: written/read only via is_device_trusted() and
-- verify_login_pin() below (SECURITY DEFINER) — same "no direct client
-- access" posture as `tags`/`tag_views` (0001, 0008).

-- Exactly one pending PIN per account at a time — see design note 2 above.
create table public.login_verifications (
  user_id uuid primary key references auth.users (id) on delete cascade,
  pin_hash text not null,
  attempts int not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.login_verifications enable row level security;
-- No policies: written/read only via store_login_pin()/verify_login_pin().

-- Cheap read used by src/proxy.ts on every /dashboard and /admin request.
create or replace function public.is_device_trusted(p_device_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.trusted_devices
    where user_id = auth.uid()
      and device_id = p_device_id
      and trusted_until > now()
  );
$$;

grant execute on function public.is_device_trusted(text) to authenticated;

-- Generates a fresh 6-digit PIN server-side (never client-supplied — see
-- design note 1), stores only its hash, and returns the plaintext so the
-- caller (a Server Action) can email it. Enforces a 60-second resend
-- cooldown per account via a row lock on the (possibly not-yet-existing)
-- pending row, so two near-simultaneous calls serialize rather than racing.
create or replace function public.store_login_pin()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_last_created timestamptz;
  v_pin text;
  v_seed bigint;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select created_at into v_last_created
    from public.login_verifications
    where user_id = v_user_id
    for update;

  if v_last_created is not null and v_last_created > now() - interval '60 seconds' then
    raise exception 'resend cooldown active';
  end if;

  select (get_byte(b, 0)::bigint << 24)
       | (get_byte(b, 1)::bigint << 16)
       | (get_byte(b, 2)::bigint << 8)
       |  get_byte(b, 3)::bigint
    into v_seed
  from (select extensions.gen_random_bytes(4) as b) s;

  v_pin := lpad((v_seed % 1000000)::text, 6, '0');

  insert into public.login_verifications
    (user_id, pin_hash, attempts, expires_at, created_at)
  values (
    v_user_id,
    encode(extensions.digest(v_pin, 'sha256'), 'hex'),
    0,
    now() + interval '10 minutes',
    now()
  )
  on conflict (user_id) do update
    set pin_hash = excluded.pin_hash,
        attempts = 0,
        expires_at = excluded.expires_at,
        created_at = excluded.created_at;

  return v_pin;
end;
$$;

grant execute on function public.store_login_pin() to authenticated;

-- Verifies a PIN and, on success, trusts p_device_id for 30 days. Never
-- distinguishes "wrong", "expired", or "too many attempts" in its return
-- value — all just `false` — so a client can't fingerprint which case
-- applied, same posture claim_tag()/set_tag_enabled() already hold to
-- (0001, 0006). The `for update` lock is what actually prevents two
-- concurrent guesses from both slipping in under the attempts cap.
create or replace function public.verify_login_pin(p_device_id text, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.login_verifications%rowtype;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;
  if p_device_id is null or length(p_device_id) = 0 then
    raise exception 'missing device id';
  end if;

  select * into v_row
    from public.login_verifications
    where user_id = v_user_id
    for update;

  if not found then
    return false;
  end if;

  if v_row.expires_at < now() or v_row.attempts >= 5 then
    return false;
  end if;

  if v_row.pin_hash <> encode(extensions.digest(p_pin, 'sha256'), 'hex') then
    update public.login_verifications
      set attempts = attempts + 1
      where user_id = v_user_id;
    return false;
  end if;

  delete from public.login_verifications where user_id = v_user_id;

  insert into public.trusted_devices (user_id, device_id, trusted_until, last_seen_at)
  values (v_user_id, p_device_id, now() + interval '30 days', now())
  on conflict (user_id, device_id) do update
    set trusted_until = excluded.trusted_until,
        last_seen_at = now();

  return true;
end;
$$;

grant execute on function public.verify_login_pin(text, text) to authenticated;
