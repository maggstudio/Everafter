begin;
create table if not exists public.wedly_security_incidents (
 id uuid primary key default gen_random_uuid(),
 reported_at timestamptz not null default now(),
 aware_at timestamptz not null,
 title text not null check(length(title) between 1 and 200),
 assessment text not null check(length(assessment) between 1 and 4000),
 status text not null default 'open' check(status in ('open','contained','closed')),
 notification_decision text not null default 'pending' check(notification_decision in ('pending','required','not_required')),
 decision_reason text,
 authority_notified_at timestamptz,
 subjects_notified_at timestamptz,
 updated_at timestamptz not null default now()
);
alter table public.wedly_security_incidents enable row level security;
revoke all on public.wedly_security_incidents from public,anon,authenticated;
create table if not exists public.wedly_incident_history (
 id bigint generated always as identity primary key,
 incident_id uuid not null references public.wedly_security_incidents(id) on delete cascade,
 actor_id uuid references auth.users(id) on delete set null,
 snapshot jsonb not null, created_at timestamptz not null default now()
);
alter table public.wedly_incident_history enable row level security;
revoke all on public.wedly_incident_history from public,anon,authenticated;
create or replace function public.wedly_admin_incident_create(p_title text,p_assessment text,p_aware timestamptz) returns uuid
language plpgsql security definer set search_path='' as $fn$
declare rid uuid;
begin
 if public.wedly_platform_admin() is distinct from true then raise exception 'Access denied'; end if;
 if p_aware is null or p_aware>now() then raise exception 'Invalid awareness time'; end if;
 insert into public.wedly_security_incidents(title,assessment,aware_at) values(btrim(p_title),btrim(p_assessment),p_aware) returning id into rid;
 insert into public.wedly_incident_history(incident_id,actor_id,snapshot) select id,auth.uid(),to_jsonb(i) from public.wedly_security_incidents i where id=rid;
 return rid;
end;
$fn$;
create or replace function public.wedly_admin_incident_update(p_id uuid,p_status text,p_decision text,p_reason text,p_authority timestamptz,p_subjects timestamptz) returns boolean
language plpgsql security definer set search_path='' as $fn$
begin
 if public.wedly_platform_admin() is distinct from true then raise exception 'Access denied'; end if;
 if p_status not in ('open','contained','closed') or p_decision not in ('pending','required','not_required') or length(btrim(coalesce(p_reason,''))) not between 1 and 4000 then raise exception 'Invalid assessment'; end if;
 if p_authority>now() or p_subjects>now() then raise exception 'Invalid notification time'; end if;
 if p_status='closed' and (p_decision='pending' or (p_decision='required' and p_authority is null)) then raise exception 'Resolve notification decision first'; end if;
 update public.wedly_security_incidents set status=p_status,notification_decision=p_decision,decision_reason=p_reason,authority_notified_at=p_authority,subjects_notified_at=p_subjects,updated_at=now() where id=p_id;
 if not found then return false; end if;
 insert into public.wedly_incident_history(incident_id,actor_id,snapshot) select id,auth.uid(),to_jsonb(i) from public.wedly_security_incidents i where id=p_id;
 return true;
end;
$fn$;
create or replace function public.wedly_admin_governance() returns jsonb
language plpgsql security definer set search_path='' as $fn$
begin
 if public.wedly_platform_admin() is distinct from true then raise exception 'Access denied'; end if;
 return jsonb_build_object(
 'privacy_open',(select count(*) from public.wedly_privacy_requests where status in ('pending','processing')),
 'privacy_due_7d',(select count(*) from public.wedly_privacy_requests where status in ('pending','processing') and coalesce(extended_until,created_at+interval '1 month') between now() and now()+interval '7 days'),
 'privacy_overdue',(select count(*) from public.wedly_privacy_requests where status in ('pending','processing') and coalesce(extended_until,created_at+interval '1 month')<now()),
 'retention_review',(select count(*) from public.wedly_privacy_requests where status in ('completed','rejected') and updated_at<now()-interval '3 years'),
 'incidents',(select coalesce(jsonb_agg(to_jsonb(i) order by i.aware_at desc),'[]'::jsonb) from (select * from public.wedly_security_incidents order by aware_at desc limit 100) i));
end;
$fn$;
revoke all on function public.wedly_admin_incident_create(text,text,timestamptz),public.wedly_admin_incident_update(uuid,text,text,text,timestamptz,timestamptz),public.wedly_admin_governance() from public,anon,authenticated;
grant execute on function public.wedly_admin_incident_create(text,text,timestamptz),public.wedly_admin_incident_update(uuid,text,text,text,timestamptz,timestamptz),public.wedly_admin_governance() to authenticated;
commit;
notify pgrst,'reload schema';
