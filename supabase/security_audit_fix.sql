begin;
-- Trigger-only function: remove unnecessary client execution privileges.
do $guard$
begin
 if exists(select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='audit_module_change' and p.pronargs=0 and p.prorettype='pg_catalog.trigger'::regtype) then
 revoke execute on function public.audit_module_change() from public,anon,authenticated;
 end if;
end;
$guard$;
commit;
notify pgrst,'reload schema';
