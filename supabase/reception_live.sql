begin;
alter table public.wedly_checkins alter column checked_by drop not null;
alter table public.wedly_checkins add column if not exists source text not null default 'manual' check(source in ('manual','public'));
grant select,insert on public.wedly_checkins to service_role;
commit;
notify pgrst, 'reload schema';
