-- WEDLY v1.1.1: audit și rezervare anti-duplicat pentru emailuri.
create table if not exists public.invitation_email_log (
 id uuid primary key default gen_random_uuid(),
 wedding_id uuid not null,
 guest_id text not null,
 recipient_email text not null,
 rsvp_url text not null,
 status text not null default 'sending' check (status in ('sending','sent','failed')),
 provider_id text,
 error text,
 sent_at timestamptz,
 created_at timestamptz not null default now(),
 unique(wedding_id,guest_id)
);
create index if not exists invitation_email_log_wedding_idx on public.invitation_email_log(wedding_id);
alter table public.invitation_email_log enable row level security;
-- Accesul la log se face doar prin serverul cu service role, după verificarea drepturilor.
revoke all on public.invitation_email_log from anon, authenticated;
