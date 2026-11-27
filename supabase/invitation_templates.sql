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

-- Admin-only draft access.
create or replace function public.wedly_admin_invitation_templates()
returns setof public.invitation_templates language plpgsql stable security definer set search_path=''
as $
begin
 if not public.wedly_platform_admin() then raise exception 'Access denied' using errcode='42501'; end if;
 return query select * from public.invitation_templates;
end;
$;
-- Store only flat, allowlisted presentation fields keyed by stable block IDs.
-- Media is deliberately excluded until catalog membership can be validated.
create or replace function public.wedly_validate_template_design(p_design jsonb)
returns boolean language plpgsql immutable set search_path=''
as $
declare b record; f record;
begin
 if p_design is null or jsonb_typeof(p_design) <> 'object' or octet_length(p_design::text)>65536 then return false; end if;
 for b in select * from jsonb_each(p_design) loop
  if b.key !~ '^[a-zA-Z0-9_-]{1,64} or jsonb_typeof(b.value)<>'object' then return false; end if;
  for f in select * from jsonb_each(b.value) loop
   if f.key in ('size','padding','headingSize','overlay','radius','letterSpacing','galleryColumns') then
    if jsonb_typeof(f.value)<>'number' or (f.value::text)::numeric not between -20 and 200 then return false; end if;
   elsif f.key in ('background','color') then
    if jsonb_typeof(f.value)<>'string' or (f.value #>> '{}') !~ '^#[0-9a-fA-F]{6} then return false; end if;
   elsif f.key in ('font','headingFont') then
    if (f.value #>> '{}') not in ('Georgia','Arial','Garamond','Times New Roman','Verdana','Palatino','Trebuchet MS','Courier New','Tahoma','Book Antiqua','Cormorant Garamond','Playfair Display','Great Vibes','Lora','Montserrat','DM Serif Display') then return false; end if;
   elsif f.key='align' then
    if (f.value #>> '{}') not in ('left','center','right') then return false; end if;
   else return false;
   end if;
  end loop;
 end loop;
 return true;
end;
$;
create or replace function public.wedly_admin_save_template(p_key text,p_event_type text,p_design jsonb)
returns void language plpgsql security definer set search_path=''
as $
begin
 if not public.wedly_platform_admin() then raise exception 'Access denied' using errcode='42501'; end if;
 if not public.wedly_validate_template_design(p_design) then raise exception 'Invalid design' using errcode='22023'; end if;
 insert into public.invitation_templates(template_key,event_type,draft_design) values(p_key,p_event_type,p_design)
 on conflict(template_key,event_type) do update set draft_design=excluded.draft_design,updated_at=now();
end;
$;
create or replace function public.wedly_admin_publish_template(p_key text,p_event_type text)
returns void language plpgsql security definer set search_path=''
as $
begin
 if not public.wedly_platform_admin() then raise exception 'Access denied' using errcode='42501'; end if;
 update public.invitation_templates set published_design=draft_design,version=version+1,published_at=now(),updated_at=now()
 where template_key=p_key and event_type=p_event_type and draft_design is not null and public.wedly_validate_template_design(draft_design);
 if not found then raise exception 'No valid draft'; end if;
end;
$;
create or replace function public.wedly_admin_reset_template(p_key text,p_event_type text)
returns void language plpgsql security definer set search_path=''
as $
begin
 if not public.wedly_platform_admin() then raise exception 'Access denied' using errcode='42501'; end if;
 update public.invitation_templates set draft_design='{}'::jsonb,updated_at=now() where template_key=p_key and event_type=p_event_type;
end;
$;
revoke all on function public.wedly_validate_template_design(jsonb) from public,anon,authenticated;
revoke all on function public.wedly_admin_invitation_templates(),public.wedly_admin_save_template(text,text,jsonb),public.wedly_admin_publish_template(text,text),public.wedly_admin_reset_template(text,text) from public,anon,authenticated;
grant execute on function public.wedly_admin_invitation_templates(),public.wedly_admin_save_template(text,text,jsonb),public.wedly_admin_publish_template(text,text),public.wedly_admin_reset_template(text,text) to authenticated;

commit;
