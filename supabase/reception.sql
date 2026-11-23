begin;
create table if not exists public.wedly_reception_limits(fingerprint text primary key, bucket timestamptz not null, hits integer not null);
alter table public.wedly_reception_limits enable row level security;
revoke all on public.wedly_reception_limits from public,anon,authenticated;
grant select,insert,update,delete on public.wedly_reception_limits to service_role;
create or replace function public.wedly_reception_limit(p_fingerprint text) returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 insert into public.wedly_reception_limits values(p_fingerprint,date_trunc('minute',now()),1)
 on conflict(fingerprint) do update set hits=case when wedly_reception_limits.bucket=excluded.bucket then wedly_reception_limits.hits+1 else 1 end,bucket=excluded.bucket returning hits into n;
 return n<=30;
end;$$;
revoke all on function public.wedly_reception_limit(text) from public,anon,authenticated;
grant execute on function public.wedly_reception_limit(text) to service_role;
commit;
