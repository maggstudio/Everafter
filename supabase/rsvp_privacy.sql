begin;
-- Preserve the existing one-time-link behavior and remove cached plaintext tokens
-- when a response consumes the link or an organizer revokes it.
create or replace function public.wedly_clear_rsvp_secret() returns trigger
language plpgsql security definer set search_path='' as $clear$
begin
 if new.revoked_at is not null or new.responded_at is not null then
  delete from public.rsvp_share_secrets where wedding_id=new.wedding_id and guest_id=new.guest_id;
 end if;
 return new;
end;
$clear$;
revoke all on function public.wedly_clear_rsvp_secret() from public,anon,authenticated;
drop trigger if exists wedly_clear_rsvp_secret on public.event_rsvp;
create trigger wedly_clear_rsvp_secret after update on public.event_rsvp
for each row execute function public.wedly_clear_rsvp_secret();
delete from public.rsvp_share_secrets s using public.event_rsvp r
where s.wedding_id=r.wedding_id and s.guest_id=r.guest_id
and (r.revoked_at is not null or r.responded_at is not null);
commit;
