/* MFM Research Hub — Supabase bootstrap (Phase 3)
   Loads people + projects from Supabase, replaces the in-memory arrays,
   then mounts the React app. Falls back to static data on error so the
   site never goes blank.
*/

(async () => {
  const cfg = window.__SUPABASE_CONFIG__;
  if (!cfg || !window.supabase) {
    console.warn('[Supabase] Config or client not loaded — falling back to static data.');
    window.mountApp?.();
    return;
  }

  const startTime = performance.now();
  // sessionStorage = auth session dies when browser/tab closes (per user request).
  const client = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: {
      storage: window.sessionStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  window.__sb = client; // expose for ad-hoc debugging in console

  const showError = (msg) => {
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `<div style="padding:40px;font-family:system-ui;max-width:560px;margin:80px auto;border:1px solid #eee;border-radius:12px;background:#fff">
        <div style="font-size:11px;font-weight:600;color:#7A003C;letter-spacing:.1em;text-transform:uppercase">Supabase load error</div>
        <div style="font-size:18px;font-weight:600;margin-top:8px">Could not load data from Supabase.</div>
        <div style="color:#666;margin-top:8px;font-size:14px">${msg}</div>
        <div style="color:#999;margin-top:12px;font-size:12px">Check your URL/anon key in <code>supabase-config.js</code>, and that RLS allows public reads.</div>
      </div>`;
    }
  };

  try {
    console.log('[Supabase] Fetching data…');

    // Fetch in parallel
    const [peopleRes, projectsRes, membersRes, pubsRes, milestonesRes, updatesRes, commentsRes, tasksRes] = await Promise.all([
      client.from('people').select('*').order('joined', { ascending: true }),
      client.from('projects').select('*').order('start_date', { ascending: true }),
      client.from('project_members').select('*'),
      client.from('publications').select('*').order('year', { ascending: false }),
      client.from('milestones').select('*').order('due_date', { ascending: true }),
      client.from('progress_updates').select('*').order('created_at', { ascending: false }),
      client.from('comments').select('*').order('created_at', { ascending: true }),
      client.from('tasks').select('*').order('created_at', { ascending: false }),
    ]);

    if (peopleRes.error) throw new Error('people: ' + peopleRes.error.message);
    if (projectsRes.error) throw new Error('projects: ' + projectsRes.error.message);
    if (membersRes.error) throw new Error('project_members: ' + membersRes.error.message);
    // publications + milestones + updates non-fatal
    if (pubsRes.error) console.warn('[Supabase] publications:', pubsRes.error.message);
    if (milestonesRes.error) console.warn('[Supabase] milestones:', milestonesRes.error.message);
    if (updatesRes.error) console.warn('[Supabase] updates:', updatesRes.error.message);
    if (commentsRes.error) console.warn('[Supabase] comments:', commentsRes.error.message);
    if (tasksRes.error) console.warn('[Supabase] tasks:', tasksRes.error.message);

    // Map Supabase rows (snake_case) → app format (camelCase)
    const people = peopleRes.data.map(p => ({
      id: p.id,
      name: p.name,
      initials: p.initials,
      role: p.role,
      training: p.training,
      email: p.email,
      color: p.color,
      joined: p.joined ? p.joined.slice(0, 7) : '',
      focus: p.focus,
      bio: p.bio,
      hasPhoto: p.has_photo,
      hasCV: p.has_cv,
      pubmedAuthor: p.pubmed_author,
      authUserId: p.auth_user_id,
      isAdmin: p.is_admin,
      isApproved: p.is_approved,
    }));

    // Build members map: project_id → [person_id, …]
    const membersByProject = {};
    membersRes.data.forEach(m => {
      if (!membersByProject[m.project_id]) membersByProject[m.project_id] = [];
      membersByProject[m.project_id].push(m.person_id);
    });

    const projects = projectsRes.data.map(p => ({
      id: p.id,
      title: p.title,
      acronym: p.acronym,
      description: p.description,
      category: p.category,
      studyDesign: p.study_design,
      status: p.status,
      health: p.health,
      priority: p.priority,
      progress: p.progress,
      pi: p.pi_id,
      lead: p.lead_id,
      members: membersByProject[p.id] || [],
      reb: p.reb,
      rebExpiry: p.reb_expiry,
      dataSource: p.data_source,
      targetJournal: p.target_journal,
      start: p.start_date,
      target: p.target_date,
      bin: p.bin,
      coverColor: p.cover_color,
      awaitingUpdate: p.awaiting_update,
      awaitingReview: p.awaiting_review,
      lastUpdate: p.last_update_date,
      nextMilestone: p.next_milestone,
      nextDue: p.next_due,
      fileCount: p.file_count,
    }));

    // Map publications (snake_case → camelCase, keep fields the existing page expects)
    const publications = (pubsRes.data || []).map(p => ({
      id: p.id, pmid: p.pmid, doi: p.doi, title: p.title, authors: p.authors,
      journal: p.journal, year: p.year, month: p.month, volume: p.volume, pages: p.pages,
      type: p.type, status: p.status, source: p.source, addedBy: p.added_by,
    }));

    // Replace the in-memory arrays the rest of the app reads from
    window.PEOPLE.length = 0; people.forEach(p => window.PEOPLE.push(p));
    window.PROJECTS.length = 0; projects.forEach(p => window.PROJECTS.push(p));
    if (publications.length) {
      window.PUBLICATIONS.length = 0; publications.forEach(p => window.PUBLICATIONS.push(p));
    }

    // Map milestones into the per-project MILESTONES dictionary
    if (milestonesRes.data) {
      Object.keys(window.MILESTONES).forEach(k => delete window.MILESTONES[k]);
      milestonesRes.data.forEach(m => {
        const mapped = {
          id: m.id, projectId: m.project_id, title: m.title,
          owner: m.owner_id, due: m.due_date, status: m.status,
          completed: m.completed_at ? m.completed_at.slice(0, 10) : null,
          notes: m.notes, displayOrder: m.display_order,
        };
        if (!window.MILESTONES[m.project_id]) window.MILESTONES[m.project_id] = [];
        window.MILESTONES[m.project_id].push(mapped);
      });
    }

    // Map progress_updates into window.UPDATES
    if (updatesRes.data) {
      window.UPDATES.length = 0;
      updatesRes.data.forEach(u => {
        window.UPDATES.push({
          id: u.id, project: u.project_id, user: u.user_id,
          completed: u.completed_since_last_update, inProgress: u.currently_working_on,
          barriers: u.barriers, helpNeeded: u.help_needed, next: u.next_steps,
          percent: u.percent_complete, piStatus: u.pi_response_status,
          piResponseText: u.pi_response_text,
          date: u.created_at ? u.created_at.slice(0, 10) : '',
          createdAt: u.created_at,
        });
      });
    }

    // Map comments by update_id and project_id
    window.COMMENTS = { byUpdate: {}, byProject: {} };
    if (commentsRes.data) {
      commentsRes.data.forEach(c => {
        const mapped = {
          id: c.id, updateId: c.update_id, projectId: c.project_id,
          userId: c.user_id, text: c.comment_text, createdAt: c.created_at,
        };
        if (c.update_id) {
          if (!window.COMMENTS.byUpdate[c.update_id]) window.COMMENTS.byUpdate[c.update_id] = [];
          window.COMMENTS.byUpdate[c.update_id].push(mapped);
        }
        if (c.project_id) {
          if (!window.COMMENTS.byProject[c.project_id]) window.COMMENTS.byProject[c.project_id] = [];
          window.COMMENTS.byProject[c.project_id].push(mapped);
        }
      });
    }

    // Map tasks into per-project TASKS dict
    Object.keys(window.TASKS).forEach(k => delete window.TASKS[k]);
    if (tasksRes.data) {
      tasksRes.data.forEach(t => {
        const mapped = {
          id: t.id, projectId: t.project_id, title: t.title, description: t.description,
          owner: t.owner_id, priority: t.priority, status: t.status,
          due: t.due_date, completed: t.completed_at ? t.completed_at.slice(0, 10) : null,
        };
        if (!window.TASKS[t.project_id]) window.TASKS[t.project_id] = [];
        window.TASKS[t.project_id].push(mapped);
      });
    }

    const ms = Math.round(performance.now() - startTime);
    console.log(`[Supabase] Loaded ${people.length} people + ${projects.length} projects + ${publications.length} publications + ${window.UPDATES.length} updates in ${ms}ms`);

    // ============== REALTIME SUBSCRIPTIONS ==============
    // When any progress_update or comment changes, refresh from DB and re-render the app.
    const channel = client.channel('mfm-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'progress_updates' }, async () => {
        await window.DataService.refresh();
        window.mountApp && window.mountApp();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, async () => {
        await window.DataService.refresh();
        window.mountApp && window.mountApp();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, async () => {
        await window.DataService.refresh();
        window.mountApp && window.mountApp();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notes' }, async () => {
        // Just trigger a soft re-render — listeners will refetch as needed
        window.dispatchEvent(new CustomEvent('mfm:notes-changed'));
      })
      .subscribe();
    window.__sbChannel = channel;

    // Initialize auth service (Phase 5)
    if (window.AuthService) {
      await window.AuthService.init();
      console.log('[Supabase] Auth initialized', window.AuthService.getSession() ? '(signed in)' : '(no session)');
    }

    // Now mount the app
    window.mountApp?.();
  } catch (err) {
    console.error('[Supabase] Load failed:', err);
    showError(err.message || String(err));
  }
})();
