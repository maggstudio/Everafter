begin;
create table if not exists public.wedly_activity (
 id bigint generated always as identity primary key,
 wedding_id uuid not null,
 actor_id uuid,
 module text not null,
 action text not null,
 created_at timestamptz not null default now()
);
create index if not exists wedly_activity_event_idx on public.wedly_activity(wedding_id,created_at desc);
alter table public.wedly_activity enable row level security;
revoke all on public.wedly_activity from public,anon,authenticated;
grant select on public.wedly_activity to authenticated;
drop policy if exists wedly_activity_read on public.wedly_activity;
create policy wedly_activity_read on public.wedly_activity for select to authenticated using (
 exists(select 1 from public.wedding_members m where m.wedding_id=wedly_activity.wedding_id and m.user_id=auth.uid() and m.status='active' and (m.role='owner' or (m.permissions->'wedding'->>'read'='true' and m.permissions->(case when wedly_activity.module='vendors' then 'expenses' else wedly_activity.module end)->>'read'='true')))
);
create or replace function public.wedly_record_activity() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  if old.content is not distinct from new.content then return new; end if;
 end if;
 if TG_OP='DELETE' then
  insert into public.wedly_activity(wedding_id,actor_id,module,action) values(old.wedding_id,auth.uid(),old.module,'deleted');
  return old;
 end if;
 insert into public.wedly_activity(wedding_id,actor_id,module,action) values(new.wedding_id,auth.uid(),new.module,case when TG_OP='INSERT' then 'created' else 'updated' end);
 return new;
end;
$$;
revoke all on function public.wedly_record_activity() from public,anon,authenticated;
drop trigger if exists wedly_activity_trigger on public.wedding_modules;
create trigger wedly_activity_trigger after insert or update or delete on public.wedding_modules for each row execute function public.wedly_record_activity();
commit;
