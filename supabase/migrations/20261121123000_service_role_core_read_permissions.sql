-- WEDLY server-side notification processing needs to read these protected tables.
-- Grant only SELECT to service_role. Existing RLS policies for user-facing roles remain unchanged.
grant usage on schema public to service_role;
grant select on table public.notification_preferences to service_role;
grant select on table public.wedding_members to service_role;
grant select on table public.wedding_modules to service_role;
