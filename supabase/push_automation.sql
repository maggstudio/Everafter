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
-- Resolve the existing RSVP storage from the deployed RPC, without exposing invitation tokens.
create or replace function public.wedly_push_rsvp(p_wedding uuid)
returns table(guest_id text,status text,party_size integer,responded_at timestamptz)
language plpgsql security definer set search_path='' as $
declare rel record;
begin
 for rel in select c.table_name from information_schema.columns c
 where c.table_schema='public' and c.column_name in ('wedding_id','guest_id','status','party_size','responded_at')
 group by c.table_name having count(distinct c.column_name)=5
 loop
 return query execute format('select guest_id::text,status::text,party_size::integer,responded_at::timestamptz from public.%I where wedding_id=$1 and responded_at is not null and status::text in (''confirmat'',''refuzat'')',rel.table_name) using p_wedding;
 end loop;
end $;
revoke all on function public.wedly_push_rsvp(uuid) from public,anon,authenticated;
grant execute on function public.wedly_push_rsvp(uuid) to service_role;
commit;
notify pgrst,'reload schema';
