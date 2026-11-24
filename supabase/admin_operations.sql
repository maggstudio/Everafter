begin;
create or replace function public.wedly_admin_operations() returns jsonb language plpgsql security definer set search_path='' as $ops$
begin
 if public.wedly_platform_admin() is distinct from true then raise exception 'Access denied' using errcode='42501'; end if;
 return jsonb_build_object(
 'generated_at',now(),
 'growth',(select jsonb_agg(jsonb_build_object('date',d.dt::date,'users',(select count(*) from auth.users u where (u.created_at at time zone 'Europe/Bucharest')::date=d.dt::date),'events',(select count(*) from public.weddings w where (w.created_at at time zone 'Europe/Bucharest')::date=d.dt::date)) order by d.dt) from generate_series((now() at time zone 'Europe/Bucharest')::date-29,(now() at time zone 'Europe/Bucharest')::date,interval '1 day') d(dt)),
 'modules',(select coalesce(jsonb_agg(to_jsonb(m)),'[]'::jsonb) from (select module,count(distinct wedding_id) AS events,sum(case when jsonb_typeof(content::jsonb)='array' then jsonb_array_length(content::jsonb) else 0 end) AS items from public.wedding_modules group by module order by module) m),
 'tables',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from (select relname AS name,pg_total_relation_size(relid) AS bytes from pg_catalog.pg_stat_user_tables where schemaname='public' order by pg_total_relation_size(relid) desc limit 10) t),
 'storage',(select coalesce(jsonb_agg(to_jsonb(b)),'[]'::jsonb) from (select bucket_id,count(*) AS objects,coalesce(sum(case when metadata->>'size' ~ '^[0-9]{1,18}$' then (metadata->>'size')::numeric else 0 end),0) AS bytes,count(*) filter(where metadata->>'size' is null or metadata->>'size' !~ '^[0-9]{1,18}$') AS unknown_sizes from storage.objects group by bucket_id) b),
 'queue_ready',(select count(*) from public.wedly_push_queue where state='pending' and available_at<=now()),
 'queue_deferred',(select count(*) from public.wedly_push_queue where state='pending' and available_at>now())
 );
end;
$ops$;
revoke all on function public.wedly_admin_operations() from public,anon,authenticated;
grant execute on function public.wedly_admin_operations() to authenticated;
commit;
notify pgrst,'reload schema';
