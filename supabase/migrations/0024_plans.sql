-- Basic and Pro plans.
--
-- * Basic is free forever with any card: profile, links, testimonials,
--   editing anytime, the Classic style and up to 3 portfolio projects.
-- * Pro adds every card style, an unlimited portfolio and daily tap
--   analytics. Claiming a card includes 12 months of Pro; profiles that
--   existed before plans launched are Founding Members with 24 months.
-- * When Pro lapses nothing is deleted: the public card shows the Classic
--   style and the first 3 projects, and everything returns on renewal.
--
-- Pro is enforced here, in the public card RPCs, so no page can forget it.

alter table public.profiles
  add column pro_until timestamptz,
  add column founding boolean not null default false;

-- Owners update their own profile row directly (RLS), so stop them giving
-- themselves Pro. SECURITY DEFINER functions (claim_tag) and migrations run
-- as the function owner, not as authenticated/anon, and pass through.
create or replace function private.guard_profile_plan()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.pro_until := null;
      new.founding := false;
    else
      new.pro_until := old.pro_until;
      new.founding := old.founding;
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_plan
  before insert or update on public.profiles
  for each row execute function private.guard_profile_plan();

-- Founding Members: everyone already here.
update public.profiles
  set founding = true,
      pro_until = greatest(coalesce(pro_until, now()), now() + interval '24 months');

-- claim_tag: unchanged, plus at least 12 months of Pro from today. Extra
-- cards don't stack — one profile shows on every card it owns.
create or replace function public.claim_tag(p_tag_id text, p_pin text default null)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_profile_id uuid;
  v_tag public.tags%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select id into v_profile_id from public.profiles where user_id = auth.uid();

  if v_profile_id is null then
    raise exception 'no profile found for current user';
  end if;

  select * into v_tag from public.tags
    where tag_id = p_tag_id and claimed = false
    for update;

  if not found then
    return false;
  end if;

  if v_tag.activation_pin_hash is not null then
    if v_tag.pin_locked_until is not null and v_tag.pin_locked_until > now() then
      return false;
    end if;

    if p_pin is null
       or crypt(p_pin, v_tag.activation_pin_hash) <> v_tag.activation_pin_hash then
      update public.tags
        set pin_attempts = pin_attempts + 1,
            pin_locked_until = case
              when pin_attempts + 1 >= 5 then now() + interval '15 minutes'
              else pin_locked_until
            end
        where tag_id = p_tag_id;
      return false;
    end if;
  end if;

  update public.tags
    set claimed = true,
        profile_id = v_profile_id,
        claimed_at = now(),
        activated_at = now(),
        pin_attempts = 0,
        pin_locked_until = null
    where tag_id = p_tag_id;

  update public.profiles
    set pro_until = greatest(coalesce(pro_until, now()), now() + interval '12 months')
    where id = v_profile_id;

  if v_tag.order_id is not null then
    update public.card_orders
      set user_id = auth.uid()
      where id = v_tag.order_id and user_id is null;
  end if;

  return true;
end;
$$;

-- Public card: Basic shows the Classic style whatever is saved.
create or replace function public.get_public_profile(p_tag_id text)
returns table (
  id uuid, full_name text, job_title text, company text, email text, phone text,
  socials jsonb, avatar_url text, template text, tagline text, bio text,
  cta_label text, cta_url text, links jsonb, updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.job_title, p.company,
         case when p.show_email then p.email end,
         case when p.show_phone then p.phone end,
         p.socials, p.avatar_url,
         case when p.pro_until > now() then p.template else 'classic' end,
         p.tagline, p.bio, p.cta_label, p.cta_url, p.links, p.updated_at
  from public.tags t
  join public.profiles p on p.id = t.profile_id
  where t.tag_id = p_tag_id and t.claimed = true and t.enabled = true
  limit 1;
$$;

-- Public card: Basic shows the first 3 projects (in display order).
create or replace function public.get_public_portfolio(p_tag_id text)
returns setof public.portfolio_items
language sql
stable
security definer
set search_path = public
as $$
  select i.*
  from public.tags t
  join public.profiles p on p.id = t.profile_id
  join public.portfolio_items i on i.profile_id = t.profile_id
  where t.tag_id = p_tag_id and t.claimed = true and t.enabled = true
    and (
      p.pro_until > now()
      or i.id in (
        select x.id from public.portfolio_items x
        where x.profile_id = t.profile_id
        order by x.sort_order asc, x.created_at desc
        limit 3
      )
    )
  order by i.sort_order asc, i.created_at desc;
$$;

-- Owner analytics: taps per Manila day on the caller's own cards. Only
-- counts, never which card or when exactly. Pro sees the daily chart;
-- the dashboard shows Basic the total.
create or replace function public.my_card_views(p_days int default 30)
returns table (day date, views int)
language sql
stable
security definer
set search_path = public
as $$
  select (v.viewed_at at time zone 'Asia/Manila')::date as day, count(*)::int as views
  from public.tag_views v
  join public.tags t on t.tag_id = v.tag_id
  join public.profiles p on p.id = t.profile_id
  where p.user_id = auth.uid()
    and v.viewed_at >= now() - make_interval(days => least(greatest(p_days, 1), 90))
  group by 1
  order by 1;
$$;

revoke execute on function public.my_card_views(int) from anon, public;
grant execute on function public.my_card_views(int) to authenticated;

create index if not exists tag_views_tag_id_viewed_at_idx on public.tag_views (tag_id, viewed_at);
