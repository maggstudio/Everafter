-- Reuse the existing per-day delivery ledger for the three reminder categories.
alter table public.notification_delivery drop constraint if exists notification_delivery_kind_check;
alter table public.notification_delivery add constraint notification_delivery_kind_check
 check (kind in ('daily_digest','task_reminders','appointment_reminders','payment_reminders'));
grant select,insert,update on public.notification_delivery to service_role;
