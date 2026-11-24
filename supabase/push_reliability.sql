begin;
-- Preserve the existing queue and deduplication keys.
alter table public.wedly_push_queue add column if not exists failure_reason text;
alter table public.wedly_push_queue add column if not exists failure_count integer not null default 0;
create index if not exists wedly_push_queue_finished on public.wedly_push_queue(finished_at) where state<>'pending';
create or replace function public.wedly_push_maintenance() returns void language plpgsql security invoker set search_path='' as $maintenance$
begin
 update public.wedly_push_queue set state='cancelled',failure_reason='expired'
 where state='pending' and created_at<now()-interval '7 days' and available_at<=now();
 delete from public.wedly_push_runs where started_at<now()-interval '90 days';
end;
$maintenance$;
revoke all on function public.wedly_push_maintenance() from public,anon,authenticated;
grant execute on function public.wedly_push_maintenance() to service_role;
-- Record assignment transitions at the source, atomically with the module update.
create or replace function public.wedly_push_assignment_event() returns trigger language plpgsql security definer set search_path='' as $assignment$
declare previous jsonb; task jsonb; prior jsonb; recipient text; event_id text;
begin
 if new.module <> 'tasks' or jsonb_typeof(new.content::jsonb) is distinct from 'array' then return new; end if;
 previous='[]'::jsonb;
 if tg_op='UPDATE' then
 if jsonb_typeof(old.content::jsonb)='array' then previous=old.content::jsonb; end if;
 end if;
 for task in select value from jsonb_array_elements(new.content::jsonb) loop
 recipient=task->>'assigneeId';
 if recipient is null or recipient='' or coalesce(task->>'id','')='' or task->>'done'='true' then continue; end if;
 select value into prior from jsonb_array_elements(previous) where value->>'id'=task->>'id' limit 1;
 if prior->>'assigneeId' is not distinct from recipient then continue; end if;
 event_id='assignment:'||(task->>'id')||':'||gen_random_uuid()::text;
 insert into public.wedly_push_queue(wedding_id,user_id,event_key,endpoint,body,view_name)
 select new.wedding_id,m.user_id,event_id,s.endpoint,left('Ai o sarcină atribuită: '||coalesce(task->>'title','Sarcină'),220),'tasks'
 from public.wedding_members m join public.push_subscriptions s on s.user_id=m.user_id
 left join public.wedly_push_preferences p on p.wedding_id=m.wedding_id and p.user_id=m.user_id
 where m.wedding_id=new.wedding_id and m.user_id::text=recipient and m.status='active'
 and (m.role='owner' or m.permissions::jsonb #>> '{tasks,read}'='true') and coalesce(p.assignments,true)
 on conflict(wedding_id,user_id,event_key,endpoint) do nothing;
 end loop;
 return new;
end;
$assignment$;
revoke all on function public.wedly_push_assignment_event() from public,anon,authenticated;
drop trigger if exists wedly_push_assignment_event on public.wedding_modules;
create trigger wedly_push_assignment_event after insert or update on public.wedding_modules for each row execute function public.wedly_push_assignment_event();
create or replace function public.wedly_push_event_mode() returns boolean language sql security invoker set search_path='' as $mode$ select true; $mode$;
revoke all on function public.wedly_push_event_mode() from public,anon,authenticated;
grant execute on function public.wedly_push_event_mode() to service_role;
commit;
notify pgrst,'reload schema';
