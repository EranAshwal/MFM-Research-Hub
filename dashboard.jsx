/* MFM Research Hub — PI dashboard */

const PortfolioDonut = ({ projects }) => {
  // Group by status family
  const groups = [
    { label: 'Ideation / Protocol', match: ['Idea / Concept', 'Protocol development', 'REB preparation'], color: 'var(--dundurn)' },
    { label: 'In ethics review', match: ['REB submitted', 'REB approved', 'Data access pending'], color: 'var(--status-amber)' },
    { label: 'Data & analysis', match: ['Data collection', 'Data cleaning', 'Statistical analysis'], color: 'var(--bayfront)' },
    { label: 'Writing', match: ['Manuscript drafting', 'Internal review'], color: 'var(--maroon)' },
    { label: 'Submission', match: ['Submitted to journal', 'Revision requested', 'Accepted / Published'], color: 'var(--gold-deep)' },
  ];
  const counts = groups.map(g => ({ ...g, n: projects.filter(p => g.match.includes(p.status)).length }));
  const total = counts.reduce((s, c) => s + c.n, 0) || 1;

  // Build donut gradient
  let cur = 0;
  const stops = counts.map(c => {
    const start = (cur / total) * 100;
    cur += c.n;
    const end = (cur / total) * 100;
    return `${c.color} ${start}% ${end}%`;
  }).join(', ');

  return (
    <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 152, height: 152, flexShrink: 0 }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `conic-gradient(${stops})` }} />
        <div style={{ position: 'absolute', inset: 22, borderRadius: '50%', background: 'var(--paper)', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <div className="serif" style={{ fontSize: 28, fontWeight: 600, lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Active</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {counts.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} />
            <span style={{ flex: 1, color: 'var(--ink-2)' }}>{c.label}</span>
            <span style={{ fontWeight: 600 }}>{c.n}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const UrgencyList = ({ projects, navigate }) => {
  const urgent = [...projects]
    .map(p => ({ ...p, daysToNext: Math.round((new Date(p.nextDue) - new Date('2026-05-24')) / (24*3600*1000)) }))
    .filter(p => p.health === 'amber' || p.health === 'red' || p.daysToNext <= 7)
    .sort((a, b) => a.daysToNext - b.daysToNext)
    .slice(0, 6);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {urgent.map(p => {
        const overdue = p.daysToNext < 0;
        return (
          <button key={p.id} onClick={() => navigate({ page: 'projects', id: p.id })}
                  style={{ display: 'grid', gridTemplateColumns: '12px 1fr auto', gap: 10, padding: '10px 12px', borderRadius: 8, alignItems: 'center', border: '1px solid var(--hairline)', background: 'var(--paper)', textAlign: 'left', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--paper)'}>
            <HealthDot health={p.health} />
            <div style={{ minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{p.acronym}</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nextMilestone}</div>
            </div>
            <span className={`chip ${overdue ? 'chip-red' : p.daysToNext <= 3 ? 'chip-amber' : 'chip-grey'}`}>
              {overdue ? `${-p.daysToNext}d overdue` : `Due ${relDate(p.nextDue)}`}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const UpcomingMilestones = ({ projects, navigate }) => {
  const all = [];
  Object.keys(MILESTONES).forEach(pid => {
    MILESTONES[pid].forEach(m => {
      if (m.status !== 'done') {
        const proj = projects.find(p => p.id === pid);
        if (proj) all.push({ ...m, project: proj });
      }
    });
  });
  // include nextDue from projects without explicit milestones
  projects.forEach(p => {
    if (!MILESTONES[p.id]) all.push({ id: `next-${p.id}`, title: p.nextMilestone, due: p.nextDue, owner: p.lead, status: 'todo', project: p });
  });
  const sorted = all.sort((a, b) => new Date(a.due) - new Date(b.due)).slice(0, 6);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sorted.map(m => {
        const owner = personById(m.owner);
        const overdue = new Date(m.due) < new Date('2026-05-24');
        return (
          <button key={`${m.project.id}-${m.id}`}
                  onClick={() => navigate({ page: 'projects', id: m.project.id, tab: 'timeline' })}
                  style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 12, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--hairline)', alignItems: 'center', background: 'var(--paper)', textAlign: 'left', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--paper)'}>
            <div style={{ width: 36, height: 40, background: 'var(--maroon-wash)', borderRadius: 6, textAlign: 'center', paddingTop: 4, color: 'var(--maroon)' }}>
              <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase' }}>{new Date(m.due).toLocaleDateString('en', { month: 'short' })}</div>
              <div className="serif" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{new Date(m.due).getDate()}</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="mono" style={{ fontSize: 10 }}>{m.project.acronym}</span>
                <span className="dot" />
                <span>{owner?.name || 'Unassigned'}</span>
              </div>
            </div>
            <span className={`chip ${overdue ? 'chip-red' : 'chip-grey'}`}>{relDate(m.due)}</span>
          </button>
        );
      })}
    </div>
  );
};

const ActivityFeed = ({ items, navigate, limit = 8 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.slice(0, limit).map((a, i) => {
        const user = personById(a.user);
        const project = PROJECTS.find(p => p.id === a.project);
        const iconMap = { update: 'updates', file: 'paperclip', comment: 'message', status: 'flag', milestone: 'flag' };
        return (
          <div key={a.id} style={{ display: 'flex', gap: 10, padding: '12px 0', borderBottom: i === items.length - 1 || i === limit - 1 ? 'none' : '1px solid var(--hairline)' }}>
            <Avatar user={user} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{user?.name}</span>{' '}
                <span style={{ color: 'var(--muted)' }}>{a.text}</span>{' '}
                <button onClick={() => navigate({ page: 'projects', id: project.id })}
                        style={{ color: 'var(--maroon)', fontWeight: 500, fontSize: 13 }}>
                  {project?.acronym}
                </button>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{a.detail}</div>
              <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 4 }}>{relDate(a.date)}</div>
            </div>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-elevated)', display: 'grid', placeItems: 'center', color: 'var(--muted)', flexShrink: 0 }}>
              <Icon name={iconMap[a.type] || 'message'} size={13} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ProjectCard = ({ project, navigate, variant = 'rich' }) => {
  const lead = personById(project.lead);
  const members = project.members.map(personById).filter(Boolean);
  const overdue = new Date(project.nextDue) < new Date('2026-05-24');
  const isMinimal = variant === 'minimal';

  return (
    <div className={`project-card ${isMinimal ? 'minimal' : ''}`} onClick={() => navigate({ page: 'projects', id: project.id })}>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row gap-2" style={{ marginBottom: 4 }}>
            <span className="mono project-acronym">{project.acronym}</span>
            <HealthDot health={project.health} />
            {project.awaitingReview && <span className="chip chip-gold">Needs PI review</span>}
            {project.awaitingUpdate && <span className="chip chip-amber">Awaiting update</span>}
          </div>
          <div className="project-title">{project.title}</div>
        </div>
        {!isMinimal && (
          <button className="btn-icon btn-ghost" onClick={e => e.stopPropagation()}><Icon name="moreH" size={16} /></button>
        )}
      </div>

      {!isMinimal && (
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
          {project.description}
        </div>
      )}

      <div className="row between" style={{ marginTop: 2 }}>
        <StatusChip status={project.status} />
        {!isMinimal && <span className="chip chip-grey">{project.category}</span>}
      </div>

      <div>
        <div className="row between" style={{ marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Progress</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{project.progress}%</span>
        </div>
        <ProgressBar value={project.progress} color={project.health === 'amber' ? 'gold' : project.health === 'red' ? 'gold' : 'maroon'} />
      </div>

      {!isMinimal && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 4 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Lead trainee</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Avatar user={lead} size="sm" />
              <span style={{ fontSize: 12, fontWeight: 500 }}>{lead?.name.split(' ')[lead.name.split(' ').length - 1]}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Next milestone</div>
            <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={project.nextMilestone}>
              <span className={overdue ? 'chip-red' : ''} style={{ color: overdue ? 'var(--status-red)' : 'inherit' }}>
                {relDate(project.nextDue)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="row between" style={{ marginTop: 4, paddingTop: 12, borderTop: '1px solid var(--hairline)' }}>
        <AvatarStack users={members} size="sm" />
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon name="paperclip" size={12} /> {project.fileCount}
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 10 }}>Updated {relDate(project.lastUpdate)}</span>
        </div>
      </div>
    </div>
  );
};

const StatusPulse = ({ projects, navigate, toast, openReport }) => {
  const refDate = new Date('2026-05-24');
  const enriched = projects.map(p => {
    const days = Math.round((refDate - new Date(p.lastUpdate)) / (24 * 3600 * 1000));
    let freshness = 'fresh';
    if (days > 14) freshness = 'cold';
    else if (days > 7) freshness = 'stale';
    return { ...p, daysSinceUpdate: days, freshness };
  }).sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);

  const fresh = enriched.filter(p => p.freshness === 'fresh').length;
  const stale = enriched.filter(p => p.freshness === 'stale').length;
  const cold = enriched.filter(p => p.freshness === 'cold').length;

  const [filter, setFilter] = useState('all');
  const visible = filter === 'all' ? enriched : enriched.filter(p => p.freshness === filter);

  const sendNudge = (p) => {
    const lead = personById(p.lead);
    toast(`Nudge sent to ${lead?.name.split(' ').slice(-1)[0]} for ${p.acronym}`);
  };
  const nudgeAll = (group) => {
    const targets = enriched.filter(p => p.freshness === group);
    toast(`Nudge sent to ${targets.length} trainee${targets.length === 1 ? '' : 's'} on ${group} projects`);
  };

  return (
    <div className="card" style={{ overflow: 'hidden', marginTop: 22 }}>
      <div className="row between" style={{ padding: '16px 18px 12px', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 16, fontFamily: 'var(--ff-serif)', fontWeight: 600 }}>Status pulse</h3>
            <span className="chip chip-maroon">PI view</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>At-a-glance check on every project — where it stands, when it last moved, and what you can do about it.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" onClick={() => toast('Weekly portfolio digest queued for Friday morning')}>
            <Icon name="updates" size={12} /> Send weekly digest
          </button>
          <button className="btn btn-sm" onClick={() => nudgeAll('cold')} disabled={cold === 0}>
            <Icon name="bell" size={12} /> Nudge cold projects
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => openReport('portfolio', null)}>
            <Icon name="reports" size={12} /> Portfolio report
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
        {[
          { id: 'fresh', label: 'Fresh', sub: 'Updated within 7 days', n: fresh, color: 'var(--status-green)', wash: 'var(--status-green-wash)' },
          { id: 'stale', label: 'Stale', sub: '8–14 days since update', n: stale, color: 'var(--status-amber)', wash: 'var(--status-amber-wash)' },
          { id: 'cold', label: 'Cold', sub: 'No update for 15+ days', n: cold, color: 'var(--status-red)', wash: 'var(--status-red-wash)' },
        ].map((s, i) => (
          <button key={s.id} onClick={() => setFilter(filter === s.id ? 'all' : s.id)}
                  style={{ padding: '14px 18px', textAlign: 'left', borderRight: i < 2 ? '1px solid var(--border)' : 'none', background: filter === s.id ? s.wash : 'transparent', cursor: 'pointer', transition: 'background 0.15s', position: 'relative' }}>
            {filter === s.id && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: s.color }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: s.color }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
            </div>
            <div className="serif" style={{ fontSize: 32, fontWeight: 600, marginTop: 4, lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{s.sub}</div>
          </button>
        ))}
      </div>

      <div style={{ maxHeight: 380, overflow: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 26 }}></th>
              <th>Project</th>
              <th>Where it stands</th>
              <th>Lead</th>
              <th style={{ width: 140 }}>Last update</th>
              <th style={{ width: 180 }}>Next due</th>
              <th style={{ width: 180 }}></th>
            </tr>
          </thead>
          <tbody>
            {visible.map(p => {
              const lead = personById(p.lead);
              const overdue = new Date(p.nextDue) < refDate;
              const freshColor = p.freshness === 'fresh' ? 'var(--status-green)' : p.freshness === 'stale' ? 'var(--status-amber)' : 'var(--status-red)';
              return (
                <tr key={p.id}>
                  <td><HealthDot health={p.health} /></td>
                  <td style={{ maxWidth: 280 }} onClick={() => navigate({ page: 'projects', id: p.id })}>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{p.acronym}</div>
                    <div className="serif" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{p.title}</div>
                  </td>
                  <td onClick={() => navigate({ page: 'projects', id: p.id })}>
                    <StatusChip status={p.status} />
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{p.progress}% complete</div>
                  </td>
                  <td onClick={() => navigate({ page: 'projects', id: p.id })}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Avatar user={lead} size="sm" />
                      <span style={{ fontSize: 12 }}>{lead?.name.split(' ').slice(-1)[0]}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: freshColor }} />
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{relDate(p.lastUpdate)}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, marginLeft: 14 }}>{p.daysSinceUpdate}d ago</div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: overdue ? 'var(--status-red)' : 'var(--ink-2)', fontWeight: overdue ? 600 : 500 }}>
                      {relDate(p.nextDue)}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }} title={p.nextMilestone}>{p.nextMilestone}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn btn-sm" onClick={() => sendNudge(p)} title="Nudge trainee">
                        <Icon name="bell" size={12} /> Nudge
                      </button>
                      <button className="btn btn-sm" onClick={() => openReport('summary', p)} title="Generate report">
                        <Icon name="reports" size={12} /> Report
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Dashboard = ({ navigate, tweaks, toast, openReport, currentUser, showOnboarding, dismissOnboarding }) => {
  const today = new Date('2026-05-24');
  const active = PROJECTS.filter(p => !['Completed', 'Archived'].includes(p.status));
  const onTrack = PROJECTS.filter(p => p.health === 'green').length;
  const delayed = PROJECTS.filter(p => p.health === 'amber' || p.health === 'red').length;
  const awaitingUpdate = PROJECTS.filter(p => p.awaitingUpdate).length;
  const awaitingReview = PROJECTS.filter(p => p.awaitingReview).length;
  const upcoming = PROJECTS.filter(p => {
    const d = (new Date(p.nextDue) - today) / (24*3600*1000);
    return d >= 0 && d <= 14;
  }).length;
  const completedThisYear = 4; // Mock

  const kpis = [
    { label: 'Active projects', value: active.length, accent: '', sub: '↑ 2 from last quarter' },
    { label: 'On track', value: onTrack, accent: 'forest', sub: `${Math.round(onTrack/active.length*100)}% of active portfolio` },
    { label: 'Needs attention', value: delayed, accent: 'amber', sub: `${delayed} flagged for follow-up` },
    { label: 'Awaiting trainee update', value: awaitingUpdate, accent: 'red', sub: `Oldest: 21 days ago` },
    { label: 'Awaiting PI review', value: awaitingReview, accent: 'gold', sub: `Includes 1 manuscript ready` },
    { label: 'Due in next 14 days', value: upcoming, accent: 'bay', sub: '6 milestones across portfolio' },
    { label: 'Submitted to journal', value: 1, accent: '', sub: 'CARDIO-PE awaiting reviews' },
    { label: 'Completed this year', value: completedThisYear, accent: 'forest', sub: '+1 vs same period 2025' },
  ];

  // Trainee leaderboard
  const trainees = PEOPLE.filter(p => ['Resident', 'MFM Fellow', 'Medical Student'].includes(p.role));
  const traineeStats = trainees.map(t => {
    const theirProjects = PROJECTS.filter(p => p.lead === t.id || p.members.includes(t.id));
    const overdueCount = theirProjects.filter(p => new Date(p.nextDue) < today).length;
    const lastUpdate = UPDATES.filter(u => u.user === t.id).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    return { ...t, count: theirProjects.length, overdueCount, lastUpdate: lastUpdate?.date };
  }).filter(t => t.count > 0).sort((a, b) => b.count - a.count);

  const isTrainee = currentUser && ['Resident', 'MFM Fellow', 'Medical Student', 'Volunteer'].includes(currentUser.role);

  // Customize greeting based on role
  const greetingName = currentUser?.name.split(' ').filter(s => !s.endsWith('.'))[0] || 'there';
  const piGreeting = currentUser?.role === 'Principal Investigator' ? `Good morning, Dr. Ashwal.` : `Hi ${greetingName} — welcome back.`;

  return (
    <div className="page">
      {/* Onboarding for trainees */}
      {isTrainee && showOnboarding && (
        <OnboardingChecklist user={currentUser} navigate={navigate} onDismiss={dismissOnboarding} />
      )}

      {/* Header */}
      <div className="page-header row between">
        <div>
          <div className="eyebrow">{new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
          <h1 className="page-title" style={{ marginTop: 4 }}>{piGreeting}</h1>
          <p className="page-sub">Here's what's happening across your research portfolio today.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn">
            <Icon name="download" size={14} />
            Export portfolio
          </button>
          <button className="btn btn-gold" onClick={() => openReport('portfolio', null)}>
            <Icon name="reports" size={14} />
            Generate report
          </button>
        </div>
      </div>

      {/* PHI banner */}
      <div className="phi-banner" style={{ marginBottom: 22 }}>
        <Icon name="alert" size={18} stroke={2} />
        <div>
          <strong>Privacy notice</strong> — Do not upload patient-identifiable information (PHI) unless this system has been approved for secure institutional use. This is a prototype environment.
        </div>
      </div>

      {/* KPI grid */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {kpis.map((k, i) => (
          <div key={i} className="kpi">
            {k.accent && <div className={`kpi-accent ${k.accent}`} />}
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-foot">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Status pulse — primary PI view */}
      <StatusPulse projects={PROJECTS.filter(p => !['Completed', 'Archived'].includes(p.status))} navigate={navigate} toast={toast} openReport={openReport} />

      {/* Mid section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20, marginTop: 22 }}>
        <div className="card card-pad">
          <div className="row between" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontFamily: 'var(--ff-serif)', fontWeight: 600 }}>Portfolio status</h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Projects by current phase</p>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => navigate({ page: 'projects' })}>
              View all <Icon name="arrowRight" size={12} />
            </button>
          </div>
          <PortfolioDonut projects={active} />
        </div>

        <div className="card card-pad">
          <div className="row between" style={{ marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontFamily: 'var(--ff-serif)', fontWeight: 600 }}>Needs your attention</h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Sorted by urgency</p>
            </div>
          </div>
          <UrgencyList projects={PROJECTS} navigate={navigate} />
        </div>
      </div>

      {/* Either project cards or data-dense table */}
      {tweaks.dashboard === 'cards' ? (
        <div style={{ marginTop: 24 }}>
          <div className="row between" style={{ marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 18, fontFamily: 'var(--ff-serif)', fontWeight: 600 }}>Active projects</h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{active.length} projects, sorted by recent activity</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" onClick={() => navigate({ page: 'projects' })}>
                <Icon name="filter" size={12} /> Filter
              </button>
              <button className="btn btn-sm" onClick={() => navigate({ page: 'projects' })}>
                <Icon name="grid" size={12} /> View all
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {active.slice(0, 6).map(p => (
              <ProjectCard key={p.id} project={p} navigate={navigate} variant={tweaks.cardVariant} />
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="row between" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <h3 style={{ fontSize: 16, fontFamily: 'var(--ff-serif)', fontWeight: 600 }}>Active projects</h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{active.length} projects</p>
            </div>
            <button className="btn btn-sm" onClick={() => navigate({ page: 'projects' })}>View all <Icon name="arrowRight" size={12} /></button>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Health</th>
                <th>Lead</th>
                <th style={{ width: 160 }}>Progress</th>
                <th>Next milestone</th>
                <th>Last update</th>
              </tr>
            </thead>
            <tbody>
              {active.map(p => {
                const lead = personById(p.lead);
                const overdue = new Date(p.nextDue) < today;
                return (
                  <tr key={p.id} onClick={() => navigate({ page: 'projects', id: p.id })}>
                    <td>
                      <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{p.acronym}</div>
                      <div className="serif" style={{ fontSize: 14, fontWeight: 600, marginTop: 1, lineHeight: 1.3 }}>{p.title}</div>
                    </td>
                    <td><StatusChip status={p.status} /></td>
                    <td><HealthDot health={p.health} label /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar user={lead} size="sm" />
                        <span style={{ fontSize: 12 }}>{lead?.name.split(' ').slice(-1)[0]}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1 }}><ProgressBar value={p.progress} /></div>
                        <span style={{ fontSize: 11, fontWeight: 600, width: 30 }}>{p.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{p.nextMilestone}</div>
                      <div style={{ fontSize: 11, color: overdue ? 'var(--status-red)' : 'var(--muted)', marginTop: 2 }}>
                        {relDate(p.nextDue)}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{relDate(p.lastUpdate)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom 3-col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 24 }}>
        <div className="card card-pad">
          <div className="row between" style={{ marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontFamily: 'var(--ff-serif)', fontWeight: 600 }}>Upcoming milestones</h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Next 14 days</p>
            </div>
          </div>
          <UpcomingMilestones projects={PROJECTS} navigate={navigate} />
        </div>
        <div className="card card-pad">
          <div className="row between" style={{ marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontFamily: 'var(--ff-serif)', fontWeight: 600 }}>Activity</h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Recent across portfolio</p>
            </div>
            <button className="btn-ghost" style={{ fontSize: 11, color: 'var(--muted)' }}>See all</button>
          </div>
          <ActivityFeed items={ACTIVITY} navigate={navigate} limit={6} />
        </div>
        <div className="card card-pad">
          <div className="row between" style={{ marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontFamily: 'var(--ff-serif)', fontWeight: 600 }}>Trainee activity</h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Last submitted update</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {traineeStats.slice(0, 6).map(t => (
              <div key={t.id} onClick={() => navigate({ page: 'people', id: t.id })}
                   style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 10, alignItems: 'center', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}
                   onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Avatar user={t} size="md" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.training} · {t.count} project{t.count > 1 ? 's' : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Last update</div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{t.lastUpdate ? relDate(t.lastUpdate) : '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
window.ProjectCard = ProjectCard;
