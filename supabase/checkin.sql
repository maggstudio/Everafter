begin;
create table if not exists public.wedly_checkins (
 wedding_id uuid not null,
 guest_id text not null,
 checked_at timestamptz not null default now(),
 checked_by uuid not null,
 primary key(wedding_id,guest_id)
);
alter table public.wedly_checkins enable row level security;
revoke all on public.wedly_checkins from public,anon,authenticated;
grant select on public.wedly_checkins to authenticated;
drop policy if exists checkin_read on public.wedly_checkins;
create policy checkin_read on public.wedly_checkins for select to authenticated using (
 exists(select 1 from public.wedding_members m where m.wedding_id=wedly_checkins.wedding_id and m.user_id=auth.uid() and m.status='active' and (m.role='owner' or m.permissions->'guests'->>'read'='true'))
);
create or replace function public.wedly_checkin(p_wedding uuid,p_guest text,p_undo boolean default false) returns text
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.wedding_members m where m.wedding_id=p_wedding and m.user_id=auth.uid() and m.status='active' and (m.role='owner' or (m.permissions->'guests'->>'read'='true' and m.permissions->'guests'->>'write'='true'))) then raise exception 'Acces interzis'; end if;
 if p_undo then
 delete from public.wedly_checkins where wedding_id=p_wedding and guest_id=p_guest;
 return 'removed';
 end if;
 if not exists(select 1 from public.wedding_modules m cross join lateral jsonb_array_elements(m.content::jsonb) g where m.wedding_id=p_wedding and m.module='guests' and g->>'id'=p_guest) then raise exception 'Invitat inexistent'; end if;
 insert into public.wedly_checkins(wedding_id,guest_id,checked_by) values(p_wedding,p_guest,auth.uid()) on conflict do nothing;
 if found then return 'checked'; end if;
 return 'duplicate';
end;
$$;
revoke all on function public.wedly_checkin(uuid,text,boolean) from public,anon;
grant execute on function public.wedly_checkin(uuid,text,boolean) to authenticated;
commit;
