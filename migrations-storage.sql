-- ============================================================================
-- MFM Research Hub — Storage policies for project-files bucket
-- Run this AFTER creating the `project-files` bucket in Supabase Storage.
-- Safe to re-run.
-- ============================================================================

-- Make sure RLS is on for storage.objects (it is by default but just in case)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop any prior versions so this is idempotent
DROP POLICY IF EXISTS pf_read   ON storage.objects;
DROP POLICY IF EXISTS pf_insert ON storage.objects;
DROP POLICY IF EXISTS pf_delete ON storage.objects;
DROP POLICY IF EXISTS pf_update ON storage.objects;

-- Approved users can list/download files in the bucket
CREATE POLICY pf_read ON storage.objects FOR SELECT
  USING (bucket_id = 'project-files' AND is_approved());

-- Admin OR project members can upload to their project folder
-- Path layout we use: <project_uuid>/<filename>
CREATE POLICY pf_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-files'
    AND (
      is_admin()
      OR is_project_member((storage.foldername(name))[1]::uuid)
    )
  );

-- Admin OR project members can delete files in their project folder
CREATE POLICY pf_delete ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-files'
    AND (
      is_admin()
      OR is_project_member((storage.foldername(name))[1]::uuid)
    )
  );

-- Same for UPDATE (rename, move) — admin or project member
CREATE POLICY pf_update ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'project-files'
    AND (
      is_admin()
      OR is_project_member((storage.foldername(name))[1]::uuid)
    )
  );
