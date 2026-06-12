-- ============================================================================
-- MFM Research Hub — PER-USER SCOPED access model  (run this LAST)
-- ============================================================================
-- This file is the single source of truth for access control. It supersedes
-- migrations.sql, supabase-rls.sql and supabase/auth-rls.sql by dropping every
-- existing policy on the affected tables and recreating a coherent set.
--
-- Model agreed with the team:
--   • ADMIN (Eran / anyone with people.is_admin) sees and controls EVERYTHING.
--   • EVERY OTHER USER sees ONLY:
--        - projects they are PI / lead / member of
--        - milestones, tasks, updates, comments, activity, files for THOSE projects
--        - notes they sent or received
--   • Any signed-in, APPROVED user can CREATE a project idea.
--   • A newly created idea starts UNAPPROVED and is visible only to its creator
--     and admins until an admin approves it.
--   • People directory + Publications stay readable (needed for the landing
--     page, avatars and names). Nothing project-specific leaks.
--
-- Paste into Supabase Dashboard → SQL Editor → New query → Run.
-- Idempotent — safe to re-run. After running: sign out / back in to refresh JWT.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0. Schema: approval flag + creator stamp on projects
-- ----------------------------------------------------------------------------
alter table public.projects
  add column if not exists approved   boolean not null default false,
  add column if not exists created_by uuid references public.people(id) on delete set null;

-- Everything that already exists is considered approved, so nothing currently
-- visible disappears when this runs.
update public.projects set approved = true where approved is distinct from true;


-- ----------------------------------------------------------------------------
-- 1. Helper functions (SECURITY DEFINER → bypass RLS while evaluating, no recursion)
-- ----------------------------------------------------------------------------
create or replace function public.current_person_id() returns uuid
  language sql stable security definer set search_path = public as $$
  select id from public.people where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce((
    select is_admin from public.people where auth_user_id = auth.uid() limit 1
  ), false);
$$;

create or replace function public.is_approved() returns boolean
  language sql stable security definer set search_path = public as $$
  select public.is_admin() or coalesce((
    select is_approved from public.people where auth_user_id = auth.uid() limit 1
  ), false);
$$;

-- True iff the signed-in user is PI, lead, or an explicit member of proj_id.
-- NOTE: approval state does NOT affect membership — a creator always sees their
-- own pending idea.
create or replace function public.is_project_member(proj_id uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
      select 1 from public.projects p
       where p.id = proj_id
         and (p.pi_id = public.current_person_id()
           or p.lead_id = public.current_person_id()
           or p.created_by = public.current_person_id())
    ) or exists (
      select 1 from public.project_members pm
       where pm.project_id = proj_id
         and pm.person_id = public.current_person_id()
    );
$$;


-- ----------------------------------------------------------------------------
-- 2. Guard trigger: non-admins can never set/keep approved = true, and their
--    inserts are always stamped with created_by = themselves.
-- ----------------------------------------------------------------------------
create or replace function public.guard_project_write() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    return new;                       -- admins may do anything
  end if;
  if tg_op = 'INSERT' then
    new.approved   := false;          -- ideas start unapproved
    new.created_by := coalesce(new.created_by, public.current_person_id());
  elsif tg_op = 'UPDATE' then
    new.approved := old.approved;     -- non-admins cannot flip approval
    new.created_by := old.created_by; -- nor rewrite the creator stamp
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_project_write on public.projects;
create trigger trg_guard_project_write
  before insert or update on public.projects
  for each row execute function public.guard_project_write();


-- ----------------------------------------------------------------------------
-- 3. Drop every existing policy on the affected tables so the 3 old files
--    can't leave a stray "read everything" policy behind.
-- ----------------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname = 'public'
       and tablename in ('people','projects','project_members','milestones',
                         'tasks','progress_updates','comments','activity_log',
                         'publications','notes')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- 4. Enable RLS
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['people','projects','project_members','milestones',
                           'tasks','progress_updates','comments','activity_log',
                           'publications','notes']
  loop
    if to_regclass('public.'||t) is not null then
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- 5. PEOPLE — directory stays readable (landing page, avatars, names).
-- ----------------------------------------------------------------------------
create policy people_read_all   on public.people for select using (true);
create policy people_self_insert on public.people for insert with check (auth_user_id = auth.uid());
create policy people_self_update on public.people for update using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
create policy people_admin_all  on public.people for all using (public.is_admin()) with check (public.is_admin());


-- ----------------------------------------------------------------------------
-- 6. PROJECTS — the core scoping rule.
-- ----------------------------------------------------------------------------
-- READ: admins see all; everyone else sees only projects they belong to.
create policy projects_read_scoped on public.projects for select
  using (public.is_admin() or public.is_project_member(id));

-- CREATE: any approved, signed-in user may submit an idea, but only as an
-- owner of it (prevents creating projects assigned to other people).
-- The guard trigger forces approved=false + created_by=self for non-admins.
create policy projects_insert_owner on public.projects for insert
  with check (
    public.is_admin()
    or (
      public.is_approved()
      and (pi_id = public.current_person_id()
        or lead_id = public.current_person_id()
        or created_by = public.current_person_id())
    )
  );

-- UPDATE: admins fully; owners/members may edit their own project's fields
-- (the guard trigger stops them changing `approved`).
create policy projects_update_member on public.projects for update
  using (public.is_admin() or public.is_project_member(id))
  with check (public.is_admin() or public.is_project_member(id));

