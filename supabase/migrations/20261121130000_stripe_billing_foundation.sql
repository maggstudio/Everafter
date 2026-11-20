-- WEDLY: Stripe billing foundation. No client-side purchase can grant access.
create table if not exists public.wedly_billing (
 wedding_id uuid primary key,
 stripe_customer_id text unique,
 stripe_checkout_session_id text unique,
 stripe_payment_intent_id text unique,
 package_id text not null default 'start' check (package_id in ('start','premium','luxury')),
 status text not null default 'inactive' check (status in ('inactive','pending','paid','refunded')),
 amount_total integer,
 currency text not null default 'ron' check (currency='ron'),
 paid_at timestamptz,
 updated_at timestamptz not null default now()
);
create index if not exists wedly_billing_status_idx on public.wedly_billing(status);
alter table public.wedly_billing enable row level security;
revoke all on public.wedly_billing from anon, authenticated;
grant select,insert,update on public.wedly_billing to service_role;
-- Owners may inspect payment status but cannot create or alter it.
grant select on public.wedly_billing to authenticated;
drop policy if exists wedly_billing_owner_read on public.wedly_billing;
create policy wedly_billing_owner_read on public.wedly_billing for select to authenticated
 using (exists(select 1 from public.wedding_members m where m.wedding_id=wedly_billing.wedding_id and m.user_id=auth.uid() and m.role='owner' and m.status='active'));
