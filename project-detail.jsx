/* MFM Research Hub — project detail workspace (7 tabs) */

// Pick a person from PEOPLE to add to a project
const AddMemberModal = ({ project, onClose, toast, onAdded }) => {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('Member');
  const [adding, setAdding] = useState(null);
  const memberIds = new Set(project.members || []);
  const available = PEOPLE.filter(p =>
    !memberIds.has(p.id) &&
    p.id !== project.pi && p.id !== project.lead &&
    (!search || (p.name + ' ' + p.role + ' ' + (p.email || '')).toLowerCase().includes(search.toLowerCase()))
  );

  const add = async (person) => {
    setAdding(person.id);
    try {
      await window.DataService.addProjectMember(project.id, person.id, role);
      toast?.(`${person.name} added to ${project.acronym}`);
      onAdded?.();
    } catch (e) {
      toast?.('Add failed: ' + e.message, 'error');
    }
    setAdding(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <div>
            <div className="serif" style={{ fontSize: 18, fontWeight: 600 }}>Add member to {project.acronym}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Pick someone from the team</div>
          </div>
          <button className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-b" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Search by name, role, email…" autoFocus style={{ width: '100%' }} />
            <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%' }}>
              {['Member','Lead','Co-Investigator','Trainee','Statistician','Collaborator'].map(r =>
                <option key={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ maxHeight: 360, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6,
                        border: '1px solid var(--hairline)', borderRadius: 8, padding: 6 }}>
            {available.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                {search ? 'No matches.' : 'Everyone has already been added to this project.'}
              </div>
            )}
            {available.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                                        borderRadius: 6, cursor: adding === p.id ? 'wait' : 'default',
                                        background: adding === p.id ? 'var(--bg-elevated)' : 'transparent' }}>
                <Avatar user={p} size="sm" />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.role} · {p.training}</div>
                </div>
                <button className="btn btn-sm btn-primary" disabled={adding === p.id} onClick={() => add(p)}>
                  {adding === p.id ? 'Adding…' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-f">
          <button className="btn btn-ghost" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};

const TabOverview = ({ project, toast, currentUser }) => {
  const [, force] = useState(0);
  const refresh = () => force(n => n + 1);
  const [addingMember, setAddingMember] = useState(false);
  const [editing, setEditing] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [requestingUpdate, setRequestingUpdate] = useState(false);
  const isAdmin = !!(window.AuthService && window.AuthService.isAdmin && window.AuthService.isAdmin());
  const pi = personById(project.pi);
  const lead = personById(project.lead);
  const members = project.members.map(personById).filter(Boolean);

  const removeMember = async (personId) => {
    const person = personById(personId);
    if (!confirm(`Remove ${person?.name} from ${project.acronym}?`)) return;
    try {
      await window.DataService.removeProjectMember(project.id, personId);
      toast?.(`${person?.name} removed from project`);
      refresh();
    } catch (e) { toast?.('Remove failed: ' + e.message, 'error'); }
  };

  const archive = async () => {
    if (!confirm(`Archive ${project.acronym}? It will be hidden from active project lists. You can restore it via Edit later.`)) return;
    try {
      await window.DataService.updateProject(project.id, { status: 'Archived' });
      toast?.(`${project.acronym} archived`);
      refresh();
    } catch (e) { toast?.('Archive failed: ' + e.message, 'error'); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card card-pad">
          <div className="eyebrow">Summary</div>
          <p style={{ fontSize: 15, marginTop: 8, lineHeight: 1.6, color: 'var(--ink-2)' }}>{project.description}</p>
        </div>

        <div className="card card-pad">
          <div className="row between" style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 16, fontWeight: 600 }}>Study details</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => isAdmin && setEditing(true)} disabled={!isAdmin}><Icon name="pencil" size={12} /> Edit</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Acronym', value: project.acronym, mono: true },
              { label: 'Study design', value: project.studyDesign },
              { label: 'Clinical area', value: project.category },
              { label: 'Priority', value: <span className={`chip ${priorityChip(project.priority)}`}>{project.priority}</span> },
              { label: 'Data source', value: project.dataSource },
              { label: 'Target journal', value: project.targetJournal, serif: true },
              { label: 'Start date', value: fmtDate(project.start) },
              { label: 'Target completion', value: fmtDate(project.target) },
              { label: 'REB status', value: <span className={`chip ${project.reb === 'Approved' ? 'chip-green' : project.reb === 'Under review' ? 'chip-amber' : 'chip-grey'}`}>{project.reb}</span> },
              { label: 'Funding', value: 'Internal — Departmental research fund' },
            ].map((f, i) => (
              <div key={i}>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{f.label}</div>
                <div className={f.serif ? 'serif' : f.mono ? 'mono' : ''} style={{ fontSize: 13, fontWeight: f.serif ? 500 : 500, marginTop: 4 }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-pad">
          <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Team</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--hairline)' }}>
                <Avatar user={m} size="md" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{m.role} · {m.training}</div>
                </div>
                {m.id === lead?.id && <span className="chip chip-maroon">Lead</span>}
                {m.id === pi?.id && <span className="chip chip-gold">PI</span>}
                {isAdmin && m.id !== pi?.id && m.id !== lead?.id && (
                  <button className="btn-icon btn-ghost" onClick={() => removeMember(m.id)} title="Remove from project">
                    <Icon name="close" size={13} />
                  </button>
                )}
              </div>
            ))}
            {isAdmin && (
              <button className="btn btn-sm" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={() => setAddingMember(true)}>
                <Icon name="plus" size={12} stroke={2} /> Add member
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card card-pad">
          <div className="eyebrow">Progress</div>
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <div className="serif" style={{ fontSize: 40, fontWeight: 600 }}>{project.progress}</div>
              <div style={{ fontSize: 18, color: 'var(--muted)' }}>%</div>
            </div>
          </div>
          <ProgressBar value={project.progress} color={project.health === 'amber' ? 'gold' : 'maroon'} />
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HealthDot health={project.health} label />
          </div>
        </div>

        <div className="card card-pad">
          <div className="eyebrow">Next milestone</div>
          <div className="serif" style={{ fontSize: 16, fontWeight: 600, marginTop: 8, lineHeight: 1.3 }}>{project.nextMilestone}</div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="clock" size={14} color="var(--muted)" />
            <span style={{ fontSize: 12, color: new Date(project.nextDue) < new Date('2026-05-24') ? 'var(--status-red)' : 'var(--ink-2)', fontWeight: 500 }}>
              Due {fmtDate(project.nextDue)} · {relDate(project.nextDue)}
            </span>
          </div>
        </div>

        <div className="card card-pad">
          <div className="eyebrow">Quick actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            <button className="btn" onClick={() => setRequestingUpdate(true)}><Icon name="updates" size={14} /> Request update from trainee</button>
            <button className="btn" onClick={() => setGeneratingSummary(true)}><Icon name="reports" size={14} /> Generate project summary</button>
            <button className="btn" onClick={() => setUploadingFile(true)}><Icon name="upload" size={14} /> Upload file</button>
            <button className="btn" onClick={() => setAddingComment(true)}><Icon name="message" size={14} /> Add comment</button>
            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
            <button className="btn" onClick={() => isAdmin && setChangingStatus(true)} disabled={!isAdmin}><Icon name="alert" size={14} /> Change status</button>
            <button className="btn" style={{ color: 'var(--status-red)' }} onClick={() => isAdmin && archive()} disabled={!isAdmin}>Archive project</button>
          </div>
        </div>
      </div>
      {addingMember && (
        <AddMemberModal project={project} toast={toast}
                        onClose={() => setAddingMember(false)}
                        onAdded={() => { refresh(); }} />
      )}
      {editing && <EditProjectModal project={project} toast={toast} onClose={() => setEditing(false)} onSaved={refresh} />}
      {changingStatus && <ChangeStatusModal project={project} toast={toast} onClose={() => setChangingStatus(false)} onSaved={refresh} />}
      {addingComment && <AddCommentModal project={project} toast={toast} currentUser={currentUser} onClose={() => setAddingComment(false)} onSaved={refresh} />}
      {uploadingFile && <UploadFileModal project={project} toast={toast} currentUser={currentUser} onClose={() => setUploadingFile(false)} />}
      {generatingSummary && <GenerateSummaryModal project={project} toast={toast} onClose={() => setGeneratingSummary(false)} />}
      {requestingUpdate && <RequestUpdateModal project={project} toast={toast} currentUser={currentUser} onClose={() => setRequestingUpdate(false)} />}
    </div>
  );
};

