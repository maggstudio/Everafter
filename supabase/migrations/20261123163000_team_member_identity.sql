-- Owner-only directory of active/pending event members, with display names when available.
-- Auth emails are never exposed to collaborators or anonymous users.
create or replace function public.list_wedding_member_identities(p_wedding uuid)
returns table(user_id uuid, display_name text, email text)
language plpgsql stable security definer set search_path = ''
as $$
begin
 if (select auth.uid()) is null or not exists (
   select 1 from public.weddings w where w.id=p_wedding and w.owner_id=(select auth.uid())
 ) then raise exception 'Owner required' using errcode='42501'; end if;
 return query
 select m.user_id,
   nullif(btrim(coalesce(u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name','')),''),
   u.email::text
 from public.wedding_members m
 join auth.users u on u.id=m.user_id
 where m.wedding_id=p_wedding;
end;
$$;
revoke all on function public.list_wedding_member_identities(uuid) from public,anon;
grant execute on function public.list_wedding_member_identities(uuid) to authenticated;
