begin;
create table if not exists public.wedly_privacy_requests (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete set null,
 kind text not null check(kind in ('access','export','rectification','erasure','restriction','objection','other')),
 message text not null default '' check(length(message)<=2000),
 status text not null default 'pending' check(status in ('pending','processing','completed','rejected')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.wedly_privacy_requests enable row level security;
revoke all on public.wedly_privacy_requests from public,anon,authenticated;
create or replace function public.wedly_privacy_submit(p_kind text,p_message text) returns uuid
language plpgsql security definer set search_path='' as $fn$
declare rid uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,19));
 if (select count(*) from public.wedly_privacy_requests where user_id=auth.uid() and created_at>now()-interval '24 hours')>=5 then raise exception 'Request limit reached; contact support'; end if;
 insert into public.wedly_privacy_requests(user_id,kind,message) values(auth.uid(),p_kind,coalesce(p_message,'')) returning id into rid;
 return rid;
end;
$fn$;
create or replace function public.wedly_privacy_list() returns jsonb
language sql security definer set search_path='' as $fn$
 select coalesce(jsonb_agg(to_jsonb(r) - 'user_id' order by r.created_at desc),'[]'::jsonb) from public.wedly_privacy_requests r where r.user_id=auth.uid();
$fn$;
create or replace function public.wedly_admin_privacy_list() returns jsonb
language plpgsql security definer set search_path='' as $fn$
begin
 if public.wedly_platform_admin() is distinct from true then raise exception 'Access denied'; end if;
 return (select coalesce(jsonb_agg(to_jsonb(r)||jsonb_build_object('email',u.email) order by r.created_at),'[]'::jsonb) from public.wedly_privacy_requests r left join auth.users u on u.id=r.user_id where r.status in ('pending','processing'));
end;
$fn$;
create or replace function public.wedly_admin_privacy_update(p_id uuid,p_status text) returns boolean
language plpgsql security definer set search_path='' as $fn$
begin
 if public.wedly_platform_admin() is distinct from true then raise exception 'Access denied'; end if;
 update public.wedly_privacy_requests set status=p_status,updated_at=now() where id=p_id and status in ('pending','processing');
 return found;
end;
$fn$;
revoke all on function public.wedly_privacy_submit(text,text),public.wedly_privacy_list(),public.wedly_admin_privacy_list(),public.wedly_admin_privacy_update(uuid,text) from public,anon,authenticated;
grant execute on function public.wedly_privacy_submit(text,text),public.wedly_privacy_list(),public.wedly_admin_privacy_list(),public.wedly_admin_privacy_update(uuid,text) to authenticated;
commit;
notify pgrst,'reload schema';
