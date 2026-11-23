-- WEDLY contact inbox: repair service-role grants without exposing messages publicly.
-- Safe to rerun in Supabase SQL Editor.
begin;
grant usage on schema public to service_role;
grant select,insert,update,delete on table public.contact_messages to service_role;
grant select,insert,update,delete on table public.contact_rate_limits to service_role;
grant usage,select on all sequences in schema public to service_role;
-- Explicitly prevent public/client access; only server service_role can read and write.
revoke all on table public.contact_messages from public,anon,authenticated;
revoke all on table public.contact_rate_limits from public,anon,authenticated;
alter table public.contact_messages enable row level security;
alter table public.contact_rate_limits enable row level security;
-- Service role has BYPASSRLS in Supabase; ensure its privileges have not been accidentally revoked.
grant execute on function public.contact_consume_limit(text) to service_role;
commit;
-- Diagnostic: both columns should be true.
select
 has_table_privilege('service_role','public.contact_messages','INSERT') as service_can_insert_messages,
 has_table_privilege('service_role','public.contact_messages','SELECT') as service_can_read_messages,
 has_table_privilege('service_role','public.contact_rate_limits','INSERT') as service_can_insert_limits;
