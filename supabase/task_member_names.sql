begin;
create or replace function public.wedly_task_member_names(p_wedding uuid)
returns table(user_id uuid,display_name text)
language sql stable security definer set search_path='' as $names$
 select m.user_id,coalesce(nullif(btrim(u.raw_user_meta_data->>'full_name'),''),nullif(btrim(u.raw_user_meta_data->>'name'),''))
 from public.wedding_members m join auth.users u on u.id=m.user_id
 where m.wedding_id=p_wedding and m.status='active'
 and (m.role='owner' or coalesce((m.permissions->'tasks'->>'read')::boolean,false))
 and public.wedding_can(p_wedding,'tasks','read');
$names$;
revoke all on function public.wedly_task_member_names(uuid) from public,anon,authenticated;
grant execute on function public.wedly_task_member_names(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
