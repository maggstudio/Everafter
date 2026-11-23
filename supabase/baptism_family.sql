begin;
create or replace function public.create_my_event_with_elders(p_type text,p_first text,p_second text,p_date date,p_city text,p_child_name text default '',p_godparents text default '',p_elders text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare wid uuid; details jsonb; begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_type not in ('wedding','baptism') then raise exception 'Unsupported event type'; end if;
 if length(btrim(coalesce(p_first,''))) not between 1 and 100 or length(btrim(coalesce(p_second,''))) not between 1 and 100 then raise exception 'Invalid participants'; end if;
 if p_date is null or length(btrim(coalesce(p_city,''))) not between 1 and 120 then raise exception 'Invalid date or city'; end if;
 if p_type='baptism' and length(btrim(coalesce(p_child_name,''))) not between 1 and 100 then raise exception 'Child name required'; end if;
 if length(coalesce(p_godparents,''))>200 then raise exception 'Godparents too long'; end if;
 if length(coalesce(p_elders,''))>240 then raise exception 'Elders too long'; end if;
 insert into public.weddings(owner_id) values(auth.uid()) returning id into wid;
 insert into public.wedding_members(wedding_id,user_id,role,status,permissions)
 values(wid,auth.uid(),'owner','active','{}'::jsonb);
 details:=jsonb_build_object('eventType',p_type,'first',btrim(p_first),'second',btrim(p_second),
  'date',p_date::text,'city',btrim(p_city),'childName',btrim(coalesce(p_child_name,'')),
  'godparents',btrim(coalesce(p_godparents,'')),'childGrandparents',case when p_type='baptism' then btrim(coalesce(p_elders,'')) else '' end,'budget',0,'guestEstimate',0,'packageId','start','addons','[]'::jsonb);
 insert into public.wedding_modules(wedding_id,module,content)
 values (wid,'wedding',details),(wid,'tasks','[]'::jsonb),(wid,'expenses','[]'::jsonb),
        (wid,'guests','[]'::jsonb),(wid,'packages','[{"id":"start","name":"Start","price":0,"features":[]},{"id":"premium","name":"Premium","price":149,"features":["invitatii","mese","buget"]},{"id":"luxury","name":"Luxury","price":299,"features":["invitatii","mese","contracte","remindere","buget"]}]'::jsonb),(wid,'calendar','[]'::jsonb);
 return wid;
end $$;
revoke all on function public.create_my_event_with_elders(text,text,text,date,text,text,text,text) from public;
grant execute on function public.create_my_event_with_elders(text,text,text,date,text,text,text,text) to authenticated;
commit;
