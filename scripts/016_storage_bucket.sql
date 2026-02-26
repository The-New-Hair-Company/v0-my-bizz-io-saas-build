-- Create company-documents storage bucket (run once via Supabase dashboard or API)
-- This SQL is reference only — storage buckets are created via the Supabase Storage API.
--
-- Bucket: company-documents
-- Public: false
-- File size limit: 50MB
-- Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain
--
-- Storage path convention: company/{organizationId}/docs/{documentId}/{filename}
--
-- Access policies (set in Supabase dashboard > Storage > Policies):
--   SELECT: auth.uid() in (select user_id from members where organization_id = [path segment 2])
--   INSERT: same
--   UPDATE: same  
--   DELETE: same (admin or uploader only)
--
-- Equivalent SQL for storage policies:
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-documents',
  'company-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ]
)
on conflict (id) do nothing;

-- Storage RLS policies
create policy "Members can upload to their company prefix"
  on storage.objects for insert
  with check (
    bucket_id = 'company-documents' and
    exists (
      select 1 from public.members
      where organization_id = (storage.foldername(name))[2]::uuid
      and user_id = auth.uid()
    )
  );

create policy "Members can read their company files"
  on storage.objects for select
  using (
    bucket_id = 'company-documents' and
    exists (
      select 1 from public.members
      where organization_id = (storage.foldername(name))[2]::uuid
      and user_id = auth.uid()
    )
  );

create policy "Members can delete their company files"
  on storage.objects for delete
  using (
    bucket_id = 'company-documents' and
    exists (
      select 1 from public.members
      where organization_id = (storage.foldername(name))[2]::uuid
      and user_id = auth.uid()
    )
  );
