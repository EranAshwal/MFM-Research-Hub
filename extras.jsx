/* MFM Research Hub — Inbox Zero, Deadlines (REB + Conferences), Onboarding checklist */

/* ============================================================
   INBOX — everything awaiting the PI's decision
   ============================================================ */

// Personal inbox shown to non-admin users (trainees, collaborators)
const PersonalInboxPage = ({ navigate, toast, currentUser }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotes = async () => {
    if (!currentUser) return;
    try {
      const data = await window.DataService.listNotesFor(currentUser.id);
      setNotes((data || []).filter(n => n.recipient_id === currentUser.id));
    } catch (e) { /* silent */ }
    setLoading(false);
  };
  useEffect(() => { loadNotes(); }, [currentUser?.id]);

  const markRead = async (n) => {
    if (n.read_at) return;
    try { await window.DataService.markNoteRead(n.id); loadNotes(); } catch {}
  };

  // Projects this person is on
  const myProjects = PROJECTS.filter(p =>
    p.lead === currentUser?.id || p.pi === currentUser?.id || (p.members || []).includes(currentUser?.id)
  );

  // Pending update requests for me: notes with template = 'progress-request' that are unread
  const updateRequests = notes.filter(n => n.template === 'progress-request' && !n.read_at);
  const otherNotes = notes.filter(n => n.template !== 'progress-request');

  // My overdue milestones
  const myOverdue = [];
  Object.keys(MILESTONES).forEach(pid => {
    (MILESTONES[pid] || []).forEach(m => {
      if (m.status !== 'done' && m.owner === currentUser?.id) {
        const proj = PROJECTS.find(p => p.id === pid);
        if (proj && new Date(m.due) < new Date()) myOverdue.push({ ...m, project: proj });
      }
    });
  });

  const total = updateRequests.length + otherNotes.filter(n => !n.read_at).length + myOverdue.length;

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 className="page-title">Inbox</h1>
          {total > 0 && <span className="chip chip-maroon" style={{ fontSize: 12, padding: '3px 10px' }}>{total} awaiting you</span>}
        </div>
        <p className="page-sub">Things that need your attention — messages from the PI, requests, and your overdue milestones.</p>
      </div>

      {loading && <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>}

      {!loading && total === 0 && (
        <div className="card card-pad" style={{ textAlign: 'center', padding: 56 }}>
          <div style={{ width: 64, height: 64, margin: '0 auto', borderRadius: 16, background: 'var(--status-green-wash)', color: 'var(--status-green)', display: 'grid', placeItems: 'center' }}>
            <Icon name="check" size={28} stroke={2.5} />
          </div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 600, marginTop: 14 }}>All caught up.</div>
          <p style={{ color: 'var(--muted)', marginTop: 6 }}>
            No new messages or pending requests. Check your projects below.
          </p>
        </div>
      )}

      {updateRequests.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div className="row" style={{ gap: 10, marginBottom: 10, alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 16, fontWeight: 600 }}>Progress updates requested</h3>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--maroon)', color: '#F8EEE2', fontWeight: 600 }}>{updateRequests.length}</span>
          </div>
          {updateRequests.map(n => {
            const project = n.project_id ? PROJECTS.find(p => p.id === n.project_id) : null;
            return (
              <div key={n.id} className="card" style={{ padding: 16, marginBottom: 8, display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 13 }}>{personById(n.sender_id)?.name || 'Admin'}</strong>
                    {project && <span className="chip chip-maroon" style={{ fontSize: 10 }}>{project.acronym}</span>}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap', color: 'var(--ink-2)' }}>{n.body}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{new Date(n.sent_at).toLocaleString()}</div>
                </div>
                {project && (
                  <button className="btn btn-sm btn-primary" onClick={() => { markRead(n); navigate({ page: 'projects', id: project.id, tab: 'updates' }); }}>
                    Submit update
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {myOverdue.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div className="row" style={{ gap: 10, marginBottom: 10, alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 16, fontWeight: 600 }}>Your overdue milestones</h3>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--status-red)', color: '#fff', fontWeight: 600 }}>{myOverdue.length}</span>
          </div>
          {myOverdue.map(m => (
            <div key={m.id} className="card" style={{ padding: 14, marginBottom: 8, cursor: 'pointer' }}
                 onClick={() => navigate({ page: 'projects', id: m.project.id, tab: 'timeline' })}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="serif" style={{ fontSize: 14, fontWeight: 600 }}>{m.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    {m.project.acronym} · Due {fmtDate(m.due)}
                  </div>
                </div>
                <span className="chip chip-red">Overdue</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {otherNotes.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div className="row" style={{ gap: 10, marginBottom: 10, alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 16, fontWeight: 600 }}>Messages</h3>
          </div>
          {otherNotes.map(n => {
            const project = n.project_id ? PROJECTS.find(p => p.id === n.project_id) : null;
            const unread = !n.read_at;
            return (
              <div key={n.id} onClick={() => markRead(n)} className="card"
                   style={{ padding: 14, marginBottom: 8, cursor: unread ? 'pointer' : 'default',
                            background: unread ? 'var(--maroon-wash)' : 'var(--paper)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 13 }}>{personById(n.sender_id)?.name || 'Admin'}</strong>
                  {project && <span className="chip chip-grey" style={{ fontSize: 10 }}>{project.acronym}</span>}
                  {unread && <span className="chip chip-maroon" style={{ fontSize: 10 }}>New</span>}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap', color: 'var(--ink-2)' }}>{n.body}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{new Date(n.sent_at).toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      )}

      {myProjects.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div className="row" style={{ gap: 10, marginBottom: 10, alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 16, fontWeight: 600 }}>Your projects</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {myProjects.map(p => (
              <button key={p.id} className="card" style={{ padding: 14, cursor: 'pointer', textAlign: 'left' }}
                      onClick={() => navigate({ page: 'projects', id: p.id })}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{p.acronym}</div>
                <div className="serif" style={{ fontSize: 14, fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>{p.title}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <span className={`chip ${statusChipClass(p.status)}`}>{p.status}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{p.progress}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
window.PersonalInboxPage = PersonalInboxPage;

const InboxPage = ({ navigate, updates, toast, openReply, currentUser }) => {
  const isAdmin = !!(window.AuthService && window.AuthService.isAdmin && window.AuthService.isAdmin());
  // Non-admin users see a personal inbox scoped to them
  if (!isAdmin) return <PersonalInboxPage navigate={navigate} toast={toast} currentUser={currentUser} />;

  const [filter, setFilter] = useState('all');

  // Gather queues
  const pendingUpdates = updates.filter(u => u.piStatus === 'pending');
  const clarificationUpdates = updates.filter(u => u.piStatus === 'requested_clarification');
  const manuscriptReviews = PROJECTS.filter(p => p.awaitingReview);
  const overdueMilestones = [];
  Object.keys(MILESTONES).forEach(pid => {
    MILESTONES[pid].forEach(m => {
      if (m.status === 'overdue' || (m.status !== 'done' && new Date(m.due) < new Date('2026-05-24'))) {
        const proj = PROJECTS.find(p => p.id === pid);
        if (proj && m.status !== 'done') overdueMilestones.push({ ...m, project: proj });
      }
    });
  });
  // Deduplicate
  const seen = new Set();
  const uniqueOverdue = overdueMilestones.filter(m => {
    const k = `${m.project.id}-${m.id}`;
    if (seen.has(k)) return false; seen.add(k); return true;
  });
  const trainees = PEOPLE.filter(p => ['Resident', 'MFM Fellow', 'Medical Student'].includes(p.role));
  const newCVs = trainees.filter(t => !t.hasCV).slice(0, 2);

  const totals = {
    all: pendingUpdates.length + manuscriptReviews.length + uniqueOverdue.length + newCVs.length,
    updates: pendingUpdates.length,
    review: manuscriptReviews.length,
    milestones: uniqueOverdue.length,
    cvs: newCVs.length,
  };

  const tabs = [
    { id: 'all', label: 'Everything', n: totals.all },
    { id: 'updates', label: 'Approve updates', n: totals.updates },
    { id: 'review', label: 'Review manuscripts', n: totals.review },
    { id: 'milestones', label: 'Confirm milestones', n: totals.milestones },
    { id: 'cvs', label: 'Trainee profiles', n: totals.cvs },
  ];

  const Empty = () => (
    <div className="card card-pad" style={{ textAlign: 'center', padding: 56 }}>
      <div style={{ width: 64, height: 64, margin: '0 auto', borderRadius: 16, background: 'var(--status-green-wash)', color: 'var(--status-green)', display: 'grid', placeItems: 'center' }}>
        <Icon name="check" size={28} stroke={2.5} />
      </div>
      <div className="serif" style={{ fontSize: 22, fontWeight: 600, marginTop: 14 }}>Inbox zero.</div>
      <p style={{ color: 'var(--muted)', marginTop: 6, maxWidth: 380, margin: '6px auto 0' }}>
        Nothing here needs your decision right now. Enjoy the quiet — or get ahead by reviewing next week's milestones.
      </p>
      <button className="btn" style={{ marginTop: 16 }} onClick={() => navigate({ page: 'deadlines' })}>
        <Icon name="calendar" size={14} /> Check upcoming deadlines
      </button>
    </div>
  );

  const Section = ({ id, label, items, render }) => {
    if (!items.length) return null;
    if (filter !== 'all' && filter !== id) return null;
    return (
      <div style={{ marginBottom: 22 }}>
        <div className="row" style={{ gap: 10, marginBottom: 10, alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 16, fontWeight: 600 }}>{label}</h3>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--maroon)', color: '#F8EEE2', fontWeight: 600 }}>{items.length}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(render)}
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-header row between" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title">Inbox</h1>
            {totals.all > 0 && <span className="chip chip-maroon" style={{ fontSize: 12, padding: '3px 10px' }}>{totals.all} awaiting you</span>}
          </div>
          <p className="page-sub">Everything across the portfolio that needs your decision, in one queue.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => toast('All caught up — marked everything reviewed')}>
            <Icon name="check" size={14} /> Mark all reviewed
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--bg-elevated)', borderRadius: 8, marginBottom: 22, overflowX: 'auto', width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)}
                  style={{ padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                           background: filter === t.id ? 'var(--paper)' : 'transparent',
                           boxShadow: filter === t.id ? 'var(--shadow-1)' : 'none',
                           color: filter === t.id ? 'var(--ink)' : 'var(--muted)',
                           display: 'flex', alignItems: 'center', gap: 6 }}>
            {t.label}
            {t.n > 0 && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: filter === t.id ? 'var(--maroon)' : 'var(--border-strong)', color: filter === t.id ? '#F8EEE2' : 'var(--ink)', fontWeight: 600 }}>{t.n}</span>}
          </button>
        ))}
      </div>

      {totals.all === 0 && <Empty />}

      <Section id="updates" label="Progress updates to approve" items={pendingUpdates} render={u => {
        const user = personById(u.user);
        const proj = PROJECTS.find(p => p.id === u.project);
        return (
          <div key={u.id} className="card" style={{ padding: 16, display: 'grid', gridTemplateColumns: '36px minmax(0, 1fr) auto', gap: 14, alignItems: 'flex-start' }}>
            <Avatar user={user} size="md" />
            <div style={{ minWidth: 0 }}>
              <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{proj?.acronym}</span>
                <span className="chip chip-amber">{u.percent}% complete</span>
              </div>
              <div className="serif" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>{proj?.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {u.completed}
              </div>
              {u.helpNeeded && u.helpNeeded !== 'None at this stage.' && u.helpNeeded !== 'None at this stage' && (
                <div style={{ marginTop: 8, padding: 8, background: 'var(--maroon-wash)', borderRadius: 6, fontSize: 12 }}>
                  <strong style={{ color: 'var(--maroon)' }}>Help asked:</strong> {u.helpNeeded}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>Submitted {relDate(u.date)}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignSelf: 'flex-start', minWidth: 130 }}>
              <button className="btn btn-sm btn-primary" onClick={() => { openReply(u, proj); }}>
                <Icon name="sparkle" size={12} /> Suggest reply
              </button>
              <button className="btn btn-sm" onClick={() => toast('Update approved')}>
                <Icon name="check" size={12} /> Approve
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => navigate({ page: 'projects', id: proj.id, tab: 'updates' })}>
                Open thread
              </button>
            </div>
          </div>
        );
      }} />

      <Section id="review" label="Manuscripts & drafts awaiting your review" items={manuscriptReviews} render={p => {
        const lead = personById(p.lead);
        return (
          <div key={p.id} className="card" style={{ padding: 16, display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--maroon-wash)', color: 'var(--maroon)', display: 'grid', placeItems: 'center' }}>
              <Icon name="document" size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{p.acronym}</div>
              <div className="serif" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                <Avatar user={lead} size="sm" /> &nbsp; {lead?.name} submitted for review · {relDate(p.lastUpdate)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm">Comments</button>
              <button className="btn btn-sm btn-primary" onClick={() => navigate({ page: 'projects', id: p.id, tab: 'files' })}>
                <Icon name="eye" size={12} /> Open draft
              </button>
            </div>
          </div>
        );
      }} />

      <Section id="milestones" label="Overdue milestones to confirm or reschedule" items={uniqueOverdue} render={m => {
        const owner = personById(m.owner);
        const days = Math.round((new Date('2026-05-24') - new Date(m.due)) / (24 * 3600 * 1000));
        return (
          <div key={`${m.project.id}-${m.id}`} className="card" style={{ padding: 14, display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--status-red-wash)', color: 'var(--status-red)', display: 'grid', placeItems: 'center' }}>
              <Icon name="alert" size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{m.project.acronym}</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{m.title}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                Owner: {owner?.name || 'Unassigned'} · Due {fmtDate(m.due)}
                <span style={{ marginLeft: 8, color: 'var(--status-red)', fontWeight: 600 }}>{days}d overdue</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm" onClick={() => toast(`${owner?.name?.split(' ').slice(-1)[0]} nudged`)}>
                <Icon name="bell" size={12} /> Nudge
              </button>
              <button className="btn btn-sm btn-primary" onClick={() => navigate({ page: 'projects', id: m.project.id, tab: 'timeline' })}>
                Reschedule
              </button>
            </div>
          </div>
        );
      }} />

      <Section id="cvs" label="Trainee profiles needing your attention" items={newCVs} render={t => {
        return (
          <div key={t.id} className="card" style={{ padding: 14, display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 14, alignItems: 'center' }}>
            <Avatar user={t} size="md" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.training} · Joined {t.joined} · No CV uploaded yet</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm" onClick={() => toast(`Reminder sent to ${t.name.split(' ').slice(-1)[0]}`)}>
                <Icon name="bell" size={12} /> Remind
              </button>
              <button className="btn btn-sm btn-primary" onClick={() => navigate({ page: 'people', id: t.id })}>
                Open profile
              </button>
            </div>
          </div>
        );
      }} />
    </div>
  );
};

/* ============================================================
   DEADLINES — REB renewals + conferences/abstracts
   ============================================================ */

const DeadlinesPage = ({ navigate, toast }) => {
  const [tab, setTab] = useState('reb');
  const today = new Date('2026-05-24');

  // REB renewals
  const rebItems = PROJECTS.filter(p => p.rebExpiry).map(p => {
    const days = Math.round((new Date(p.rebExpiry) - today) / (24 * 3600 * 1000));
    let urgency = 'safe';
    if (days < 0) urgency = 'expired';
    else if (days <= 30) urgency = 'critical';
    else if (days <= 60) urgency = 'soon';
    return { ...p, days, urgency };
  }).sort((a, b) => a.days - b.days);

  // Conferences with upcoming abstract deadlines
  const confItems = CONFERENCES.map(c => {
    const days = Math.round((new Date(c.abstractDue) - today) / (24 * 3600 * 1000));
    return { ...c, days };
  }).sort((a, b) => a.days - b.days);

  return (
    <div className="page">
      <div className="page-header row between">
        <div>
          <h1 className="page-title">Deadlines</h1>
          <p className="page-sub">REB renewals and conference abstract submissions — the things that quietly fall through the cracks.</p>
        </div>
        <button className="btn"><Icon name="calendar" size={14} /> Sync to my calendar</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--bg-elevated)', borderRadius: 8, marginBottom: 22, width: 'fit-content' }}>
        {[
          { id: 'reb', label: 'REB renewals', icon: 'flag', n: rebItems.filter(p => p.urgency !== 'safe').length },
          { id: 'conf', label: 'Conference abstracts', icon: 'book', n: confItems.filter(c => c.days >= 0).length },
          { id: 'calendar', label: 'Calendar view', icon: 'calendar' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                           background: tab === t.id ? 'var(--paper)' : 'transparent',
                           boxShadow: tab === t.id ? 'var(--shadow-1)' : 'none',
                           color: tab === t.id ? 'var(--ink)' : 'var(--muted)',
                           display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name={t.icon} size={13} /> {t.label}
            {t.n > 0 && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: tab === t.id ? 'var(--maroon)' : 'var(--border-strong)', color: tab === t.id ? '#F8EEE2' : 'var(--ink)', fontWeight: 600 }}>{t.n}</span>}
          </button>
        ))}
      </div>

      {tab === 'reb' && (
        <>
          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
            {[
              { label: 'Expired', n: rebItems.filter(r => r.urgency === 'expired').length, color: 'var(--status-red)', wash: 'var(--status-red-wash)' },
              { label: 'Within 30 days', n: rebItems.filter(r => r.urgency === 'critical').length, color: 'var(--status-amber)', wash: 'var(--status-amber-wash)' },
              { label: 'Within 60 days', n: rebItems.filter(r => r.urgency === 'soon').length, color: 'var(--gold-deep)', wash: 'var(--gold-wash)' },
              { label: 'On track', n: rebItems.filter(r => r.urgency === 'safe').length, color: 'var(--status-green)', wash: 'var(--status-green-wash)' },
            ].map(k => (
              <div key={k.label} className="kpi" style={{ background: k.wash }}>
                <div className="kpi-label" style={{ color: k.color, fontWeight: 600 }}>{k.label}</div>
                <div className="kpi-value" style={{ color: k.color }}>{k.n}</div>
                <div className="kpi-foot">REB approval{k.n === 1 ? '' : 's'}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Current REB status</th>
                  <th>Renewal due</th>
                  <th>Days remaining</th>
                  <th>Coordinator</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rebItems.map(p => {
                  const coord = personById('u11'); // Default coordinator
                  return (
                    <tr key={p.id}>
                      <td style={{ maxWidth: 280 }}>
                        <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{p.acronym}</div>
                        <div className="serif" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{p.title}</div>
                      </td>
                      <td><span className="chip chip-green">{p.reb}</span></td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{fmtDate(p.rebExpiry)}</div>
                      </td>
                      <td>
                        <span className={`chip ${p.urgency === 'expired' ? 'chip-red' : p.urgency === 'critical' ? 'chip-amber' : p.urgency === 'soon' ? 'chip-gold' : 'chip-green'}`}>
                          {p.urgency === 'expired' ? `${-p.days}d overdue` : `${p.days}d`}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Avatar user={coord} size="sm" />
                          <span style={{ fontSize: 12 }}>{coord?.name.split(' ').slice(-1)[0]}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button className="btn btn-sm" onClick={() => toast(`Renewal reminder sent to ${coord?.name.split(' ').slice(-1)[0]}`)}>
                            <Icon name="bell" size={12} /> Remind
                          </button>
                          <button className="btn btn-sm" onClick={() => navigate({ page: 'projects', id: p.id, tab: 'files' })}>
                            Open files
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'conf' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {confItems.map(c => {
            const intents = ABSTRACT_INTENTS.filter(i => i.conference === c.id);
            const past = c.days < 0;
            const closing = c.days >= 0 && c.days <= 30;
            return (
              <div key={c.id} className="card" style={{ padding: 18, display: 'grid', gridTemplateColumns: '90px 1fr 280px', gap: 22, alignItems: 'flex-start', opacity: past ? 0.65 : 1 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 78, height: 92, borderRadius: 10, background: past ? 'var(--bg-elevated)' : closing ? 'var(--status-amber-wash)' : 'var(--maroon-wash)',
                                color: past ? 'var(--muted)' : closing ? 'var(--status-amber)' : 'var(--maroon)',
                                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                      {new Date(c.abstractDue).toLocaleDateString('en', { month: 'short' })}
                    </div>
                    <div className="serif" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
                      {new Date(c.abstractDue).getDate()}
                    </div>
                    <div style={{ fontSize: 9, color: past ? 'var(--muted)' : closing ? 'var(--status-amber)' : 'var(--maroon)', fontWeight: 500 }}>
                      {new Date(c.abstractDue).getFullYear()}
                    </div>
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{c.short}</span>
                    {past && <span className="chip chip-grey">Deadline passed</span>}
                    {closing && <span className="chip chip-amber">Closes in {c.days}d</span>}
                    {!past && !closing && <span className="chip chip-green">{c.days}d to deadline</span>}
                  </div>
                  <div className="serif" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <span><Icon name="calendar" size={11} /> {c.dates}</span>
                    <span><Icon name="target" size={11} /> {c.location}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    {c.tags.map(t => <span key={t} className="chip chip-grey" style={{ fontSize: 10 }}>{t}</span>)}
                  </div>
                  {intents.length > 0 && (
                    <div style={{ marginTop: 14, padding: 10, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                      <div className="eyebrow" style={{ marginBottom: 6 }}>Planned submissions ({intents.length})</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {intents.map((i, idx) => {
                          const proj = PROJECTS.find(p => p.id === i.project);
                          const owner = i.owner ? personById(i.owner) : null;
                          return (
                            <button key={idx} onClick={() => navigate({ page: 'projects', id: proj.id })}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: 'var(--paper)', textAlign: 'left' }}>
                              <span style={{ width: 6, height: 6, borderRadius: 999, background: i.status === 'submitted' ? 'var(--status-green)' : i.status === 'planned' ? 'var(--maroon)' : 'var(--muted-2)' }} />
                              <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{proj?.acronym}</span>
                              <span style={{ fontSize: 12, flex: 1 }}>{i.notes}</span>
                              {owner && <Avatar user={owner} size="sm" />}
                              <span className="chip chip-grey" style={{ fontSize: 10, textTransform: 'capitalize' }}>{i.status}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button className="btn btn-sm" disabled={past}>
                    <Icon name="plus" size={12} stroke={2} /> Add intent to submit
                  </button>
                  <button className="btn btn-sm" onClick={() => toast(`Calendar event added: ${c.short}`)}>
                    <Icon name="calendar" size={12} /> Add to calendar
                  </button>
                  <a className="btn btn-sm" href={c.url} target="_blank" rel="noopener noreferrer" style={{ justifyContent: 'center' }}>
                    Conference site <Icon name="arrowRight" size={11} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'calendar' && <CalendarPage navigate={navigate} />}
    </div>
  );
};

/* ============================================================
   ONBOARDING — checklist for new trainees
   ============================================================ */

const OnboardingChecklist = ({ user, navigate, onDismiss }) => {
  const [items, setItems] = useState([
    { id: 'profile', label: 'Complete your profile — photo + short bio', icon: 'user', done: user.hasPhoto || !!user.bio, action: () => navigate({ page: 'people', id: user.id }) },
    { id: 'cv', label: 'Upload your CV', icon: 'document', done: !!user.hasCV, action: () => navigate({ page: 'people', id: user.id }) },
    { id: 'training', label: 'Complete REB / TCPS-2 ethics training', icon: 'flag', done: false, action: () => alert('Opens TCPS-2 training portal (mock)') },
    { id: 'coi', label: 'Declare conflicts of interest', icon: 'check', done: false, action: () => alert('Opens COI declaration form (mock)') },
    { id: 'meet', label: 'Schedule first meeting with PI', icon: 'calendar', done: false, action: () => alert('Opens calendar invite to Dr. Ashwal (mock)') },
    { id: 'project', label: 'Get assigned to a project', icon: 'projects', done: PROJECTS.some(p => p.lead === user.id || p.members.includes(user.id)), action: () => navigate({ page: 'projects' }) },
    { id: 'firstupdate', label: 'Submit your first progress update', icon: 'updates', done: UPDATES.some(u => u.user === user.id), action: () => navigate({ page: 'projects' }) },
  ]);
  const completed = items.filter(i => i.done).length;
  const pct = (completed / items.length) * 100;
  const allDone = completed === items.length;

  const toggle = (id) => {
    setItems(items.map(i => i.id === id ? { ...i, done: !i.done } : i));
  };

  return (
    <div className="card" style={{ padding: 22, marginBottom: 22, background: 'linear-gradient(135deg, var(--maroon) 0%, var(--maroon-deep) 100%)', color: '#F8EEE2', borderColor: 'transparent', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -100, top: -80, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,191,87,0.16), transparent 70%)' }} />
      <div style={{ position: 'relative' }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--gold)' }}>Welcome to the MFM Research Hub</div>
            <h2 className="serif" style={{ fontSize: 22, fontWeight: 600, marginTop: 6, lineHeight: 1.25 }}>
              {allDone ? `You're fully onboarded — let's get to work, ${user.name.split(' ')[0]}.` : `Let's get you set up, ${user.name.split(' ')[0]}.`}
            </h2>
          </div>
          <button onClick={onDismiss} className="btn-icon btn-ghost" style={{ color: '#F8EEE2', background: 'rgba(255,255,255,0.08)' }}>
            <Icon name="close" size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.14)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--gold)', borderRadius: 999, transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)' }}>{completed} of {items.length} complete</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {items.map(it => (
            <div key={it.id}
                 style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8,
                          background: it.done ? 'rgba(34,160,107,0.15)' : 'rgba(255,255,255,0.06)',
                          border: '1px solid', borderColor: it.done ? 'rgba(34,160,107,0.4)' : 'rgba(255,255,255,0.08)' }}>
              <button onClick={() => toggle(it.id)}
                      style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid',
                               borderColor: it.done ? '#22A06B' : 'rgba(248,238,226,0.4)',
                               background: it.done ? '#22A06B' : 'transparent',
                               display: 'grid', placeItems: 'center', flexShrink: 0, color: '#fff' }}>
                {it.done && <Icon name="check" size={11} stroke={3.5} />}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, textDecoration: it.done ? 'line-through' : 'none', opacity: it.done ? 0.7 : 1 }}>
                  {it.label}
                </div>
              </div>
              {!it.done && (
                <button onClick={it.action} className="btn-ghost" style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>
                  Go <Icon name="arrowRight" size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

window.InboxPage = InboxPage;
window.DeadlinesPage = DeadlinesPage;
window.OnboardingChecklist = OnboardingChecklist;
