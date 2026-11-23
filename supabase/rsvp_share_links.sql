-- WEDLY: reuse one private RSVP invitation token across organizer sharing channels.
-- Apply in Supabase SQL Editor before deploying the matching frontend.
-- Only authenticated event owners or active members with guests.write can retrieve tokens.
begin;
create table if not exists public.rsvp_share_secrets (
 wedding_id uuid not null references public.weddings(id) on delete cascade,
 guest_id uuid not null,
 token text not null,
 created_at timestamptz not null default now(),
 primary key(wedding_id,guest_id)
);
alter table public.rsvp_share_secrets enable row level security;
revoke all on public.rsvp_share_secrets from public,anon,authenticated;

create or replace function public.rsvp_share_link(p_wedding uuid,p_guest_id uuid,p_guest_name text)
returns text language plpgsql security definer set search_path = '' as $$
declare secret text; state jsonb; begin
 if auth.uid() is null or not exists(
   select 1 from public.wedding_members m
   where m.wedding_id=p_wedding and m.user_id=auth.uid() and m.status='active'
   and (m.role='owner' or coalesce((m.permissions->'guests'->>'write')::boolean,false))
 ) then raise exception 'Permission denied'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_wedding::text||':'||p_guest_id::text,923));
 select to_jsonb(r) into state from public.rsvp_list(p_wedding) r where r.guest_id::text=p_guest_id::text limit 1;
 if state is not null and state->>'responded_at' is not null then
   raise exception 'Invitatul a răspuns deja.';
 end if;
 select token into secret from public.rsvp_share_secrets where wedding_id=p_wedding and guest_id=p_guest_id;
 if secret is not null and state is not null and state->>'revoked_at' is null
    and (state->>'expires_at' is null or (state->>'expires_at')::timestamptz>now()) then
   return secret;
 end if;
 secret:=public.rsvp_issue(p_wedding,p_guest_id,p_guest_name);
 insert into public.rsvp_share_secrets(wedding_id,guest_id,token)
 values(p_wedding,p_guest_id,secret)
 on conflict(wedding_id,guest_id) do update set token=excluded.token,created_at=now();
 return secret;
end $$;
revoke all on function public.rsvp_share_link(uuid,uuid,text) from public;
grant execute on function public.rsvp_share_link(uuid,uuid,text) to authenticated;

create or replace function public.rsvp_cancel_shared_link(p_wedding uuid,p_guest_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or not exists(
   select 1 from public.wedding_members m
   where m.wedding_id=p_wedding and m.user_id=auth.uid() and m.status='active'
   and (m.role='owner' or coalesce((m.permissions->'guests'->>'write')::boolean,false))
 ) then raise exception 'Permission denied'; end if;
 perform public.rsvp_revoke(p_wedding,p_guest_id);
 delete from public.rsvp_share_secrets where wedding_id=p_wedding and guest_id=p_guest_id;
end $$;
revoke all on function public.rsvp_cancel_shared_link(uuid,uuid) from public;
grant execute on function public.rsvp_cancel_shared_link(uuid,uuid) to authenticated;
commit;
