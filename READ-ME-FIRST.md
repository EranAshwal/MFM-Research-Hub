# Fixing "can't create projects" + "sees everyone's projects/inbox"

Two halves. **Both** are required — the app changes alone won't help until the database policies are applied.

## 1. Database (do this first) — `supabase-rls-scoped.sql`

This is the new single source of truth for access control. It **supersedes** the three
older, conflicting files (`migrations.sql`, `supabase-rls.sql`, `supabase/auth-rls.sql`) —
you do **not** need to run those again.

1. Open **Supabase Dashboard → SQL Editor → New query**.
2. Paste the entire contents of `supabase-rls-scoped.sql` and click **Run**.
3. Everyone signs out and back in once (refreshes the JWT).

What it does:
- Adds an `approved` flag + `created_by` stamp to `projects` (all 39 existing projects are
  marked approved, so nothing currently visible disappears).
- **Projects, milestones, tasks, updates, comments, files** are now visible only to the
  project's PI / lead / members — and to admins, who still see everything.
- **Notes** are visible only to their sender or recipient.
- **Any approved, signed-in user can create a project idea.** It saves as *unapproved* and is
  visible only to its creator and admins until an admin approves it. A guard trigger makes it
  impossible for a non-admin to approve their own idea.
- People directory + Publications stay readable (the public landing page needs them).

## 2. App (already done in this project)

- `createProject` now stamps the creator as PI + lead + member, so the project they make
  actually belongs to them under the new scoping.
- New project modal reads "New project idea / Submit idea → sent for admin approval" for
  non-admins.
- Project page shows a **Pending approval** chip, and admins get a green **Approve project**
  button in the header.
- Sidebar **Projects** badge now counts only *your* projects (it follows the scoped data).
- Sidebar **Inbox** badge now counts *your own unread notes* — not the lab-wide PI metric
  that was showing "7".

## Why your colleague saw the error + the 40 / 7 counters

- The error was a UI-vs-database mismatch: the app showed everyone a "New project" button,
  but the live policy only let an **admin** insert. Now non-admins can submit (as ideas).
- "40 projects / 7 inbox" was by old design — every approved user could read *all* projects,
  and the inbox badge counted a PI workflow metric. Both are now per-user.
