/* MFM Research Hub — shell: sidebar, topbar, notifications, common widgets */

const { useState, useEffect, useRef, useMemo } = React;

const Avatar = ({ user, size = 'md' }) => {
  if (!user) return null;
  return (
    <span className={`avatar ${size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : size === 'xl' ? 'xl' : ''}`}
          style={{ background: user.color }}
          title={user.name}>
      {user.initials}
    </span>
  );
};

const AvatarStack = ({ users, max = 3, size = 'sm' }) => {
  const visible = users.slice(0, max);
  const extra = users.length - visible.length;
  return (
    <span className="avatar-stack">
      {visible.map(u => <Avatar key={u.id} user={u} size={size} />)}
      {extra > 0 && (
        <span className={`avatar ${size === 'sm' ? 'sm' : ''}`} style={{ background: 'var(--grey)' }}>+{extra}</span>
      )}
    </span>
  );
};

const Sidebar = ({ route, navigate, collapsed, currentUser, awaitingReview, awaitingUpdate, mobileOpen, onCloseMobile, onSignOut }) => {
  const inboxCount = PROJECTS.filter(p => p.awaitingReview).length + (window.UPDATES ? UPDATES.filter(u => u.piStatus === 'pending').length : 0);
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'inbox', label: 'Inbox', icon: 'message', badge: inboxCount },
    { id: 'projects', label: 'Projects', icon: 'projects', badge: PROJECTS.length },
    { id: 'tasks', label: 'My Tasks', icon: 'tasks' },
    { id: 'updates', label: 'Trainee Updates', icon: 'updates', badge: awaitingReview },
    { id: 'reports', label: 'Reports', icon: 'reports' },
    { id: 'publications', label: 'Publications', icon: 'publication' },
    { id: 'deadlines', label: 'Deadlines', icon: 'calendar' },
    { id: 'files', label: 'Files', icon: 'files' },
    { id: 'people', label: 'People', icon: 'people' },
  ];
  const lower = [
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">M</div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div className="sidebar-brand-name">MFM Research Hub</div>
            <div className="sidebar-brand-sub">Maternal-Fetal Medicine</div>
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 6 }}>
        {!collapsed && <div className="sidebar-section">Workspace</div>}
        {items.map(item => (
          <button key={item.id}
                  className={`nav-item ${route.page === item.id ? 'active' : ''}`}
                  onClick={() => { navigate({ page: item.id }); onCloseMobile?.(); }}
                  title={item.label}>
            <Icon name={item.icon} size={18} stroke={1.7} />
            <span className="nav-label">{item.label}</span>
            {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
          </button>
        ))}
        {!collapsed && <div className="sidebar-section">System</div>}
        {lower.map(item => (
          <button key={item.id}
                  className={`nav-item ${route.page === item.id ? 'active' : ''}`}
                  onClick={() => { navigate({ page: item.id }); onCloseMobile?.(); }}
                  title={item.label}>
            <Icon name={item.icon} size={18} stroke={1.7} />
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
      {!collapsed && (
        <div style={{ padding: 12, borderTop: '1px solid var(--sidebar-border)' }}>
          <div style={{ padding: '8px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar user={currentUser} size="md" />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</div>
              <div style={{ fontSize: 11, color: 'var(--sidebar-muted)' }}>{currentUser.role}</div>
            </div>
            <button className="btn-icon" style={{ color: 'var(--sidebar-muted)' }} title="Sign out"
                    onClick={onSignOut}>
              <Icon name="logOut" size={15} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

const Topbar = ({ collapsed, setCollapsed, search, setSearch, currentUser, setShowNotif, unreadCount, navigate, route, openMobile, onSendNotification }) => {
  const crumbs = useMemo(() => {
    const map = { dashboard: 'Dashboard', inbox: 'Inbox', projects: 'Projects', tasks: 'My Tasks', updates: 'Trainee Updates',
                  reports: 'Reports', publications: 'Publications', deadlines: 'Deadlines', calendar: 'Calendar', files: 'Files', people: 'People', settings: 'Settings' };
    return map[route.page] || '';
  }, [route]);
  return (
    <div className="topbar">
      <button className="btn-icon btn-ghost desktop-only" onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar">
        <Icon name="menu" size={18} />
      </button>
      <button className="btn-icon btn-ghost mobile-only" onClick={openMobile} title="Open menu">
        <Icon name="menu" size={18} />
      </button>
      <div className="crumbs-text" style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 14, color: 'var(--muted)' }}>Workspace</span>
        <Icon name="chevronRight" size={12} stroke={2} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>{crumbs}</span>
      </div>
      <div className="search">
        <span className="search-icon"><Icon name="search" size={15} /></span>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
               placeholder="Search…" />
      </div>
      <button className="btn btn-sm new-project-btn">
        <Icon name="plus" size={14} stroke={2} />
        <span>New project</span>
      </button>
      <button className="btn-icon btn-ghost" onClick={onSendNotification} title="Notify trainees">
        <Icon name="updates" size={18} />
      </button>
      <button className="btn-icon btn-ghost" onClick={() => setShowNotif(s => !s)} style={{ position: 'relative' }} title="Inbox">
        <Icon name="bell" size={18} />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: 4, right: 4, background: 'var(--maroon)', color: '#fff',
                         fontSize: 9, fontWeight: 700, borderRadius: 999, minWidth: 16, height: 16, padding: '0 5px',
                         display: 'grid', placeItems: 'center', border: '2px solid var(--paper)' }}>
            {unreadCount}
          </span>
        )}
      </button>
      <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 8 }}
              onClick={() => navigate({ page: 'people', id: currentUser.id })}>
        <Avatar user={currentUser} size="md" />
      </button>
    </div>
  );
};

