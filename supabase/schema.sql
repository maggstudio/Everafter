-- SCHEMĂ PROPUSĂ PENTRU ETAPA DE INTEGRARE SUPABASE.
-- Nu este conectată încă la aplicația demo. Nu rulați în producție fără revizuirea politicilor RLS.
create extension if not exists pgcrypto;
create table public.weddings (id uuid primary key default gen_random_uuid(), first_partner text not null, second_partner text not null, wedding_date date not null, city text not null, estimated_budget numeric(12,2) not null default 0, guest_estimate int not null default 0, created_at timestamptz not null default now());
create table public.wedding_members (wedding_id uuid not null references public.weddings(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, role text not null check (role in ('owner','partner','planner')), primary key(wedding_id,user_id));
create table public.tasks (id uuid primary key default gen_random_uuid(), wedding_id uuid not null references public.weddings(id) on delete cascade, title text not null, category text not null default 'General', done boolean not null default false, due_date date);
create table public.expenses (id uuid primary key default gen_random_uuid(), wedding_id uuid not null references public.weddings(id) on delete cascade, name text not null, amount numeric(12,2) not null check(amount>=0), created_at timestamptz not null default now());
create table public.guests (id uuid primary key default gen_random_uuid(), wedding_id uuid not null references public.weddings(id) on delete cascade, full_name text not null, status text not null default 'asteptare' check(status in ('asteptare','confirmat','refuzat')));
create table public.feature_catalog (id text primary key, label text not null, enabled boolean not null default true);
create table public.plans (id text primary key, name text not null, price_ron numeric(12,2) not null check(price_ron>=0));
create table public.plan_features (plan_id text not null references public.plans(id) on delete cascade, feature_id text not null references public.feature_catalog(id) on delete cascade, primary key(plan_id,feature_id));
create table public.wedding_entitlements (wedding_id uuid not null references public.weddings(id) on delete cascade, feature_id text not null references public.feature_catalog(id), source text not null check(source in ('plan','addon','manual')), valid_until timestamptz, primary key(wedding_id,feature_id,source));
-- RLS: accesul doar pentru membrii evenimentului. Politicile de scriere se vor defini după implementarea autentificării.
alter table public.weddings enable row level security;
alter table public.wedding_members enable row level security;
alter table public.tasks enable row level security;
alter table public.expenses enable row level security;
alter table public.guests enable row level security;
alter table public.feature_catalog enable row level security;
alter table public.plans enable row level security;
alter table public.plan_features enable row level security;
alter table public.wedding_entitlements enable row level security;
