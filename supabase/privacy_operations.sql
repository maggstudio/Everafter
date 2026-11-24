begin;
alter table public.wedly_privacy_requests add column if not exists extended_until timestamptz;
alter table public.wedly_privacy_requests add column if not exists resolution text;
create table if not exists public.wedly_privacy_history (
 id bigint generated always as identity primary key,
 request_id uuid not null references public.wedly_privacy_requests(id) on delete cascade,
 actor_id uuid references auth.users(id) on delete set null,
 action text not null, note text not null default '', created_at timestamptz not null default now()
);
alter table public.wedly_privacy_history enable row level security;
revoke all on public.wedly_privacy_history from public,anon,authenticated;
create or replace function public.wedly_admin_privacy_action(p_id uuid,p_action text,p_note text) returns boolean
language plpgsql security definer set search_path='' as $fn$
declare r public.wedly_privacy_requests%rowtype;
begin
 if public.wedly_platform_admin() is distinct from true then raise exception 'Access denied'; end if;
 if length(btrim(coalesce(p_note,''))) not between 1 and 2000 then raise exception 'Note required'; end if;
 select * into r from public.wedly_privacy_requests where id=p_id for update;
 if not found or r.status not in ('pending','processing') then return false; end if;
 if p_action='extend' then
  if r.extended_until is not null or now()>r.created_at+interval '1 month' then raise exception 'Extension unavailable'; end if;
  update public.wedly_privacy_requests set extended_until=created_at+interval '3 months',updated_at=now() where id=p_id;
 elsif p_action in ('processing','completed','rejected') then
  update public.wedly_privacy_requests set status=p_action,updated_at=now(),resolution=case when p_action in ('completed','rejected') then p_note else resolution end where id=p_id;
 else raise exception 'Invalid action'; end if;
 insert into public.wedly_privacy_history(request_id,actor_id,action,note) values(p_id,auth.uid(),p_action,p_note);
 return true;
end;
$fn$;
revoke execute on function public.wedly_admin_privacy_update(uuid,text) from public,anon,authenticated;
create or replace function public.wedly_admin_privacy_archive(p_closed boolean) returns jsonb
language plpgsql security definer set search_path='' as $fn$
begin
 if public.wedly_platform_admin() is distinct from true then raise exception 'Access denied'; end if;
 return (select coalesce(jsonb_agg(to_jsonb(r)||jsonb_build_object('email',u.email,'history',(select coalesce(jsonb_agg(to_jsonb(h) order by h.created_at),'[]'::jsonb) from public.wedly_privacy_history h where h.request_id=r.id)) order by r.created_at desc),'[]'::jsonb) from (select * from public.wedly_privacy_requests where (status in ('completed','rejected'))=p_closed order by created_at desc limit 200) r left join auth.users u on u.id=r.user_id);
end;
$fn$;
create or replace function public.wedly_my_account_export() returns jsonb
language plpgsql security definer set search_path='' as $fn$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 return jsonb_build_object('generated_at',now(),'scope','account only; event content and other personal data require separate review',
 'account',(select jsonb_build_object('id',id,'email',email,'created_at',created_at,'last_sign_in_at',last_sign_in_at) from auth.users where id=auth.uid()),
 'memberships',(select coalesce(jsonb_agg(jsonb_build_object('wedding_id',wedding_id,'role',role,'status',status,'permissions',permissions)),'[]'::jsonb) from public.wedding_members where user_id=auth.uid()),
 'terms',(select coalesce(jsonb_agg(to_jsonb(t)-'user_id'),'[]'::jsonb) from public.wedly_terms_acceptances t where user_id=auth.uid()),
 'declarations',(select coalesce(jsonb_agg(to_jsonb(a)-'user_id'),'[]'::jsonb) from public.wedly_organizer_acceptances a where user_id=auth.uid()),
 'requests',public.wedly_privacy_list());
end;
$fn$;
create or replace function public.wedly_my_erasure_preflight() returns jsonb
language sql security definer set search_path='' as $fn$
 select jsonb_build_object('owned_events',(select count(*) from public.weddings where owner_id=auth.uid()),'memberships',(select count(*) from public.wedding_members where user_id=auth.uid() and role<>'owner')) where auth.uid() is not null;
$fn$;
revoke all on function public.wedly_admin_privacy_action(uuid,text,text),public.wedly_admin_privacy_archive(boolean),public.wedly_my_account_export(),public.wedly_my_erasure_preflight() from public,anon,authenticated;
grant execute on function public.wedly_admin_privacy_action(uuid,text,text),public.wedly_admin_privacy_archive(boolean),public.wedly_my_account_export(),public.wedly_my_erasure_preflight() to authenticated;
commit;
notify pgrst,'reload schema';
