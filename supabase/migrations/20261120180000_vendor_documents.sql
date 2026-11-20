-- WEDLY v1.3: private contract documents and event-scoped metadata.
create table if not exists public.vendor_documents (
 id uuid primary key default gen_random_uuid(),
 wedding_id uuid not null,
 vendor_id text not null,
 file_name text not null,
 storage_path text not null unique,
 file_size bigint not null check (file_size > 0 and file_size <= 10485760),
 status text not null default 'draft' check (status in ('draft','pending','signed')),
 created_by uuid not null default auth.uid(),
 created_at timestamptz not null default now(),
 constraint vendor_documents_name_length check (char_length(file_name) between 1 and 200)
);
create index if not exists vendor_documents_wedding_vendor_idx on public.vendor_documents(wedding_id,vendor_id);
alter table public.vendor_documents enable row level security;
grant select,insert,update,delete on public.vendor_documents to authenticated;

create or replace function public.vendor_documents_allowed(p_wedding uuid,p_write boolean)
returns boolean language sql stable security definer set search_path=public
as $$
 select exists (
  select 1 from public.wedding_members m
  where m.wedding_id=p_wedding and m.user_id=auth.uid() and m.status='active'
    and (m.role='owner' or
      case when p_write then coalesce((m.permissions->'expenses'->>'write')::boolean,false)
      else coalesce((m.permissions->'expenses'->>'read')::boolean,false) end)
 )
$$;
revoke all on function public.vendor_documents_allowed(uuid,boolean) from public;
grant execute on function public.vendor_documents_allowed(uuid,boolean) to authenticated;

drop policy if exists vendor_docs_read on public.vendor_documents;
create policy vendor_docs_read on public.vendor_documents for select to authenticated
 using (public.vendor_documents_allowed(wedding_id,false));
drop policy if exists vendor_docs_insert on public.vendor_documents;
create policy vendor_docs_insert on public.vendor_documents for insert to authenticated
 with check (public.vendor_documents_allowed(wedding_id,true) and created_by=auth.uid()
  and storage_path like wedding_id::text || '/' || vendor_id || '/%'
  and file_name ~* '\\.pdf$');
drop policy if exists vendor_docs_update on public.vendor_documents;
create policy vendor_docs_update on public.vendor_documents for update to authenticated
 using (public.vendor_documents_allowed(wedding_id,true))
 with check (public.vendor_documents_allowed(wedding_id,true));
drop policy if exists vendor_docs_delete on public.vendor_documents;
create policy vendor_docs_delete on public.vendor_documents for delete to authenticated
 using (public.vendor_documents_allowed(wedding_id,true));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('wedly-contracts','wedly-contracts',false,10485760,array['application/pdf'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['application/pdf'];

drop policy if exists wedly_contracts_read on storage.objects;
create policy wedly_contracts_read on storage.objects for select to authenticated
 using (bucket_id='wedly-contracts' and public.vendor_documents_allowed((split_part(name,'/',1))::uuid,false));
drop policy if exists wedly_contracts_upload on storage.objects;
create policy wedly_contracts_upload on storage.objects for insert to authenticated
 with check (bucket_id='wedly-contracts' and public.vendor_documents_allowed((split_part(name,'/',1))::uuid,true)
  and name ~* '\\.pdf$');
drop policy if exists wedly_contracts_delete on storage.objects;
create policy wedly_contracts_delete on storage.objects for delete to authenticated
 using (bucket_id='wedly-contracts' and public.vendor_documents_allowed((split_part(name,'/',1))::uuid,true));
