-- Lets each card owner pick which of the three public-profile layouts
-- (classic / editorial / minimal — see src/app/t/[tag_id]/templates/)
-- renders when someone taps their card. Defaults existing profiles to the
-- current design so nothing changes until an owner opts into a new one.
alter table public.profiles
  add column template text not null default 'classic'
  check (template in ('classic', 'editorial', 'minimal'));
