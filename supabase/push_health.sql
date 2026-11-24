begin;
alter table public.wedly_push_queue add column if not exists created_at timestamptz;
alter table public.wedly_push_queue alter column created_at set default now();
alter table public.wedly_push_queue add column if not exists finished_at timestamptz;
create table if not exists public.wedly_push_runs (
 id bigint generated always as identity primary key,
 started_at timestamptz not null, finished_at timestamptz not null default now(),
 claimed integer not null, sent integer not null, failed integer not null, outcome text not null
);
alter table public.wedly_push_runs enable row level security;
revoke all on public.wedly_push_runs from public,anon,authenticated;
grant insert,select,delete on public.wedly_push_runs to service_role;
grant usage,select on sequence public.wedly_push_runs_id_seq to service_role;
create index if not exists wedly_push_runs_started on public.wedly_push_runs(started_at);
create or replace function public.wedly_push_stamp() returns trigger language plpgsql set search_path='' as $stamp$
begin
 if new.state <> old.state and new.state <> 'pending' then new.finished_at=now(); end if;
 return new;
end;
$stamp$;
drop trigger if exists wedly_push_stamp on public.wedly_push_queue;
create trigger wedly_push_stamp before update on public.wedly_push_queue for each row execute function public.wedly_push_stamp();
create or replace function public.wedly_admin_push_health() returns jsonb language plpgsql security definer set search_path='' as $health$
begin
 if public.wedly_platform_admin() is distinct from true then raise exception 'Access denied' using errcode='42501'; end if;
 return jsonb_build_object(
 'oldest_pending_seconds',(select extract(epoch from now()-min(created_at))::bigint from public.wedly_push_queue where state='pending'),
 'last_run',(select to_jsonb(r) from public.wedly_push_runs r order by started_at desc limit 1),
 'daily',(select coalesce(jsonb_agg(to_jsonb(d) order by d.day),'[]'::jsonb) from (select (finished_at at time zone 'Europe/Bucharest')::date day,count(*) filter(where state='sent') sent,count(*) filter(where state='cancelled') cancelled from public.wedly_push_queue where finished_at>=now()-interval '30 days' group by 1) d),
 'average_latency_seconds',(select round(avg(extract(epoch from finished_at-created_at))) from public.wedly_push_queue where state='sent' and finished_at>=now()-interval '7 days')
 );
end;
$health$;
revoke all on function public.wedly_admin_push_health() from public,anon,authenticated;
grant execute on function public.wedly_admin_push_health() to authenticated;
commit;
notify pgrst,'reload schema';
