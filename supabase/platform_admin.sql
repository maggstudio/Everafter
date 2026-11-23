-- WEDLY owner-only operations panel and future pricing foundation.
-- Execute once in Supabase SQL Editor. No paid feature is enabled by this migration.
begin;

create table if not exists public.platform_plan_catalog (
 code text primary key check (code in ('free','plus','premium')),
 label text not null,
 price_ron integer not null default 0 check (price_ron >= 0),
 enabled boolean not null default false,
 features jsonb not null default '{}'::jsonb,
 limits jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
alter table public.platform_plan_catalog enable row level security;
revoke all on public.platform_plan_catalog from public,anon,authenticated;
insert into public.platform_plan_catalog(code,label,price_ron,enabled,features,limits)
values
 ('free','WEDLY Free',0,true,'{"planning":true,"guest_rsvp":true,"personal_sharing":true}'::jsonb,'{}'::jsonb),
 ('plus','WEDLY Plus',49,false,'{"daily_digest":true,"advanced_reminders":true}'::jsonb,'{"emails_per_event":0}'::jsonb),
 ('premium','WEDLY Premium',129,false,'{"daily_digest":true,"advanced_reminders":true,"platform_invitation_emails":true}'::jsonb,'{"emails_per_event":100}'::jsonb)
on conflict(code) do nothing;

-- Never rely on UI hiding or client-supplied email for authorization.
-- Requires a verified email belonging to the current authenticated Supabase user.
create or replace function public.wedly_platform_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists(
  select 1 from auth.users u
  where u.id = (select auth.uid())
    and lower(u.email) = 'ioan.romulus@gmail.com'
    and u.email_confirmed_at is not null
 );
$$;
revoke all on function public.wedly_platform_admin() from public;
grant execute on function public.wedly_platform_admin() to authenticated;

create or replace function public.wedly_admin_overview()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare result jsonb; begin
 if not public.wedly_platform_admin() then raise exception 'Access denied' using errcode='42501'; end if;
 select jsonb_build_object(
  'generated_at', now(),
  'users_total', (select count(*) from auth.users),
  'users_active_30d', (select count(*) from auth.users where last_sign_in_at >= now()-interval '30 days'),
  'users_active_7d', (select count(*) from auth.users where last_sign_in_at >= now()-interval '7 days'),
  'events_total', (select count(*) from public.weddings),
  'events_created_30d', (select count(*) from public.weddings where created_at >= now()-interval '30 days'),
  'guests_total', (select coalesce(sum(jsonb_array_length(case when jsonb_typeof(content)='array' then content else '[]'::jsonb end)),0) from public.wedding_modules where module='guests'),
  'database_bytes', pg_catalog.pg_database_size(current_database()),
  'plans', (select coalesce(jsonb_agg(jsonb_build_object('code',code,'label',label,'price_ron',price_ron,'enabled',enabled,'features',features,'limits',limits) order by price_ron),'[]'::jsonb) from public.platform_plan_catalog)
 ) into result;
 return result;
end $$;
revoke all on function public.wedly_admin_overview() from public;
grant execute on function public.wedly_admin_overview() to authenticated;

-- Explicitly deny direct reads/writes to all users, including the admin.
-- Admin reads only through the authenticated, email-verified RPC above.
commit;
