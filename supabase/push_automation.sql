begin;
create table if not exists public.wedly_push_preferences (
 wedding_id uuid not null references public.weddings(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 rsvp boolean not null default true,
 tasks boolean not null default true,
 appointments boolean not null default true,
 payments boolean not null default true,
 assignments boolean not null default true,
 countdown boolean not null default true,
 digest boolean not null default false,
 digest_hour integer not null default 9 check(digest_hour between 0 and 23),
 quiet_start integer not null default 22 check(quiet_start between 0 and 23),
 quiet_end integer not null default 8 check(quiet_end between 0 and 23),
 primary key(wedding_id,user_id)
);
alter table public.wedly_push_preferences enable row level security;
revoke all on public.wedly_push_preferences from public,anon,authenticated;
grant select,insert,update on public.wedly_push_preferences to authenticated;
grant select on public.wedly_push_preferences to service_role;
drop policy if exists own_push_preferences on public.wedly_push_preferences;
create policy own_push_preferences on public.wedly_push_preferences for all to authenticated
using(user_id=auth.uid() and exists(select 1 from public.wedding_members m where m.wedding_id=wedly_push_preferences.wedding_id and m.user_id=auth.uid() and m.status='active'))
with check(user_id=auth.uid() and exists(select 1 from public.wedding_members m where m.wedding_id=wedly_push_preferences.wedding_id and m.user_id=auth.uid() and m.status='active'));
create table if not exists public.wedly_push_delivery (
 wedding_id uuid not null references public.weddings(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 event_key text not null,
 created_at timestamptz not null default now(),
 primary key(wedding_id,user_id,event_key)
);
alter table public.wedly_push_delivery enable row level security;
revoke all on public.wedly_push_delivery from public,anon,authenticated;
grant select,insert,delete on public.wedly_push_delivery to service_role;
commit;
notify pgrst,'reload schema';
