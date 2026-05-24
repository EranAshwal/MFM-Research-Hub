/* MFM Research Hub — Publications page (PubMed sync + manual add) */

const PublicationsPage = ({ toast }) => {
  const [pubs, setPubs] = useState(PUBLICATIONS);
  const [search, setSearch] = useState('');
  const [yearF, setYearF] = useState('');
  const [typeF, setTypeF] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('2 hours ago');
  const [pubmedAuthor, setPubmedAuthor] = useState('Ashwal E');

  const filtered = pubs.filter(p => {
    if (yearF && String(p.year) !== yearF) return false;
    if (typeF && p.type !== typeF) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!p.title.toLowerCase().includes(s) && !p.authors.toLowerCase().includes(s) && !p.journal.toLowerCase().includes(s)) return false;
    }
    return true;
  }).sort((a, b) => (b.year * 100) - (a.year * 100));

  const years = [...new Set(pubs.map(p => p.year))].sort((a, b) => b - a);
  const types = [...new Set(pubs.map(p => p.type))];

  const syncPubmed = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSync('just now');
      toast('PubMed sync complete · No new publications since last check');
    }, 1800);
  };

  const addPub = (p) => {
    setPubs([{ ...p, id: `pub-${Date.now()}`, source: 'manual', addedBy: 'u1' }, ...pubs]);
    setShowAdd(false);
    toast('Publication added');
  };

  const removePub = (id) => {
    if (confirm('Remove this publication from the list?')) {
      setPubs(pubs.filter(p => p.id !== id));
      toast('Publication removed');
    }
  };

  const byYear = years.map(y => ({ year: y, count: pubs.filter(p => p.year === y).length }));
  const maxYearCount = Math.max(...byYear.map(y => y.count), 1);

  return (
    <div className="page">
      <div className="page-header row between" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Publications</h1>
          <p className="page-sub">Synced from PubMed for author <strong style={{ color: 'var(--ink)' }}>{pubmedAuthor}</strong> · {pubs.length} entries</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={14} stroke={2} /> Add manually
          </button>
          <button className="btn" onClick={() => toast('Exported as BibTeX')}>
            <Icon name="download" size={14} /> Export BibTeX
          </button>
          <button className="btn btn-primary" onClick={syncPubmed} disabled={syncing}>
            {syncing ? <><span className="skel" style={{ width: 14, height: 14, borderRadius: '50%' }} /> Syncing…</> : <><Icon name="updates" size={14} /> Sync from PubMed</>}
          </button>
        </div>
      </div>

      {/* PubMed status banner */}
      <div className="card card-pad" style={{ marginBottom: 18, display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--maroon-wash)', color: 'var(--maroon)', display: 'grid', placeItems: 'center' }}>
            <Icon name="publication" size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>PubMed integration</div>
              <span className="chip chip-green"><span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} /> Connected</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Auto-fetches all publications where you appear as author or co-author. Last refreshed {lastSync}.</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Author query</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input value={pubmedAuthor} onChange={e => setPubmedAuthor(e.target.value)}
                   style={{ width: 160, fontSize: 12 }} />
            <button className="btn btn-sm" onClick={() => toast(`Author updated to "${pubmedAuthor}"`)}>Save</button>
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>Format: <span className="mono">Lastname Initials</span></div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Refresh schedule</div>
          <select defaultValue="daily" style={{ fontSize: 12 }}>
            <option value="hourly">Every hour</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="manual">Manual only</option>
          </select>
        </div>
      </div>

      {/* Year histogram + stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18, marginBottom: 18 }}>
        <div className="card card-pad">
          <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Publications by year</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 140 }}>
            {byYear.slice().reverse().map(y => (
              <button key={y.year} onClick={() => setYearF(String(y.year))}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 0, background: 'transparent', cursor: 'pointer' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: yearF === String(y.year) ? 'var(--maroon)' : 'var(--ink-2)' }}>{y.count}</div>
                <div style={{ width: '100%', height: `${(y.count / maxYearCount) * 100}px`, minHeight: 4, background: yearF === String(y.year) ? 'var(--maroon)' : 'var(--maroon-wash)', borderRadius: '4px 4px 0 0', transition: 'all 0.15s' }} />
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{y.year}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="card card-pad">
          <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>By type</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {types.map(t => {
              const n = pubs.filter(p => p.type === t).length;
              const pct = (n / pubs.length) * 100;
              return (
                <div key={t}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>{t}</span><span style={{ fontWeight: 600 }}>{n}</span>
                  </div>
                  <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 4 }}>Search</div>
            <span style={{ position: 'absolute', left: 11, top: 30, color: 'var(--muted)' }}><Icon name="search" size={14} /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Title, author or journal…"
                   style={{ width: '100%', paddingLeft: 32, background: 'var(--bg-elevated)' }} />
          </div>
          <Select label="Year" value={yearF} onChange={setYearF} options={years.map(y => String(y))} />
          <Select label="Type" value={typeF} onChange={setTypeF} options={types} />
          {(yearF || typeF || search) && (
            <button className="btn btn-sm btn-ghost" onClick={() => { setYearF(''); setTypeF(''); setSearch(''); }}>Clear</button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No publications match those filters.</div>
        )}
        {filtered.map((pub, i) => {
          const authorsParts = pub.authors.split(pubmedAuthor);
          return (
            <div key={pub.id} style={{ padding: '18px 22px', borderBottom: i === filtered.length - 1 ? 'none' : '1px solid var(--hairline)',
                                       display: 'grid', gridTemplateColumns: '64px 1fr auto 30px', gap: 16, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="serif" style={{ fontSize: 22, fontWeight: 600, color: 'var(--maroon)', lineHeight: 1 }}>{pub.year}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{pub.month}</div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="serif" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>{pub.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 5, lineHeight: 1.5 }}>
                  {authorsParts.length > 1 ? (
                    <>{authorsParts[0]}<strong style={{ color: 'var(--maroon)', background: 'var(--maroon-wash)', padding: '0 4px', borderRadius: 3 }}>{pubmedAuthor}</strong>{authorsParts.slice(1).join(pubmedAuthor)}</>
                  ) : pub.authors}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  <span style={{ fontStyle: 'italic', color: 'var(--ink-2)' }}>{pub.journal}</span> · {pub.volume} · {pub.pages}
                  {pub.pmid && pub.pmid !== 'in-press' && <span> · <span className="mono">PMID {pub.pmid}</span></span>}
                  {pub.doi && pub.doi !== 'pending' && <span> · <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--maroon)', fontWeight: 500 }}>doi:{pub.doi}</a></span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <span className="chip chip-grey">{pub.type}</span>
                {pub.status === 'Accepted' && <span className="chip chip-gold">In press</span>}
                {pub.source === 'manual' && <span className="chip chip-maroon">Manual add</span>}
                {pub.source === 'pubmed' && <span className="chip chip-bayfront">PubMed</span>}
              </div>
              <button className="btn-icon btn-ghost" onClick={() => removePub(pub.id)} title="Remove">
                <Icon name="close" size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {showAdd && <AddPublicationModal onClose={() => setShowAdd(false)} onAdd={addPub} />}
    </div>
  );
};

const AddPublicationModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({ title: '', authors: 'Ashwal E', journal: '', year: 2026, month: '', volume: '', pages: '', pmid: '', doi: '', type: 'Original article', status: 'Published' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    onAdd(form);
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-h">
          <div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>Add publication manually</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Use for in-press papers or anything PubMed hasn't indexed yet.</div>
          </div>
          <button type="button" className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-b">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Title <span style={{ color: 'var(--status-red)' }}>*</span></div>
              <textarea rows={2} required value={form.title} onChange={e => set('title', e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Authors <span style={{ color: 'var(--status-red)' }}>*</span></div>
              <input required value={form.authors} onChange={e => set('authors', e.target.value)} placeholder="e.g. Smith J, Ashwal E, Doe A." style={{ width: '100%' }} />
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Include "Ashwal E" so it's highlighted in the list.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Journal <span style={{ color: 'var(--status-red)' }}>*</span></div>
                <input required value={form.journal} onChange={e => set('journal', e.target.value)} placeholder="e.g. BJOG" style={{ width: '100%' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Year</div>
                <input type="number" value={form.year} onChange={e => set('year', +e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Month</div>
                <input value={form.month} onChange={e => set('month', e.target.value)} placeholder="e.g. Mar" style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Volume / issue</div>
                <input value={form.volume} onChange={e => set('volume', e.target.value)} placeholder="e.g. 133(4)" style={{ width: '100%' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Pages</div>
                <input value={form.pages} onChange={e => set('pages', e.target.value)} placeholder="e.g. 442–453" style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>PMID</div>
                <input value={form.pmid} onChange={e => set('pmid', e.target.value)} placeholder="(optional)" style={{ width: '100%' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>DOI</div>
                <input value={form.doi} onChange={e => set('doi', e.target.value)} placeholder="10.xxxx/…" style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Type</div>
                <select value={form.type} onChange={e => set('type', e.target.value)} style={{ width: '100%' }}>
                  {['Original article', 'Review', 'Systematic review', 'Commentary', 'Methods', 'Editorial', 'Case report'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Status</div>
                <select value={form.status} onChange={e => set('status', e.target.value)} style={{ width: '100%' }}>
                  {['Published', 'Accepted', 'In revision', 'Submitted'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-f">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!form.title || !form.authors || !form.journal}>
            <Icon name="check" size={14} stroke={2.5} /> Add publication
          </button>
        </div>
      </form>
    </div>
  );
};

window.PublicationsPage = PublicationsPage;
