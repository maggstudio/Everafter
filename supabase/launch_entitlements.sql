begin;
create table if not exists public.wedly_launch_policy (
 singleton boolean primary key default true check(singleton),
 closed_at timestamptz
);
insert into public.wedly_launch_policy(singleton) values(true) on conflict do nothing;
create table if not exists public.wedly_launch_entitlements (
 wedding_id uuid primary key references public.weddings(id) on delete cascade,
 granted_at timestamptz not null default now()
);
alter table public.wedly_launch_policy enable row level security;
alter table public.wedly_launch_entitlements enable row level security;
revoke all on public.wedly_launch_policy,public.wedly_launch_entitlements from public,anon,authenticated;
create or replace function public.wedly_grant_launch_access() returns trigger
language plpgsql security definer set search_path='' as $$
declare cutoff timestamptz;
begin
 select closed_at into cutoff from public.wedly_launch_policy where singleton for share;
 if cutoff is null then
 insert into public.wedly_launch_entitlements(wedding_id) values(new.id) on conflict do nothing;
 end if;
 return new;
end $$;
revoke all on function public.wedly_grant_launch_access() from public,anon,authenticated;
drop trigger if exists wedly_launch_access on public.weddings;
create trigger wedly_launch_access after insert on public.weddings for each row execute function public.wedly_grant_launch_access();
insert into public.wedly_launch_entitlements(wedding_id)
select w.id from public.weddings w cross join public.wedly_launch_policy p
where p.singleton and (p.closed_at is null or w.created_at < p.closed_at)
on conflict do nothing;
create or replace function public.wedly_has_launch_access(p_wedding uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.wedly_launch_entitlements e where e.wedding_id=p_wedding)
 and exists(select 1 from public.wedding_members m where m.wedding_id=p_wedding and m.user_id=auth.uid() and m.status='active');
$$;
revoke all on function public.wedly_has_launch_access(uuid) from public,anon;
grant execute on function public.wedly_has_launch_access(uuid) to authenticated;
-- Future activation only, by database administrator, after paid access enforcement is ready:
-- update public.wedly_launch_policy set closed_at=now() where singleton and closed_at is null;
-- Never delete existing entitlements when closing the promotion.
commit;
notify pgrst, 'reload schema';
