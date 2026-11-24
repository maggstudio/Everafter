begin;
-- Transactional RSVP delivery; keep the legacy scanner for pre-migration responses.
create or replace function public.wedly_push_rsvp_event() returns trigger language plpgsql security definer set search_path='' as $rsvp$
declare k text; label text;
begin
 if new.responded_at is null or new.status not in ('confirmat','refuzat') then return new; end if;
 if tg_op='UPDATE' then
 if old.responded_at is not distinct from new.responded_at then return new; end if;
 end if;
 -- Match the existing PostgREST timestamp representation for deduplication.
 k='rsvp:'||new.guest_id||':'||to_char(new.responded_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS')||case when extract(microseconds from new.responded_at)::bigint%1000000=0 then '' else '.'||rtrim(to_char(extract(microseconds from new.responded_at)::bigint%1000000,'FM000000'),'0') end||'+00:00';
 select g->>'name' into label from public.wedding_modules w cross join lateral jsonb_array_elements(case when jsonb_typeof(w.content)='array' then w.content else '[]'::jsonb end) g where w.wedding_id=new.wedding_id and w.module='guests' and g->>'id'=new.guest_id limit 1;
 if label is null then return new; end if;
 insert into public.wedly_push_queue(wedding_id,user_id,event_key,endpoint,body,view_name)
 select new.wedding_id,m.user_id,k,s.endpoint,left(label||case when new.status='confirmat' then ' a confirmat participarea pentru '||coalesce(new.party_size,1)::text||' persoane.' else ' nu va participa la eveniment.' end,220),'guests'
 from public.wedding_members m join public.push_subscriptions s on s.user_id=m.user_id
 left join public.wedly_push_preferences p on p.wedding_id=m.wedding_id and p.user_id=m.user_id
 where m.wedding_id=new.wedding_id and m.status='active' and (m.role='owner' or m.permissions->'guests'->>'read'='true') and coalesce(p.rsvp,true)
 on conflict(wedding_id,user_id,event_key,endpoint) do nothing;
 return new;
end;
$rsvp$;
revoke all on function public.wedly_push_rsvp_event() from public,anon,authenticated;
drop trigger if exists wedly_push_rsvp_event on public.event_rsvp;
create trigger wedly_push_rsvp_event after insert or update on public.event_rsvp for each row execute function public.wedly_push_rsvp_event();
create index if not exists wedly_push_subscriptions_user_idx on public.push_subscriptions(user_id);
create index if not exists wedly_members_active_user_idx on public.wedding_members(user_id) where status='active';
commit;
notify pgrst,'reload schema';
