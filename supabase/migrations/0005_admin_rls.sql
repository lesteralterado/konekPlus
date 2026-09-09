-- Hardens the admin/customer boundary at the database level. Previously
-- every /admin route ran through the service-role client (bypasses RLS
-- entirely) and the only gate was an app-layer ADMIN_EMAILS check — so RLS
-- played no part in keeping a customer out of admin data. This migration
-- adds a real admin identity + RLS policies so the database itself refuses
-- non-admins, independent of any app-layer check.

-- ---------------------------------------------------------------------------
-- Admin identity: a private (non-API-exposed) table + a public checker fn.
-- ---------------------------------------------------------------------------

create table private.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- Deliberately public (unlike the 0003 helpers): called both from RLS
-- policies below and directly by the app (supabase.rpc('is_admin')) for the
-- requireAdmin() check itself.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from private.admin_users where user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Admin RLS policies. All permissive/additive — Postgres ORs permissive
-- policies together, so these can only grant admins extra access; they
-- cannot narrow what any existing policy already allows a customer to do.
-- ---------------------------------------------------------------------------

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can view all tags"
  on public.tags for select
  using (public.is_admin());

create policy "Admins can provision tags"
  on public.tags for insert
  with check (public.is_admin());

create policy "Admins can reset any tag"
  on public.tags for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can view batch history"
  on public.tag_batches for select
  using (public.is_admin());

create policy "Admins can record batch history"
  on public.tag_batches for insert
  with check (public.is_admin());
