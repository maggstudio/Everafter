-- WEDLY: never recreate an event implicitly when the owner has deleted all events.
-- Legacy clients may still call ensure_my_wedding on login/refresh.
-- Keep the function for compatibility, but make it read-only.
create or replace function public.ensure_my_wedding()
returns uuid
language sql
security definer
set search_path = ''
as $$
  select w.id
  from public.weddings w
  where w.owner_id = (select auth.uid())
  order by w.created_at, w.id
  limit 1;
$$;
revoke all on function public.ensure_my_wedding() from public, anon;
grant execute on function public.ensure_my_wedding() to authenticated;
