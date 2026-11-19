-- Rulați în Supabase SQL Editor. Schema v0.4 este independentă de schema demonstrativă v0.3.
create table if not exists public.wedding_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  wedding_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.wedding_workspaces enable row level security;
revoke all on public.wedding_workspaces from anon;
grant select, insert, update, delete on public.wedding_workspaces to authenticated;
drop policy if exists "workspace_select_own" on public.wedding_workspaces;
drop policy if exists "workspace_insert_own" on public.wedding_workspaces;
drop policy if exists "workspace_update_own" on public.wedding_workspaces;
drop policy if exists "workspace_delete_own" on public.wedding_workspaces;
create policy "workspace_select_own" on public.wedding_workspaces for select to authenticated using ((select auth.uid())=user_id);
create policy "workspace_insert_own" on public.wedding_workspaces for insert to authenticated with check ((select auth.uid())=user_id);
create policy "workspace_update_own" on public.wedding_workspaces for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "workspace_delete_own" on public.wedding_workspaces for delete to authenticated using ((select auth.uid())=user_id);
