begin;
-- Enforce published RSVP settings for all response paths, including direct RPC.
create or replace function public.wedly_validate_rsvp_settings() returns trigger
language plpgsql security definer set search_path='' as $validate$
declare cfg jsonb; max_guests integer; q jsonb; prefix text;
begin
 if new.responded_at is null or old.responded_at is not null then return new; end if;
 select m.content->'invitationDesign'->'studio'->'rsvp' into cfg from public.wedding_modules m where m.wedding_id=new.wedding_id and m.module='wedding';
 if cfg is null then return new; end if;
 if cfg->>'enabled'='false' then raise exception 'Confirmarea este dezactivată'; end if;
 max_guests:=20;
 if coalesce(cfg->>'maxGuests','') ~ '^[0-9]{1,2}$' then max_guests:=greatest(1,least(20,(cfg->>'maxGuests')::integer)); end if;
 if new.status='confirmat' then
 if new.party_size>max_guests then raise exception 'Numărul de persoane depășește limita'; end if;
 if jsonb_typeof(cfg->'questions')='array' then
 for q in select value from jsonb_array_elements(cfg->'questions') limit 5 loop
 if q->>'required'='true' and length(trim(coalesce(q->>'label','')))>0 then
 prefix:=left(trim(q->>'label'),80)||': ';
 if not exists(select 1 from regexp_split_to_table(coalesce(new.dietary_notes,''), E'\\n') as line where left(line,length(prefix))=prefix and length(trim(substr(line,length(prefix)+1)))>0 and (q->>'kind' is distinct from 'yesno' or trim(substr(line,length(prefix)+1)) in ('Da','Nu'))) then raise exception 'Completează întrebările obligatorii'; end if;
 end if;
 end loop;
 end if;
 end if;
 return new;
end;
$validate$;
revoke all on function public.wedly_validate_rsvp_settings() from public,anon,authenticated;
drop trigger if exists wedly_validate_rsvp_settings on public.event_rsvp;
create trigger wedly_validate_rsvp_settings before update on public.event_rsvp for each row execute function public.wedly_validate_rsvp_settings();
commit;
