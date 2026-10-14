-- Orders placed from the landing page's order form. Same write-only-for-anon
-- posture as feedback (0014): visitors can submit, only admins can read or
-- update. No prices are stored here — totals are always recomputed from the
-- price config (quote() in src/lib/finishes.ts), so a tampered request
-- can't name its own price. Orders are confirmed by a person before
-- anything ships (COD / GCash), so this is the order request, not a charge.
create table public.card_orders (
  id uuid primary key default gen_random_uuid(),
  finish text not null
    check (finish in ('obsidian', 'frost', 'titanium', 'linen', 'aurora')),
  quantity smallint not null check (quantity between 1 and 100),
  full_name text not null check (char_length(full_name) between 1 and 120),
  phone text not null check (char_length(phone) between 7 and 30),
  email text check (email is null or char_length(email) <= 200),
  address text not null check (char_length(address) between 3 and 500),
  payment_method text not null check (payment_method in ('cod', 'gcash')),
  notes text check (notes is null or char_length(notes) <= 1000),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'fulfilled', 'cancelled')),
  created_at timestamptz not null default now()
);

create index card_orders_created_at_idx on public.card_orders (created_at desc);

alter table public.card_orders enable row level security;

-- Status pinned to 'new' so an anonymous insert can't pre-mark itself as
-- fulfilled.
create policy "Anyone can place an order"
  on public.card_orders for insert with check (status = 'new');
create policy "Admins can view orders"
  on public.card_orders for select using (public.is_admin());
create policy "Admins can update orders"
  on public.card_orders for update using (public.is_admin()) with check (public.is_admin());
