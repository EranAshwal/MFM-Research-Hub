-- ============================================================================
-- MFM Research Hub — Milestones RLS (run after main migrations.sql)
-- Adds RLS policies to the existing milestones table so the app can read/write.
-- ============================================================================

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Drop existing for idempotency
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='milestones' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.milestones', r.policyname);
  END LOOP;
END $$;

CREATE POLICY milestones_read_approved
  ON milestones FOR SELECT
  USING (is_approved());

-- Admin and project members can modify milestones on their projects
CREATE POLICY milestones_member_insert
  ON milestones FOR INSERT
  WITH CHECK (is_admin() OR is_project_member(project_id));

CREATE POLICY milestones_member_update
  ON milestones FOR UPDATE
  USING (is_admin() OR is_project_member(project_id));

CREATE POLICY milestones_admin_delete
  ON milestones FOR DELETE
  USING (is_admin() OR is_project_member(project_id));
