begin;
create or replace function public.wedly_admin_erasure_review(p_request uuid) returns jsonb
language plpgsql security definer set search_path='' as $fn$
declare r public.wedly_privacy_requests%rowtype; result jsonb;
begin
 if public.wedly_platform_admin() is distinct from true then raise exception 'Access denied'; end if;
 select * into r from public.wedly_privacy_requests where id=p_request and kind='erasure' and status in ('pending','processing');
 if not found or r.user_id is null then raise exception 'No active account erasure request'; end if;
 result:=public.wedly_admin_erasure_preflight(r.user_id);
 return result||jsonb_build_object('request_id',r.id,'account_id',r.user_id,'storage_objects',(select count(*) from storage.objects where owner_id=r.user_id::text),'shared_memberships',(select count(*) from public.wedding_members where user_id=r.user_id and role<>'owner'),'review_only',true);
end;
$fn$;
revoke all on function public.wedly_admin_erasure_review(uuid) from public,anon,authenticated;
grant execute on function public.wedly_admin_erasure_review(uuid) to authenticated;
commit;
notify pgrst,'reload schema';