const NotificationDrawer = ({ open, onClose, notifications, navigate, markRead }) => {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,18,24,0.2)', zIndex: 60 }} />
      <div className="card" style={{ position: 'fixed', top: 64, right: 16, width: 380, zIndex: 70, maxHeight: '70vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="row between" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Notifications</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{notifications.filter(n => n.unread).length} unread</div>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={markRead}>Mark all read</button>
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>
          {notifications.map(n => {
            const project = PROJECTS.find(p => p.id === n.project);
            const iconMap = { overdue: 'alert', review: 'eye', update: 'updates', deadline: 'clock', file: 'paperclip' };
            const colorMap = { overdue: 'var(--status-red)', review: 'var(--maroon)', update: 'var(--bayfront)', deadline: 'var(--status-amber)', file: 'var(--muted)' };
            return (
              <button key={n.id}
                      onClick={() => { onClose(); navigate({ page: 'projects', id: n.project }); }}
                      style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--hairline)',
                               display: 'flex', gap: 12, alignItems: 'flex-start', background: n.unread ? 'var(--maroon-wash)' : 'transparent' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-elevated)', display: 'grid', placeItems: 'center', color: colorMap[n.type], flexShrink: 0 }}>
                  <Icon name={iconMap[n.type] || 'bell'} size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{n.text}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{project?.acronym} · {relDate(n.date)}</div>
                </div>
                {n.unread && <span style={{ width: 8, height: 8, background: 'var(--maroon)', borderRadius: 999, marginTop: 6 }} />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

const HealthDot = ({ health, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    <span className={`health-dot health-${health}`} />
    {label && <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{healthLabel(health)}</span>}
  </span>
);

const StatusChip = ({ status }) => (
  <span className={`chip ${statusChipClass(status)}`}>
    <span className="chip-dot" />
    {status}
  </span>
);

const Toast = ({ toasts }) => (
  <div className="toast-wrap">
    {toasts.map(t => (
      <div key={t.id} className="toast">
        <Icon name={t.type === 'success' ? 'check' : 'message'} size={16} />
        {t.text}
      </div>
    ))}
  </div>
);

const ProgressBar = ({ value, color = 'maroon' }) => (
  <div className="bar" title={`${value}%`}>
    <div className={`bar-fill ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

const MobileBottomNav = ({ route, navigate, onSendNotification }) => {
  const items = [
    { id: 'dashboard', icon: 'home', label: 'Home' },
    { id: 'projects', icon: 'projects', label: 'Projects' },
    { id: 'updates', icon: 'updates', label: 'Updates' },
    { id: 'send', icon: 'message', label: 'Notify', action: onSendNotification },
    { id: 'people', icon: 'people', label: 'People' },
  ];
  return (
    <nav className="mobile-bottom-nav">
      {items.map(it => (
        <button key={it.id}
                className={route.page === it.id ? 'active' : ''}
                onClick={() => it.action ? it.action() : navigate({ page: it.id })}>
          <Icon name={it.icon} size={20} />
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
};

const SendNotificationModal = ({ open, onClose, onSend, currentUser }) => {
  if (!open) return null;
  const trainees = PEOPLE.filter(p => ['Resident', 'MFM Fellow', 'Medical Student', 'Research Coordinator', 'Volunteer'].includes(p.role));
  const [selected, setSelected] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [template, setTemplate] = useState('update');
  const [channel, setChannel] = useState({ inApp: true, email: true });
  const [customMessage, setCustomMessage] = useState('');

  const templates = {
    update: { label: 'Time for a progress update', body: 'Hi! It\'s been a little while since your last update — when you get a chance, please submit a quick progress update so we can stay aligned. Even a few sentences is helpful.' },
    deadline: { label: 'Friendly deadline reminder', body: 'Just a heads-up: an upcoming milestone is approaching. Let me know if you need anything to stay on track or want to revisit the timeline.' },
    checkin: { label: 'Quick check-in', body: 'Do you have 15 minutes this week to meet briefly? I\'d like to hear how the project is going and what blockers you\'re running into.' },
    praise: { label: 'Recognition / thank-you', body: 'Just wanted to flag — really nice work on the last update. Thanks for the careful detail; let\'s keep this momentum going.' },
    custom: { label: 'Custom message', body: '' },
  };

  const projectsForSelected = selected.length === 1
    ? PROJECTS.filter(p => p.lead === selected[0] || p.members.includes(selected[0]))
    : PROJECTS;

  const toggleSelected = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selectAll = () => setSelected(trainees.map(t => t.id));
  const clearAll = () => setSelected([]);

  const message = template === 'custom' ? customMessage : templates[template].body;
  const project = PROJECTS.find(p => p.id === projectId);

  const send = (e) => {
    e?.preventDefault?.();
    if (!selected.length) return;
    onSend({ recipients: selected, projectId, template, message, channel });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" style={{ maxWidth: 920 }} onClick={e => e.stopPropagation()} onSubmit={send}>
        <div className="modal-h">
          <div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>Send a notification</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Nudge trainees about updates, deadlines, or just to check in.</div>
          </div>
          <button type="button" className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', flex: 1, overflow: 'hidden' }}>
          {/* Recipients */}
          <div style={{ borderRight: '1px solid var(--border)', padding: 16, overflow: 'auto', background: 'var(--bg-elevated)' }}>
            <div className="row between" style={{ marginBottom: 10 }}>
              <div className="eyebrow">Recipients ({selected.length})</div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="button" className="btn-ghost" style={{ fontSize: 10, color: 'var(--maroon)', fontWeight: 600 }} onClick={selectAll}>All</button>
                {selected.length > 0 && <button type="button" className="btn-ghost" style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }} onClick={clearAll}>Clear</button>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {trainees.map(t => {
                const on = selected.includes(t.id);
                return (
                  <button key={t.id} type="button" onClick={() => toggleSelected(t.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 8, borderRadius: 7,
                                   background: on ? 'var(--maroon-wash)' : 'transparent',
                                   border: '1px solid', borderColor: on ? 'var(--maroon)' : 'transparent',
                                   textAlign: 'left' }}>
                    <Avatar user={t} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: on ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{t.training}</div>
                    </div>
                    {on && <Icon name="check" size={13} color="var(--maroon)" stroke={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compose */}
          <div style={{ padding: 20, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Project context (optional)</div>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} style={{ width: '100%' }}>
                <option value="">— No specific project —</option>
                {projectsForSelected.map(p => <option key={p.id} value={p.id}>{p.acronym} · {p.title}</option>)}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Template</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                {Object.entries(templates).map(([key, t]) => (
                  <button key={key} type="button" onClick={() => setTemplate(key)}
                          style={{ padding: '10px 12px', textAlign: 'left', borderRadius: 8, border: '1px solid',
                                   borderColor: template === key ? 'var(--maroon)' : 'var(--border)',
                                   background: template === key ? 'var(--maroon-wash)' : 'var(--paper)',
                                   fontSize: 12, fontWeight: template === key ? 600 : 500,
                                   color: template === key ? 'var(--maroon)' : 'var(--ink-2)' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Message</div>
              <textarea rows={5}
                        value={template === 'custom' ? customMessage : templates[template].body}
                        onChange={e => { if (template === 'custom') setCustomMessage(e.target.value); else { setTemplate('custom'); setCustomMessage(e.target.value); } }}
                        placeholder="Write your message…"
                        style={{ width: '100%', fontSize: 13, lineHeight: 1.5, resize: 'vertical', fontFamily: 'var(--ff-sans)' }} />
              {project && (
                <div style={{ marginTop: 8, padding: 10, background: 'var(--bg-elevated)', borderRadius: 6, fontSize: 11, color: 'var(--muted)' }}>
                  <Icon name="paperclip" size={11} /> A link to <strong style={{ color: 'var(--ink-2)' }}>{project.acronym}</strong> will be included.
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Delivery</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={channel.inApp} onChange={e => setChannel({ ...channel, inApp: e.target.checked })} style={{ accentColor: 'var(--maroon)' }} />
                  In-app notification
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={channel.email} onChange={e => setChannel({ ...channel, email: e.target.checked })} style={{ accentColor: 'var(--maroon)' }} />
                  Email
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-f">
          <div style={{ fontSize: 11, color: 'var(--muted)', flex: 1 }}>
            {selected.length === 0 ? 'Select at least one recipient.' : `Will send to ${selected.length} trainee${selected.length === 1 ? '' : 's'}.`}
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!selected.length || (!channel.inApp && !channel.email) || !message.trim()}>
            <Icon name="updates" size={14} /> Send notification
          </button>
        </div>
      </form>
    </div>
  );
};

Object.assign(window, { Avatar, AvatarStack, Sidebar, Topbar, NotificationDrawer, HealthDot, StatusChip, Toast, ProgressBar, MobileBottomNav, SendNotificationModal });
