begin;
create or replace function public.wedly_admin_auth_metrics() returns jsonb
language plpgsql security definer set search_path='' as $fn$
begin
 if public.wedly_platform_admin() is distinct from true then raise exception 'Access denied'; end if;
 return (select jsonb_build_object('total',count(*),'google',count(*) filter(where g),'email',count(*) filter(where e),'both',count(*) filter(where g and e),'active_1d',count(*) filter(where last_sign_in_at>=now()-interval '1 day'),'active_7d',count(*) filter(where last_sign_in_at>=now()-interval '7 days'),'active_30d',count(*) filter(where last_sign_in_at>=now()-interval '30 days'),'database_bytes',pg_database_size(current_database()),'storage_bytes',(select coalesce(sum(case when metadata->>'size' ~ '^[0-9]{1,18}$' then (metadata->>'size')::numeric else 0 end),0) from storage.objects)) from (select u.last_sign_in_at,exists(select 1 from auth.identities i where i.user_id=u.id and i.provider='google') g,exists(select 1 from auth.identities i where i.user_id=u.id and i.provider='email') e from auth.users u) x);
end;
$fn$;
revoke all on function public.wedly_admin_auth_metrics() from public,anon,authenticated;
grant execute on function public.wedly_admin_auth_metrics() to authenticated;
commit;
notify pgrst,'reload schema';
