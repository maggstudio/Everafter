-- Resend delivery tracking for WEDLY invitations.
alter table public.invitation_email_log
 drop constraint if exists invitation_email_log_status_check;
alter table public.invitation_email_log
 add constraint invitation_email_log_status_check
 check (status in ('sending','sent','delivered','bounced','complained','failed'));
create unique index if not exists invitation_email_log_provider_id_unique
 on public.invitation_email_log(provider_id) where provider_id is not null;
