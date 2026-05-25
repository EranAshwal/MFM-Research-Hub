/* MFM Research Hub — Project action modals (edit / status / comment / upload / summary / request-update) */

// =========================================================================
// NEW PROJECT — create a brand-new project
// =========================================================================
const NewProjectModal = ({ onClose, toast, navigate, currentUser }) => {
  const me = currentUser || (window.AuthService?.getCurrentPerson?.());
  const today = new Date().toISOString().slice(0, 10);
  const inSixMonths = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().slice(0, 10);
  })();
  const [p, setP] = useState({
    title: '',
    acronym: '',
    description: '',
    category: 'Clinical research',
    studyDesign: 'TBD',
    status: 'Idea / scoping',
    health: 'green',
    priority: 'Medium',
    progress: 0,
    pi: me?.id || '',
    lead: me?.id || '',
    reb: 'Not yet submitted',
    start: today,
    target: inSixMonths,
    nextMilestone: 'Define scope and write protocol outline',
    nextDue: inSixMonths,
    bin: '',
    coverColor: 'maroon',
    awaitingUpdate: false,
    awaitingReview: false,
    fileCount: 0,
    lastUpdate: today,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setP(s => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!p.title.trim()) { toast?.('Title is required'); return; }
    if (!p.acronym.trim()) { toast?.('Acronym is required'); return; }
    setSaving(true);
    try {
      const created = await window.DataService.createProject(p);
      const newId = created?.id || p.id;
      toast?.('Project created');
      onClose();
      if (newId) navigate?.({ page: 'projects', id: newId });
      else navigate?.({ page: 'projects' });
    } catch (err) {
      console.error(err);
      toast?.('Could not create project: ' + (err.message || 'unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const people = (window.PEOPLE || []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-h">
          <div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>New project</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>You can edit any of these details later.</div>
          </div>
          <button type="button" className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-b" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <NPField label="Title">
            <input autoFocus value={p.title} onChange={e => set('title', e.target.value)}
                   placeholder="e.g. Postpartum Hemorrhage Risk Stratification"
                   style={{ width: '100%' }} />
          </NPField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <NPField label="Acronym">
              <input value={p.acronym} onChange={e => set('acronym', e.target.value.toUpperCase())}
                     placeholder="e.g. PPH-RISK" style={{ width: '100%' }} />
            </NPField>
            <NPField label="Category">
              <select value={p.category} onChange={e => set('category', e.target.value)} style={{ width: '100%' }}>
                {['Clinical research', 'Translational', 'Education', 'Quality improvement', 'Health services', 'Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </NPField>
          </div>
          <NPField label="Description">
            <textarea value={p.description} onChange={e => set('description', e.target.value)} rows={3}
                      placeholder="One or two sentences on the question, population, and outcome."
                      style={{ width: '100%', resize: 'vertical' }} />
          </NPField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <NPField label="Study design">
              <select value={p.studyDesign} onChange={e => set('studyDesign', e.target.value)} style={{ width: '100%' }}>
                {['TBD', 'Retrospective cohort', 'Prospective cohort', 'Case-control', 'RCT', 'Cross-sectional', 'Systematic review', 'QI / audit', 'Protocol / guideline', 'Other'].map(s => <option key={s}>{s}</option>)}
              </select>
            </NPField>
            <NPField label="Status">
              <select value={p.status} onChange={e => set('status', e.target.value)} style={{ width: '100%' }}>
                {['Idea / scoping', 'Protocol development', 'REB submission', 'Data collection', 'Analysis', 'Manuscript drafting', 'Under review', 'Published', 'On hold'].map(s => <option key={s}>{s}</option>)}
              </select>
            </NPField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <NPField label="PI">
              <select value={p.pi} onChange={e => set('pi', e.target.value)} style={{ width: '100%' }}>
                <option value="">— Select PI —</option>
                {people.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
              </select>
            </NPField>
            <NPField label="Project lead">
              <select value={p.lead} onChange={e => set('lead', e.target.value)} style={{ width: '100%' }}>
                <option value="">— Select lead —</option>
                {people.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
              </select>
            </NPField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <NPField label="Start">
              <input type="date" value={p.start} onChange={e => set('start', e.target.value)} style={{ width: '100%' }} />
            </NPField>
            <NPField label="Target completion">
              <input type="date" value={p.target} onChange={e => set('target', e.target.value)} style={{ width: '100%' }} />
            </NPField>
            <NPField label="REB status">
              <select value={p.reb} onChange={e => set('reb', e.target.value)} style={{ width: '100%' }}>
                {['Not yet submitted', 'In preparation', 'Submitted', 'Approved', 'Exempt', 'Not required'].map(s => <option key={s}>{s}</option>)}
              </select>
            </NPField>
          </div>
          <NPField label="Next milestone">
            <input value={p.nextMilestone} onChange={e => set('nextMilestone', e.target.value)}
                   placeholder="What's the next concrete deliverable?" style={{ width: '100%' }} />
          </NPField>
          <NPField label="Next milestone due">
            <input type="date" value={p.nextDue} onChange={e => set('nextDue', e.target.value)} style={{ width: '100%', maxWidth: 220 }} />
          </NPField>
        </div>
        <div className="modal-f">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving || !p.title.trim() || !p.acronym.trim()}>
            <Icon name="plus" size={14} stroke={2} /> {saving ? 'Creating…' : 'Create project'}
          </button>
        </div>
      </form>
    </div>
  );
};

const NPField = ({ label, children }) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
    {children}
  </div>
);

// =========================================================================
// EDIT PROJECT — edit core study fields
// =========================================================================
const EditProjectModal = ({ project, onClose, toast, onSaved }) => {
  const [p, setP] = useState({
    title: project.title || '',
    acronym: project.acronym || '',
    description: project.description || '',
    studyDesign: project.studyDesign || '',
    category: project.category || '',
    priority: project.priority || 'Medium',
    progress: project.progress || 0,
    dataSource: project.dataSource || '',
    targetJournal: project.targetJournal || '',
    start: project.start || '',
    target: project.target || '',
    reb: project.reb || 'Not submitted',
    nextMilestone: project.nextMilestone || '',
    nextDue: project.nextDue || '',
    status: project.status || 'In progress',
  });
  const set = (k, v) => setP(s => ({ ...s, [k]: v }));
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await window.DataService.updateProject(project.id, p);
      toast?.('Study details saved');
      onSaved?.();
      onClose();
    } catch (err) {
      toast?.('Save failed: ' + err.message, 'error');
    }
    setSaving(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()} onSubmit={save}>
        <div className="modal-h">
          <div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>Edit project</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{project.acronym}</div>
          </div>
          <button type="button" className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-b" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Title"><input value={p.title} onChange={e => set('title', e.target.value)} style={{ width: '100%' }} required /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Acronym"><input value={p.acronym} onChange={e => set('acronym', e.target.value)} style={{ width: '100%' }} /></Field>
            <Field label="Status">
              <select value={p.status} onChange={e => set('status', e.target.value)} style={{ width: '100%' }}>
                {['Planning','In progress','Awaiting review','Paused','Completed','Archived'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Summary"><textarea rows={3} value={p.description} onChange={e => set('description', e.target.value)} style={{ width: '100%', resize: 'vertical' }} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Study design"><input value={p.studyDesign} onChange={e => set('studyDesign', e.target.value)} style={{ width: '100%' }} /></Field>
            <Field label="Clinical area"><input value={p.category} onChange={e => set('category', e.target.value)} style={{ width: '100%' }} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Priority">
              <select value={p.priority} onChange={e => set('priority', e.target.value)} style={{ width: '100%' }}>
                {['High','Medium','Low'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Progress %"><input type="number" min={0} max={100} value={p.progress} onChange={e => set('progress', +e.target.value)} style={{ width: '100%' }} /></Field>
            <Field label="REB status">
              <select value={p.reb} onChange={e => set('reb', e.target.value)} style={{ width: '100%' }}>
                {['Not submitted','Under review','Approved','Amendment','Expired'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Data source"><input value={p.dataSource} onChange={e => set('dataSource', e.target.value)} style={{ width: '100%' }} /></Field>
            <Field label="Target journal"><input value={p.targetJournal} onChange={e => set('targetJournal', e.target.value)} style={{ width: '100%' }} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Start date"><input type="date" value={p.start} onChange={e => set('start', e.target.value)} style={{ width: '100%' }} /></Field>
            <Field label="Target completion"><input type="date" value={p.target} onChange={e => set('target', e.target.value)} style={{ width: '100%' }} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Field label="Next milestone"><input value={p.nextMilestone} onChange={e => set('nextMilestone', e.target.value)} style={{ width: '100%' }} /></Field>
            <Field label="Milestone due"><input type="date" value={p.nextDue} onChange={e => set('nextDue', e.target.value)} style={{ width: '100%' }} /></Field>
          </div>
        </div>
        <div className="modal-f">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </div>
  );
};
const Field = ({ label, children }) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
    {children}
  </div>
);

// =========================================================================
// CHANGE STATUS — quick small dropdown
// =========================================================================
const ChangeStatusModal = ({ project, onClose, toast, onSaved }) => {
  const [status, setStatus] = useState(project.status || 'In progress');
  const [health, setHealth] = useState(project.health || 'green');
  const [saving, setSaving] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await window.DataService.updateProject(project.id, { status, health });
      toast?.(`Status set to "${status}"`);
      onSaved?.();
      onClose();
    } catch (err) {
      toast?.('Failed: ' + err.message, 'error');
    }
    setSaving(false);
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()} onSubmit={save}>
        <div className="modal-h">
          <div className="serif" style={{ fontSize: 18, fontWeight: 600 }}>Change project status</div>
          <button type="button" className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-b" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Status">
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%' }}>
              {['Planning','In progress','Awaiting review','Paused','Completed','Archived'].map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Health">
            <select value={health} onChange={e => setHealth(e.target.value)} style={{ width: '100%' }}>
              <option value="green">On track</option>
              <option value="amber">At risk</option>
              <option value="red">Off track</option>
            </select>
          </Field>
        </div>
        <div className="modal-f">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Apply'}</button>
        </div>
      </form>
    </div>
  );
};

// =========================================================================
// ADD COMMENT — appends to activity_log
// =========================================================================
const AddCommentModal = ({ project, onClose, toast, currentUser, onSaved }) => {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      await window.DataService.logActivity(project.id, currentUser?.id, 'comment', 'commented', text);
      toast?.('Comment added');
      onSaved?.();
      onClose();
    } catch (err) {
      toast?.('Failed: ' + err.message, 'error');
    }
    setSaving(false);
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()} onSubmit={save}>
        <div className="modal-h">
          <div>
            <div className="serif" style={{ fontSize: 18, fontWeight: 600 }}>Add comment to {project.acronym}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Posts to the project activity feed</div>
          </div>
          <button type="button" className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-b">
          <textarea rows={5} value={text} onChange={e => setText(e.target.value)} autoFocus
                    placeholder="What's the update?" style={{ width: '100%', resize: 'vertical' }} />
        </div>
        <div className="modal-f">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving || !text.trim()}>
            {saving ? 'Posting…' : 'Post comment'}
          </button>
        </div>
      </form>
    </div>
  );
};

// =========================================================================
// UPLOAD FILE — to Supabase Storage `project-files` bucket
// =========================================================================
const UploadFileModal = ({ project, onClose, toast, currentUser }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState([]);

  const handleFiles = (fileList) => {
    setFiles(Array.from(fileList));
  };
  const upload = async () => {
    if (!files.length) return;
    setUploading(true);
    const sb = window.__sb;
    const results = [];
    for (const f of files) {
      const path = `${project.id}/${Date.now()}-${f.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error } = await sb.storage.from('project-files').upload(path, f);
      if (error) {
        results.push({ name: f.name, error: error.message });
      } else {
        results.push({ name: f.name, path });
        // Log to activity
        try {
          await window.DataService.logActivity(project.id, currentUser?.id, 'upload',
            `uploaded ${f.name}`, `${(f.size/1024).toFixed(1)} KB`);
        } catch {}
      }
    }
    setDone(results);
    setUploading(false);
    const ok = results.filter(r => !r.error).length;
    toast?.(`Uploaded ${ok} of ${files.length} file${files.length === 1 ? '' : 's'}`);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <div>
            <div className="serif" style={{ fontSize: 18, fontWeight: 600 }}>Upload files to {project.acronym}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Stored in your private Supabase bucket</div>
          </div>
          <button className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-b" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'block', padding: 28, border: '2px dashed var(--border-strong)', borderRadius: 10, textAlign: 'center', cursor: 'pointer', background: 'var(--bg-elevated)' }}>
            <input type="file" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
            <Icon name="upload" size={28} color="var(--muted)" />
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500 }}>
              {files.length ? `${files.length} file(s) selected` : 'Click to choose files'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Any file type, up to 50MB each</div>
          </label>
          {files.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
              {files.map((f, i) => {
                const result = done.find(d => d.name === f.name);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 6 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    {result?.error && <span style={{ color: 'var(--status-red)' }}>✗ {result.error}</span>}
                    {result && !result.error && <span style={{ color: 'var(--status-green)' }}>✓ Uploaded</span>}
                    {!result && uploading && <span style={{ color: 'var(--muted)' }}>…</span>}
                    {!result && !uploading && <span style={{ color: 'var(--muted)' }}>{(f.size/1024).toFixed(1)} KB</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="modal-f">
          <button className="btn btn-ghost" onClick={onClose}>{done.length ? 'Done' : 'Cancel'}</button>
          <button className="btn btn-primary" disabled={!files.length || uploading} onClick={upload}>
            {uploading ? 'Uploading…' : `Upload ${files.length || ''} file${files.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// GENERATE PROJECT SUMMARY — uses Claude
// =========================================================================
const GenerateSummaryModal = ({ project, onClose, toast }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const team = (project.members || []).map(id => personById(id)?.name).filter(Boolean).join(', ');
        const prompt = `Write a 3-paragraph executive summary of this research project for a department-head report. Be specific and concise — no marketing language.

Project: ${project.title}
Acronym: ${project.acronym}
Status: ${project.status} · ${project.progress}% complete
Clinical area: ${project.category}
Study design: ${project.studyDesign}
Data source: ${project.dataSource}
Target journal: ${project.targetJournal}
Started: ${project.start} · Target completion: ${project.target}
REB: ${project.reb}
Team: ${team}

Project description: ${project.description}

Next milestone: ${project.nextMilestone} (due ${project.nextDue})

Paragraph 1: what the study is about and why it matters clinically.
Paragraph 2: current progress, methods status, any obstacles.
Paragraph 3: next steps and timeline to publication.`;
        const text = await window.claude.complete(prompt);
        setSummary(text);
      } catch (e) {
        setErr(e.message);
      }
      setLoading(false);
    })();
  }, []);

  const copy = async () => {
    try { await navigator.clipboard.writeText(summary); toast?.('Copied to clipboard'); }
    catch { toast?.('Copy failed — select & copy manually', 'error'); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <div>
            <div className="serif" style={{ fontSize: 18, fontWeight: 600 }}>Generated summary · {project.acronym}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>AI-generated from project metadata</div>
          </div>
          <button className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-b">
          {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Generating…</div>}
          {err && <div style={{ color: 'var(--status-red)', fontSize: 13 }}>{err}</div>}
          {!loading && !err && (
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)' }}>
              {summary}
            </div>
          )}
        </div>
        <div className="modal-f">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-primary" disabled={loading || !summary} onClick={copy}>
            <Icon name="copy" size={13} /> Copy text
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// REQUEST UPDATE — sends a note to the team (uses existing notes table)
// =========================================================================
const RequestUpdateModal = ({ project, onClose, toast, currentUser }) => {
  const team = (project.members || []).map(id => personById(id)).filter(Boolean);
  const [selected, setSelected] = useState(new Set(team.map(t => t.id)));
  const [message, setMessage] = useState(`Hi — could you share a quick progress update on ${project.acronym}? Thanks.`);
  const [sending, setSending] = useState(false);
  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const send = async (e) => {
    e.preventDefault();
    const recipients = [...selected];
    if (!recipients.length) return;
    setSending(true);
    try {
      await window.DataService.sendNotes({
        senderId: currentUser?.id, recipients, projectId: project.id,
        template: 'progress-request', subject: `Update request: ${project.acronym}`,
        body: message, channel: { inApp: true, email: false },
      });
      toast?.(`Update requested from ${recipients.length} member${recipients.length === 1 ? '' : 's'}`);
      onClose();
    } catch (err) {
      toast?.('Send failed: ' + err.message, 'error');
    }
    setSending(false);
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()} onSubmit={send}>
        <div className="modal-h">
          <div>
            <div className="serif" style={{ fontSize: 18, fontWeight: 600 }}>Request progress update</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>For {project.acronym}</div>
          </div>
          <button type="button" className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-b" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Recipients">
            {team.length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)' }}>No team members yet. Add some first.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {team.map(m => (
                <label key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', background: selected.has(m.id) ? 'var(--maroon-wash)' : 'transparent' }}>
                  <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} style={{ accentColor: 'var(--maroon)' }} />
                  <Avatar user={m} size="sm" />
                  <div style={{ fontSize: 12 }}>
                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 11 }}>{m.role}</div>
                  </div>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Message">
            <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
          </Field>
        </div>
        <div className="modal-f">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={sending || selected.size === 0 || !message.trim()}>
            {sending ? 'Sending…' : `Send to ${selected.size}`}
          </button>
        </div>
      </form>
    </div>
  );
};

