-- WEDLY contact inbox. Run manually in Supabase SQL Editor.
begin;
create table if not exists public.contact_messages(
 id uuid primary key default gen_random_uuid(),
 sender_name text not null check(char_length(sender_name) between 2 and 120),
 sender_email text not null check(char_length(sender_email) between 5 and 254),
 category text not null check(category in ('suggestion','problem','question','other')),
 subject text not null check(char_length(subject) between 3 and 160),
 message text not null check(char_length(message) between 10 and 4000),
 user_id uuid references auth.users(id) on delete set null,
 status text not null default 'new' check(status in ('new','answered')),
 created_at timestamptz not null default now(),
 answered_at timestamptz,
 reply_text text,
 reply_provider_id text,
 reply_error text
);
create index if not exists contact_messages_created_idx on public.contact_messages(created_at desc);
create index if not exists contact_messages_status_idx on public.contact_messages(status,created_at desc);
alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from public,anon,authenticated;
-- The service-role API alone inserts and reads messages, after server-side authorization.
-- Keep message bodies inaccessible to authenticated clients and to anonymous users.
create table if not exists public.contact_rate_limits(
 fingerprint text not null,
 window_start timestamptz not null,
 count integer not null default 1,
 primary key(fingerprint,window_start)
);
alter table public.contact_rate_limits enable row level security;
revoke all on public.contact_rate_limits from public,anon,authenticated;
create or replace function public.contact_consume_limit(p_fingerprint text)
returns boolean language plpgsql security definer set search_path=''
as $$
declare n integer;
begin
 if auth.role() <> 'service_role' then raise exception 'Forbidden' using errcode='42501'; end if;
 insert into public.contact_rate_limits(fingerprint,window_start,count)
 values(p_fingerprint,date_trunc('hour',now()),1)
 on conflict(fingerprint,window_start) do update set count=public.contact_rate_limits.count+1
 returning count into n;
 return n <= 5;
end;
$$;
revoke all on function public.contact_consume_limit(text) from public,anon,authenticated;
grant execute on function public.contact_consume_limit(text) to service_role;
commit;
