begin;
alter function public.wedly_create_event_accepted(text,text,text,date,text,text,text,text,boolean) security definer;
revoke execute on function public.create_my_event_with_elders(text,text,text,date,text,text,text,text) from public,anon,authenticated;
-- Disable legacy creation RPCs, regardless of overload.
do $block$
declare f record;
begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('create_my_event','ensure_my_wedding') loop
 execute format('revoke execute on function %s from public,anon,authenticated',f.signature);
 end loop;
end;
$block$;
create or replace function public.wedly_organizer_status(p_wedding uuid) returns boolean
language sql security definer set search_path='' as $status$
 select exists(select 1 from public.wedly_organizer_acceptances a where a.wedding_id=p_wedding and a.user_id=auth.uid() and a.version='2026-11-24-v1');
$status$;
revoke all on function public.wedly_organizer_status(uuid) from public,anon,authenticated;
grant execute on function public.wedly_organizer_status(uuid) to authenticated;
commit;
notify pgrst,'reload schema';
