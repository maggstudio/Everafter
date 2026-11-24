begin;
create table if not exists public.wedly_api_limits (
 scope text not null, subject uuid not null, bucket timestamptz not null, hits integer not null default 1,
 primary key(scope,subject,bucket)
);
alter table public.wedly_api_limits enable row level security;
revoke all on public.wedly_api_limits from public,anon,authenticated;
create or replace function public.wedly_consume_push_limit(p_user uuid,p_action text)
returns boolean language plpgsql security definer set search_path='' as $limit$
declare n integer; ceiling integer; window_start timestamptz;
begin
 if p_user is null or p_action not in ('test','subscribe') then return false; end if;
 ceiling=case when p_action='test' then 5 else 20 end;
 window_start=date_trunc('hour',now());
 insert into public.wedly_api_limits(scope,subject,bucket) values(p_action,p_user,window_start)
 on conflict(scope,subject,bucket) do update set hits=public.wedly_api_limits.hits+1 where public.wedly_api_limits.hits<ceiling
 returning hits into n;
 return n is not null;
end;
$limit$;
revoke all on function public.wedly_consume_push_limit(uuid,text) from public,anon,authenticated;
grant execute on function public.wedly_consume_push_limit(uuid,text) to service_role;
create or replace function public.wedly_api_limit_cleanup() returns void language sql security definer set search_path='' as $cleanup$
 delete from public.wedly_api_limits where bucket<now()-interval '48 hours';
$cleanup$;
revoke all on function public.wedly_api_limit_cleanup() from public,anon,authenticated;
grant execute on function public.wedly_api_limit_cleanup() to service_role;
commit;
notify pgrst,'reload schema';
