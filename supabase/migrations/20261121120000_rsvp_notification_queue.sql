-- Capture RSVP changes at the database layer, including responses submitted from public links.
create table if not exists public.rsvp_notification_queue (
 id bigint generated always as identity primary key,
 wedding_id uuid not null,
 guest_id text,
 guest_name text not null default 'Invitat',
 response_status text not null,
 party_size integer not null default 0,
 created_at timestamptz not null default now(),
 processed_at timestamptz,
 attempts integer not null default 0
);
create index if not exists rsvp_notification_queue_pending on public.rsvp_notification_queue(created_at) where processed_at is null;
alter table public.rsvp_notification_queue enable row level security;
-- No policies: only service role may read or process notifications.
create or replace function public.wedly_queue_rsvp_notification()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
 payload jsonb := to_jsonb(new);
 previous jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
 event_id uuid;
begin
 if tg_op = 'UPDATE' and
    (payload->>'status') is not distinct from (previous->>'status') and
    (payload->>'party_size') is not distinct from (previous->>'party_size') and
    (payload->>'dietary_notes') is not distinct from (previous->>'dietary_notes') then
   return new;
 end if;
 if payload->>'status' not in ('confirmat','refuzat') then return new; end if;
 event_id := nullif(payload->>'wedding_id','')::uuid;
 if event_id is null then return new; end if;
 insert into public.rsvp_notification_queue(wedding_id,guest_id,guest_name,response_status,party_size)
 values(event_id,coalesce(payload->>'guest_id',payload->>'id'),coalesce(nullif(payload->>'guest_name',''),'Invitat'),payload->>'status',coalesce(nullif(payload->>'party_size','')::integer,0));
 return new;
end;
$$;
drop trigger if exists wedly_rsvp_notification on public.event_rsvp;
create trigger wedly_rsvp_notification after insert or update on public.event_rsvp
for each row execute function public.wedly_queue_rsvp_notification();
revoke all on function public.wedly_queue_rsvp_notification() from public, anon, authenticated;
