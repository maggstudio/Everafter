begin;
create or replace function public.wedly_admin_erasure_audit() returns jsonb
language plpgsql security definer set search_path='' as $fn$
begin
 if public.wedly_platform_admin() is distinct from true then raise exception 'Access denied'; end if;
 return jsonb_build_object('foreign_keys',(select coalesce(jsonb_agg(jsonb_build_object('table',c.conrelid::regclass::text,'target',c.confrelid::regclass::text,'definition',pg_get_constraintdef(c.oid),'delete_action',case c.confdeltype when 'c' then 'cascade' when 'n' then 'set null' when 'd' then 'set default' when 'r' then 'restrict' else 'no action' end) order by c.conrelid::regclass::text),'[]'::jsonb) from pg_constraint c where c.contype='f' and c.confrelid in ('auth.users'::regclass,'public.weddings'::regclass)),
 'candidate_columns',(select coalesce(jsonb_agg(jsonb_build_object('table',table_name,'column',column_name,'type',data_type) order by table_name,column_name),'[]'::jsonb) from information_schema.columns where table_schema='public' and column_name in ('user_id','owner_id','created_by','updated_by','actor_id','wedding_id','email','endpoint')),
 'storage',(select coalesce(jsonb_agg(jsonb_build_object('bucket',bucket_id,'objects',n)),'[]'::jsonb) from (select bucket_id,count(*) n from storage.objects group by bucket_id) s));
end;
$fn$;
revoke all on function public.wedly_admin_erasure_audit() from public,anon,authenticated;
grant execute on function public.wedly_admin_erasure_audit() to authenticated;
commit;
notify pgrst,'reload schema';
