begin;
create table if not exists public.wedly_terms_acceptances (
 user_id uuid not null references auth.users(id) on delete cascade,
 version text not null,
 accepted_at timestamptz not null default now(),
 primary key(user_id,version)
);
alter table public.wedly_terms_acceptances enable row level security;
revoke all on public.wedly_terms_acceptances from public,anon,authenticated;
create or replace function public.wedly_terms_status() returns boolean
language sql security definer set search_path='' as $status$
 select exists(select 1 from public.wedly_terms_acceptances where user_id=auth.uid() and version='2026-11-24-v1.1');
$status$;
create or replace function public.wedly_accept_terms(p_version text,p_accepted boolean) returns boolean
language plpgsql security definer set search_path='' as $accept$
begin
 if auth.uid() is null or p_version is distinct from '2026-11-24-v1.1' or p_accepted is distinct from true then raise exception 'Invalid acceptance'; end if;
 insert into public.wedly_terms_acceptances(user_id,version) values(auth.uid(),p_version) on conflict do nothing;
 return true;
end;
$accept$;
revoke all on function public.wedly_terms_status(),public.wedly_accept_terms(text,boolean) from public,anon,authenticated;
grant execute on function public.wedly_terms_status(),public.wedly_accept_terms(text,boolean) to authenticated;
create or replace function public.wedly_admin_terms_metrics() returns jsonb
language plpgsql security definer set search_path='' as $metrics$
begin
 if public.wedly_platform_admin() is distinct from true then raise exception 'Access denied'; end if;
 return jsonb_build_object('accepted',(select count(*) from public.wedly_terms_acceptances where version='2026-11-24-v1.1'),'accounts',(select count(*) from auth.users),'version','2026-11-24-v1.1');
end;
$metrics$;
revoke all on function public.wedly_admin_terms_metrics() from public,anon,authenticated;
grant execute on function public.wedly_admin_terms_metrics() to authenticated;
commit;
notify pgrst,'reload schema';
