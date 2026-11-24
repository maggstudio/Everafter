begin;
create or replace function public.wedly_admin_security_audit() returns jsonb language plpgsql security definer set search_path='' as $audit$
begin
 if public.wedly_platform_admin() is distinct from true then raise exception 'Access denied' using errcode='42501'; end if;
 return jsonb_build_object(
 'tables',(select coalesce(jsonb_agg(jsonb_build_object('name',c.relname,'rls',c.relrowsecurity,'policies',(select count(*) from pg_catalog.pg_policy p where p.polrelid=c.oid),'anon_read',has_table_privilege('anon',c.oid,'SELECT'),'anon_write',has_table_privilege('anon',c.oid,'INSERT,UPDATE,DELETE'),'authenticated_read',has_table_privilege('authenticated',c.oid,'SELECT'),'authenticated_write',has_table_privilege('authenticated',c.oid,'INSERT,UPDATE,DELETE')) order by c.relname),'[]'::jsonb) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p')),
 'functions',(select coalesce(jsonb_agg(jsonb_build_object('name',p.proname,'signature',pg_get_function_identity_arguments(p.oid),'anon_execute',has_function_privilege('anon',p.oid,'EXECUTE'),'authenticated_execute',has_function_privilege('authenticated',p.oid,'EXECUTE'),'search_path_set',exists(select 1 from unnest(p.proconfig) cfg where cfg like 'search_path=%')) order by p.proname),'[]'::jsonb) from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef)
 );
end;
$audit$;
revoke all on function public.wedly_admin_security_audit() from public,anon,authenticated;
grant execute on function public.wedly_admin_security_audit() to authenticated;
commit;
notify pgrst,'reload schema';
