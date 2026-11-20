-- WEDLY RSVP: permit 0 attendees for declined invitations.
-- Existing RSVP functions can set party_size=0 when status='refuzat'.
-- Confirmed attendance must remain between 1 and 20.
alter table public.event_rsvp
  drop constraint if exists event_rsvp_party_size_check;
alter table public.event_rsvp
  add constraint event_rsvp_party_size_check
  check (
    (status = 'refuzat' and party_size between 0 and 20)
    or
    (status <> 'refuzat' and party_size between 1 and 20)
  );
