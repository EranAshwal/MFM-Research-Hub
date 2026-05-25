/* MFM Research Hub — projects registry */

const FilterChip = ({ label, value, onClear, active }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: active ? 'var(--maroon-wash)' : 'var(--bg-elevated)', color: active ? 'var(--maroon)' : 'var(--ink-2)', fontSize: 12, fontWeight: 500, border: '1px solid', borderColor: active ? 'var(--maroon)' : 'var(--border)' }}>
    <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{label}:</span> {value}
    {onClear && <button onClick={onClear} style={{ display: 'inline-grid', placeItems: 'center', color: 'inherit', marginLeft: 2 }}><Icon name="close" size={12} stroke={2.5} /></button>}
  </div>
);

const Select = ({ value, onChange, options, label, allLabel = 'All' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
    <select value={value} onChange={e => onChange(e.target.value)} style={{ minWidth: 140 }}>
      <option value="">{allLabel}</option>
      {options.map(o => <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>{typeof o === 'string' ? o : o.label}</option>)}
    </select>
  </div>
);

const ProjectsRegistry = ({ navigate, search, tweaks, currentUser }) => {
  const isAdmin = !!(window.AuthService && window.AuthService.isAdmin && window.AuthService.isAdmin());
  // Trainees and other non-admins only see projects they're a member of (or PI/lead on)
  const visibleProjects = isAdmin ? PROJECTS : PROJECTS.filter(p =>
    p.pi === currentUser?.id || p.lead === currentUser?.id || (p.members || []).includes(currentUser?.id)
  );

  const [view, setView] = useState('cards');
  const [statusF, setStatusF] = useState('');
  const [healthF, setHealthF] = useState('');
  const [leadF, setLeadF] = useState('');
  const [categoryF, setCategoryF] = useState('');
  const [rebF, setRebF] = useState('');
  const [awaitF, setAwaitF] = useState('');
  const [sort, setSort] = useState('updated');

  const filtered = useMemo(() => {
    let r = visibleProjects.filter(p => {
      if (statusF && p.status !== statusF) return false;
      if (healthF && p.health !== healthF) return false;
      if (leadF && p.lead !== leadF) return false;
      if (categoryF && p.category !== categoryF) return false;
      if (rebF && p.reb !== rebF) return false;
      if (awaitF === 'update' && !p.awaitingUpdate) return false;
      if (awaitF === 'review' && !p.awaitingReview) return false;
      if (awaitF === 'overdue' && new Date(p.nextDue) >= new Date('2026-05-24')) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!p.title.toLowerCase().includes(s) && !p.acronym.toLowerCase().includes(s) && !p.description.toLowerCase().includes(s)) return false;
      }
      return true;
    });
    if (sort === 'updated') r.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
    if (sort === 'due') r.sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));
    if (sort === 'progress') r.sort((a, b) => b.progress - a.progress);
    if (sort === 'name') r.sort((a, b) => a.title.localeCompare(b.title));
    return r;
  }, [statusF, healthF, leadF, categoryF, rebF, awaitF, sort, search]);

  const leads = [...new Set(visibleProjects.map(p => p.lead))].map(id => personById(id)).filter(Boolean);
  const categories = [...new Set(visibleProjects.map(p => p.category))];
  const rebOptions = [...new Set(visibleProjects.map(p => p.reb))];

  const clearAll = () => {
    setStatusF(''); setHealthF(''); setLeadF(''); setCategoryF(''); setRebF(''); setAwaitF('');
  };
  const hasFilters = statusF || healthF || leadF || categoryF || rebF || awaitF;

  return (
    <div className="page">
      <div className="page-header row between" style={{ alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-sub">{filtered.length} of {visibleProjects.length} projects shown{!isAdmin ? ' · your assigned projects' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn">
            <Icon name="download" size={14} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => window.__openNewProject?.()}>
            <Icon name="plus" size={14} stroke={2} /> New project
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Select label="Status" value={statusF} onChange={setStatusF} options={STATUSES} />
          <Select label="Health" value={healthF} onChange={setHealthF} options={[
            { value: 'green', label: 'On track' }, { value: 'amber', label: 'Needs attention' }, { value: 'red', label: 'Delayed' }, { value: 'grey', label: 'Inactive' }
          ]} />
          <Select label="Lead trainee" value={leadF} onChange={setLeadF} options={leads.map(p => ({ value: p.id, label: p.name }))} />
          <Select label="Category" value={categoryF} onChange={setCategoryF} options={categories} />
          <Select label="REB status" value={rebF} onChange={setRebF} options={rebOptions} />
          <Select label="Show only" value={awaitF} onChange={setAwaitF} options={[
            { value: 'update', label: 'Awaiting update' }, { value: 'review', label: 'Awaiting PI review' }, { value: 'overdue', label: 'Overdue' }
          ]} />
          <div style={{ flex: 1 }} />
          <Select label="Sort by" value={sort} onChange={setSort} options={[
            { value: 'updated', label: 'Recently updated' }, { value: 'due', label: 'Next due date' }, { value: 'progress', label: 'Progress' }, { value: 'name', label: 'Title (A–Z)' }
          ]} allLabel="" />
          <div style={{ display: 'flex', padding: 3, background: 'var(--bg-elevated)', borderRadius: 8, gap: 2 }}>
            {[
              { id: 'cards', icon: 'grid', label: 'Cards' },
              { id: 'table', icon: 'list', label: 'Table' },
              { id: 'kanban', icon: 'kanban', label: 'Kanban' },
              { id: 'timeline', icon: 'timeline', label: 'Timeline' },
            ].map(v => (
              <button key={v.id} onClick={() => setView(v.id)} title={v.label}
                      style={{ padding: '6px 10px', borderRadius: 6, background: view === v.id ? 'var(--paper)' : 'transparent', boxShadow: view === v.id ? 'var(--shadow-1)' : 'none', color: view === v.id ? 'var(--ink)' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500 }}>
                <Icon name={v.icon} size={14} />
                {v.label}
              </button>
            ))}
          </div>
        </div>
        {hasFilters && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--hairline)' }}>
            {statusF && <FilterChip label="Status" value={statusF} active onClear={() => setStatusF('')} />}
            {healthF && <FilterChip label="Health" value={healthLabel(healthF)} active onClear={() => setHealthF('')} />}
            {leadF && <FilterChip label="Lead" value={personById(leadF)?.name} active onClear={() => setLeadF('')} />}
            {categoryF && <FilterChip label="Category" value={categoryF} active onClear={() => setCategoryF('')} />}
            {rebF && <FilterChip label="REB" value={rebF} active onClear={() => setRebF('')} />}
            {awaitF && <FilterChip label="Filter" value={awaitF} active onClear={() => setAwaitF('')} />}
            <button onClick={clearAll} style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'underline' }}>Clear all</button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="card card-pad" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ width: 56, height: 56, margin: '0 auto', borderRadius: 16, background: 'var(--maroon-wash)', color: 'var(--maroon)', display: 'grid', placeItems: 'center' }}>
            <Icon name="search" size={22} />
          </div>
          <div className="serif" style={{ fontSize: 20, fontWeight: 600, marginTop: 14 }}>No projects match these filters</div>
          <p style={{ color: 'var(--muted)', marginTop: 6 }}>Try adjusting or clearing filters above.</p>
          <button className="btn" style={{ marginTop: 16 }} onClick={clearAll}>Clear filters</button>
        </div>
      )}

      {/* Cards view */}
      {view === 'cards' && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {filtered.map(p => <ProjectCard key={p.id} project={p} navigate={navigate} variant={tweaks.cardVariant} />)}
        </div>
      )}

      {/* Table view */}
      {view === 'table' && filtered.length > 0 && (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th>Project</th>
                <th>Status</th>
                <th>Lead</th>
                <th>Members</th>
                <th style={{ width: 140 }}>Progress</th>
                <th>Next due</th>
                <th>REB</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const lead = personById(p.lead);
                const members = p.members.map(personById).filter(Boolean);
                return (
                  <tr key={p.id} onClick={() => navigate({ page: 'projects', id: p.id })}>
                    <td><HealthDot health={p.health} /></td>
                    <td style={{ maxWidth: 340 }}>
                      <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{p.acronym}</div>
                      <div className="serif" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{p.title}</div>
                    </td>
                    <td><StatusChip status={p.status} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar user={lead} size="sm" />
                        <span style={{ fontSize: 12 }}>{lead?.name.split(' ').slice(-1)[0]}</span>
                      </div>
                    </td>
                    <td><AvatarStack users={members} max={4} size="sm" /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 60 }}><ProgressBar value={p.progress} /></div>
                        <span style={{ fontSize: 11, fontWeight: 600, width: 30 }}>{p.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: new Date(p.nextDue) < new Date('2026-05-24') ? 'var(--status-red)' : 'var(--ink-2)', fontWeight: 500 }}>
                        {relDate(p.nextDue)}
                      </span>
                    </td>
                    <td><span style={{ fontSize: 12 }}>{p.reb}</span></td>
                    <td><span style={{ fontSize: 12, color: 'var(--muted)' }}>{relDate(p.lastUpdate)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Kanban view */}
      {view === 'kanban' && filtered.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(260px, 1fr))', gap: 12, minWidth: 1200 }}>
            {[
              { label: 'Ideation', statuses: ['Idea / Concept', 'Protocol development', 'REB preparation'], color: 'var(--dundurn)' },
              { label: 'Ethics', statuses: ['REB submitted', 'REB approved', 'Data access pending'], color: 'var(--status-amber)' },
              { label: 'Data & analysis', statuses: ['Data collection', 'Data cleaning', 'Statistical analysis'], color: 'var(--bayfront)' },
              { label: 'Writing', statuses: ['Manuscript drafting', 'Internal review'], color: 'var(--maroon)' },
              { label: 'Submission', statuses: ['Submitted to journal', 'Revision requested', 'Accepted / Published'], color: 'var(--gold-deep)' },
            ].map(col => {
              const items = filtered.filter(p => col.statuses.includes(p.status));
              return (
                <div key={col.label} className="kanban-col" style={{ minHeight: 400 }}>
                  <div className="kanban-col-h">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: col.color }} />
                      {col.label}
                    </div>
                    <span style={{ color: 'var(--muted)', fontWeight: 500 }}>{items.length}</span>
                  </div>
                  <div>
                    {items.map(p => {
                      const lead = personById(p.lead);
                      return (
                        <div key={p.id} className="kanban-card" onClick={() => navigate({ page: 'projects', id: p.id })}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div className="mono" style={{ fontSize: 9, color: 'var(--muted)' }}>{p.acronym}</div>
                            <HealthDot health={p.health} />
                          </div>
                          <div className="serif" style={{ fontSize: 13, fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>{p.title}</div>
                          <div style={{ marginTop: 8 }}>
                            <ProgressBar value={p.progress} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--hairline)' }}>
                            <Avatar user={lead} size="sm" />
                            <span style={{ fontSize: 10, color: 'var(--muted)' }}>{relDate(p.nextDue)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline view */}
      {view === 'timeline' && filtered.length > 0 && (
        <div className="card" style={{ padding: 20, overflow: 'auto' }}>
          <div style={{ position: 'relative', minWidth: 1000 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <div className="eyebrow">Project</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => (
                  <div key={m} className="eyebrow" style={{ textAlign: 'center' }}>{m}</div>
                ))}
              </div>
            </div>
            {filtered.map(p => {
              const start = new Date(p.start);
              const target = new Date(p.target);
              // calc relative to 2026
              const year = 2026;
              const startMonth = (start.getFullYear() < year ? 0 : start.getMonth() + (start.getFullYear() - year) * 12);
              const endMonth = Math.min(11, target.getMonth() + (target.getFullYear() - year) * 12);
              const left = Math.max(0, startMonth) / 12 * 100;
              const width = Math.max(4, ((endMonth - Math.max(0, startMonth) + 1) / 12) * 100);
              const colorMap = { green: 'var(--status-green)', amber: 'var(--status-amber)', red: 'var(--status-red)', grey: 'var(--muted-2)' };
              return (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, padding: '10px 0', alignItems: 'center', borderBottom: '1px solid var(--hairline)', cursor: 'pointer' }}
                     onClick={() => navigate({ page: 'projects', id: p.id })}>
                  <div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{p.acronym}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                  </div>
                  <div style={{ position: 'relative', height: 24, background: 'var(--bg-elevated)', borderRadius: 4 }}>
                    <div style={{ position: 'absolute', left: `${left}%`, width: `${width}%`, top: 4, bottom: 4, background: colorMap[p.health], borderRadius: 3, display: 'flex', alignItems: 'center', padding: '0 8px', overflow: 'hidden' }}>
                      <span style={{ fontSize: 10, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>{p.progress}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>Showing year 2026. Project bars span declared start to target completion.</div>
        </div>
      )}
    </div>
  );
};

window.ProjectsRegistry = ProjectsRegistry;
