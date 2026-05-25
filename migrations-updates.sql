-- ============================================================================
-- MFM Research Hub — Progress updates + comments RLS
-- Run AFTER migrations.sql and migrations-milestones.sql.
-- Enables real progress-update threads visible to project members.
-- ============================================================================

ALTER TABLE progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments         ENABLE ROW LEVEL SECURITY;

-- Drop existing for idempotency
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies
           WHERE schemaname='public' AND tablename IN ('progress_updates','comments') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ===== PROGRESS UPDATES =====
-- Approved users can read all updates (so PI sees everything; trainees see their own projects via app filtering)
CREATE POLICY pu_read_approved ON progress_updates FOR SELECT USING (is_approved());

-- Project members can insert their own updates
CREATE POLICY pu_member_insert ON progress_updates FOR INSERT
  WITH CHECK (is_admin() OR is_project_member(project_id));

-- The author OR the admin can update the row (the admin uses this to mark approved/comment)
CREATE POLICY pu_author_update ON progress_updates FOR UPDATE
  USING (is_admin() OR user_id = current_person_id());

CREATE POLICY pu_admin_delete ON progress_updates FOR DELETE
  USING (is_admin());

-- ===== COMMENTS =====
-- Anyone approved can read project comments
CREATE POLICY c_read_approved ON comments FOR SELECT USING (is_approved());

-- A project member (or admin) can post comments scoped to that project
CREATE POLICY c_member_insert ON comments FOR INSERT
  WITH CHECK (
    is_admin()
    OR (project_id IS NOT NULL AND is_project_member(project_id))
    OR (update_id IS NOT NULL AND is_project_member(
          (SELECT project_id FROM progress_updates WHERE id = update_id)
       ))
  );

-- Author can edit/delete own comments; admin can do anything
CREATE POLICY c_author_update ON comments FOR UPDATE
  USING (is_admin() OR user_id = current_person_id());

CREATE POLICY c_author_delete ON comments FOR DELETE
  USING (is_admin() OR user_id = current_person_id());

-- ===== REALTIME =====
-- Enable broadcasts so the app can subscribe to new updates + comments.
-- (Supabase exposes this via the `supabase_realtime` publication.)
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE progress_updates';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE comments';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- ===== TASKS — allow project members to insert/delete too (not just admin) =====
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname='public' AND tablename='tasks' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tasks', r.policyname);
  END LOOP;
END $$;

CREATE POLICY tasks_read_approved ON tasks FOR SELECT USING (is_approved());
CREATE POLICY tasks_member_insert ON tasks FOR INSERT
  WITH CHECK (is_admin() OR is_project_member(project_id));
CREATE POLICY tasks_member_update ON tasks FOR UPDATE
  USING (is_admin() OR is_project_member(project_id));
CREATE POLICY tasks_member_delete ON tasks FOR DELETE
  USING (is_admin() OR is_project_member(project_id));

DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE tasks';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

