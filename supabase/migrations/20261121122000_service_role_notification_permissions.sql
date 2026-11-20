-- Restore server-side access to private email/notification tables.
-- RLS remains enabled; no policies are granted to anon/authenticated users.
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.rsvp_notification_queue to service_role;
grant select, insert, update, delete on table public.rsvp_notification_delivery to service_role;
grant usage, select on sequence public.rsvp_notification_queue_id_seq to service_role;
grant select, insert, update, delete on table public.invitation_email_log to service_role;
-- Keep private data inaccessible to browser roles.
revoke all on table public.rsvp_notification_queue from anon, authenticated;
revoke all on table public.rsvp_notification_delivery from anon, authenticated;
