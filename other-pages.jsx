/* MFM Research Hub — people, reports modal, tasks, updates, calendar, files (global), settings */

const EditPersonModal = ({ user, onClose, onSaved, mode = 'edit' }) => {
  const [form, setForm] = useState({
    name: user?.name || '',
    initials: user?.initials || '',
    role: user?.role || 'Collaborator',
    training: user?.training || '',
    email: user?.email || '',
    focus: user?.focus || '',
    bio: user?.bio || '',
    color: user?.color || '#7A003C',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!window.DataService) { setErr('Data service not ready'); return; }
    setSaving(true); setErr('');
    try {
      if (mode === 'add') {
        await window.DataService.createPerson(form);
      } else {
        await window.DataService.updatePerson(user.id, form);
      }
      onSaved?.();
      onClose();
    } catch (e) {
      setErr(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const ROLES = ['Principal Investigator','Co-Investigator','Co-Supervisor','MFM Fellow','Resident','Medical Student','Research Coordinator','Biostatistician','Neonatology','Collaborator','Volunteer','Industry Partner'];
  const COLORS = ['#7A003C','#5C002D','#9C2E5E','#0D5D78','#0E5B3D','#137A4B','#B4760E','#9A2A2A','#495965','#6B7785'];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-h">
          <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>{mode === 'add' ? 'Add a person' : 'Edit ' + (user?.name?.split(' ')[0] || 'person')}</div>
          <button type="button" className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-b">
          {err && <div style={{ padding: 10, background: 'var(--status-red-wash)', color: 'var(--status-red)', fontSize: 12, borderRadius: 6, marginBottom: 14 }}>{err}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Full name <span style={{ color: 'var(--status-red)' }}>*</span></div>
                <input required value={form.name} onChange={e => set('name', e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Initials</div>
                <input value={form.initials} onChange={e => set('initials', e.target.value.slice(0, 3).toUpperCase())} placeholder="(auto)" style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Role</div>
                <select value={form.role} onChange={e => set('role', e.target.value)} style={{ width: '100%' }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Training level</div>
                <input value={form.training} onChange={e => set('training', e.target.value)} placeholder="e.g. PGY-3, Fellow Y1" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Email</div>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Research focus</div>
              <input value={form.focus} onChange={e => set('focus', e.target.value)} placeholder="e.g. Cervical length screening" style={{ width: '100%' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Bio / about</div>
              <textarea rows={3} value={form.bio || ''} onChange={e => set('bio', e.target.value)} style={{ width: '100%', resize: 'vertical', fontFamily: 'var(--ff-sans)', fontSize: 13 }} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Avatar color</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => set('color', c)}
                          style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid var(--ink)' : '3px solid transparent' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="modal-f">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving || !form.name.trim()}>
            {saving ? 'Saving…' : (mode === 'add' ? 'Add person' : 'Save changes')}
          </button>
        </div>
      </form>
    </div>
  );
};

const DeletePersonConfirm = ({ user, onClose, onConfirm }) => {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const projectCount = PROJECTS.filter(p => p.lead === user.id || p.members.includes(user.id)).length;
  const handleConfirm = async () => {
    setBusy(true); setErr('');
    try {
      await window.DataService.deletePerson(user.id);
      onConfirm?.();
      onClose();
    } catch (e) { setErr(e.message); setBusy(false); }
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <div className="serif" style={{ fontSize: 18, fontWeight: 600 }}>Delete {user.name}?</div>
          <button className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-b">
          {err && <div style={{ padding: 10, background: 'var(--status-red-wash)', color: 'var(--status-red)', fontSize: 12, borderRadius: 6, marginBottom: 12 }}>{err}</div>}
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)' }}>
            This will permanently remove {user.name} from your research hub.
            {projectCount > 0 && (
              <> They are currently linked to <strong>{projectCount} project{projectCount === 1 ? '' : 's'}</strong>; those project memberships will be removed automatically.</>
            )}
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>This cannot be undone. Their progress updates and comments (if any) will remain in the activity log.</p>
        </div>
        <div className="modal-f">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn" style={{ background: 'var(--status-red)', color: '#fff', borderColor: 'var(--status-red)' }} disabled={busy} onClick={handleConfirm}>
            {busy ? 'Deleting…' : 'Yes, delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfilePhoto = ({ user }) => {
  const [photo, setPhoto] = useState(user.hasPhoto || null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const onFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPhoto(url);
  };

  return (
    <div style={{ position: 'relative', width: 96, height: 96 }}
         onDragOver={e => { e.preventDefault(); setDragOver(true); }}
         onDragLeave={() => setDragOver(false)}
         onDrop={e => { e.preventDefault(); setDragOver(false); onFile(e.dataTransfer.files?.[0]); }}>
      {photo && photo !== true ? (
        <img src={photo} alt={user.name}
             style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--paper)', boxShadow: 'var(--shadow-2)' }} />
      ) : photo === true ? (
        // hasPhoto flag — show subtle silhouette placeholder so user knows a photo exists in real data
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: `linear-gradient(135deg, ${user.color}, ${user.color}AA)`, display: 'grid', placeItems: 'center', color: '#F8EEE2', fontFamily: 'var(--ff-serif)', fontWeight: 600, fontSize: 36, border: '3px solid var(--paper)', boxShadow: 'var(--shadow-2)' }}>
          {user.initials}
        </div>
      ) : (
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: user.color, display: 'grid', placeItems: 'center', color: '#F8EEE2', fontFamily: 'var(--ff-serif)', fontWeight: 600, fontSize: 36, border: dragOver ? '3px dashed var(--gold)' : '3px solid var(--paper)', boxShadow: 'var(--shadow-2)' }}>
          {user.initials}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => onFile(e.target.files?.[0])} />
      <button onClick={() => inputRef.current?.click()}
              title="Upload photo"
              style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: '50%', background: 'var(--paper)', color: 'var(--maroon)', border: '2px solid var(--paper)', boxShadow: 'var(--shadow-2)', display: 'grid', placeItems: 'center' }}>
        <Icon name="upload" size={13} />
      </button>
    </div>
  );
};

const ProfileCV = ({ user }) => {
  const [cv, setCV] = useState(user.hasCV ? { name: `${user.name.split(' ').slice(-1)[0]}_CV.pdf`, date: '2025-12-04', size: '186 KB' } : null);
  const inputRef = useRef(null);

  const onFile = (file) => {
    if (!file) return;
    setCV({
      name: file.name,
      date: new Date().toISOString().slice(0, 10),
      size: file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`,
    });
  };

  return (
    <>
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => onFile(e.target.files?.[0])} />
      {cv ? (
        <div style={{ display: 'flex', gap: 10, padding: 10, border: '1px solid var(--hairline)', borderRadius: 8, alignItems: 'center', background: 'var(--bg-elevated)' }}>
          <div className="file-icon" style={{ flexShrink: 0 }}>PDF</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cv.name}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{cv.size} · Uploaded {cv.date}</div>
          </div>
          <button className="btn-icon btn-ghost" title="Download" onClick={() => alert('Download starting…')}><Icon name="download" size={13} /></button>
          <button className="btn-icon btn-ghost" title="Replace" onClick={() => inputRef.current?.click()}><Icon name="pencil" size={13} /></button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()}
                style={{ width: '100%', padding: '14px', border: '2px dashed var(--border-strong)', borderRadius: 8, background: 'var(--bg-elevated)',
                         display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>
          <Icon name="upload" size={18} color="var(--maroon)" />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>Upload CV</span>
          <span>PDF or Word, up to 5MB</span>
        </button>
      )}
    </>
  );
};

const PeoplePage = ({ navigate, route, toast }) => {
  const isAdmin = !!(window.AuthService && window.AuthService.isAdmin && window.AuthService.isAdmin());
  const [roleF, setRoleF] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // person being edited
  const [deleting, setDeleting] = useState(null); // person being deleted
  const [adding, setAdding] = useState(false);
  const [, forceRender] = useState(0);
  const refresh = () => forceRender(n => n + 1);

  const filtered = PEOPLE.filter(p => {
    if (roleF && p.role !== roleF) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const selected = route.id ? personById(route.id) : null;

  const projectsForPerson = (id) => PROJECTS.filter(p => p.lead === id || p.members.includes(id));

  if (selected) {
    const projects = projectsForPerson(selected.id);
    const lastUpd = UPDATES.filter(u => u.user === selected.id).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const personActivity = ACTIVITY.filter(a => a.user === selected.id);
    return (
      <>
      <div className="page">
        <div style={{ marginBottom: 18 }}>
          <button onClick={() => navigate({ page: 'people' })}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
            <Icon name="chevronLeft" size={12} /> Back to people
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.7fr', gap: 24, alignItems: 'flex-start' }}>
          <div className="card card-pad" style={{ position: 'sticky', top: 80 }}>
            <ProfilePhoto user={selected} />
            <h2 className="serif" style={{ fontSize: 24, fontWeight: 600, marginTop: 14, letterSpacing: '-0.01em' }}>{selected.name}</h2>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{selected.role} · {selected.training}</div>
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 18, borderTop: '1px solid var(--hairline)', fontSize: 13 }}>
              <div className="row" style={{ gap: 8, color: 'var(--muted)' }}><Icon name="message" size={13} /> {selected.email}</div>
              <div className="row" style={{ gap: 8, color: 'var(--muted)' }}><Icon name="target" size={13} /> {selected.focus}</div>
              <div className="row" style={{ gap: 8, color: 'var(--muted)' }}><Icon name="calendar" size={13} /> Joined {selected.joined}</div>
            </div>

            {/* Bio block */}
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--hairline)' }}>
              <div className="row between" style={{ marginBottom: 6 }}>
                <div className="eyebrow">About</div>
                {isAdmin && (
                  <button className="btn-ghost" style={{ fontSize: 11, color: 'var(--maroon)', fontWeight: 500 }}
                          onClick={() => setEditing(selected)}>
                    <Icon name="pencil" size={11} /> Edit
                  </button>
                )}
              </div>
              {selected.bio ? (
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)' }}>{selected.bio}</p>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>No bio yet — add a short description so the team and visitors know what {selected.name.split(' ')[0]} is interested in.</p>
              )}
            </div>

            {/* CV block */}
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--hairline)' }}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <div className="eyebrow">Curriculum Vitae</div>
              </div>
              <ProfileCV user={selected} />
            </div>

            <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--hairline)', display: 'flex', gap: 6 }}>
              {isAdmin ? (
                <>
                  <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditing(selected)}>
                    <Icon name="pencil" size={12} /> Edit
                  </button>
                  <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', color: 'var(--status-red)' }}
                          onClick={() => setDeleting(selected)}>
                    <Icon name="close" size={12} /> Delete
                  </button>
                </>
              ) : (
                <a className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }} href={`mailto:${selected.email}`}>
                  <Icon name="mail" size={12} /> Email
                </a>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Projects', value: projects.length },
                { label: 'As lead', value: projects.filter(p => p.lead === selected.id).length },
                { label: 'Open tasks', value: 7 },
                { label: 'Updates submitted', value: UPDATES.filter(u => u.user === selected.id).length },
              ].map((k, i) => (
                <div key={i} className="kpi" style={{ padding: 14 }}>
                  <div className="kpi-label">{k.label}</div>
                  <div className="serif" style={{ fontSize: 26, fontWeight: 600, marginTop: 2 }}>{k.value}</div>
                </div>
              ))}
            </div>

            <div className="card card-pad">
              <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Assigned projects</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {projects.map(p => (
                  <button key={p.id} onClick={() => navigate({ page: 'projects', id: p.id })}
                          style={{ display: 'grid', gridTemplateColumns: '12px 1fr auto auto', gap: 12, alignItems: 'center', padding: 12, border: '1px solid var(--hairline)', borderRadius: 8, textAlign: 'left', background: 'var(--paper)', cursor: 'pointer', transition: 'border-color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--hairline)'}>
                    <HealthDot health={p.health} />
                    <div>
                      <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{p.acronym}</div>
                      <div className="serif" style={{ fontSize: 13, fontWeight: 600 }}>{p.title}</div>
                    </div>
                    <StatusChip status={p.status} />
                    {p.lead === selected.id && <span className="chip chip-maroon">Lead</span>}
                  </button>
                ))}
                {projects.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>No projects assigned yet.</div>
                )}
              </div>
            </div>

            {lastUpd && (
              <div className="card card-pad">
                <div className="row between" style={{ marginBottom: 12 }}>
                  <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 16, fontWeight: 600 }}>Most recent update</h3>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{relDate(lastUpd.date)}</span>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                  <strong>Completed:</strong> {lastUpd.completed}
                </div>
                <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6 }}>
                  <strong>In progress:</strong> {lastUpd.inProgress}
                </div>
              </div>
            )}

            <div className="card card-pad">
              <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Recent activity</h3>
              <ActivityFeed items={personActivity.length ? personActivity : ACTIVITY.slice(0, 4)} navigate={navigate} limit={6} />
            </div>
          </div>
        </div>
      </div>
      {editing && <EditPersonModal user={editing} onClose={() => setEditing(null)} onSaved={refresh} />}
      {deleting && <DeletePersonConfirm user={deleting} onClose={() => setDeleting(null)} onConfirm={() => { navigate({ page: 'people' }); }} />}
      </>
    );
  }

  const groups = ['Principal Investigator', 'Co-Investigator', 'Co-Supervisor', 'MFM Fellow', 'Resident', 'Medical Student', 'Research Coordinator', 'Biostatistician', 'Neonatology', 'Volunteer', 'Collaborator', 'Industry Partner', 'Other'];

  return (
    <div className="page">
      <div className="page-header row between">
        <div>
          <h1 className="page-title">People</h1>
          <p className="page-sub">{PEOPLE.length} members across the research group</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && (
            <button className="btn" onClick={() => navigate({ page: 'users' })}>
              <Icon name="upload" size={14} /> Invite
            </button>
          )}
          {isAdmin && <button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={14} stroke={2} /> Add person</button>}
        </div>
      </div>
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span className="search-icon"><Icon name="search" size={15} /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people…" style={{ width: '100%', paddingLeft: 36, background: 'var(--bg-elevated)' }} />
          </div>
          <Select label="Role" value={roleF} onChange={setRoleF} options={[...new Set(PEOPLE.map(p => p.role))]} />
        </div>
      </div>
      {groups.map(g => {
        const items = g === 'Other'
          ? filtered.filter(p => !groups.includes(p.role))
          : filtered.filter(p => p.role === g);
        if (!items.length) return null;
        return (
          <div key={g} style={{ marginBottom: 28 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>{g} · {items.length}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {items.map(p => {
                const projects = projectsForPerson(p.id);
                return (
                  <button key={p.id} className="card card-hover" style={{ padding: 18, textAlign: 'left' }} onClick={() => navigate({ page: 'people', id: p.id })}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Avatar user={p} size="lg" />
                      <span className="chip chip-grey" style={{ fontSize: 10 }}>{projects.length} project{projects.length === 1 ? '' : 's'}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 12 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.training}</div>
                    <div className="serif" style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 8, fontStyle: 'italic' }}>{p.focus}</div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {adding && <EditPersonModal mode="add" onClose={() => setAdding(false)} onSaved={refresh} />}
      {editing && <EditPersonModal user={editing} onClose={() => setEditing(null)} onSaved={refresh} />}
    </div>
  );
};

/* Generic page stubs (not deeply built but realistic) */

const MyTasksPage = ({ navigate, currentUser, toast }) => {
  const myTasks = [];
  Object.keys(TASKS).forEach(pid => {
    TASKS[pid].forEach(t => {
      if (t.owner === currentUser.id || t.owner === 'u1') myTasks.push({ ...t, projectId: pid });
    });
  });
  // Sort by due
  myTasks.sort((a, b) => new Date(a.due) - new Date(b.due));
  const today = new Date('2026-05-24');
  const overdue = myTasks.filter(t => t.status !== 'done' && new Date(t.due) < today);
  const thisWeek = myTasks.filter(t => {
    const d = (new Date(t.due) - today) / (24*3600*1000);
    return t.status !== 'done' && d >= 0 && d <= 7;
  });
  const later = myTasks.filter(t => {
    const d = (new Date(t.due) - today) / (24*3600*1000);
    return t.status !== 'done' && d > 7;
  });

  const Section = ({ label, items, accent }) => (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="row between" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: accent }} />
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>{label}</h3>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>· {items.length}</span>
        </div>
      </div>
      {items.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Nothing here.</div>}
      {items.map(t => {
        const project = PROJECTS.find(p => p.id === t.projectId);
        const owner = personById(t.owner);
        return (
          <div key={`${t.projectId}-${t.id}`} className="file-row" style={{ gridTemplateColumns: '24px 1fr 180px 100px 90px 100px', cursor: 'pointer' }}
               onClick={() => navigate({ page: 'projects', id: t.projectId, tab: 'tasks' })}>
            <input type="checkbox" checked={t.status === 'done'} onChange={e => e.stopPropagation()} style={{ width: 16, height: 16 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{project?.acronym} · {project?.title}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Avatar user={owner} size="sm" />
              <span style={{ fontSize: 12 }}>{owner?.name.split(' ').slice(-1)[0]}</span>
            </div>
            <span className={`chip ${priorityChip(t.priority)}`}>{t.priority}</span>
            <span className="chip chip-grey">{KANBAN_COLS.find(c => c.id === t.status)?.label || t.status}</span>
            <span style={{ fontSize: 12, color: new Date(t.due) < today ? 'var(--status-red)' : 'var(--muted)', fontWeight: 500 }}>{relDate(t.due)}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="page">
      <div className="page-header row between">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-sub">{overdue.length + thisWeek.length} open tasks need attention</p>
        </div>
        <button className="btn btn-primary"><Icon name="plus" size={14} stroke={2} /> Quick add</button>
      </div>
      <Section label="Overdue" items={overdue} accent="var(--status-red)" />
      <Section label="This week" items={thisWeek} accent="var(--maroon)" />
      <Section label="Later" items={later} accent="var(--muted-2)" />
    </div>
  );
};

const TraineeUpdatesPage = ({ navigate, updates }) => {
  const [filter, setFilter] = useState('all');
  const filtered = updates.filter(u => {
    if (filter === 'pending') return u.piStatus === 'pending';
    if (filter === 'clarification') return u.piStatus === 'requested_clarification';
    return true;
  });
  return (
    <div className="page">
      <div className="page-header row between">
        <div>
          <h1 className="page-title">Trainee Updates</h1>
          <p className="page-sub">Submitted progress reports awaiting your review</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, padding: 3, background: 'var(--bg-elevated)', borderRadius: 8, alignSelf: 'flex-start', width: 'fit-content' }}>
        {[
          { id: 'all', label: 'All', n: updates.length },
          { id: 'pending', label: 'Awaiting PI response', n: updates.filter(u => u.piStatus === 'pending').length },
          { id: 'clarification', label: 'Clarification requested', n: updates.filter(u => u.piStatus === 'requested_clarification').length },
        ].map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)}
                  style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, background: filter === t.id ? 'var(--paper)' : 'transparent', boxShadow: filter === t.id ? 'var(--shadow-1)' : 'none', color: filter === t.id ? 'var(--ink)' : 'var(--muted)' }}>
            {t.label} <span style={{ color: 'var(--muted-2)' }}>· {t.n}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.map(u => {
          const user = personById(u.user);
          const project = PROJECTS.find(p => p.id === u.project);
          return (
            <button key={u.id} onClick={() => navigate({ page: 'projects', id: project.id, tab: 'updates' })} className="card card-hover" style={{ textAlign: 'left', padding: 18 }}>
              <div className="row between" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar user={user} size="md" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{project?.acronym} · Submitted {relDate(u.date)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="chip chip-maroon">{u.percent}% complete</span>
                  {u.piStatus === 'pending' && <span className="chip chip-amber">Awaiting PI</span>}
                  {u.piStatus === 'requested_clarification' && <span className="chip chip-red">Clarification requested</span>}
                  {u.piStatus === 'approved' && <span className="chip chip-green">Approved</span>}
                </div>
              </div>
              <div className="serif" style={{ fontSize: 15, fontWeight: 600 }}>{project?.title}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {u.completed}
              </div>
              {u.helpNeeded && u.helpNeeded !== 'None at this stage.' && (
                <div style={{ marginTop: 10, padding: 10, background: 'var(--maroon-wash)', borderRadius: 8, fontSize: 12 }}>
                  <strong style={{ color: 'var(--maroon)' }}>Help needed:</strong> {u.helpNeeded}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const CalendarPage = ({ navigate }) => {
  // Calendar with milestones overlay
  const today = new Date('2026-05-24');
  const month = today.getMonth();
  const year = today.getFullYear();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const events = [];
  PROJECTS.forEach(p => {
    events.push({ date: p.nextDue, title: p.nextMilestone, project: p, type: 'milestone' });
  });
  Object.keys(MILESTONES).forEach(pid => {
    MILESTONES[pid].forEach(m => {
      const project = PROJECTS.find(p => p.id === pid);
      if (project) events.push({ date: m.due, title: m.title, project, type: 'milestone', done: m.status === 'done' });
    });
  });
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="page">
      <div className="page-header row between">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-sub">{new Date(year, month).toLocaleDateString('en', { month: 'long', year: 'numeric' })} — portfolio milestones and deadlines</p>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: 3, background: 'var(--bg-elevated)', borderRadius: 8 }}>
          {['Month', 'Week', 'List'].map(v => (
            <button key={v} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 500, borderRadius: 6, background: v === 'Month' ? 'var(--paper)' : 'transparent', boxShadow: v === 'Month' ? 'var(--shadow-1)' : 'none', color: v === 'Month' ? 'var(--ink)' : 'var(--muted)' }}>{v}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="eyebrow" style={{ textAlign: 'center', padding: '6px 0' }}>{d}</div>
            ))}
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const date = new Date(year, month, d).toISOString().slice(0, 10);
              const dayEvents = events.filter(e => e.date === date);
              const isToday = d === today.getDate();
              return (
                <div key={i} style={{ minHeight: 96, padding: 6, borderRadius: 8, background: isToday ? 'var(--maroon-wash)' : 'var(--bg-elevated)', border: '1px solid', borderColor: isToday ? 'var(--maroon)' : 'var(--hairline)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: isToday ? 'var(--maroon)' : 'var(--ink-2)', marginBottom: 4 }}>{d}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {dayEvents.slice(0, 2).map((e, j) => (
                      <button key={j} onClick={() => navigate({ page: 'projects', id: e.project.id, tab: 'timeline' })}
                              style={{ background: e.done ? 'var(--status-grey-wash)' : 'var(--maroon)', color: e.done ? 'var(--muted)' : '#fff',
                                       fontSize: 9, padding: '2px 5px', borderRadius: 3, textAlign: 'left',
                                       textDecoration: e.done ? 'line-through' : 'none',
                                       whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', width: '100%' }}>
                        {e.project.acronym}
                      </button>
                    ))}
                    {dayEvents.length > 2 && <div style={{ fontSize: 9, color: 'var(--muted)' }}>+{dayEvents.length - 2} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card card-pad">
          <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Upcoming this month</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.filter(e => {
              const d = new Date(e.date);
              return d.getMonth() === month && d.getFullYear() === year && !e.done;
            }).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 10).map((e, i) => (
              <button key={i} onClick={() => navigate({ page: 'projects', id: e.project.id, tab: 'timeline' })}
                      style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: 10, alignItems: 'center', padding: 10, borderRadius: 8, border: '1px solid var(--hairline)', background: 'var(--paper)', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 36, height: 40, background: 'var(--maroon-wash)', borderRadius: 6, textAlign: 'center', paddingTop: 4, color: 'var(--maroon)' }}>
                  <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase' }}>{new Date(e.date).toLocaleDateString('en', { month: 'short' })}</div>
                  <div className="serif" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{new Date(e.date).getDate()}</div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{e.project.acronym}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const FilesGlobalPage = ({ navigate }) => {
  const recent = SAMPLE_FILES.slice(0, 12);
  return (
    <div className="page">
      <div className="page-header row between">
        <div>
          <h1 className="page-title">Files</h1>
          <p className="page-sub">Recent uploads across all projects</p>
        </div>
        <button className="btn btn-primary"><Icon name="upload" size={14} /> Upload</button>
      </div>
      <div className="phi-banner" style={{ marginBottom: 18 }}>
        <Icon name="alert" size={18} stroke={2} />
        <div><strong>Do not upload PHI or patient-identifiable data</strong> unless this system has been approved for secure institutional use.</div>
      </div>
      <div className="card">
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'grid', gridTemplateColumns: '32px 1fr 180px 140px 100px 100px 40px', gap: 12, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: 'var(--muted)' }}>
          <div></div><div>File</div><div>Project</div><div>Uploaded by</div><div>Version</div><div>Date</div><div></div>
        </div>
        {recent.map(f => {
          const user = personById(f.uploadedBy);
          const project = PROJECTS[0];
          return (
            <div key={f.id} style={{ padding: '10px 12px', borderBottom: '1px solid var(--hairline)', display: 'grid', gridTemplateColumns: '32px 1fr 180px 140px 100px 100px 40px', gap: 12, alignItems: 'center' }}>
              <div className="file-icon">{f.type}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{f.size}</div>
              </div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{project.acronym}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar user={user} size="sm" />
                <span style={{ fontSize: 12 }}>{user?.name.split(' ').slice(-1)[0]}</span>
              </div>
              <div style={{ fontSize: 12 }}>v{f.version}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{relDate(f.date)}</div>
              <button className="btn-icon btn-ghost"><Icon name="download" size={14} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ReportsPage = ({ openReport }) => {
  const reports = [
    { type: 'portfolio', icon: 'dashboard', title: 'Monthly research portfolio report', desc: 'A 1-page snapshot of every active project for the past month.' },
    { type: 'overdue', icon: 'alert', title: 'Overdue items', desc: 'Every overdue milestone, task and update across the portfolio.' },
    { type: 'pubpipe', icon: 'publication', title: 'Publication pipeline', desc: 'All manuscripts in writing, review, submitted, or accepted stages.' },
    { type: 'trainee', icon: 'user', title: 'Trainee performance summary', desc: 'Per-trainee activity, projects, and update cadence.' },
    { type: 'reb', icon: 'flag', title: 'REB & ethics status', desc: 'Status of REB submissions, approvals, and data agreements.' },
  ];
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-sub">Generate a report across the full portfolio, or pick a project from its Reports tab for a deeper export.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {reports.map(r => (
          <button key={r.type} onClick={() => openReport(r.type)} className="card card-hover" style={{ padding: 20, display: 'flex', alignItems: 'flex-start', gap: 14, textAlign: 'left' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--maroon-wash)', color: 'var(--maroon)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name={r.icon} size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="serif" style={{ fontSize: 16, fontWeight: 600 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{r.desc}</div>
            </div>
            <Icon name="arrowRight" size={16} color="var(--muted)" />
          </button>
        ))}
      </div>
    </div>
  );
};

const SettingsPage = ({ tweaks, setTweak, toast }) => {
  const [integrations, setIntegrations] = useState({
    pubmed: { connected: true, since: '2024-09-12', detail: 'Author "Ashwal E" · 9 publications' },
    google: { connected: false, detail: 'Two-way sync: hub events ↔ Google Calendar' },
    outlook: { connected: false, detail: 'Two-way sync: hub events ↔ Outlook / Microsoft 365' },
    ical: { connected: true, since: '2025-11-04', detail: 'Subscribe URL: mfmhub.example.ca/calendar.ics' },
    notion: { connected: false, detail: 'Mirror Projects, Publications, People & Milestones to a Notion workspace' },
    slack: { connected: false, detail: 'Post notifications to a Slack channel' },
    teams: { connected: false, detail: 'Post notifications to a Microsoft Teams channel' },
    orcid: { connected: false, detail: 'Verify authorship and auto-import publications' },
    redcap: { connected: false, detail: 'Link a REDCap project per study' },
  });

  const toggle = (key) => {
    setIntegrations(s => ({ ...s, [key]: { ...s[key], connected: !s[key].connected, since: !s[key].connected ? new Date().toISOString().slice(0, 10) : null } }));
    toast(integrations[key].connected ? `Disconnected from ${key}` : `Connected to ${key}`);
  };

  const integrationCards = [
    { key: 'pubmed', name: 'PubMed', desc: 'Auto-pulls publications by author query. The Publications page mirrors PubMed E-utilities.', icon: 'publication', color: '#0D5D78', wash: 'var(--bayfront-wash)', tag: 'Bibliometrics' },
    { key: 'google', name: 'Google Calendar', desc: 'Read and write meetings, milestones and deadlines via OAuth + Calendar API.', icon: 'calendar', color: '#4285F4', wash: 'rgba(66,133,244,0.08)', tag: 'Calendar' },
    { key: 'outlook', name: 'Outlook / Microsoft 365', desc: 'Sync your admin\'s scheduled meetings via Microsoft Graph. Two-way: events you create here appear in Outlook.', icon: 'calendar', color: '#0078D4', wash: 'rgba(0,120,212,0.08)', tag: 'Calendar' },
    { key: 'ical', name: 'iCal subscription feed', desc: 'Read-only feed of hub deadlines you can subscribe to in any calendar app — no OAuth needed.', icon: 'calendar', color: '#495965', wash: 'var(--bg-elevated)', tag: 'Calendar' },
    { key: 'notion', name: 'Notion', desc: 'Mirror Projects, Publications, People and Milestones to databases in your Notion workspace. Two-way sync.', icon: 'document', color: '#1A1D24', wash: 'var(--bg-elevated)', tag: 'Knowledge base' },
    { key: 'slack', name: 'Slack', desc: 'Post status pulse digests, overdue alerts and trainee updates to a Slack channel.', icon: 'message', color: '#4A154B', wash: 'rgba(74,21,75,0.08)', tag: 'Notifications' },
    { key: 'teams', name: 'Microsoft Teams', desc: 'Same as Slack, but for Teams channels.', icon: 'message', color: '#4B53BC', wash: 'rgba(75,83,188,0.08)', tag: 'Notifications' },
    { key: 'orcid', name: 'ORCID', desc: 'Verify trainee and PI authorship; auto-import publications using ORCID iD.', icon: 'user', color: '#A6CE39', wash: 'rgba(166,206,57,0.1)', tag: 'Identity' },
    { key: 'redcap', name: 'REDCap', desc: 'Link a REDCap project per study to jump directly to data forms.', icon: 'document', color: '#9A2A2A', wash: 'var(--status-red-wash)', tag: 'Data capture' },
  ];

  return (
  <div className="page" style={{ maxWidth: 1100 }}>
    <div className="page-header"><h1 className="page-title">Settings</h1><p className="page-sub">Workspace, integrations, privacy and compliance.</p></div>

    {/* Integrations */}
    <div style={{ marginBottom: 24 }}>
      <div className="row between" style={{ marginBottom: 12 }}>
        <h2 className="serif" style={{ fontSize: 18, fontWeight: 600 }}>Integrations</h2>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {Object.values(integrations).filter(i => i.connected).length} of {integrationCards.length} connected
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {integrationCards.map(c => {
          const i = integrations[c.key];
          return (
            <div key={c.key} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: c.wash, color: c.color, display: 'grid', placeItems: 'center' }}>
                  <Icon name={c.icon} size={18} />
                </div>
                {i.connected ? (
                  <span className="chip chip-green"><span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} /> Connected</span>
                ) : (
                  <span className="chip chip-grey">Not connected</span>
                )}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                  <span className="chip chip-grey" style={{ fontSize: 9 }}>{c.tag}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{c.desc}</p>
                {i.detail && <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 4 }}>{i.detail}</div>}
                {i.since && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Connected since {fmtDate(i.since)}</div>}
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', gap: 6 }}>
                {i.connected ? (
                  <>
                    <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => toast(`${c.name} settings opened`)}>Configure</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => toggle(c.key)}>Disconnect</button>
                  </>
                ) : (
                  <button className="btn btn-sm btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => toggle(c.key)}>
                    <Icon name="plus" size={12} stroke={2} /> Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <div className="card card-pad" style={{ marginBottom: 16 }}>
      <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Workspace</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Group name</div>
          <input defaultValue="MFM Research Hub" style={{ width: '100%' }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Department</div>
          <input defaultValue="Maternal-Fetal Medicine, Obstetrics & Gynecology" style={{ width: '100%' }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Default reminder cadence</div>
          <select defaultValue="weekly" style={{ width: '100%' }}>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
            <option value="none">No automatic reminders</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Institutional SSO</div>
          <button className="btn" style={{ width: '100%', justifyContent: 'center' }}>
            <Icon name="user" size={14} /> Connect McMaster / HHS SSO
          </button>
        </div>
      </div>
    </div>
    <div className="card card-pad" style={{ marginBottom: 16 }}>
      <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Privacy & compliance</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
        {[
          { label: 'Audit log enabled', sub: 'All sensitive actions are logged with user, timestamp and IP', on: true },
          { label: 'Role-based access control', sub: 'Trainees see only assigned projects unless granted access', on: true },
          { label: 'Two-factor authentication', sub: 'Required for PI and Coordinator roles', on: true },
          { label: 'PHI uploads blocked', sub: 'Files are scanned for direct identifiers (mock)', on: false },
          { label: 'Approved for clinical research data', sub: 'Awaiting institutional privacy review', on: false },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--hairline)' }}>
            <div style={{ width: 32, height: 18, borderRadius: 999, background: r.on ? 'var(--maroon)' : 'var(--border-strong)', position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 14, height: 14, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: r.on ? 16 : 2, transition: 'left 0.15s' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{r.label}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};

window.PeoplePage = PeoplePage;
window.MyTasksPage = MyTasksPage;
window.TraineeUpdatesPage = TraineeUpdatesPage;
window.CalendarPage = CalendarPage;
window.FilesGlobalPage = FilesGlobalPage;
window.ReportsPage = ReportsPage;
window.SettingsPage = SettingsPage;
