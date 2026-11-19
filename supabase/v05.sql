-- EVERAFTER v0.5. Run AFTER v04.sql. Keeps wedding_workspaces untouched.
create extension if not exists pgcrypto;
create table if not exists public.weddings (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now());
create unique index if not exists weddings_owner_unique on public.weddings(owner_id);
create table if not exists public.wedding_members (
 wedding_id uuid not null references public.weddings(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('owner','partner','planner')),
 status text not null default 'active' check(status in ('active','pending')),
 permissions jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 primary key(wedding_id,user_id));
create table if not exists public.wedding_modules (
 wedding_id uuid not null references public.weddings(id) on delete cascade,
 module text not null check(module in ('wedding','tasks','expenses','guests','calendar','packages')),
 content jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now(),
 primary key(wedding_id,module));
create index if not exists wedding_members_user_idx on public.wedding_members(user_id);

-- Helper functions are SECURITY DEFINER so RLS policies do not recurse.
create or replace function public.wedding_can(p_wedding uuid,p_module text,p_action text)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.wedding_members m
 where m.wedding_id=p_wedding and m.user_id=(select auth.uid()) and m.status='active'
 and (m.role='owner' or coalesce((m.permissions -> p_module ->> p_action)::boolean,false)))
$$;
revoke all on function public.wedding_can(uuid,text,text) from public;
grant execute on function public.wedding_can(uuid,text,text) to authenticated;

alter table public.weddings enable row level security;
alter table public.wedding_members enable row level security;
alter table public.wedding_modules enable row level security;
revoke all on public.weddings,public.wedding_members,public.wedding_modules from anon;
grant select on public.weddings,public.wedding_members,public.wedding_modules to authenticated;
grant insert,update,delete on public.wedding_modules to authenticated;

drop policy if exists weddings_read on public.weddings;
create policy weddings_read on public.weddings for select to authenticated using (public.wedding_can(id,'wedding','read'));
drop policy if exists members_read on public.wedding_members;
create policy members_read on public.wedding_members for select to authenticated using (public.wedding_can(wedding_id,'members','read') or user_id=(select auth.uid()));
drop policy if exists modules_read on public.wedding_modules;
create policy modules_read on public.wedding_modules for select to authenticated using (public.wedding_can(wedding_id,module,'read'));
drop policy if exists modules_insert on public.wedding_modules;
create policy modules_insert on public.wedding_modules for insert to authenticated with check (public.wedding_can(wedding_id,module,'write'));
drop policy if exists modules_update on public.wedding_modules;
create policy modules_update on public.wedding_modules for update to authenticated using (public.wedding_can(wedding_id,module,'write')) with check (public.wedding_can(wedding_id,module,'write'));
-- No direct deletes; protects migrated data.

-- Owner workspace bootstrap and migration. Safe to rerun. Legacy rows are NEVER deleted or overwritten.
create or replace function public.ensure_my_wedding()
returns uuid language plpgsql security definer set search_path = '' as $$
declare wid uuid; old_data jsonb; begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select id into wid from public.weddings where owner_id=auth.uid();
 if wid is not null then return wid; end if;
 insert into public.weddings(owner_id) values(auth.uid()) on conflict(owner_id) do nothing;
 select id into wid from public.weddings where owner_id=auth.uid();
 insert into public.wedding_members(wedding_id,user_id,role,status,permissions)
 values(wid,auth.uid(),'owner','active','{}') on conflict do nothing;
 select wedding_data into old_data from public.wedding_workspaces where user_id=auth.uid();
 insert into public.wedding_modules(wedding_id,module,content)
 select wid,x.module,coalesce(old_data -> x.field,x.fallback)
 from (values ('wedding','wedding','{}'::jsonb),('tasks','tasks','[]'::jsonb),
 ('expenses','expenses','[]'::jsonb),('guests','guests','[]'::jsonb),
 ('packages','packages','[]'::jsonb),('calendar','appointments','[]'::jsonb)) as x(module,field,fallback)
 on conflict do nothing;
 return wid;
end $$;
revoke all on function public.ensure_my_wedding() from public;
grant execute on function public.ensure_my_wedding() to authenticated;

-- Invite an already registered user; no service key in browser. Invitation is pending until accepted.
create or replace function public.invite_wedding_member(p_wedding uuid,p_email text,p_role text,p_permissions jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare target_id uuid; begin
 if not exists(select 1 from public.weddings where id=p_wedding and owner_id=auth.uid()) then raise exception 'Only owner can invite'; end if;
 if p_role not in ('partner','planner') then raise exception 'Invalid role'; end if;
 if length(coalesce(p_email,''))>320 or length(coalesce(p_email,''))<3 then raise exception 'Invalid email'; end if;
 if jsonb_typeof(p_permissions) is distinct from 'object' then raise exception 'Invalid permissions'; end if;
 if exists(select 1 from jsonb_each(p_permissions) e where e.key not in ('wedding','tasks','expenses','guests','calendar','packages','members')) then raise exception 'Unknown module'; end if;
 if exists(select 1 from jsonb_each(p_permissions) e where jsonb_typeof(e.value)<>'object' or (e.value ? 'read' and jsonb_typeof(e.value->'read')<>'boolean') or (e.value ? 'write' and jsonb_typeof(e.value->'write')<>'boolean')) then raise exception 'Invalid permission values'; end if;
 select id into target_id from auth.users where lower(email)=lower(trim(p_email)) and email_confirmed_at is not null;
 if target_id is null then raise exception 'Contul nu există sau emailul nu este confirmat'; end if;
 if target_id=auth.uid() then raise exception 'Nu te poți invita singur'; end if;
 insert into public.wedding_members(wedding_id,user_id,role,status,permissions)
 values(p_wedding,target_id,p_role,'pending',p_permissions)
 on conflict(wedding_id,user_id) do update set role=excluded.role,permissions=excluded.permissions,status='pending'
 where public.wedding_members.role<>'owner';
end $$;
revoke all on function public.invite_wedding_member(uuid,text,text,jsonb) from public;
grant execute on function public.invite_wedding_member(uuid,text,text,jsonb) to authenticated;

create or replace function public.accept_wedding_invite(p_wedding uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
 update public.wedding_members set status='active' where wedding_id=p_wedding and user_id=auth.uid() and status='pending';
 if not found then raise exception 'Invitația nu a fost găsită'; end if;
end $$;
revoke all on function public.accept_wedding_invite(uuid) from public;
grant execute on function public.accept_wedding_invite(uuid) to authenticated;

create or replace function public.set_wedding_permissions(p_wedding uuid,p_user uuid,p_permissions jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if not exists(select 1 from public.weddings where id=p_wedding and owner_id=auth.uid()) then raise exception 'Only owner can change permissions'; end if;
 if jsonb_typeof(p_permissions) is distinct from 'object' then raise exception 'Invalid permissions'; end if;
 if exists(select 1 from jsonb_each(p_permissions) e where e.key not in ('wedding','tasks','expenses','guests','calendar','packages','members') or jsonb_typeof(e.value)<>'object' or (e.value ? 'read' and jsonb_typeof(e.value->'read')<>'boolean') or (e.value ? 'write' and jsonb_typeof(e.value->'write')<>'boolean')) then raise exception 'Invalid permissions'; end if;
 update public.wedding_members set permissions=p_permissions where wedding_id=p_wedding and user_id=p_user and role<>'owner';
 if not found then raise exception 'Member not found'; end if;
end $$;
revoke all on function public.set_wedding_permissions(uuid,uuid,jsonb) from public;
grant execute on function public.set_wedding_permissions(uuid,uuid,jsonb) to authenticated;
