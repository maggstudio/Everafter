begin;
-- Explicit event deletion or verified ownership transfer must precede account deletion.
alter table public.weddings drop constraint if exists weddings_owner_id_fkey;
do $guard$
declare c record;
begin
 for c in select conname from pg_constraint where conrelid='public.weddings'::regclass and confrelid='auth.users'::regclass and contype='f' and pg_get_constraintdef(oid) like 'FOREIGN KEY (owner_id)%' loop
 execute format('alter table public.weddings drop constraint %I',c.conname);
 end loop;
end;
$guard$;
alter table public.weddings add constraint weddings_owner_id_fkey foreign key(owner_id) references auth.users(id) on delete restrict;
create or replace function public.wedly_admin_erasure_preflight(p_user uuid) returns jsonb
language plpgsql security definer set search_path='' as $fn$
declare r record; n bigint; refs jsonb:='[]'::jsonb;
begin
 if public.wedly_platform_admin() is distinct from true then raise exception 'Access denied'; end if;
 if not exists(select 1 from auth.users where id=p_user) then raise exception 'Unknown account'; end if;
 for r in select table_name,column_name from information_schema.columns where table_schema='public' and data_type='uuid' and column_name in ('user_id','owner_id','actor_id','created_by','updated_by','invited_by','accepted_by') loop
 execute format('select count(*) from public.%I where %I=$1',r.table_name,r.column_name) into n using p_user;
 if n>0 then refs:=refs||jsonb_build_array(jsonb_build_object('table',r.table_name,'column',r.column_name,'count',n)); end if;
 end loop;
 return jsonb_build_object('owned_events',(select count(*) from public.weddings where owner_id=p_user),'references',refs,'requires_manual_review',true);
end;
$fn$;
revoke all on function public.wedly_admin_erasure_preflight(uuid) from public,anon,authenticated;
grant execute on function public.wedly_admin_erasure_preflight(uuid) to authenticated;
commit;
notify pgrst,'reload schema';
