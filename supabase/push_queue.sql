begin;
create table if not exists public.wedly_push_queue (
 id bigint generated always as identity primary key,
 wedding_id uuid not null references public.weddings(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 event_key text not null,
 endpoint text not null,
 body text not null,
 view_name text not null,
 attempts integer not null default 0,
 available_at timestamptz not null default now(),
 state text not null default 'pending' check(state in ('pending','sent','cancelled')),
 unique(wedding_id,user_id,event_key,endpoint)
);
alter table public.wedly_push_queue enable row level security;
revoke all on public.wedly_push_queue from public,anon,authenticated;
grant select,insert,update,delete on public.wedly_push_queue to service_role;
grant usage,select on sequence public.wedly_push_queue_id_seq to service_role;
create index if not exists wedly_push_queue_pending on public.wedly_push_queue(available_at,id) where state='pending';
create table if not exists public.wedly_push_cursor (
 id integer primary key check(id=1), endpoint text not null default '', lease_until timestamptz not null default '-infinity'
);
insert into public.wedly_push_cursor(id) values(1) on conflict do nothing;
alter table public.wedly_push_cursor enable row level security;
revoke all on public.wedly_push_cursor from public,anon,authenticated;
grant select,update on public.wedly_push_cursor to service_role;
create or replace function public.wedly_push_claim(p_limit integer)
returns setof public.wedly_push_queue language sql security invoker set search_path='' as $queue$
 update public.wedly_push_queue q set available_at=now()+interval '2 minutes', attempts=q.attempts+1
 where q.id in (select x.id from public.wedly_push_queue x where x.state='pending' and x.available_at<=now() order by x.available_at,x.id limit greatest(1,least(p_limit,100)) for update skip locked)
 returning q.*;
$queue$;
revoke all on function public.wedly_push_claim(integer) from public,anon,authenticated;
grant execute on function public.wedly_push_claim(integer) to service_role;
commit;
notify pgrst,'reload schema';