-- DELETE: admins anytime; a creator may delete their OWN still-unapproved idea.
create policy projects_delete on public.projects for delete
  using (
    public.is_admin()
    or (approved = false and created_by = public.current_person_id())
  );


-- ----------------------------------------------------------------------------
-- 7. PROJECT_MEMBERS — only admin or members of that same project.
-- ----------------------------------------------------------------------------
create policy pm_read_scoped on public.project_members for select
  using (public.is_admin() or public.is_project_member(project_id));

-- Owners/members can manage their own team; admins anywhere.
create policy pm_write_member on public.project_members for all
  using (public.is_admin() or public.is_project_member(project_id))
  with check (public.is_admin() or public.is_project_member(project_id));


-- ----------------------------------------------------------------------------
-- 8. Project-scoped child tables — read + write gated by membership.
--    (Reads were previously workspace-wide; now they follow the project.)
-- ----------------------------------------------------------------------------
do $$ begin
  if to_regclass('public.milestones') is not null then
    execute 'create policy ms_read   on public.milestones for select using (public.is_admin() or public.is_project_member(project_id))';
    execute 'create policy ms_write  on public.milestones for all    using (public.is_admin() or public.is_project_member(project_id)) with check (public.is_admin() or public.is_project_member(project_id))';
  end if;

  if to_regclass('public.tasks') is not null then
    execute 'create policy tk_read   on public.tasks for select using (public.is_admin() or public.is_project_member(project_id))';
    execute 'create policy tk_write  on public.tasks for all    using (public.is_admin() or public.is_project_member(project_id)) with check (public.is_admin() or public.is_project_member(project_id))';
  end if;

  if to_regclass('public.progress_updates') is not null then
    execute 'create policy pu_read   on public.progress_updates for select using (public.is_admin() or public.is_project_member(project_id))';
    execute 'create policy pu_insert on public.progress_updates for insert with check (public.is_admin() or public.is_project_member(project_id))';
    execute 'create policy pu_update on public.progress_updates for update using (public.is_admin() or user_id = public.current_person_id()) with check (public.is_admin() or user_id = public.current_person_id())';
    execute 'create policy pu_delete on public.progress_updates for delete using (public.is_admin())';
  end if;

  if to_regclass('public.comments') is not null then
    execute 'create policy cm_read   on public.comments for select using (public.is_admin() or public.is_project_member(project_id))';
    execute 'create policy cm_insert on public.comments for insert with check (user_id = public.current_person_id())';
    execute 'create policy cm_update on public.comments for update using (user_id = public.current_person_id()) with check (user_id = public.current_person_id())';
    execute 'create policy cm_delete on public.comments for delete using (public.is_admin() or user_id = public.current_person_id())';
  end if;

  if to_regclass('public.activity_log') is not null then
    execute 'create policy al_read   on public.activity_log for select using (public.is_admin() or public.is_project_member(project_id))';
    execute 'create policy al_insert on public.activity_log for insert with check (public.is_admin() or public.is_project_member(project_id))';
    execute 'create policy al_delete on public.activity_log for delete using (public.is_admin())';
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- 9. PUBLICATIONS — stay readable (landing page list). Admin writes.
-- ----------------------------------------------------------------------------
do $$ begin
  if to_regclass('public.publications') is not null then
    execute 'create policy pub_read_all  on public.publications for select using (true)';
    execute 'create policy pub_admin_all on public.publications for all using (public.is_admin()) with check (public.is_admin())';
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- 10. NOTES — each user sees only notes they sent or received.
-- ----------------------------------------------------------------------------
do $$ begin
  if to_regclass('public.notes') is not null then
    execute 'create policy notes_read_own   on public.notes for select using (public.is_admin() or recipient_id = public.current_person_id() or sender_id = public.current_person_id())';
    execute 'create policy notes_insert      on public.notes for insert with check (public.is_admin() or sender_id = public.current_person_id())';
    execute 'create policy notes_recipient_update on public.notes for update using (public.is_admin() or recipient_id = public.current_person_id()) with check (public.is_admin() or recipient_id = public.current_person_id())';
    execute 'create policy notes_delete      on public.notes for delete using (public.is_admin() or sender_id = public.current_person_id())';
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- 11. STORAGE — project-files bucket scoped to members of the owning project.
--     Path convention: <project_id>/<filename>
-- ----------------------------------------------------------------------------
do $$ begin
  if exists (select 1 from storage.buckets where id = 'project-files') then
    drop policy if exists "project_files_read"          on storage.objects;
    drop policy if exists "project_files_member_insert" on storage.objects;
    drop policy if exists "project_files_member_update" on storage.objects;
    drop policy if exists "project_files_admin_delete"  on storage.objects;
    drop policy if exists pf_read   on storage.objects;
    drop policy if exists pf_insert on storage.objects;
    drop policy if exists pf_delete on storage.objects;

    create policy pf_read   on storage.objects for select
      using (bucket_id = 'project-files'
             and (public.is_admin() or public.is_project_member((storage.foldername(name))[1]::uuid)));

    create policy pf_insert on storage.objects for insert
      with check (bucket_id = 'project-files'
             and (public.is_admin() or public.is_project_member((storage.foldername(name))[1]::uuid)));

    create policy pf_delete on storage.objects for delete
      using (bucket_id = 'project-files' and public.is_admin());
  end if;
end $$;


-- ============================================================================
-- DONE. Quick check — every table below should show rowsecurity = true:
--   select tablename, rowsecurity from pg_tables
--    where schemaname='public' order by tablename;
-- ============================================================================
