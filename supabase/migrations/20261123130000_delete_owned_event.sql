-- WEDLY: permanent deletion of an event and all dependent relational records.
-- All event-owned tables must reference public.weddings(id) ON DELETE CASCADE.
-- Deletion is atomic; foreign-key RESTRICT errors abort the transaction.
create or replace function public.delete_my_event(p_wedding uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;
  delete from public.weddings
   where id=p_wedding and owner_id=auth.uid();
  if not found then
    raise exception 'Only the event owner may delete this event' using errcode='42501';
  end if;
  return true;
end;
$$;
revoke all on function public.delete_my_event(uuid) from public, anon;
grant execute on function public.delete_my_event(uuid) to authenticated;