const TabTimeline = ({ project, toast }) => {
  const [, force] = useState(0);
  const refresh = () => force(n => n + 1);
  useEffect(() => {
    const onChange = (e) => {
      if (e.detail?.table === 'milestones' || e.detail?.table === 'poll') refresh();
    };
    window.addEventListener('mfm:data-changed', onChange);
    return () => window.removeEventListener('mfm:data-changed', onChange);
  }, []);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const isAdmin = !!(window.AuthService && window.AuthService.isAdmin && window.AuthService.isAdmin());
  const canEdit = isAdmin; // could also allow project members later

  const milestones = (MILESTONES[project.id] && MILESTONES[project.id].length)
    ? MILESTONES[project.id]
    : (project.nextMilestone
        ? [{ id: 'auto', title: project.nextMilestone, owner: project.lead, due: project.nextDue, status: 'in_progress', completed: null }]
        : []);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
      <div className="card card-pad">
        <div className="row between" style={{ marginBottom: 18 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 18, fontWeight: 600 }}>Milestones</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{milestones.filter(m => m.status === 'done').length} of {milestones.length} complete</p>
          </div>
          {canEdit && (
            <button className="btn btn-sm" onClick={() => setAdding(true)}>
              <Icon name="plus" size={12} stroke={2} /> Add milestone
            </button>
          )}
        </div>
        <div>
          {milestones.map((m, i) => {
            const owner = personById(m.owner);
            const isDone = m.status === 'done';
            const isCurrent = m.status === 'in_progress';
            const isOverdue = m.status === 'overdue' || (m.status !== 'done' && new Date(m.due) < new Date('2026-05-24'));
            return (
              <div key={m.id} className="timeline-row"
                   onClick={() => canEdit && m.id !== 'auto' && setEditing(m)}
                   style={{ cursor: canEdit && m.id !== 'auto' ? 'pointer' : 'default' }}>
                <div className={`timeline-dot ${isDone ? 'done' : isCurrent ? 'current' : ''}`}>
                  {isDone ? <Icon name="check" size={14} stroke={3} /> : isCurrent ? <span style={{ width: 8, height: 8, borderRadius: 50, background: '#fff' }} /> : <span style={{ fontSize: 11, fontWeight: 600 }}>{i + 1}</span>}
                </div>
                <div style={{ padding: '4px 12px 16px 0' }}>
                  <div className="row between" style={{ alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="serif" style={{ fontSize: 14, fontWeight: 600, color: isDone ? 'var(--muted)' : 'var(--ink)', textDecoration: isDone ? 'line-through' : 'none' }}>{m.title}</div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11, color: 'var(--muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Icon name="user" size={11} /> {owner?.name || 'Unassigned'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Icon name="calendar" size={11} /> Due {fmtDate(m.due)}
                        </span>
                        {isDone && <span style={{ color: 'var(--status-green)' }}>Completed {fmtDate(m.completed)}</span>}
                      </div>
                    </div>
                    {isDone ? <span className="chip chip-green">Done</span> :
                     isOverdue ? <span className="chip chip-red">Overdue</span> :
                     isCurrent ? <span className="chip chip-maroon">In progress</span> :
                     <span className="chip chip-grey">Not started</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card card-pad">
          <div className="eyebrow">Gantt overview</div>
          <div style={{ marginTop: 12, fontSize: 12 }}>
            <div className="row between" style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>Start</span>
              <span style={{ fontWeight: 500 }}>{fmtDate(project.start)}</span>
            </div>
            <div className="row between" style={{ marginBottom: 12 }}>
              <span style={{ color: 'var(--muted)' }}>Target</span>
              <span style={{ fontWeight: 500 }}>{fmtDate(project.target)}</span>
            </div>
            <div style={{ position: 'relative', height: 10, background: 'var(--bg-elevated)', borderRadius: 999 }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${project.progress}%`, background: 'linear-gradient(90deg, var(--maroon), var(--gold-deep))', borderRadius: 999 }} />
              <div style={{ position: 'absolute', left: `${project.progress}%`, top: -3, width: 4, height: 16, background: 'var(--ink)', borderRadius: 999, transform: 'translateX(-50%)' }} />
            </div>
            <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 12 }}>
              <div style={{ color: 'var(--muted)' }}>Time used</div>
              <div className="serif" style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>~52% elapsed</div>
              <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>vs {project.progress}% project progress</div>
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <div className="eyebrow">Milestone health</div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Completed on time', n: milestones.filter(m => m.status === 'done').length, color: 'var(--status-green)' },
              { label: 'In progress', n: milestones.filter(m => m.status === 'in_progress').length, color: 'var(--maroon)' },
              { label: 'Overdue', n: milestones.filter(m => m.status === 'overdue').length, color: 'var(--status-red)' },
              { label: 'Not started', n: milestones.filter(m => m.status === 'todo').length, color: 'var(--muted)' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: r.color }} />
                  {r.label}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{r.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {adding && <MilestoneModal project={project} toast={toast} onClose={() => setAdding(false)} onSaved={refresh} />}
      {editing && <MilestoneModal project={project} milestone={editing} toast={toast} onClose={() => setEditing(null)} onSaved={refresh} />}
    </div>
  );
};

const KANBAN_COLS = [
  { id: 'todo', label: 'To do', color: 'var(--muted-2)' },
  { id: 'in_progress', label: 'In progress', color: 'var(--bayfront)' },
  { id: 'waiting', label: 'Waiting on someone', color: 'var(--status-amber)' },
  { id: 'review', label: 'Needs PI review', color: 'var(--maroon)' },
  { id: 'done', label: 'Done', color: 'var(--status-green)' },
];

const TabTasks = ({ project, toast }) => {
  const [, force] = useState(0);
  const refresh = () => force(n => n + 1);
  useEffect(() => {
    const onChange = (e) => {
      if (e.detail?.table === 'tasks' || e.detail?.table === 'poll') refresh();
    };
    window.addEventListener('mfm:data-changed', onChange);
    return () => window.removeEventListener('mfm:data-changed', onChange);
  }, []);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const initial = (window.TASKS[project.id] && window.TASKS[project.id].length)
    ? window.TASKS[project.id]
    : [];
  const [tasks, setTasks] = useState(initial);
  // Keep tasks in sync with global TASKS dict on every render
  const liveTasks = window.TASKS[project.id] || [];
  const useTasks = liveTasks.length || tasks.length ? liveTasks : tasks;
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [filterOwner, setFilterOwner] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const filteredTasks = useTasks.filter(t => {
    if (filterOwner && t.owner !== filterOwner) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const onDragStart = (e, id) => { setDraggedId(id); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver = (e, colId) => { e.preventDefault(); setDragOverCol(colId); };
  const onDrop = async (e, colId) => {
    e.preventDefault();
    if (draggedId) {
      const t = useTasks.find(x => x.id === draggedId);
      if (t && t.status !== colId) {
        try {
          await window.DataService.updateTaskStatus(draggedId, colId);
          toast(`Task moved to "${KANBAN_COLS.find(c => c.id === colId).label}"`);
          refresh();
        } catch (err) { toast('Move failed: ' + err.message, 'error'); }
      }
    }
    setDraggedId(null); setDragOverCol(null);
  };
  const owners = [...new Set(useTasks.map(t => t.owner))];

  return (
    <div>
      <div className="row between" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select label="Owner" value={filterOwner} onChange={setFilterOwner}
                  options={owners.map(o => ({ value: o, label: personById(o)?.name || o }))} />
          <Select label="Priority" value={filterPriority} onChange={setFilterPriority}
                  options={['High', 'Medium', 'Low']} />
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={14} stroke={2} /> Add task</button>
      </div>

      <div className="kanban">
        {KANBAN_COLS.map(col => {
          const items = filteredTasks.filter(t => t.status === col.id);
          return (
            <div key={col.id}
                 className={`kanban-col ${dragOverCol === col.id ? 'drop-over' : ''}`}
                 onDragOver={e => onDragOver(e, col.id)}
                 onDragLeave={() => setDragOverCol(null)}
                 onDrop={e => onDrop(e, col.id)}>
              <div className="kanban-col-h">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: col.color }} />
                  {col.label}
                </div>
                <span style={{ color: 'var(--muted)' }}>{items.length}</span>
              </div>
              {items.map(t => {
                const owner = personById(t.owner);
                const overdue = t.status !== 'done' && new Date(t.due) < new Date('2026-05-24');
                return (
                  <div key={t.id}
                       className={`kanban-card ${draggedId === t.id ? 'dragging' : ''}`}
                       draggable
                       onClick={() => setEditing(t)}
                       onDragStart={e => onDragStart(e, t.id)}
                       onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
                       style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>{t.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                      <Avatar user={owner} size="sm" />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`chip ${priorityChip(t.priority)}`}>{t.priority}</span>
                        <span style={{ fontSize: 11, color: overdue ? 'var(--status-red)' : 'var(--muted)', fontWeight: overdue ? 600 : 500 }}>
                          {relDate(t.due)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', padding: 14, border: '1px dashed var(--border)', borderRadius: 8, marginTop: 4 }}>Drop here</div>
              )}
            </div>
          );
        })}
      </div>
      {adding && <TaskModal project={project} toast={toast} onClose={() => setAdding(false)} onSaved={refresh} />}
      {editing && <TaskModal project={project} task={editing} toast={toast} onClose={() => setEditing(null)} onSaved={refresh} />}
    </div>
  );
};

const ProgressUpdateForm = ({ project, onSubmit, onClose }) => {
  const [form, setForm] = useState({ completed: '', inProgress: '', barriers: '', helpNeeded: '', next: '', percent: project.progress });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fields = [
    { k: 'completed', label: 'What was completed since the last update?', placeholder: 'e.g. Finalized the multivariable model and ran the sensitivity analysis…' },
    { k: 'inProgress', label: 'What is currently in progress?', placeholder: 'e.g. Drafting the Methods section…' },
    { k: 'barriers', label: 'Any barriers, delays or open questions?', placeholder: 'e.g. Three records have ambiguous GA — need chart review…' },
    { k: 'helpNeeded', label: 'What help do you need from the PI?', placeholder: 'e.g. Confirm cut-points for risk categorization…' },
    { k: 'next', label: 'What is planned before the next update?', placeholder: 'e.g. Complete Methods + draft Results by next Monday…' },
  ];
  const submit = (e) => {
    e.preventDefault();
    const currentUser = window.AuthService?.getCurrentPerson();
    onSubmit({
      id: `up-${Date.now()}`,
      project: project.id,
      user: currentUser?.id || project.lead,
      date: new Date().toISOString().slice(0, 10),
      percent: form.percent,
      completed: form.completed,
      inProgress: form.inProgress,
      barriers: form.barriers || 'None reported',
      helpNeeded: form.helpNeeded || 'None at this stage',
      next: form.next,
      piStatus: 'pending',
    });
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-h">
          <div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>New progress update</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{project.acronym} · {project.title}</div>
          </div>
          <button type="button" className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-b">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {fields.map(f => (
              <div key={f.k}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{f.label}</div>
                <textarea rows={f.k === 'completed' || f.k === 'next' ? 3 : 2}
                          placeholder={f.placeholder}
                          value={form[f.k]}
                          onChange={e => set(f.k, e.target.value)}
                          style={{ width: '100%', resize: 'vertical', fontFamily: 'var(--ff-sans)', fontSize: 13 }} />
              </div>
            ))}
            <div>
              <div className="row between" style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Estimated percent complete</div>
                <div className="serif" style={{ fontSize: 22, fontWeight: 600, color: 'var(--maroon)' }}>{form.percent}%</div>
              </div>
              <input type="range" min={0} max={100} step={5} value={form.percent}
                     onChange={e => set('percent', +e.target.value)}
                     style={{ width: '100%', padding: 0, border: 'none', accentColor: 'var(--maroon)' }} />
            </div>
            <div className="card-pad" style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Icon name="paperclip" size={16} />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--ink-2)' }}>Attach files (optional)</div>
                <div style={{ marginTop: 2 }}>Drag and drop, or click to upload. Do not include patient-identifiable information.</div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-f">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!form.completed.trim()}>
            <Icon name="check" size={14} stroke={2.5} /> Submit update
          </button>
        </div>
      </form>
    </div>
  );
};

// Comment thread shown under each progress update
const UpdateThread = ({ update, project, toast, currentUser }) => {
  const [, force] = useState(0);
  const refresh = () => force(n => n + 1);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const comments = (window.COMMENTS?.byUpdate?.[update.id]) || [];
  const isAdmin = !!(window.AuthService && window.AuthService.isAdmin && window.AuthService.isAdmin());

  // Listen for live updates from Supabase Realtime
  useEffect(() => {
    const onChange = (e) => {
      if (e.detail?.table === 'comments' || e.detail?.table === 'poll') refresh();
    };
    window.addEventListener('mfm:data-changed', onChange);
    return () => window.removeEventListener('mfm:data-changed', onChange);
  }, []);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !currentUser) return;
    setSending(true);
    try {
      await window.DataService.addUpdateComment({
        updateId: update.id, projectId: project.id, userId: currentUser.id, text,
      });
      setText('');
      refresh();
    } catch (err) { toast?.('Failed: ' + err.message, 'error'); }
    setSending(false);
  };
  const del = async (c) => {
    if (!confirm('Delete this comment?')) return;
    try { await window.DataService.deleteComment(c.id); refresh(); }
    catch (err) { toast?.('Failed: ' + err.message, 'error'); }
  };

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--hairline)' }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 10 }}>
        Conversation{comments.length > 0 ? ` · ${comments.length}` : ''}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
        {comments.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>No comments yet — start the conversation.</div>
        )}
        {comments.map(c => {
          const author = personById(c.userId);
          const canDelete = isAdmin || c.userId === currentUser?.id;
          return (
            <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Avatar user={author} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 12 }}>{author?.name || 'Unknown'}</strong>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.55, marginTop: 3, whiteSpace: 'pre-wrap', color: 'var(--ink-2)' }}>{c.text}</div>
              </div>
              {canDelete && (
                <button className="btn-icon btn-ghost" onClick={() => del(c)} title="Delete">
                  <Icon name="trash" size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <form onSubmit={send} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <Avatar user={currentUser} size="sm" />
        <textarea value={text} onChange={e => setText(e.target.value)} rows={2}
                  placeholder="Reply to this update…"
                  style={{ flex: 1, resize: 'vertical', fontSize: 13, fontFamily: 'var(--ff-sans)' }} />
        <button type="submit" className="btn btn-sm btn-primary" disabled={sending || !text.trim()}>
          {sending ? '…' : 'Post'}
        </button>
      </form>
    </div>
  );
};

const TabUpdates = ({ project, toast, updates, addUpdate, currentUser }) => {
  const [showForm, setShowForm] = useState(false);
  const [, force] = useState(0);
  useEffect(() => {
    const onChange = (e) => {
      if (e.detail?.table === 'progress_updates' || e.detail?.table === 'poll') force(n => n + 1);
    };
    window.addEventListener('mfm:data-changed', onChange);
    return () => window.removeEventListener('mfm:data-changed', onChange);
  }, []);
  const [aiReplyFor, setAiReplyFor] = useState(null);
  const projectUpdates = updates.filter(u => u.project === project.id).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <div className="row between" style={{ marginBottom: 16 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 18, fontWeight: 600 }}>Progress updates</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{projectUpdates.length} update{projectUpdates.length === 1 ? '' : 's'} submitted</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn"><Icon name="message" size={14} /> Request update</button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Icon name="plus" size={14} stroke={2} /> Submit update
          </button>
        </div>
      </div>

      {showForm && <ProgressUpdateForm project={project} onClose={() => setShowForm(false)}
                                       onSubmit={(u) => { addUpdate(u); setShowForm(false); toast('Progress update submitted'); }} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {projectUpdates.length === 0 && (
          <div className="card card-pad" style={{ textAlign: 'center', padding: 40 }}>
            <Icon name="updates" size={32} color="var(--muted-2)" />
            <div className="serif" style={{ fontSize: 16, fontWeight: 600, marginTop: 10 }}>No updates yet</div>
            <p style={{ color: 'var(--muted)', marginTop: 4, fontSize: 13 }}>Submit your first update to share progress with the PI.</p>
            <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setShowForm(true)}>
              <Icon name="plus" size={14} stroke={2} /> Submit your first update
            </button>
          </div>
        )}
        {projectUpdates.map(u => {
          const user = personById(u.user);
          const statusMap = {
            pending: { label: 'Awaiting PI response', chip: 'chip-amber' },
            commented: { label: 'PI commented', chip: 'chip-maroon' },
            requested_clarification: { label: 'Clarification requested', chip: 'chip-red' },
            approved: { label: 'PI approved', chip: 'chip-green' },
          };
          const st = statusMap[u.piStatus] || statusMap.pending;
          return (
            <div key={u.id} className="card card-pad">
              <div className="row between" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar user={user} size="md" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{user?.training} · Submitted {fmtDate(u.date)} ({relDate(u.date)})</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Reported progress</div>
                    <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>{u.percent}%</div>
                  </div>
                  <span className={`chip ${st.chip}`}>{st.label}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                {[
                  { label: 'Completed since last update', val: u.completed },
                  { label: 'In progress', val: u.inProgress },
                  { label: 'Barriers / delays', val: u.barriers, color: 'var(--status-amber)' },
                  { label: 'Help needed from PI', val: u.helpNeeded, color: 'var(--maroon)' },
                  { label: 'Planned before next update', val: u.next },
                ].map((r, i) => (
                  <div key={i} style={{ gridColumn: i === 4 ? 'span 2' : 'auto' }}>
                    <div style={{ fontSize: 10, color: r.color || 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{r.label}</div>
                    <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{r.val}</div>
                  </div>
                ))}
              </div>

              {/* AI Summary toggle */}
              <div style={{ marginTop: 14 }}>
                <AISummary update={u} project={project} />
              </div>

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--hairline)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {window.AuthService?.isAdmin?.() && (
                  <>
                    <button className="btn btn-sm btn-primary" onClick={() => setAiReplyFor(u)}>
                      <Icon name="sparkle" size={12} /> Suggest reply
                    </button>
                    <button className="btn btn-sm" onClick={async () => {
                      try { await window.DataService.setUpdateStatus(u.id, 'approved'); toast('Update approved'); }
                      catch (e) { toast('Failed: ' + e.message, 'error'); }
                    }}><Icon name="check" size={12} /> Mark approved</button>
                    <button className="btn btn-sm" onClick={async () => {
                      try { await window.DataService.setUpdateStatus(u.id, 'requested_clarification'); toast('Clarification requested'); }
                      catch (e) { toast('Failed: ' + e.message, 'error'); }
                    }}>Request clarification</button>
                  </>
                )}
                <div style={{ flex: 1 }} />
                <button className="btn btn-sm btn-ghost"><Icon name="reports" size={12} /> Use in report</button>
              </div>

              {/* Live comment thread */}
              <UpdateThread update={u} project={project} toast={toast} currentUser={currentUser} />
            </div>
          );
        })}
      </div>
      {aiReplyFor && (
        <AIReplyModal open={true} update={aiReplyFor} project={project}
                      onClose={() => setAiReplyFor(null)}
                      onSend={(msg) => { toast('Reply sent to ' + personById(aiReplyFor.user)?.name.split(' ').slice(-1)[0]); setAiReplyFor(null); }} />
      )}
    </div>
  );
};

const FILE_FOLDERS = [
  { id: 'protocol', label: 'Protocol', icon: 'document' },
  { id: 'reb', label: 'REB documents', icon: 'document' },
  { id: 'data', label: 'Data dictionary', icon: 'document' },
  { id: 'analysis', label: 'Analysis files', icon: 'document' },
  { id: 'figures', label: 'Tables & figures', icon: 'document' },
  { id: 'manuscript', label: 'Manuscript drafts', icon: 'document' },
  { id: 'abstracts', label: 'Abstracts & presentations', icon: 'document' },
  { id: 'corresp', label: 'Correspondence', icon: 'document' },
  { id: 'other', label: 'Other', icon: 'folder' },
];

const SAMPLE_FILES = [
  { id: 'f1', name: 'Protocol_v3.2_clean.docx', type: 'DOCX', folder: 'protocol', uploadedBy: 'u4', date: '2026-04-12', version: 3.2, size: '142 KB' },
  { id: 'f2', name: 'REB_amendment_approval.pdf', type: 'PDF', folder: 'reb', uploadedBy: 'u11', date: '2026-03-08', version: 1, size: '218 KB' },
  { id: 'f3', name: 'Data_dictionary_v2.xlsx', type: 'XLSX', folder: 'data', uploadedBy: 'u13', date: '2026-04-22', version: 2, size: '64 KB' },
  { id: 'f4', name: 'multivariable_model_v3.R', type: 'R', folder: 'analysis', uploadedBy: 'u13', date: '2026-05-22', version: 3, size: '18 KB' },
  { id: 'f5', name: 'cleaned_cohort_anonymized.csv', type: 'CSV', folder: 'analysis', uploadedBy: 'u4', date: '2026-04-30', version: 1, size: '4.2 MB' },
  { id: 'f6', name: 'Table1_descriptive_stats.docx', type: 'DOCX', folder: 'figures', uploadedBy: 'u4', date: '2026-05-15', version: 2, size: '52 KB' },
  { id: 'f7', name: 'Figure1_KaplanMeier.png', type: 'PNG', folder: 'figures', uploadedBy: 'u13', date: '2026-05-18', version: 1, size: '380 KB' },
  { id: 'f8', name: 'Manuscript_draft_v1.docx', type: 'DOCX', folder: 'manuscript', uploadedBy: 'u4', date: '2026-05-22', version: 1, size: '186 KB' },
  { id: 'f9', name: 'SOGC2026_abstract_submitted.pdf', type: 'PDF', folder: 'abstracts', uploadedBy: 'u4', date: '2026-02-14', version: 1, size: '74 KB' },
  { id: 'f10', name: 'PI_meeting_notes_2026-04-17.md', type: 'MD', folder: 'corresp', uploadedBy: 'u1', date: '2026-04-17', version: 1, size: '12 KB' },
];

const TabFiles = ({ project, toast }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const isAdmin = !!(window.AuthService && window.AuthService.isAdmin && window.AuthService.isAdmin());
  const currentUser = window.AuthService?.getCurrentPerson();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await window.__sb.storage.from('project-files')
        .list(project.id, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
      if (error) throw error;
      setFiles(data || []);
    } catch (e) {
      setError(e.message || String(e));
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [project.id]);

  const uploadFiles = async (fileList) => {
    if (!fileList || !fileList.length) return;
    setUploading(true);
    let ok = 0;
    for (const f of fileList) {
      const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${project.id}/${Date.now()}-${safe}`;
      const { error } = await window.__sb.storage.from('project-files').upload(path, f);
      if (error) {
        toast(`Upload failed (${f.name}): ${error.message}`, 'error');
      } else {
        ok++;
        try {
          await window.DataService.logActivity(project.id, currentUser?.id, 'upload',
            `uploaded ${f.name}`, `${(f.size / 1024).toFixed(1)} KB`);
        } catch {}
      }
    }
    setUploading(false);
    if (ok) toast(`Uploaded ${ok} file${ok === 1 ? '' : 's'}`);
    load();
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    uploadFiles(Array.from(e.dataTransfer.files || []));
  };

  const download = async (file) => {
    try {
      const { data, error } = await window.__sb.storage.from('project-files')
        .createSignedUrl(`${project.id}/${file.name}`, 300); // 5-minute URL
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (e) { toast('Download failed: ' + e.message, 'error'); }
  };

  const del = async (file) => {
    if (!confirm(`Delete ${file.name}? This is permanent.`)) return;
    try {
      const { error } = await window.__sb.storage.from('project-files')
        .remove([`${project.id}/${file.name}`]);
      if (error) throw error;
      toast('Deleted');
      load();
    } catch (e) { toast('Delete failed: ' + e.message, 'error'); }
  };

  // Strip the timestamp prefix the uploader added, so display names look clean
  const displayName = (name) => name.replace(/^\d{13}-/, '');
  const sizeOf = (file) => {
    const b = file.metadata?.size || 0;
    if (b > 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
    if (b > 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${b} B`;
  };

  return (
    <div>
      <div className="phi-banner" style={{ marginBottom: 16 }}>
        <Icon name="alert" size={18} stroke={2} />
        <div>
          <strong>Do not upload patient-identifiable information (PHI).</strong> Files are stored in a private Supabase bucket scoped to project members.
        </div>
      </div>

      <div onDragOver={e => { e.preventDefault(); setDragOver(true); }}
           onDragLeave={() => setDragOver(false)}
           onDrop={onDrop}
           style={{ padding: 22, border: '2px dashed', borderColor: dragOver ? 'var(--maroon)' : 'var(--border-strong)', borderRadius: 12, background: dragOver ? 'var(--maroon-wash)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, transition: 'all 0.15s' }}>
        <div style={{ width: 40, height: 40, background: 'var(--paper)', borderRadius: 10, display: 'grid', placeItems: 'center', color: 'var(--maroon)' }}>
          <Icon name="upload" size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{uploading ? 'Uploading…' : 'Drop files here or click to upload'}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Any file type. Stored in <code>project-files/{project.id}/</code>.</div>
        </div>
        <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
          <input type="file" multiple style={{ display: 'none' }} disabled={uploading}
                 onChange={e => uploadFiles(Array.from(e.target.files))} />
          <Icon name="upload" size={14} /> Browse
        </label>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'grid', gridTemplateColumns: '32px 1fr 120px 100px 80px', gap: 12, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: 'var(--muted)' }}>
          <div></div><div>File</div><div>Size</div><div>Uploaded</div><div></div>
        </div>
        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading files…</div>}
        {error && (
          <div style={{ padding: 30, color: 'var(--status-red)', fontSize: 13 }}>
            <strong>Could not list files:</strong> {error}
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
              Most likely the <code>project-files</code> Storage bucket hasn't been created yet, or storage RLS isn't set up. See migrations.sql.
            </div>
          </div>
        )}
        {!loading && !error && files.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No files yet. Drop some above.</div>
        )}
        {!loading && !error && files.map(f => {
          const ext = (f.name.split('.').pop() || '').toUpperCase().slice(0, 4);
          return (
            <div key={f.name} className="file-row"
                 style={{ gridTemplateColumns: '32px 1fr 120px 100px 80px', cursor: 'pointer' }}
                 onClick={() => download(f)}>
              <div className="file-icon">{ext}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {displayName(f.name)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{f.metadata?.mimetype || 'file'}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{sizeOf(f)}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{f.created_at ? relDate(f.created_at) : '—'}</div>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                <button className="btn-icon btn-ghost" title="Download" onClick={() => download(f)}>
                  <Icon name="download" size={14} />
                </button>
                {isAdmin && (
                  <button className="btn-icon btn-ghost" title="Delete" onClick={() => del(f)}>
                    <Icon name="trash" size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TabReports = ({ project, openReport }) => {
  const reports = [
    { type: 'summary', icon: 'document', title: 'One-page project summary', desc: 'Plain-language overview suitable for a department review or supervisor handoff.' },
    { type: 'trainee', icon: 'user', title: 'Trainee progress report', desc: 'Recent activity, current tasks, and trajectory for the lead trainee on this project.' },
    { type: 'overdue', icon: 'alert', title: 'Overdue items report', desc: 'Past-due milestones, tasks and updates flagged for follow-up.' },
    { type: 'reb', icon: 'flag', title: 'REB / ethics status report', desc: 'Current ethics approval status and history of REB-related activity.' },
    { type: 'pubpipe', icon: 'publication', title: 'Publication pipeline report', desc: 'Manuscript draft status, target journal, and projected submission timeline.' },
    { type: 'detail', icon: 'book', title: 'Full detailed project report', desc: 'Everything: overview, milestones, tasks, updates, file inventory, activity log.' },
  ];
  return (
    <div>
      <div className="row between" style={{ marginBottom: 16 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 18, fontWeight: 600 }}>Generate reports</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Pick a report type. All exports include a plain-language executive summary.</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {reports.map(r => (
          <button key={r.type} onClick={() => openReport(r.type, project)}
                  className="card card-hover" style={{ padding: 18, display: 'flex', alignItems: 'flex-start', gap: 14, textAlign: 'left', background: 'var(--paper)' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--maroon-wash)', color: 'var(--maroon)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name={r.icon} size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="serif" style={{ fontSize: 15, fontWeight: 600 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{r.desc}</div>
            </div>
            <Icon name="arrowRight" size={14} color="var(--muted)" />
          </button>
        ))}
      </div>
    </div>
  );
};

const TabDiscussion = ({ project, toast, currentUser }) => {
  const [, force] = useState(0);
  const refresh = () => force(n => n + 1);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const me = currentUser || window.AuthService?.getCurrentPerson();

  // Pull all comment-type activity for this project (real + synthesized)
  const items = (window.ACTIVITY || [])
    .filter(a => a.project === project.id && (a.type === 'comment' || !a.type || a.type === 'note'))
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const post = async (e) => {
    e?.preventDefault();
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      await window.DataService.logActivity(project.id, me?.id, 'comment', 'commented', text.trim());
      // Optimistically append so the user sees it immediately
      (window.ACTIVITY || []).push({
        id: 'a-' + Date.now(),
        project: project.id,
        user: me?.id,
        type: 'comment',
        text: 'commented',
        detail: text.trim(),
        date: new Date().toISOString(),
      });
      setText('');
      refresh();
      toast?.('Comment posted');
    } catch (err) {
      toast?.('Failed to post: ' + (err.message || 'unknown error'), 'error');
    }
    setPosting(false);
  };

  const fmt = (date) => {
    const d = new Date(date);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (isToday) return 'Today at ' + d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
    if (isYesterday) return 'Yesterday at ' + d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) +
           ' at ' + d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
  };

  // Group by day for nice "DATE" separators
  const groups = {};
  items.forEach(it => {
    const key = new Date(it.date).toDateString();
    (groups[key] = groups[key] || []).push(it);
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16, maxWidth: 820, margin: '0 auto' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--hairline)', background: 'var(--bg-elevated)' }}>
          <div className="serif" style={{ fontSize: 16, fontWeight: 600 }}>Discussion</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            {items.length === 0 ? 'No comments yet — start the conversation below.' : `${items.length} comment${items.length === 1 ? '' : 's'} on ${project.acronym}`}
          </div>
        </div>

        <div style={{ padding: '14px 20px', maxHeight: 520, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {items.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ width: 48, height: 48, margin: '0 auto 12px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'grid', placeItems: 'center' }}>
                <Icon name="message" size={20} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>No comments yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Be the first to leave a note for the team.</div>
            </div>
          )}
          {Object.entries(groups).map(([dayKey, dayItems]) => {
            const d = new Date(dayKey);
            const today = new Date();
            const label = d.toDateString() === today.toDateString() ? 'Today'
                        : d.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });
            return (
              <div key={dayKey} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ textAlign: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--hairline)', zIndex: 0 }} />
                  <span style={{ position: 'relative', background: 'var(--paper)', padding: '0 12px', fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                </div>
                {dayItems.map(it => {
                  const author = personById(it.user) || { name: 'Unknown', initials: '?' };
                  const isMe = me && it.user === me.id;
                  return (
                    <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 10, alignItems: 'flex-start' }}>
                      <Avatar user={author} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{author.name}{isMe ? ' (you)' : ''}</span>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{fmt(it.date)}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {it.detail || it.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <form onSubmit={post} style={{ padding: '14px 20px', borderTop: '1px solid var(--hairline)', background: 'var(--bg-elevated)', display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 10, alignItems: 'flex-start' }}>
          <Avatar user={me || { name: 'Y', initials: 'Y' }} size="sm" />
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Write a comment for ${project.acronym}…`}
            rows={2}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) post(e); }}
            style={{ width: '100%', resize: 'vertical', minHeight: 48, fontSize: 13, fontFamily: 'inherit' }}
          />
          <button type="submit" className="btn btn-primary" disabled={!text.trim() || posting}
                  style={{ alignSelf: 'flex-end' }}>
            <Icon name="send" size={14} stroke={2} /> {posting ? 'Posting…' : 'Post'}
          </button>
        </form>
        <div style={{ padding: '0 20px 12px', fontSize: 10, color: 'var(--muted)', textAlign: 'right' }}>
          Tip: <kbd style={{ padding: '1px 4px', background: 'var(--paper)', border: '1px solid var(--hairline)', borderRadius: 3, fontSize: 10 }}>⌘/Ctrl + Enter</kbd> to post
        </div>
      </div>
    </div>
  );
};

const TabActivity = ({ project, navigate }) => {
  const items = ACTIVITY.filter(a => a.project === project.id);
  // Plus some synthesized history
  const synthetic = [
    { id: 's1', project: project.id, user: project.pi, type: 'status', text: 'changed status', detail: `Set to ${project.status}`, date: project.lastUpdate },
    { id: 's2', project: project.id, user: project.pi, type: 'comment', text: 'project created', detail: `${project.acronym} — initial scope confirmed`, date: project.start },
  ];
  const all = [...items, ...synthetic].sort((a, b) => new Date(b.date) - new Date(a.date));
  return (
    <div className="card card-pad">
      <ActivityFeed items={all} navigate={navigate} limit={50} />
    </div>
  );
};

const ProjectDetail = ({ project, route, navigate, toast, updates, addUpdate, openReport }) => {
  const tab = route.tab || 'overview';
  const setTab = (t) => navigate({ page: 'projects', id: project.id, tab: t });
  const currentUser = window.AuthService?.getCurrentPerson();
  const [headerComment, setHeaderComment] = useState(false);
  const [headerUpload, setHeaderUpload] = useState(false);
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'timeline', label: 'Timeline', icon: 'timeline' },
    { id: 'tasks', label: 'Tasks', icon: 'tasks' },
    { id: 'updates', label: 'Progress updates', icon: 'updates' },
    { id: 'discussion', label: 'Discussion', icon: 'message' },
    { id: 'files', label: 'Files', icon: 'files', badge: project.fileCount },
    { id: 'reports', label: 'Reports', icon: 'reports' },
    { id: 'activity', label: 'Activity', icon: 'activity' },
  ];
  const pi = personById(project.pi);
  const lead = personById(project.lead);
  const members = project.members.map(personById).filter(Boolean);

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <button onClick={() => navigate({ page: 'projects' })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
          <Icon name="chevronLeft" size={12} /> Back to projects
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div className="row gap-2" style={{ marginBottom: 6 }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.05em', fontWeight: 500 }}>{project.acronym}</span>
            <HealthDot health={project.health} label />
            <span className="chip chip-grey">{project.category}</span>
          </div>
          <h1 className="page-title" style={{ fontSize: 28, lineHeight: 1.15 }}>{project.title}</h1>
          <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusChip status={project.status} />
            <span style={{ width: 1, height: 16, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Lead: <strong style={{ color: 'var(--ink)' }}>{lead?.name}</strong></span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>PI: <strong style={{ color: 'var(--ink)' }}>{pi?.name}</strong></span>
            <span style={{ width: 1, height: 16, background: 'var(--border)' }} />
            <AvatarStack users={members} max={5} size="sm" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setHeaderComment(true)}><Icon name="message" size={14} /> Comment</button>
          <button className="btn" onClick={() => setHeaderUpload(true)}><Icon name="upload" size={14} /> Upload</button>
          <button className="btn btn-primary" onClick={() => openReport('summary', project)}>
            <Icon name="reports" size={14} /> Generate report
          </button>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <Icon name={t.icon} size={14} />
            {t.label}
            {t.badge > 0 && <span style={{ fontSize: 10, color: 'var(--muted)' }}>· {t.badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && <TabOverview project={project} toast={toast} currentUser={window.AuthService?.getCurrentPerson()} />}
      {tab === 'timeline' && <TabTimeline project={project} toast={toast} />}
      {tab === 'tasks' && <TabTasks project={project} toast={toast} />}
      {tab === 'updates' && <TabUpdates project={project} toast={toast} updates={updates} addUpdate={addUpdate} currentUser={window.AuthService?.getCurrentPerson()} />}
      {tab === 'discussion' && <TabDiscussion project={project} toast={toast} currentUser={window.AuthService?.getCurrentPerson()} />}
      {tab === 'files' && <TabFiles project={project} toast={toast} />}
      {tab === 'reports' && <TabReports project={project} openReport={openReport} />}
      {tab === 'activity' && <TabActivity project={project} navigate={navigate} />}

      {headerComment && <AddCommentModal project={project} toast={toast} currentUser={currentUser} onClose={() => setHeaderComment(false)} />}
      {headerUpload && <UploadFileModal project={project} toast={toast} currentUser={currentUser} onClose={() => setHeaderUpload(false)} />}
    </div>
  );
};

window.ProjectDetail = ProjectDetail;
window.ProgressUpdateForm = ProgressUpdateForm;
