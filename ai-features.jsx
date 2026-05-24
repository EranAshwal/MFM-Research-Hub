/* MFM Research Hub — AI features using window.claude.complete */

const AISummary = ({ update, project }) => {
  const [state, setState] = useState('idle'); // idle | loading | ready | error
  const [summary, setSummary] = useState('');

  const generate = async () => {
    setState('loading');
    try {
      const prompt = `You are summarizing a research trainee's weekly progress update for a busy clinician-scientist PI. Output exactly TWO sentences. First sentence: what's the headline (key progress or biggest blocker). Second sentence: what the PI should do next, if anything. Plain language, no fluff, no greeting.

Project: ${project.acronym} — ${project.title}
Current phase: ${project.status}

What was completed:
${update.completed}

What's in progress:
${update.inProgress}

Barriers/delays:
${update.barriers}

Help needed:
${update.helpNeeded}

Planned next:
${update.next}`;
      const out = await window.claude.complete(prompt);
      setSummary(out.trim());
      setState('ready');
    } catch (e) {
      setSummary('Could not generate summary. ' + (e?.message || ''));
      setState('error');
    }
  };

  if (state === 'idle') {
    return (
      <button className="btn btn-sm" onClick={generate} style={{ background: 'var(--gold-wash)', borderColor: 'var(--gold-deep)', color: '#5C4108' }}>
        <Icon name="sparkle" size={12} /> Summarize for me
      </button>
    );
  }
  return (
    <div style={{ padding: 12, background: 'var(--gold-wash)', border: '1px solid var(--gold-deep)', borderRadius: 8, fontSize: 13, lineHeight: 1.55, color: '#5C4108', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        <Icon name="sparkle" size={11} /> AI summary
      </div>
      {state === 'loading' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="skel" style={{ width: 14, height: 14, borderRadius: '50%' }} /> Reading the update…
        </div>
      ) : (
        <div>{summary}</div>
      )}
      {state === 'ready' && (
        <button onClick={generate} title="Regenerate" style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, color: '#8C6517', fontWeight: 500 }}>
          ↻ Regenerate
        </button>
      )}
    </div>
  );
};

const AIReplyModal = ({ open, update, project, onClose, onSend }) => {
  if (!open) return null;
  const [tone, setTone] = useState('warm');
  const [intent, setIntent] = useState('acknowledge');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const user = personById(update.user);

  const toneOptions = [
    { id: 'warm', label: 'Warm & encouraging' },
    { id: 'direct', label: 'Direct & clinical' },
    { id: 'coaching', label: 'Coaching / Socratic' },
  ];
  const intentOptions = [
    { id: 'acknowledge', label: 'Acknowledge + thank' },
    { id: 'clarify', label: 'Ask clarifying questions' },
    { id: 'unblock', label: 'Help unblock' },
    { id: 'redirect', label: 'Suggest a different angle' },
    { id: 'approve', label: 'Approve & set next step' },
  ];

  const generate = async () => {
    setLoading(true);
    try {
      const intentMap = {
        acknowledge: 'briefly acknowledge what was completed and thank the trainee for the update; reinforce one specific thing that was done well',
        clarify: 'ask 1–2 targeted clarifying questions about the methodology, data or interpretation; be specific',
        unblock: 'offer concrete suggestions to address the barriers they reported; propose a path forward',
        redirect: 'gently suggest an alternative approach or consideration they may not have thought of',
        approve: 'give explicit PI approval to continue, and propose the next 1–2 milestones to target',
      };
      const toneMap = {
        warm: 'warm, encouraging, supportive — like a thoughtful senior mentor',
        direct: 'direct, professional, clinical — efficient and to the point',
        coaching: 'coaching style — answer with questions that guide the trainee to think it through themselves',
      };
      const prompt = `You are Dr. Eran Ashwal, a Maternal-Fetal Medicine PI replying to a progress update from a trainee. Write a SHORT reply (3–5 sentences, no greeting line, no sign-off). Tone: ${toneMap[tone]}. Goal: ${intentMap[intent]}.

Trainee: ${user?.name} (${user?.training})
Project: ${project.acronym} — ${project.title}
Phase: ${project.status}

Their update:
- Completed: ${update.completed}
- In progress: ${update.inProgress}
- Barriers: ${update.barriers}
- Help needed: ${update.helpNeeded}
- Plan: ${update.next}

Write only the reply text. No quotes around it.`;
      const out = await window.claude.complete(prompt);
      setDraft(out.trim());
    } catch (e) {
      setDraft('Could not generate a draft. ' + (e?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}
            onSubmit={e => { e.preventDefault(); onSend(draft); }}>
        <div className="modal-h">
          <div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>Suggest a reply</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              Drafting reply to <strong style={{ color: 'var(--ink)' }}>{user?.name}</strong> on {project.acronym}
            </div>
          </div>
          <button type="button" className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-b">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Tone</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {toneOptions.map(o => (
                  <button key={o.id} type="button" onClick={() => setTone(o.id)}
                          style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 7, border: '1px solid',
                                   borderColor: tone === o.id ? 'var(--maroon)' : 'var(--border)',
                                   background: tone === o.id ? 'var(--maroon-wash)' : 'var(--paper)',
                                   fontSize: 12, fontWeight: tone === o.id ? 600 : 500,
                                   color: tone === o.id ? 'var(--maroon)' : 'var(--ink-2)' }}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Intent</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {intentOptions.map(o => (
                  <button key={o.id} type="button" onClick={() => setIntent(o.id)}
                          style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 7, border: '1px solid',
                                   borderColor: intent === o.id ? 'var(--maroon)' : 'var(--border)',
                                   background: intent === o.id ? 'var(--maroon-wash)' : 'var(--paper)',
                                   fontSize: 12, fontWeight: intent === o.id ? 600 : 500,
                                   color: intent === o.id ? 'var(--maroon)' : 'var(--ink-2)' }}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="row between" style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Draft reply</div>
              <button type="button" className="btn btn-sm" onClick={generate} disabled={loading}
                      style={{ background: 'var(--gold-wash)', borderColor: 'var(--gold-deep)', color: '#5C4108' }}>
                {loading ? <><span className="skel" style={{ width: 12, height: 12, borderRadius: '50%' }} /> Drafting…</> : <><Icon name="sparkle" size={12} /> {draft ? 'Re-draft' : 'Generate draft'}</>}
              </button>
            </div>
            <textarea rows={8} value={draft} onChange={e => setDraft(e.target.value)}
                      placeholder="Click 'Generate draft' to have Claude draft a reply based on your selected tone and intent. You can edit before sending."
                      style={{ width: '100%', fontFamily: 'var(--ff-sans)', fontSize: 13, lineHeight: 1.55, resize: 'vertical' }} />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="alert" size={11} /> AI drafts are starting points — always read before sending. The trainee will see your edited version.
            </div>
          </div>
        </div>
        <div className="modal-f">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
            <Icon name="message" size={14} /> Send reply
          </button>
        </div>
      </form>
    </div>
  );
};

Object.assign(window, { AISummary, AIReplyModal });
