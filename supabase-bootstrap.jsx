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
  const client = window.supabase.createClient(cfg.url, cfg.anonKey);
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
    const [peopleRes, projectsRes, membersRes] = await Promise.all([
      client.from('people').select('*').order('joined', { ascending: true }),
      client.from('projects').select('*').order('start_date', { ascending: true }),
      client.from('project_members').select('*'),
    ]);

    if (peopleRes.error) throw new Error('people: ' + peopleRes.error.message);
    if (projectsRes.error) throw new Error('projects: ' + projectsRes.error.message);
    if (membersRes.error) throw new Error('project_members: ' + membersRes.error.message);

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

    // Replace the in-memory arrays the rest of the app reads from
    window.PEOPLE.length = 0; people.forEach(p => window.PEOPLE.push(p));
    window.PROJECTS.length = 0; projects.forEach(p => window.PROJECTS.push(p));

    const ms = Math.round(performance.now() - startTime);
    console.log(`[Supabase] Loaded ${people.length} people + ${projects.length} projects in ${ms}ms`);

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
