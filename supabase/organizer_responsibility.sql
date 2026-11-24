begin;
create table if not exists public.wedly_organizer_acceptances (
 user_id uuid not null references auth.users(id) on delete cascade,
 wedding_id uuid not null references public.weddings(id) on delete cascade,
 version text not null,
 accepted_at timestamptz not null default now(),
 primary key(user_id,wedding_id,version)
);
alter table public.wedly_organizer_acceptances enable row level security;
revoke all on public.wedly_organizer_acceptances from public,anon,authenticated;
create or replace function public.wedly_accept_organizer(p_wedding uuid) returns boolean
language plpgsql security definer set search_path='' as $accept$
begin
 if auth.uid() is null or not exists(select 1 from public.wedding_members where wedding_id=p_wedding and user_id=auth.uid() and role='owner' and status='active') then raise exception 'Access denied'; end if;
 insert into public.wedly_organizer_acceptances(user_id,wedding_id,version) values(auth.uid(),p_wedding,'2026-11-24-v1') on conflict do nothing;
 return true;
end;
$accept$;
revoke all on function public.wedly_accept_organizer(uuid) from public,anon,authenticated;
grant execute on function public.wedly_accept_organizer(uuid) to authenticated;
create or replace function public.wedly_create_event_accepted(p_type text,p_first text,p_second text,p_date date,p_city text,p_child_name text,p_godparents text,p_elders text,p_accepted boolean) returns uuid
language plpgsql security invoker set search_path='' as $create$
declare event_id uuid;
begin
 if p_accepted is distinct from true then raise exception 'Organizer declaration required'; end if;
 event_id:=public.create_my_event_with_elders(p_type,p_first,p_second,p_date,p_city,p_child_name,p_godparents,p_elders);
 perform public.wedly_accept_organizer(event_id);
 return event_id;
end;
$create$;
revoke all on function public.wedly_create_event_accepted(text,text,text,date,text,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.wedly_create_event_accepted(text,text,text,date,text,text,text,text,boolean) to authenticated;
create or replace function public.wedly_admin_organizer_acceptances() returns jsonb
language plpgsql security definer set search_path='' as $admin$
begin
 if public.wedly_platform_admin() is distinct from true then raise exception 'Access denied'; end if;
 return (select jsonb_build_object('total',count(*),'events',count(distinct wedding_id),'latest',max(accepted_at)) from public.wedly_organizer_acceptances);
end;
$admin$;
revoke all on function public.wedly_admin_organizer_acceptances() from public,anon,authenticated;
grant execute on function public.wedly_admin_organizer_acceptances() to authenticated;
commit;
notify pgrst,'reload schema';
