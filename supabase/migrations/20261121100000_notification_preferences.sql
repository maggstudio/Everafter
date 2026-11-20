-- Personal notification preferences, scoped to an active wedding membership.
create table if not exists public.notification_preferences (
 wedding_id uuid not null,
 user_id uuid not null,
 rsvp_immediate boolean not null default false,
 daily_digest boolean not null default false,
 task_reminders boolean not null default false,
 appointment_reminders boolean not null default false,
 payment_reminders boolean not null default false,
 digest_hour smallint not null default 9 check (digest_hour between 0 and 23),
 updated_at timestamptz not null default now(),
 primary key (wedding_id,user_id)
);
alter table public.notification_preferences enable row level security;
drop policy if exists "members manage own notification preferences" on public.notification_preferences;
create policy "members manage own notification preferences" on public.notification_preferences
 for all to authenticated
 using (user_id = (select auth.uid()) and exists (
  select 1 from public.wedding_members m where m.wedding_id=notification_preferences.wedding_id
   and m.user_id=(select auth.uid()) and m.status='active'))
 with check (user_id = (select auth.uid()) and exists (
  select 1 from public.wedding_members m where m.wedding_id=notification_preferences.wedding_id
   and m.user_id=(select auth.uid()) and m.status='active'));
grant select,insert,update,delete on public.notification_preferences to authenticated;
