-- WEDLY v0.8: multiple independent events per owner. Run once after v06.sql.
-- Back up weddings, wedding_members, wedding_modules, wedding_email_invitations first.
-- Existing event IDs, module data, permissions, and invitations are preserved.
begin;

-- v0.5 restricted one owned event per user through this unique index.
drop index if exists public.weddings_owner_unique;
create index if not exists weddings_owner_idx on public.weddings(owner_id);

-- Keep the legacy bootstrap RPC for older clients, but make it idempotently
-- return the oldest owned event instead of creating a new event on each login.
create or replace function public.ensure_my_wedding()
returns uuid language plpgsql security definer set search_path = '' as $$
declare wid uuid; old_data jsonb; begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select id into wid from public.weddings where owner_id=auth.uid() order by created_at,id limit 1;
 if wid is not null then
  insert into public.wedding_members(wedding_id,user_id,role,status,permissions)
  values(wid,auth.uid(),'owner','active','{}'::jsonb)
  on conflict(wedding_id,user_id) do nothing;
  return wid;
 end if;
 -- Prevent concurrent first-login calls from creating multiple initial events.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text, 842));
 select id into wid from public.weddings where owner_id=auth.uid() order by created_at,id limit 1;
 if wid is not null then return wid; end if;
 insert into public.weddings(owner_id) values(auth.uid()) returning id into wid;
 insert into public.wedding_members(wedding_id,user_id,role,status,permissions)
 values(wid,auth.uid(),'owner','active','{}'::jsonb);
 select wedding_data into old_data from public.wedding_workspaces where user_id=auth.uid();
 insert into public.wedding_modules(wedding_id,module,content)
 select wid,x.module,coalesce(old_data -> x.field,x.fallback)
 from (values ('wedding','wedding','{}'::jsonb),('tasks','tasks','[]'::jsonb),
 ('expenses','expenses','[]'::jsonb),('guests','guests','[]'::jsonb),
 ('packages','packages','[]'::jsonb),('calendar','appointments','[]'::jsonb)) as x(module,field,fallback)
 on conflict do nothing;
 return wid;
end $$;
revoke all on function public.ensure_my_wedding() from public;
grant execute on function public.ensure_my_wedding() to authenticated;

-- Atomic creation: only the authenticated user can create an owned event.
-- Use existing module keys so current RLS policies remain in force.
create or replace function public.create_my_event(p_type text,p_first text,p_second text,p_date date,p_city text,p_child_name text default '',p_godparents text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare wid uuid; details jsonb; begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_type not in ('wedding','baptism') then raise exception 'Unsupported event type'; end if;
 if length(btrim(coalesce(p_first,''))) not between 1 and 100 or length(btrim(coalesce(p_second,''))) not between 1 and 100 then raise exception 'Invalid participants'; end if;
 if p_date is null or length(btrim(coalesce(p_city,''))) not between 1 and 120 then raise exception 'Invalid date or city'; end if;
 if p_type='baptism' and length(btrim(coalesce(p_child_name,''))) not between 1 and 100 then raise exception 'Child name required'; end if;
 if length(coalesce(p_godparents,''))>200 then raise exception 'Godparents too long'; end if;
 insert into public.weddings(owner_id) values(auth.uid()) returning id into wid;
 insert into public.wedding_members(wedding_id,user_id,role,status,permissions)
 values(wid,auth.uid(),'owner','active','{}'::jsonb);
 details:=jsonb_build_object('eventType',p_type,'first',btrim(p_first),'second',btrim(p_second),
  'date',p_date::text,'city',btrim(p_city),'childName',btrim(coalesce(p_child_name,'')),
  'godparents',btrim(coalesce(p_godparents,'')),'budget',0,'guestEstimate',0,'packageId','start','addons','[]'::jsonb);
 insert into public.wedding_modules(wedding_id,module,content)
 values (wid,'wedding',details),(wid,'tasks','[]'::jsonb),(wid,'expenses','[]'::jsonb),
        (wid,'guests','[]'::jsonb),(wid,'packages','[{"id":"start","name":"Start","price":0,"features":[]},{"id":"premium","name":"Premium","price":149,"features":["invitatii","mese","buget"]},{"id":"luxury","name":"Luxury","price":299,"features":["invitatii","mese","contracte","remindere","buget"]}]'::jsonb),(wid,'calendar','[]'::jsonb);
 return wid;
end $$;
revoke all on function public.create_my_event(text,text,text,date,text,text,text) from public;
grant execute on function public.create_my_event(text,text,text,date,text,text,text) to authenticated;
commit;
