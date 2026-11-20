-- WEDLY v1.1.1 hotfix: explicit service_role privileges for invitation email audit.
-- Keep anon/authenticated blocked; never grant these roles access to the log.
grant usage on schema public to service_role;
grant select, insert, update on table public.invitation_email_log to service_role;
-- Verify:
-- select has_table_privilege('service_role','public.invitation_email_log','SELECT') as can_read,
--        has_table_privilege('service_role','public.invitation_email_log','INSERT') as can_insert,
--        has_table_privilege('service_role','public.invitation_email_log','UPDATE') as can_update;
