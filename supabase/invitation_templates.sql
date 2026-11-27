-- Global invitation design storage. Run in Supabase SQL Editor.
begin;
create table if not exists public.invitation_templates (
 template_key text not null check (template_key in ('classic','editorial','botanical','cinema','romantic','terracotta','champagne','royal','cloud','star','pop','disco','lemon','postcard','peach','picnic','bold','sunset','candy','confetti')),
 event_type text not null check (event_type in ('wedding','baptism')),
 draft_design jsonb,
 published_design jsonb,
 version integer not null default 0,
 updated_at timestamptz not null default now(),
 published_at timestamptz,
 primary key(template_key,event_type),
 check (draft_design is null or (jsonb_typeof(draft_design)='object' and octet_length(draft_design::text)<=65536)),
 check (published_design is null or (jsonb_typeof(published_design)='object' and octet_length(published_design::text)<=65536))
);
alter table public.invitation_templates enable row level security;
revoke all on public.invitation_templates from public,anon,authenticated;
-- Published projection deliberately excludes drafts.
create or replace function public.wedly_published_invitation_templates(p_event_type text)
returns table(template_key text, published_design jsonb, version integer)
language sql stable security definer set search_path=''
as $$
 select t.template_key,t.published_design,t.version
 from public.invitation_templates t
 where auth.uid() is not null and t.event_type=p_event_type and t.published_design is not null;
$$;
revoke all on function public.wedly_published_invitation_templates(text) from public;
grant execute on function public.wedly_published_invitation_templates(text) to authenticated;
commit;
