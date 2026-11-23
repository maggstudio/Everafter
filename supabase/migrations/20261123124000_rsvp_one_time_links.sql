-- Apply this migration in Supabase to enforce one-time RSVP links at the database level.
-- Existing rsvp_view/rsvp_respond reject revoked links; a successful first response
-- now revokes the token in the same atomic UPDATE as the response.
create or replace function public.wedly_consume_rsvp_link()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.responded_at is null and new.responded_at is not null then
    new.revoked_at := coalesce(new.revoked_at, clock_timestamp());
  end if;
  return new;
end;
$$;

drop trigger if exists wedly_rsvp_one_time on public.event_rsvp;
create trigger wedly_rsvp_one_time
before update on public.event_rsvp
for each row
execute function public.wedly_consume_rsvp_link();

comment on function public.wedly_consume_rsvp_link() is
  'Automatically invalidates an RSVP token on its first recorded response. Organizers may issue a new token using rsvp_issue.';
