-- Admin dashboard: records each provisioning run (CLI script or the new
-- admin UI) so staff can see batch history, not just the live tag list.
-- RLS is enabled with zero policies — nobody gets access via the anon or
-- authenticated roles; only the service-role client (used exclusively by
-- server-only admin code) can read/write this table. Fails closed.

create table public.tag_batches (
  id uuid primary key default gen_random_uuid(),
  count int not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.tag_batches enable row level security;
