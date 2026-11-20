-- Idempotent daily email deliveries, one record per member/event/local date.
create table if not exists public.notification_delivery (
 wedding_id uuid not null,
 user_id uuid not null,
 kind text not null check (kind in ('daily_digest')),
 delivery_date date not null,
 status text not null default 'processing' check (status in ('processing','sent','failed')),
 provider_id text,
 updated_at timestamptz not null default now(),
 primary key(wedding_id,user_id,kind,delivery_date)
);
alter table public.notification_delivery enable row level security;
-- Deliberately no authenticated grants or policies: service role only.