// =========================================================================
// ADD / EDIT MILESTONE
// =========================================================================
const MilestoneModal = ({ project, milestone, onClose, toast, onSaved }) => {
  const isEdit = !!milestone;
  const [title, setTitle] = useState(milestone?.title || '');
  const [ownerId, setOwnerId] = useState(milestone?.owner || project.lead || '');
  const [dueDate, setDueDate] = useState(milestone?.due || '');
  const [status, setStatus] = useState(milestone?.status || 'todo');
  const [notes, setNotes] = useState(milestone?.notes || '');
  const [saving, setSaving] = useState(false);

  const teamIds = new Set([project.pi, project.lead, ...(project.members || [])].filter(Boolean));
  const teamPeople = Array.from(teamIds).map(id => personById(id)).filter(Boolean);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await window.DataService.updateMilestone(milestone.id, { title, ownerId, dueDate, status, notes });
        toast?.('Milestone updated');
      } else {
        await window.DataService.createMilestone({ projectId: project.id, title, ownerId, dueDate, status, notes });
        toast?.('Milestone added');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast?.('Failed: ' + err.message, 'error');
    }
    setSaving(false);
  };

  const del = async () => {
    if (!confirm(`Delete milestone "${milestone.title}"?`)) return;
    setSaving(true);
    try {
      await window.DataService.deleteMilestone(milestone.id);
      toast?.('Milestone deleted');
      onSaved?.();
      onClose();
    } catch (err) {
      toast?.('Delete failed: ' + err.message, 'error');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()} onSubmit={save}>
        <div className="modal-h">
          <div>
            <div className="serif" style={{ fontSize: 18, fontWeight: 600 }}>{isEdit ? 'Edit milestone' : 'Add milestone'}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{project.acronym}</div>
          </div>
          <button type="button" className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-b" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Title">
            <input value={title} onChange={e => setTitle(e.target.value)} required autoFocus
                   placeholder="e.g. Data extraction complete" style={{ width: '100%' }} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Owner">
              <select value={ownerId} onChange={e => setOwnerId(e.target.value)} style={{ width: '100%' }}>
                <option value="">— Unassigned —</option>
                {teamPeople.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Due date">
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: '100%' }} />
            </Field>
          </div>
          <Field label="Status">
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%' }}>
              <option value="todo">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
              <option value="overdue">Overdue</option>
            </select>
          </Field>
          <Field label="Notes (optional)">
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
          </Field>
        </div>
        <div className="modal-f" style={{ justifyContent: 'space-between' }}>
          <div>
            {isEdit && (
              <button type="button" className="btn btn-ghost" style={{ color: 'var(--status-red)' }} onClick={del} disabled={saving}>
                <Icon name="trash" size={13} /> Delete
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !title}>
              {saving ? 'Saving…' : (isEdit ? 'Save' : 'Add milestone')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// =========================================================================
// TASK detail/edit
// =========================================================================
const TaskModal = ({ project, task, onClose, toast, onSaved }) => {
  const isEdit = !!task;
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [ownerId, setOwnerId] = useState(task?.owner || project.lead || '');
  const [priority, setPriority] = useState(task?.priority || 'Medium');
  const [status, setStatus] = useState(task?.status || 'todo');
  const [dueDate, setDueDate] = useState(task?.due || '');
  const [saving, setSaving] = useState(false);

  const teamIds = new Set([project.pi, project.lead, ...(project.members || [])].filter(Boolean));
  const teamPeople = Array.from(teamIds).map(id => personById(id)).filter(Boolean);
  const isAdmin = !!(window.AuthService && window.AuthService.isAdmin && window.AuthService.isAdmin());
  const currentUser = window.AuthService?.getCurrentPerson();
  const canDelete = isAdmin || task?.owner === currentUser?.id;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await window.DataService.updateTask(task.id, { title, description, ownerId, priority, status, dueDate });
        toast?.('Task saved');
      } else {
        await window.DataService.createTask({ projectId: project.id, title, description, ownerId, priority, status, dueDate });
        toast?.('Task added');
      }
      onSaved?.();
      onClose();
    } catch (err) { toast?.('Failed: ' + err.message, 'error'); }
    setSaving(false);
  };

  const del = async () => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    setSaving(true);
    try {
      await window.DataService.deleteTask(task.id);
      toast?.('Task deleted');
      onSaved?.();
      onClose();
    } catch (err) { toast?.('Delete failed: ' + err.message, 'error'); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()} onSubmit={save}>
        <div className="modal-h">
          <div>
            <div className="serif" style={{ fontSize: 18, fontWeight: 600 }}>{isEdit ? 'Task details' : 'Add task'}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{project.acronym}</div>
          </div>
          <button type="button" className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-b" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Title">
            <input value={title} onChange={e => setTitle(e.target.value)} required autoFocus style={{ width: '100%' }} />
          </Field>
          <Field label="Description (optional)">
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Owner">
              <select value={ownerId} onChange={e => setOwnerId(e.target.value)} style={{ width: '100%' }}>
                <option value="">— Unassigned —</option>
                {teamPeople.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Due date">
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: '100%' }} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Priority">
              <select value={priority} onChange={e => setPriority(e.target.value)} style={{ width: '100%' }}>
                {['High','Medium','Low'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%' }}>
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="waiting">Waiting</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </Field>
          </div>
        </div>
        <div className="modal-f" style={{ justifyContent: 'space-between' }}>
          <div>
            {isEdit && canDelete && (
              <button type="button" className="btn btn-ghost" style={{ color: 'var(--status-red)' }} onClick={del} disabled={saving}>
                <Icon name="trash" size={13} /> Delete
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !title}>
              {saving ? 'Saving…' : (isEdit ? 'Save' : 'Add task')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

window.TaskModal = TaskModal;
Object.assign(window, {
  EditProjectModal, ChangeStatusModal, AddCommentModal,
  UploadFileModal, GenerateSummaryModal, RequestUpdateModal,
});
