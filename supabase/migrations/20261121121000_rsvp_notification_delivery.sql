create table if not exists public.rsvp_notification_delivery (
 queue_id bigint not null references public.rsvp_notification_queue(id) on delete cascade,
 user_id uuid not null,
 status text not null default 'processing' check (status in ('processing','sent','failed')),
 provider_id text,
 created_at timestamptz not null default now(),
 primary key(queue_id,user_id)
);
alter table public.rsvp_notification_delivery enable row level security;
-- Only service role can access delivery records.
