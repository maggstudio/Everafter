begin;
create or replace function public.wedly_admin_delete_empty_account(p_request uuid,p_confirmation text,p_note text) returns boolean
language plpgsql security definer set search_path='' as $fn$
declare r public.wedly_privacy_requests%rowtype; u uuid; ref record; n bigint;
begin
 if public.wedly_platform_admin() is distinct from true then raise exception 'Access denied'; end if;
 if p_confirmation is distinct from 'STERGE CONT DEFINITIV' or length(btrim(coalesce(p_note,''))) not between 1 and 2000 then raise exception 'Confirmation required'; end if;
 select * into r from public.wedly_privacy_requests where id=p_request and kind='erasure' and status='processing' for update;
 if not found or r.user_id is null or r.user_id=auth.uid() then raise exception 'Invalid request'; end if;
 u:=r.user_id;
 perform 1 from auth.users where id=u for update;
 if not found then raise exception 'Account unavailable'; end if;
 if exists(select 1 from public.weddings where owner_id=u) or exists(select 1 from public.wedding_members where user_id=u) or exists(select 1 from storage.objects where owner_id=u::text) then raise exception 'Event or storage dependencies remain'; end if;
 -- Only known account-specific rows and legally reviewed case records may remain.
 for ref in select table_name,column_name from information_schema.columns where table_schema='public' and data_type='uuid' and column_name in ('user_id','owner_id','actor_id','created_by','updated_by','invited_by','accepted_by') and table_name not in ('push_subscriptions','wedly_push_delivery','wedly_push_preferences','wedly_push_queue','wedly_terms_acceptances','wedly_organizer_acceptances','wedly_privacy_requests','wedly_privacy_history','wedly_incident_history','wedding_workspaces') loop
 execute format('select count(*) from public.%I where %I=$1',ref.table_name,ref.column_name) into n using u;
 if n>0 then raise exception 'Unresolved dependency: %.%',ref.table_name,ref.column_name; end if;
 end loop;
 -- Do not close the GDPR case until the administrator has communicated the outcome.
 insert into public.wedly_privacy_history(request_id,actor_id,action,note) values(r.id,auth.uid(),'account_deleted',p_note);
 delete from auth.users where id=u;
 if not found then raise exception 'Deletion failed'; end if;
 return true;
end;
$fn$;
revoke all on function public.wedly_admin_delete_empty_account(uuid,text,text) from public,anon,authenticated;
grant execute on function public.wedly_admin_delete_empty_account(uuid,text,text) to authenticated;
commit;
notify pgrst,'reload schema';
