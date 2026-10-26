-- Finance: what Konek+ spends, so the admin can see whether card sales cover
-- the bills. Admin-only end to end — the public never reads or writes these.
--
-- * finance_bills: the recurring bills (Supabase, Vercel, domain, Claude…) in
--   the currency they're charged in. Drives the monthly burn and break-even.
-- * finance_expenses: money actually paid out, always in PHP — the peso
--   amount that left the account, FX and card fees included.
-- * finance_settings: one row — the USD→PHP rate used for budgeting, and the
--   Server Reserve (balance updated at the monthly close, per-card top-up,
--   target in months of server bills).

create table public.finance_bills (
  id uuid primary key default gen_random_uuid(),
  vendor text not null check (char_length(vendor) between 1 and 60),
  category text not null check (category in ('ktlo', 'dev', 'marketing', 'other')),
  currency text not null default 'USD' check (currency in ('USD', 'PHP')),
  amount numeric(12, 2) not null check (amount >= 0),
  billing_interval text not null default 'monthly'
    check (billing_interval in ('monthly', 'yearly')),
  active boolean not null default true,
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now()
);

create table public.finance_expenses (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid references public.finance_bills (id) on delete set null,
  category text not null
    check (category in ('ktlo', 'dev', 'cogs', 'marketing', 'fees', 'other')),
  description text not null check (char_length(description) between 1 and 120),
  amount_php numeric(12, 2) not null check (amount_php >= 0),
  paid_on date not null default ((now() at time zone 'Asia/Manila')::date),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index finance_expenses_paid_on_idx on public.finance_expenses (paid_on);
create index finance_expenses_bill_id_idx on public.finance_expenses (bill_id);
create index finance_expenses_created_by_idx on public.finance_expenses (created_by);

create table public.finance_settings (
  id boolean primary key default true check (id),
  -- Budget a little above the bank rate to absorb FX and card fees.
  usd_php_rate numeric(8, 2) not null default 66 check (usd_php_rate > 0),
  reserve_balance_php numeric(12, 2) not null default 0 check (reserve_balance_php >= 0),
  reserve_per_card_php integer not null default 250 check (reserve_per_card_php >= 0),
  reserve_target_months smallint not null default 6
    check (reserve_target_months between 1 and 24),
  updated_at timestamptz not null default now()
);

insert into public.finance_settings default values;

alter table public.finance_bills enable row level security;
alter table public.finance_expenses enable row level security;
alter table public.finance_settings enable row level security;

create policy "Admins manage bills"
  on public.finance_bills for all
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage expenses"
  on public.finance_expenses for all
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins read finance settings"
  on public.finance_settings for select using (public.is_admin());
create policy "Admins update finance settings"
  on public.finance_settings for update
  using (public.is_admin()) with check (public.is_admin());

-- The bills as of October 2026.
insert into public.finance_bills (vendor, category, currency, amount, billing_interval, note) values
  ('Supabase Pro', 'ktlo', 'USD', 25.00, 'monthly', 'Database, auth, storage'),
  ('Supabase extra usage', 'ktlo', 'USD', 18.07, 'monthly',
    'Unknown — check Billing → Usage (likely a compute add-on or a second project)'),
  ('Vercel Pro', 'ktlo', 'USD', 20.00, 'monthly', 'Hosting'),
  ('Domain', 'ktlo', 'PHP', 7167.00, 'yearly', 'Yearly renewal'),
  ('Claude', 'dev', 'USD', 22.40, 'monthly', 'Coding tool — can pause in quiet months');
