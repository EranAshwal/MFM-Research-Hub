/* MFM Research Hub — Admin + pending-approval + notes inbox pages */

// =========================================================================
// Pending approval screen — shown when a signed-in user is NOT yet approved
// =========================================================================
const PendingApprovalScreen = ({ currentUser, onSignOut }) => (
  <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--paper, #f6f4ef)', padding: 24 }}>
    <div className="card card-pad" style={{ maxWidth: 480, textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--maroon-wash, #f1e3e9)', color: 'var(--maroon, #7A003C)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
        <Icon name="clock" size={28} />
      </div>
      <div className="serif" style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>You're on the waitlist</div>
      <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.5, marginBottom: 18 }}>
        Your account <strong style={{ color: 'var(--ink)' }}>{currentUser?.email}</strong> has been created,
        but the site administrator hasn't approved access yet. You'll get an email once you're in.
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 22 }}>
        For approval please contact <a href="mailto:eran.ashwal@gmail.com" style={{ color: 'var(--maroon)' }}>eran.ashwal@gmail.com</a>.
      </div>
      <button className="btn btn-ghost" onClick={onSignOut}>Sign out</button>
    </div>
  </div>
);

window.PendingApprovalScreen = PendingApprovalScreen;


// =========================================================================
// Users admin page — only the admin sees this. Approve/reject signups,
// promote to admin, remove people.
// =========================================================================
const UsersAdminPage = ({ toast }) => {
  const [, force] = useState(0);
  const refresh = () => force(n => n + 1);
  const [showInvite, setShowInvite] = useState(false);
  const [invites, setInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [currentUser] = useState(window.AuthService?.getCurrentPerson());

  const loadInvites = async () => {
    setLoadingInvites(true);
    try {
      const data = await window.DataService.listInvitations();
      setInvites(data || []);
    } catch (e) { /* table may not exist yet */ }
    setLoadingInvites(false);
  };
  useEffect(() => { loadInvites(); }, []);

  const people = window.PEOPLE.slice().sort((a, b) => {
    // Pending first, then admins, then alphabetical
    const aPending = !a.isApproved && !a.isAdmin;
    const bPending = !b.isApproved && !b.isAdmin;
    if (aPending !== bPending) return aPending ? -1 : 1;
    if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  const pendingCount = people.filter(p => !p.isApproved && !p.isAdmin).length;

  const approve = async (p) => {
    try { await window.DataService.setApproval(p.id, true); toast(`${p.name} approved`); refresh(); }
    catch (e) { toast('Approve failed: ' + e.message, 'error'); }
  };
  const revoke = async (p) => {
    if (!confirm(`Revoke ${p.name}'s access?`)) return;
    try { await window.DataService.setApproval(p.id, false); toast(`${p.name}'s access revoked`); refresh(); }
    catch (e) { toast('Revoke failed: ' + e.message, 'error'); }
  };
  const toggleAdmin = async (p) => {
    const target = !p.isAdmin;
    if (!confirm(target ? `Make ${p.name} an admin? They'll have full edit access.` : `Remove admin rights from ${p.name}?`)) return;
    try { await window.DataService.setAdmin(p.id, target); toast(`${p.name} is ${target ? 'now an admin' : 'no longer an admin'}`); refresh(); }
    catch (e) { toast('Failed: ' + e.message, 'error'); }
  };
  const remove = async (p) => {
    if (!confirm(`Delete ${p.name} permanently? This removes their people row but not their auth account.`)) return;
    try { await window.DataService.deletePerson(p.id); toast(`${p.name} removed`); refresh(); }
    catch (e) { toast('Delete failed: ' + e.message, 'error'); }
  };

  return (
    <div className="page">
      <style>{`
        @media (max-width: 720px) {
          .users-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
          .users-grid-header { display: none !important; }
          .users-row { padding: 14px 16px !important; }
          .users-row-actions { justify-content: flex-start !important; }
          .invites-grid { grid-template-columns: 1fr !important; }
          .invites-header { display: none !important; }
        }
      `}</style>
      <div className="page-header row between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Users & access</h1>
          <p className="page-sub">{pendingCount > 0 ? `${pendingCount} pending approval · ` : ''}{people.length} total · {invites.filter(i => !i.accepted_at && !i.revoked_at).length} open invitations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
          <Icon name="plus" size={14} stroke={2} /> Invite someone
        </button>
      </div>

      {/* Invitations list */}
      {invites.length > 0 && (
        <>
          <h2 style={{ fontFamily: 'var(--ff-serif)', fontSize: 16, fontWeight: 600, margin: '10px 0 10px' }}>Invitations</h2>
          <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 160px 200px', gap: 12, padding: '12px 20px',
                          background: 'var(--bg-elevated)', fontSize: 11, fontWeight: 600, color: 'var(--muted)',
                          textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--hairline)' }}>
              <div>Email / name</div><div>Role</div><div>Status</div><div>Sent</div><div style={{ textAlign: 'right' }}>Actions</div>
            </div>
            {invites.map((inv, i) => {
              const status = inv.revoked_at ? 'revoked'
                : inv.accepted_at ? 'accepted'
                : new Date(inv.expires_at) <= new Date() ? 'expired'
                : 'pending';
              const url = `${location.origin}${location.pathname}?invite=${inv.token}`;
              return (
                <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 160px 200px', gap: 12,
                                            padding: '12px 20px', alignItems: 'center',
                                            borderBottom: i === invites.length - 1 ? 'none' : '1px solid var(--hairline)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.email}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{inv.invited_name || '—'}</div>
                  </div>
                  <div style={{ fontSize: 12 }}>{inv.invited_role}</div>
                  <div>
                    {status === 'pending'  && <span className="chip chip-gold">Pending</span>}
                    {status === 'accepted' && <span className="chip chip-green">Accepted</span>}
                    {status === 'expired'  && <span className="chip chip-grey">Expired</span>}
                    {status === 'revoked'  && <span className="chip chip-grey">Revoked</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {new Date(inv.sent_at).toLocaleDateString()}
                    {inv.accepted_at && <div>accepted {new Date(inv.accepted_at).toLocaleDateString()}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {status === 'pending' && (
                      <>
                        <button className="btn btn-sm" onClick={async () => {
                          try { await navigator.clipboard.writeText(url); toast('Link copied'); }
                          catch { toast('Copy failed', 'error'); }
                        }}><Icon name="copy" size={11} /> Copy link</button>
                        <button className="btn btn-sm btn-ghost" onClick={async () => {
                          if (!confirm('Revoke this invitation?')) return;
                          try { await window.DataService.revokeInvitation(inv.id); loadInvites(); toast('Invitation revoked'); }
                          catch (e) { toast('Failed: ' + e.message, 'error'); }
                        }}>Revoke</button>
                      </>
                    )}
                    {status === 'accepted' && (
                      <button className="btn btn-sm btn-ghost" onClick={() => alert(
                        `Consent record\n\n` +
                        `Email: ${inv.email}\n` +
                        `Name on invite: ${inv.invited_name || '—'}\n` +
                        `Sent: ${new Date(inv.sent_at).toLocaleString()}\n` +
                        `Accepted: ${new Date(inv.accepted_at).toLocaleString()}\n` +
                        `User agent: ${inv.accepted_user_agent || '—'}\n\n` +
                        `Consent text presented:\n${'-'.repeat(40)}\n${inv.consent_text}`
                      )}>View consent</button>
                    )}
                    {(status === 'expired' || status === 'revoked') && (
                      <button className="btn-icon btn-ghost" onClick={async () => {
                        if (!confirm('Delete this invitation row?')) return;
                        try { await window.DataService.deleteInvitation(inv.id); loadInvites(); }
                        catch (e) { toast('Failed: ' + e.message, 'error'); }
                      }} title="Delete"><Icon name="trash" size={12} /></button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <h2 style={{ fontFamily: 'var(--ff-serif)', fontSize: 16, fontWeight: 600, margin: '10px 0 10px' }}>Team members</h2>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="users-grid users-grid-header" style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 100px 220px', gap: 12, padding: '12px 20px',
                      background: 'var(--bg-elevated)', fontSize: 11, fontWeight: 600, color: 'var(--muted)',
                      textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--hairline)' }}>
          <div>Name</div><div>Role</div><div>Status</div><div>Admin</div><div style={{ textAlign: 'right' }}>Actions</div>
        </div>

        {people.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No users yet.</div>
        )}

        {people.map((p, i) => (
          <div key={p.id} className="users-grid users-row" style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 100px 220px', gap: 12,
                                    padding: '14px 20px', alignItems: 'center',
                                    borderBottom: i === people.length - 1 ? 'none' : '1px solid var(--hairline)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Avatar user={p} size="sm" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email || '—'}</div>
              </div>
            </div>
            <div style={{ fontSize: 12 }}>
              <div>{p.role}</div>
              <div style={{ color: 'var(--muted)', fontSize: 11 }}>{p.training}</div>
            </div>
            <div>
              {p.isApproved
                ? <span className="chip chip-green">Approved</span>
                : <span className="chip chip-gold">Pending</span>}
            </div>
            <div>
              {p.isAdmin
                ? <span className="chip chip-maroon">Admin</span>
                : <span style={{ fontSize: 11, color: 'var(--muted)' }}>—</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {!p.isApproved && !p.isAdmin && (
                <button className="btn btn-sm btn-primary" onClick={() => approve(p)}>
                  <Icon name="check" size={12} stroke={2.5} /> Approve
                </button>
              )}
              {p.isApproved && !p.isAdmin && (
                <button className="btn btn-sm btn-ghost" onClick={() => revoke(p)}>Revoke</button>
              )}
              <button className="btn btn-sm btn-ghost" onClick={() => toggleAdmin(p)} title={p.isAdmin ? 'Remove admin' : 'Make admin'}>
                {p.isAdmin ? 'Demote' : 'Make admin'}
              </button>
              <button className="btn-icon btn-ghost" onClick={() => remove(p)} title="Delete">
                <Icon name="trash" size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, padding: 14, background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--ink-2)' }}>How approval works:</strong> when someone signs up with email/password,
        they're created in <code>auth.users</code> but their <code>people</code> row starts un-approved. They land on the
        "waitlist" screen until you click <strong>Approve</strong> here. Approved users can read everything; only admins
        can edit projects, people, and publications.
      </div>

      <InviteComposeModal open={showInvite} onClose={() => setShowInvite(false)} currentUser={currentUser}
                          toast={toast} onCreated={loadInvites} />
    </div>
  );
};

window.UsersAdminPage = UsersAdminPage;


// =========================================================================
// Notes inbox — list of notes received (or sent if admin)
// =========================================================================
const NotesInboxPage = ({ currentUser, navigate, toast }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | unread | sent

  const load = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await window.DataService.listNotesFor(currentUser.id);
      setNotes(data || []);
    } catch (e) { toast('Could not load notes: ' + e.message, 'error'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentUser?.id]);

  const visible = notes.filter(n => {
    if (filter === 'unread') return n.recipient_id === currentUser.id && !n.read_at;
    if (filter === 'sent')   return n.sender_id === currentUser.id;
    return true;
  });

  const markRead = async (n) => {
    if (n.read_at || n.recipient_id !== currentUser.id) return;
    try { await window.DataService.markNoteRead(n.id); load(); }
    catch (e) { /* silent */ }
  };

  const del = async (n) => {
    if (!confirm('Delete this note?')) return;
    try { await window.DataService.deleteNote(n.id); load(); toast('Note deleted'); }
    catch (e) { toast('Delete failed: ' + e.message, 'error'); }
  };

  const unreadCount = notes.filter(n => n.recipient_id === currentUser.id && !n.read_at).length;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Notes</h1>
        <p className="page-sub">{unreadCount > 0 ? `${unreadCount} unread · ` : ''}{notes.length} total</p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['all','unread','sent'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ textTransform: 'capitalize' }}>{f}</button>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>}
        {!loading && visible.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No notes here.</div>
        )}
        {!loading && visible.map((n, i) => {
          const sender = personById(n.sender_id);
          const recipient = personById(n.recipient_id);
          const project = n.project_id ? PROJECTS.find(p => p.id === n.project_id) : null;
          const isInbound = n.recipient_id === currentUser.id;
          const unread = isInbound && !n.read_at;
          return (
            <div key={n.id} onClick={() => markRead(n)}
                 style={{ padding: '16px 20px', cursor: unread ? 'pointer' : 'default',
                          borderBottom: i === visible.length - 1 ? 'none' : '1px solid var(--hairline)',
                          background: unread ? 'var(--maroon-wash)' : 'transparent',
                          display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'flex-start' }}>
              <Avatar user={isInbound ? sender : recipient} size="md" />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 13 }}>
                    {isInbound ? (sender?.name || 'Unknown') : `To ${recipient?.name || 'Unknown'}`}
                  </strong>
                  {project && (
                    <span className="chip chip-grey" style={{ fontSize: 10 }}>
                      {project.acronym}
                    </span>
                  )}
                  {n.template && <span style={{ fontSize: 11, color: 'var(--muted)' }}>· {n.template}</span>}
                  {unread && <span className="chip chip-maroon" style={{ fontSize: 10 }}>New</span>}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.55, marginTop: 6, whiteSpace: 'pre-wrap', color: 'var(--ink-2)' }}>
                  {n.body}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                  {new Date(n.sent_at).toLocaleString()}
                  {n.channel_email && <span> · also emailed</span>}
                </div>
              </div>
              <button className="btn-icon btn-ghost" onClick={(e) => { e.stopPropagation(); del(n); }} title="Delete">
                <Icon name="trash" size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

window.NotesInboxPage = NotesInboxPage;


// =========================================================================
// Invitations — admin sends, recipient accepts via shareable link.
// Consent text + acceptance timestamp + user-agent are recorded permanently.
// =========================================================================

const InviteComposeModal = ({ open, onClose, currentUser, toast, onCreated }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Collaborator');
  const [training, setTraining] = useState('');
  const [message, setMessage] = useState('');
  const [consentText, setConsentText] = useState(() => window.DataService?.DEFAULT_CONSENT_TEXT || '');
  const [sending, setSending] = useState(false);
  const [created, setCreated] = useState(null);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const inv = await window.DataService.createInvitation({
        email, invitedName: name, invitedRole: role, invitedTraining: training,
        message, consentText, senderId: currentUser?.id,
      });
      setCreated(inv);
      toast('Invitation created');
      onCreated?.();
    } catch (err) {
      toast('Failed: ' + err.message, 'error');
    }
    setSending(false);
  };

  const inviteUrl = created ? `${location.origin}${location.pathname}?invite=${created.token}` : '';
  const copy = async () => {
    try { await navigator.clipboard.writeText(inviteUrl); toast('Link copied'); }
    catch { toast('Copy failed — select & copy manually', 'error'); }
  };
  const emailDraft = created ? `mailto:${created.email}?subject=${encodeURIComponent('Invitation to join the MFM Research Hub')}&body=${encodeURIComponent(
`Hi ${created.invited_name || ''},

You're invited to join the MFM Research Hub. Please use the link below to set up your account:

${inviteUrl}

${created.message ? '\n' + created.message + '\n' : ''}
This invitation expires in 30 days.

Best,
Dr. Eran Ashwal`
  )}` : '#';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-h">
          <div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>{created ? 'Invitation ready' : 'Invite someone to the Hub'}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {created ? 'Send this link to the recipient. They\'ll review the consent text before joining.'
                       : 'Creates a one-time link. The recipient will see the consent text below and must accept before getting in.'}
            </div>
          </div>
          <button type="button" className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>

        {!created ? (
          <>
            <div className="modal-b" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Email <span style={{ color: 'var(--status-red)' }}>*</span></div>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="person@example.com" style={{ width: '100%' }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Name</div>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="First Last" style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Role</div>
                  <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%' }}>
                    {['Collaborator','Resident','MFM Fellow','Medical Student','Research Coordinator','Volunteer','Co-investigator'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Training / level</div>
                  <input value={training} onChange={e => setTraining(e.target.value)} placeholder="e.g. PGY-3" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Personal note (optional)</div>
                <textarea rows={2} value={message} onChange={e => setMessage(e.target.value)} placeholder="A short greeting…" style={{ width: '100%', resize: 'vertical' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Consent text the recipient will see <span style={{ color: 'var(--status-red)' }}>*</span></span>
                  <button type="button" className="btn-ghost" style={{ fontSize: 11, color: 'var(--maroon)' }}
                          onClick={() => setConsentText(window.DataService.DEFAULT_CONSENT_TEXT)}>Reset to default</button>
                </div>
                <textarea rows={8} value={consentText} onChange={e => setConsentText(e.target.value)} required
                          style={{ width: '100%', fontSize: 12, lineHeight: 1.55, fontFamily: 'var(--ff-sans)', resize: 'vertical' }} />
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                  This exact text is snapshotted onto the invitation row. When the recipient accepts, the snapshot + their
                  timestamp + browser info become the permanent consent record.
                </div>
              </div>
            </div>
            <div className="modal-f">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={sending || !email || !consentText.trim()}>
                {sending ? 'Creating…' : <><Icon name="check" size={14} stroke={2.5} /> Create invitation</>}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-b" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 14, background: 'var(--maroon-wash)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--maroon)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>Invitation link</div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, wordBreak: 'break-all', userSelect: 'all', padding: 10, background: 'var(--paper)', borderRadius: 6, border: '1px solid var(--hairline)' }}>
                  {inviteUrl}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button type="button" className="btn btn-sm" onClick={copy}>
                    <Icon name="copy" size={12} /> Copy link
                  </button>
                  <a className="btn btn-sm btn-primary" href={emailDraft}>
                    <Icon name="mail" size={12} /> Open in email
                  </a>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                The recipient must sign up using <strong style={{ color: 'var(--ink)' }}>{created.email}</strong> — the
                invitation will only accept that email. Link expires in 30 days. You can revoke at any time from the Users page.
              </div>
            </div>
            <div className="modal-f">
              <button type="button" className="btn btn-primary" onClick={onClose}>Done</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

window.InviteComposeModal = InviteComposeModal;


// =========================================================================
// Accept-invite screen — shown when URL has ?invite=TOKEN
// Handles: load invitation → show consent → user signs up → accept
// =========================================================================

const AcceptInviteScreen = ({ token, onAccepted }) => {
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('signup'); // signup | signin
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState('review'); // review | password | done

  useEffect(() => {
    (async () => {
      try {
        const inv = await window.DataService.getInvitationByToken(token);
        if (!inv) { setError('This invitation link is invalid or has been deleted.'); }
        else if (inv.revoked_at) { setError('This invitation has been revoked by the administrator.'); }
        else if (new Date(inv.expires_at) <= new Date()) { setError('This invitation has expired.'); }
        else if (inv.accepted_at) { setError('This invitation has already been accepted. Please sign in normally.'); }
        else { setInvite(inv); }
      } catch (err) { setError(err.message); }
      setLoading(false);
    })();
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (!agreed) return;
    setBusy(true);
    try {
      // Sign up or sign in with the invitation email
      if (mode === 'signup') {
        const { error } = await window.__sb.auth.signUp({ email: invite.email, password });
        if (error && !error.message.includes('already')) throw error;
        if (error && error.message.includes('already')) {
          // Fall back to sign-in
          const { error: e2 } = await window.__sb.auth.signInWithPassword({ email: invite.email, password });
          if (e2) throw new Error('Account exists. Wrong password?');
        }
      } else {
        const { error } = await window.__sb.auth.signInWithPassword({ email: invite.email, password });
        if (error) throw error;
      }
      // Accept the invitation
      await window.DataService.acceptInvitation(token);
      // Refresh auth person
      if (window.AuthService) await window.AuthService._loadPerson();
      setStep('done');
      setTimeout(() => {
        // Remove the ?invite= from URL, then full-reload to enter the app cleanly
        const url = new URL(location.href);
        url.searchParams.delete('invite');
        history.replaceState({}, '', url.toString());
        location.reload();
      }, 1500);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading invitation…</div>;
  if (error && !invite) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="card card-pad" style={{ maxWidth: 460, textAlign: 'center' }}>
        <div className="serif" style={{ fontSize: 22, fontWeight: 600, marginBottom: 10 }}>Can't use this invitation</div>
        <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 18 }}>{error}</div>
        <button className="btn btn-primary" onClick={() => { location.href = location.pathname; }}>Go to home page</button>
      </div>
    </div>
  );

  if (step === 'done') return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div className="card card-pad" style={{ maxWidth: 420, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--status-green-wash)', color: 'var(--status-green)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
          <Icon name="check" size={28} stroke={3} />
        </div>
        <div className="serif" style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Welcome aboard</div>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>Taking you to the dashboard…</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', padding: 32, display: 'grid', placeItems: 'center' }}>
      <div className="card" style={{ maxWidth: 640, width: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '24px 28px', background: 'var(--maroon)', color: '#F8EEE2' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, opacity: 0.7 }}>Invitation</div>
          <div className="serif" style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>Join the MFM Research Hub</div>
          <div style={{ fontSize: 13, marginTop: 6, opacity: 0.85 }}>
            Invited as <strong>{invite.invited_name || invite.email}</strong> · {invite.invited_role}
          </div>
        </div>

        <div style={{ padding: 28 }}>
          {invite.message && (
            <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 13, lineHeight: 1.55, marginBottom: 20, fontStyle: 'italic' }}>
              "{invite.message}"
            </div>
          )}

          {step === 'review' && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 10 }}>Consent</div>
              <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--hairline)',
                            maxHeight: 320, overflow: 'auto', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {invite.consent_text}
              </div>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 18, cursor: 'pointer', fontSize: 13, lineHeight: 1.5 }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                       style={{ marginTop: 3, accentColor: 'var(--maroon)' }} />
                <span>I have read the above and I consent. I understand my acceptance will be recorded with a timestamp as a permanent audit record.</span>
              </label>
              <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" disabled={!agreed} onClick={() => setStep('password')}>
                  I agree — continue
                </button>
              </div>
            </>
          )}

          {step === 'password' && (
            <form onSubmit={submit}>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 10 }}>
                {mode === 'signup' ? 'Create your account' : 'Sign in to your existing account'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>
                {mode === 'signup'
                  ? <>You don't have an account yet. <strong style={{ color: 'var(--ink)' }}>Choose a password</strong> for <code>{invite.email}</code> — you'll use it to sign in later.</>
                  : <>If you already have an account with <code>{invite.email}</code>, enter your password.</>
                }
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Email</div>
                  <input type="email" value={invite.email} disabled style={{ width: '100%' }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{mode === 'signup' ? 'Choose a password (min 6 characters)' : 'Your password'}</div>
                  <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                         autoFocus style={{ width: '100%' }} />
                </div>
              </div>
              {error && <div style={{ color: 'var(--status-red)', fontSize: 12, marginTop: 12 }}>{error}</div>}
              <div style={{ marginTop: 18 }}>
                <button type="submit" className="btn btn-primary" disabled={busy || !password} style={{ width: '100%', justifyContent: 'center', padding: '12px 18px' }}>
                  {busy ? 'Working…' : (mode === 'signup' ? 'Create account & enter' : 'Sign in & enter')}
                </button>
                <button type="button" className="btn-ghost" style={{ fontSize: 12, color: 'var(--maroon)', marginTop: 10, width: '100%', textAlign: 'center', display: 'block' }}
                        onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(null); }}>
                  {mode === 'signup' ? 'I already have an account — sign in instead' : 'I need to create a new account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

window.AcceptInviteScreen = AcceptInviteScreen;
