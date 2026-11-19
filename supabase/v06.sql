-- EVERAFTER v0.6 additive migration. Never deletes or rewrites v0.4/v0.5 data.
create extension if not exists pgcrypto;
create table if not exists public.wedding_email_invitations (
 id uuid primary key default gen_random_uuid(), wedding_id uuid not null references public.weddings(id) on delete cascade,
 email text not null, role text not null check(role in ('partner','planner')),
 permissions jsonb not null default '{}'::jsonb, token_hash text not null unique,
 invited_by uuid not null references auth.users(id), status text not null default 'pending' check(status in ('pending','accepted','revoked')),
 expires_at timestamptz not null default (now()+interval '7 days'), created_at timestamptz not null default now(),
 accepted_by uuid references auth.users(id), accepted_at timestamptz);
create index if not exists wedding_email_invitations_wedding_idx on public.wedding_email_invitations(wedding_id);
create table if not exists public.wedding_audit_log (
 id bigint generated always as identity primary key, wedding_id uuid not null references public.weddings(id) on delete cascade,
 actor_id uuid, event text not null, module text, detail jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now());
create index if not exists wedding_audit_log_wedding_idx on public.wedding_audit_log(wedding_id,created_at desc);
alter table public.wedding_email_invitations enable row level security;
alter table public.wedding_audit_log enable row level security;
revoke all on public.wedding_email_invitations,public.wedding_audit_log from public,anon,authenticated;
grant select on public.wedding_audit_log to authenticated;
drop policy if exists audit_owner_read on public.wedding_audit_log;
create policy audit_owner_read on public.wedding_audit_log for select to authenticated
 using (exists(select 1 from public.weddings w where w.id=wedding_id and w.owner_id=(select auth.uid())));
-- No direct table access to invitations: prevents token hash/email enumeration.
-- Only the owner can issue invites. The plaintext token is returned ONCE; only its digest is stored.
create or replace function public.create_email_invitation(p_wedding uuid,p_email text,p_role text,p_permissions jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare secret text; normalized text; begin
 if auth.uid() is null or not exists(select 1 from public.weddings where id=p_wedding and owner_id=auth.uid()) then raise exception 'Owner required'; end if;
 normalized:=lower(trim(p_email));
 if normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(normalized)>254 then raise exception 'Invalid email'; end if;
 if p_role not in ('partner','planner') then raise exception 'Invalid role'; end if;
 if jsonb_typeof(p_permissions) is distinct from 'object' or
 exists(select 1 from jsonb_each(p_permissions) e where e.key not in ('wedding','tasks','expenses','guests','calendar','packages','members') or jsonb_typeof(e.value)<>'object' or exists(select 1 from jsonb_each(e.value) v where v.key not in ('read','write') or jsonb_typeof(v.value)<>'boolean')) then raise exception 'Invalid permissions'; end if;
 -- Restrict one outstanding invitation per address per wedding; rotate older links.
 update public.wedding_email_invitations set status='revoked' where wedding_id=p_wedding and email=normalized and status='pending';
 secret:=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.wedding_email_invitations(wedding_id,email,role,permissions,token_hash,invited_by)
 values(p_wedding,normalized,p_role,p_permissions,encode(extensions.digest(secret,'sha256'),'hex'),auth.uid());
 return secret;
end $$;
revoke all on function public.create_email_invitation(uuid,text,text,jsonb) from public;
grant execute on function public.create_email_invitation(uuid,text,text,jsonb) to authenticated;
-- Accept only when the authenticated account has a confirmed, matching email.
create or replace function public.accept_email_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare inv public.wedding_email_invitations%rowtype; email_verified text; begin
 if auth.uid() is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'Invalid invitation'; end if;
 select lower(email) into email_verified from auth.users where id=auth.uid() and email_confirmed_at is not null;
 select * into inv from public.wedding_email_invitations
 where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and status='pending' and expires_at>now() for update;
 if not found or email_verified is null or email_verified<>inv.email then raise exception 'Invitation expired or email mismatch'; end if;
 insert into public.wedding_members(wedding_id,user_id,role,status,permissions)
 values(inv.wedding_id,auth.uid(),inv.role,'active',inv.permissions)
 on conflict(wedding_id,user_id) do update set role=excluded.role,status='active',permissions=excluded.permissions
 where public.wedding_members.role<>'owner';
 update public.wedding_email_invitations set status='accepted',accepted_by=auth.uid(),accepted_at=now() where id=inv.id;
 insert into public.wedding_audit_log(wedding_id,actor_id,event,detail) values(inv.wedding_id,auth.uid(),'invite_accepted',jsonb_build_object('invitation_id',inv.id));
 return inv.wedding_id;
end $$;
revoke all on function public.accept_email_invitation(text) from public;
grant execute on function public.accept_email_invitation(text) to authenticated;
create or replace function public.list_email_invitations(p_wedding uuid)
returns table(id uuid,email text,role text,status text,expires_at timestamptz,created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$ begin
 if not exists(select 1 from public.weddings where owner_id=auth.uid() and public.weddings.id=p_wedding) then raise exception 'Owner required'; end if;
 return query select i.id,i.email,i.role,i.status,i.expires_at,i.created_at from public.wedding_email_invitations i where i.wedding_id=p_wedding order by i.created_at desc limit 100;
end $$;
revoke all on function public.list_email_invitations(uuid) from public;
grant execute on function public.list_email_invitations(uuid) to authenticated;
create or replace function public.revoke_email_invitation(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$ begin
 update public.wedding_email_invitations i set status='revoked' where i.id=p_id and i.status='pending'
 and exists(select 1 from public.weddings w where w.id=i.wedding_id and w.owner_id=auth.uid());
 if not found then raise exception 'Invitation not found or already closed'; end if;
end $$;
revoke all on function public.revoke_email_invitation(uuid) from public;
grant execute on function public.revoke_email_invitation(uuid) to authenticated;
create or replace function public.revoke_wedding_member(p_wedding uuid,p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$ begin
 if not exists(select 1 from public.weddings where id=p_wedding and owner_id=auth.uid()) then raise exception 'Owner required'; end if;
 delete from public.wedding_members where wedding_id=p_wedding and user_id=p_user and role<>'owner';
 if not found then raise exception 'Member not found'; end if;
 insert into public.wedding_audit_log(wedding_id,actor_id,event,detail) values(p_wedding,auth.uid(),'member_revoked',jsonb_build_object('member_id',p_user));
end $$;
revoke all on function public.revoke_wedding_member(uuid,uuid) from public;
grant execute on function public.revoke_wedding_member(uuid,uuid) to authenticated;
-- Audit updates to modules, regardless of which authorized client performs them.
create or replace function public.audit_module_change()
returns trigger language plpgsql security definer set search_path = '' as $$ begin
 insert into public.wedding_audit_log(wedding_id,actor_id,event,module,detail)
 values(new.wedding_id,auth.uid(),lower(tg_op),new.module,jsonb_build_object('timestamp',now()));
 return new;
end $$;
drop trigger if exists wedding_module_audit on public.wedding_modules;
create trigger wedding_module_audit after insert or update on public.wedding_modules
 for each row execute function public.audit_module_change();
-- Retain old data and all previous RLS policies. No destructive DDL.
