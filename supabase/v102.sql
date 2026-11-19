-- WEDLY v1.0.2 RSVP. Apply once after v101.sql. No existing data deleted.
create extension if not exists pgcrypto with schema extensions;
create table if not exists public.event_rsvp (
 id uuid primary key default gen_random_uuid(),
 wedding_id uuid not null references public.weddings(id) on delete cascade,
 guest_id text not null,
 guest_name text not null,
 token_hash text not null unique,
 status text not null default 'asteptare' check(status in ('asteptare','confirmat','refuzat')),
 party_size integer not null default 1 check(party_size between 1 and 20),
 dietary_notes text not null default '',
 expires_at timestamptz not null default (now()+interval '90 days'),
 revoked_at timestamptz,
 responded_at timestamptz,
 created_at timestamptz not null default now(),
 unique(wedding_id,guest_id)
);
create index if not exists event_rsvp_wedding_idx on public.event_rsvp(wedding_id);
alter table public.event_rsvp enable row level security;
revoke all on public.event_rsvp from anon,authenticated;
-- No direct table access. All access goes through narrowly scoped RPCs.
create or replace function public.rsvp_issue(p_wedding uuid,p_guest_id text,p_guest_name text)
returns text language plpgsql security definer set search_path='' as $$
declare t text; begin
 if auth.uid() is null or not public.wedding_can(p_wedding,'guests','write') then raise exception 'Acces interzis'; end if;
 if length(btrim(coalesce(p_guest_id,''))) not between 1 and 100 or length(btrim(coalesce(p_guest_name,''))) not between 1 and 150 then raise exception 'Date invitat invalide'; end if;
 if not exists(select 1 from public.wedding_modules wm, jsonb_array_elements(wm.content) g where wm.wedding_id=p_wedding and wm.module='guests' and g->>'id'=p_guest_id) then raise exception 'Invitat inexistent'; end if;
 t:=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.event_rsvp(wedding_id,guest_id,guest_name,token_hash)
 values(p_wedding,p_guest_id,btrim(p_guest_name),encode(extensions.digest(t,'sha256'),'hex'))
 on conflict(wedding_id,guest_id) do update set guest_name=excluded.guest_name,token_hash=excluded.token_hash,status='asteptare',party_size=1,dietary_notes='',expires_at=now()+interval '90 days',revoked_at=null,responded_at=null;
 return t;
end $$;
create or replace function public.rsvp_list(p_wedding uuid)
returns table(id uuid,guest_id text,guest_name text,status text,party_size integer,dietary_notes text,expires_at timestamptz,revoked_at timestamptz,responded_at timestamptz)
language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null or not public.wedding_can(p_wedding,'guests','read') then raise exception 'Acces interzis'; end if;
 return query select r.id,r.guest_id,r.guest_name,r.status,r.party_size,r.dietary_notes,r.expires_at,r.revoked_at,r.responded_at from public.event_rsvp r where r.wedding_id=p_wedding order by r.created_at desc;
end $$;
create or replace function public.rsvp_revoke(p_wedding uuid,p_guest_id text)
returns void language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null or not public.wedding_can(p_wedding,'guests','write') then raise exception 'Acces interzis'; end if;
 update public.event_rsvp set revoked_at=now() where wedding_id=p_wedding and guest_id=p_guest_id;
end $$;
create or replace function public.rsvp_view(p_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.event_rsvp%rowtype; begin
 if p_token is null or length(p_token)<>64 or p_token !~ '^[0-9a-f]{64}$' then return null; end if;
 select * into r from public.event_rsvp where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and revoked_at is null and expires_at>now();
 if not found then return null; end if;
 return jsonb_build_object('guest_name',r.guest_name,'status',r.status,'party_size',r.party_size,'dietary_notes',r.dietary_notes,'expires_at',r.expires_at);
end $$;
create or replace function public.rsvp_respond(p_token text,p_status text,p_party_size integer,p_dietary_notes text)
returns boolean language plpgsql security definer set search_path='' as $$
declare r public.event_rsvp%rowtype; begin
 if p_token is null or length(p_token)<>64 or p_token !~ '^[0-9a-f]{64}$' then return false; end if;
 if p_status not in ('confirmat','refuzat') or p_party_size is null or p_party_size not between 1 and 20 or length(coalesce(p_dietary_notes,''))>500 then raise exception 'Răspuns invalid'; end if;
 select * into r from public.event_rsvp where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and revoked_at is null and expires_at>now() for update;
 if not found then return false; end if;
 update public.event_rsvp set status=p_status,party_size=case when p_status='refuzat' then 0 else p_party_size end,dietary_notes=coalesce(p_dietary_notes,''),responded_at=now() where id=r.id;
 -- Keep the existing guests module in sync; serialize concurrent writes to the JSON module row.
 update public.wedding_modules wm set content=(select coalesce(jsonb_agg(case when g->>'id'=r.guest_id then jsonb_set(g,'{status}',to_jsonb(p_status),true) else g end order by ord),'[]'::jsonb) from jsonb_array_elements(wm.content) with ordinality as x(g,ord)),updated_at=now()
 where wm.wedding_id=r.wedding_id and wm.module='guests';
 return true;
end $$;
revoke all on function public.rsvp_issue(uuid,text,text) from public;
revoke all on function public.rsvp_list(uuid) from public;
revoke all on function public.rsvp_revoke(uuid,text) from public;
revoke all on function public.rsvp_view(text) from public;
revoke all on function public.rsvp_respond(text,text,integer,text) from public;
grant execute on function public.rsvp_issue(uuid,text,text),public.rsvp_list(uuid),public.rsvp_revoke(uuid,text) to authenticated;
grant execute on function public.rsvp_view(text),public.rsvp_respond(text,text,integer,text) to anon,authenticated;
