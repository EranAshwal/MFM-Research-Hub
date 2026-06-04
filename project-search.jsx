/* MFM Research Hub — quick project search (spotlight-style finder)
   Opens from the top bar Search button or ⌘K / Ctrl+K. Type a name, acronym,
   or keyword; arrow keys to move, Enter to open, Esc to close.
*/

const Kbd = ({ children }) => (
  <span style={{ display: 'inline-grid', placeItems: 'center', minWidth: 18, height: 18, padding: '0 5px',
                 borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                 fontSize: 10, fontWeight: 600, color: 'var(--ink-2)', fontFamily: 'var(--ff-mono, monospace)' }}>{children}</span>
);

const ProjectSearchModal = ({ open, onClose, navigate, currentUser }) => {
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef(null);

  // Respect the same visibility rule as the projects registry.
  const isAdmin = !!(window.AuthService && window.AuthService.isAdmin && window.AuthService.isAdmin());
  const pool = isAdmin ? PROJECTS : PROJECTS.filter(p =>
    p.pi === currentUser?.id || p.lead === currentUser?.id || (p.members || []).includes(currentUser?.id)
  );

  const results = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    const matches = !s ? pool : pool.filter(p => {
      const lead = personById(p.lead);
      return (
        (p.title || '').toLowerCase().includes(s) ||
        (p.acronym || '').toLowerCase().includes(s) ||
        (p.description || '').toLowerCase().includes(s) ||
        (p.category || '').toLowerCase().includes(s) ||
        (lead?.name || '').toLowerCase().includes(s)
      );
    });
    return matches.slice(0, 8);
  }, [q, pool]);

  // Reset + focus each time it opens
  React.useEffect(() => {
    if (open) {
      setQ(''); setActive(0);
      const id = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [open]);

  React.useEffect(() => { setActive(0); }, [q]);

  if (!open) return null;

  const choose = (p) => {
    if (!p) return;
    onClose();
    navigate({ page: 'projects', id: p.id });
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '12vh' }}>
      <div className="modal" style={{ maxWidth: 560, width: '100%' }} onClick={e => e.stopPropagation()}>
        {/* Search field */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <Icon name="search" size={18} color="var(--muted)" />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKeyDown}
                 placeholder="Search projects by name, acronym, or keyword…"
                 style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 16, color: 'var(--ink)', padding: 0 }} />
          <button type="button" className="btn-icon btn-ghost" onClick={onClose} title="Close"><Icon name="close" size={16} /></button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '52vh', overflow: 'auto', padding: 8 }}>
          {results.length === 0 ? (
            <div style={{ padding: '38px 20px', textAlign: 'center', color: 'var(--muted)' }}>
              <Icon name="search" size={22} />
              <div style={{ marginTop: 10, fontSize: 14 }}>No projects match “{q}”.</div>
            </div>
          ) : results.map((p, i) => {
            const lead = personById(p.lead);
            const on = i === active;
            return (
              <button key={p.id} type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(p)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                               padding: '10px 12px', borderRadius: 9, border: 'none',
                               background: on ? 'var(--maroon-wash)' : 'transparent' }}>
                <span style={{ flexShrink: 0, width: 46, height: 30, borderRadius: 7, display: 'grid', placeItems: 'center',
                               background: p.coverColor || 'var(--maroon)', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '.02em' }}>
                  {p.acronym}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--ink)',
                                 whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginTop: 1,
                                 whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.category}{lead ? ` · ${lead.name}` : ''}
                  </span>
                </span>
                {typeof StatusChip === 'function' && <span className="desktop-only"><StatusChip status={p.status} /></span>}
                <Icon name="chevronRight" size={15} color="var(--muted)" />
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', borderTop: '1px solid var(--border)',
                      fontSize: 11, color: 'var(--muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Kbd>↵</Kbd> open</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Kbd>esc</Kbd> close</span>
          <span style={{ marginLeft: 'auto' }}>{results.length} result{results.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ProjectSearchModal });
