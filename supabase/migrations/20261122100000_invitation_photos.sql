-- Private event invitation images, never publicly listable.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('wedly-invitation-photos','wedly-invitation-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
-- Service-role server routes perform authenticated uploads and scoped reads.
