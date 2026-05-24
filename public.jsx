/* MFM Research Hub — public landing + login */

const HERO_QUOTES = [
  { q: "Medicine is a science of uncertainty and an art of probability.", a: "Sir William Osler", role: "Physician (1849–1919)" },
  { q: "Listen to your patient — they are telling you the diagnosis.", a: "Sir William Osler", role: "Physician" },
  { q: "Far better an approximate answer to the right question than an exact answer to the wrong one.", a: "John W. Tukey", role: "Statistician" },
  { q: "All models are wrong, but some are useful.", a: "George E. P. Box", role: "Statistician" },
  { q: "There is no substitute for sound clinical observation.", a: "Sir William Osler", role: "Physician" },
  { q: "The good physician treats the disease; the great physician treats the patient who has the disease.", a: "Sir William Osler", role: "Physician" },
  { q: "Knowing is not enough; we must apply. Willing is not enough; we must do.", a: "Johann Wolfgang von Goethe", role: "Polymath" },
  { q: "Wherever the art of medicine is loved, there is also a love of humanity.", a: "Hippocrates", role: "Physician (c. 460–370 BCE)" },
  { q: "The aim of medicine is to prevent disease and prolong life; the ideal of medicine is to eliminate the need of a physician.", a: "William J. Mayo", role: "Surgeon, Mayo Clinic" },
  { q: "In examining disease we gain wisdom about anatomy and physiology. In examining the person with the disease, we gain wisdom about life.", a: "Oliver Sacks", role: "Neurologist & author" },
  { q: "Science is built up with facts, as a house is built with stones. But a collection of facts is no more a science than a heap of stones is a house.", a: "Henri Poincaré", role: "Mathematician" },
  { q: "The greatest enemy of knowledge is not ignorance — it is the illusion of knowledge.", a: "Daniel J. Boorstin", role: "Historian" },
  { q: "Whenever a theory appears to you as the only possible one, take this as a sign that you have neither understood the theory nor the problem it was intended to solve.", a: "Karl Popper", role: "Philosopher of science" },
  { q: "The plural of anecdote is not data — but neither is data the plural of certainty.", a: "On clinical evidence", role: "Adapted" },
];

const HeroQuote = () => {
  const seed = React.useMemo(() => Math.floor(Math.random() * HERO_QUOTES.length), []);
  const [idx, setIdx] = React.useState(seed);
  const q = HERO_QUOTES[idx];
  const next = () => setIdx((idx + 1) % HERO_QUOTES.length);

  return (
    <div style={{ position: 'relative', maxWidth: 400, marginLeft: 'auto' }}>
      {/* Emblem — abstract Kaplan-Meier graph, no labels */}
      <div style={{ marginBottom: 28, padding: '4px 0' }}>
        <svg viewBox="0 0 320 180" style={{ width: '100%', maxWidth: 380, height: 'auto', display: 'block' }}>
          {/* Plot area background */}
          <rect x="38" y="14" width="266" height="130" fill="var(--bg-elevated)" rx="2" />

          {/* Subtle gridlines */}
          {[1, 2, 3].map(i => (
            <line key={`gh${i}`} x1="38" y1={14 + i * 32.5} x2="304" y2={14 + i * 32.5} stroke="#7A003C" strokeWidth="0.4" strokeOpacity="0.08" />
          ))}
          {[1, 2, 3].map(i => (
            <line key={`gv${i}`} x1={38 + i * 66.5} y1="14" x2={38 + i * 66.5} y2="144" stroke="#7A003C" strokeWidth="0.4" strokeOpacity="0.08" />
          ))}

          {/* Axes */}
          <line x1="38" y1="14" x2="38" y2="144" stroke="#495965" strokeWidth="0.7" strokeOpacity="0.6" />
          <line x1="38" y1="144" x2="304" y2="144" stroke="#495965" strokeWidth="0.7" strokeOpacity="0.6" />

          {/* Long-cervix group (maroon, ends higher) — smooth curve */}
          <path d="M 38 14 C 100 15, 150 17, 195 35 C 240 60, 280 95, 304 110"
                stroke="#7A003C" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          {[{ x: 84, y: 15 }, { x: 132, y: 19 }, { x: 178, y: 30 }, { x: 222, y: 50 }, { x: 262, y: 80 }].map((c, i) => (
            <line key={`cm${i}`} x1={c.x} y1={c.y - 4} x2={c.x} y2={c.y + 4} stroke="#7A003C" strokeWidth="1.2" strokeLinecap="round" />
          ))}

          {/* Short-cervix group (grey, ends lower) — smooth curve */}
          <path d="M 38 14 C 70 18, 105 40, 150 75 C 200 110, 260 132, 304 140"
                stroke="#495965" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeOpacity="0.7" />
          {[{ x: 82, y: 25 }, { x: 138, y: 65 }, { x: 195, y: 105 }, { x: 235, y: 128 }].map((c, i) => (
            <line key={`cg${i}`} x1={c.x} y1={c.y - 3} x2={c.x} y2={c.y + 3} stroke="#495965" strokeWidth="1" strokeOpacity="0.7" strokeLinecap="round" />
          ))}

          {/* Gold accent marker on maroon curve */}
          <circle cx="222" cy="50" r="9" fill="none" stroke="#FDBF57" strokeWidth="1" strokeOpacity="0.5" />
          <circle cx="222" cy="50" r="3.5" fill="#FDBF57" />
        </svg>
      </div>

      {/* Quote card */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: -22, top: 0, bottom: 0, width: 3, background: 'var(--maroon)', borderRadius: 2 }} />

        <div className="mono" style={{ fontSize: 10, color: 'var(--maroon)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600, marginBottom: 16 }}>
          A thought for the day
        </div>

        <blockquote className="serif" style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.4, letterSpacing: '-0.005em', color: 'var(--ink)', margin: 0, fontStyle: 'italic' }}>
          <span style={{ color: 'var(--maroon)', fontSize: 26 }}>“</span>{q.q}<span style={{ color: 'var(--maroon)', fontSize: 26 }}>”</span>
        </blockquote>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{q.a}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{q.role}</div>
          </div>
          <button onClick={next} title="Another thought"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)', fontWeight: 500, padding: '6px 10px', borderRadius: 6, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--maroon)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; }}>
            ↻ Another
          </button>
        </div>
      </div>
    </div>
  );
};

const PublicNav = ({ navigate, route, setShowLogin }) => {
  const sections = [
    { id: 'about', label: 'About' },
    { id: 'philosophy', label: 'How we work' },
    { id: 'projects', label: 'Projects' },
    { id: 'people', label: 'People' },
    { id: 'publications', label: 'Publications' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'contact', label: 'Contact' },
  ];
  const scroll = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return (
    <div className="public-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, background: 'var(--maroon)', borderRadius: 8, display: 'grid', placeItems: 'center', color: 'var(--gold)', fontFamily: 'var(--ff-serif)', fontSize: 20, fontWeight: 700 }}>M</div>
        <div>
          <div className="serif" style={{ fontSize: 16, fontWeight: 600 }}>MFM Research Hub</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Maternal-Fetal Medicine</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {sections.map(s => (
          <button key={s.id} className="btn-ghost" style={{ padding: '8px 12px', fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', borderRadius: 8 }} onClick={() => scroll(s.id)}>
            {s.label}
          </button>
        ))}
        <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }} />
        <button className="btn btn-primary" onClick={() => setShowLogin(true)}>
          <Icon name="user" size={14} />
          Sign in
        </button>
      </div>
    </div>
  );
};

const PublicLanding = ({ navigate, setShowLogin }) => {
  const activeProjects = PROJECTS.filter(p => !['Completed', 'Archived', 'Accepted / Published'].includes(p.status));
  const [activeBin, setActiveBin] = useState(BINS[0].id);
  const [quickProject, setQuickProject] = useState(null);

  const stats = [
    { v: '12', l: 'Active projects' },
    { v: '9', l: 'Trainees & collaborators' },
    { v: '24', l: 'Peer-reviewed publications' },
    { v: '6', l: 'Years operating' },
  ];

  const team = PEOPLE.filter(p => ['Principal Investigator', 'Co-Investigator', 'Co-Supervisor', 'MFM Fellow', 'Resident'].includes(p.role)).slice(0, 8);

  return (
    <div style={{ background: 'var(--bg)' }}>
      <PublicNav navigate={navigate} setShowLogin={setShowLogin} />

      {/* HERO */}
      <section id="about" className="public-hero" style={{ padding: '40px 32px 0', background: 'var(--bg)', borderBottom: 'none' }}>
        <div className="public-hero-inner" style={{ position: 'relative' }}>
          {/* Decorative editorial pattern */}
          <svg viewBox="0 0 600 600" style={{ position: 'absolute', top: -20, right: -40, width: 460, height: 460, opacity: 0.045, pointerEvents: 'none', zIndex: 0 }}>
            <defs>
              <radialGradient id="rg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#7A003C" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            {/* Concentric rings reminiscent of fetal ultrasound */}
            {[80, 140, 200, 260, 320].map(r => (
              <circle key={r} cx="300" cy="300" r={r} fill="none" stroke="#7A003C" strokeWidth="1" />
            ))}
            <circle cx="300" cy="300" r="60" fill="url(#rg)" />
            {[0, 30, 60, 90, 120, 150].map(a => {
              const x2 = 300 + Math.cos(a * Math.PI / 180) * 320;
              const y2 = 300 + Math.sin(a * Math.PI / 180) * 320;
              return <line key={a} x1="300" y1="300" x2={x2} y2={y2} stroke="#7A003C" strokeWidth="0.5" />;
            })}
          </svg>

          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 64, alignItems: 'center', minHeight: 540, paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ maxWidth: 620 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 12px 6px 8px', borderRadius: 999, background: 'var(--maroon-wash)', marginBottom: 22 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--maroon)', boxShadow: '0 0 0 3px rgba(122,0,60,0.15)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--maroon)' }}>
                  Maternal-Fetal Medicine · Ontario, Canada
                </span>
              </div>

              <h1 className="serif" style={{ fontSize: 'clamp(40px, 5.2vw, 64px)', lineHeight: 1.04, fontWeight: 600, letterSpacing: '-0.028em', color: 'var(--ink)' }}>
                Better questions.<br/>
                <span style={{ color: 'var(--maroon)', fontStyle: 'italic', fontWeight: 500 }}>Better</span> patient care.
              </h1>

              <p style={{ fontSize: 18, color: 'var(--grey)', marginTop: 22, lineHeight: 1.55, maxWidth: 540 }}>
                A clinician-led research group asking the questions that come up at the bedside —
                placental insufficiency, hypertensive disorders, obstetric ultrasound, twin pregnancy,
                neonatal outcomes. We work with curious clinicians and collaborators at every stage — students, residents, fellows, research coordinators and volunteers.
              </p>

              <div style={{ display: 'flex', gap: 10, marginTop: 32, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" style={{ padding: '12px 18px', fontSize: 14 }}
                        onClick={() => document.getElementById('projects').scrollIntoView({ behavior: 'smooth' })}>
                  Explore current projects
                  <Icon name="arrowRight" size={14} />
                </button>
                <button className="btn" style={{ padding: '12px 18px', fontSize: 14 }}
                        onClick={() => document.getElementById('philosophy').scrollIntoView({ behavior: 'smooth' })}>
                  How we work
                </button>
              </div>
            </div>

            {/* Right column — rotating thoughtful quote */}
            <HeroQuote />
          </div>
        </div>
      </section>

      {/* AT A GLANCE — refined stats */}
      <section style={{ padding: '40px 32px 0', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          {[
            { v: PROJECTS.filter(p => !['Completed', 'Archived'].includes(p.status)).length, l: 'Active projects', sub: 'across 5 clinical areas' },
            { v: PEOPLE.filter(p => ['Resident', 'MFM Fellow', 'Medical Student', 'Volunteer'].includes(p.role)).length, l: 'Trainees', sub: 'med students to fellows' },
            { v: PUBLICATIONS.length + '+', l: 'Peer-reviewed papers', sub: 'last 3 years · synced from PubMed' },
            { v: '6', l: 'Years operating', sub: 'continuous research output' },
          ].map((s, i) => (
            <div key={s.l} style={{ padding: '28px 24px', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <div className="serif" style={{ fontSize: 44, fontWeight: 600, color: 'var(--maroon)', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginTop: 10 }}>{s.l}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PHILOSOPHY — three principles */}
      <section id="philosophy" style={{ padding: '88px 32px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 64, alignItems: 'flex-start' }}>
          <div style={{ position: 'sticky', top: 90 }}>
            <div className="eyebrow">How we work</div>
            <h2 className="serif" style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 8, lineHeight: 1.2 }}>
              How we approach the work.
            </h2>
            <p style={{ color: 'var(--grey)', marginTop: 14, lineHeight: 1.7, fontSize: 14 }}>
              Done carefully, clinical research makes us better physicians and our patients safer. These three commitments are how we try to keep ours honest — grounded in real questions, respectful of evidence, and connected to the patients whose care it should improve.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {[
              {
                n: '01',
                title: 'The question comes first.',
                body: "Every project starts from something we actually noticed in clinic — a Doppler that didn't fit the textbook, a question from a family we couldn't quite answer. We try not to chase data. We try to find questions worth answering, and we keep checking that the answer would change something we do."
              },
              {
                n: '02',
                title: 'Method before novelty.',
                body: "Pre-registered protocols when they make sense. Code and analysis files under version control. Clear data dictionaries from day one. The slow, careful parts of research are the ones that decide whether the work holds up — and whether anyone should change practice because of it."
              },
              {
                n: '03',
                title: 'Findings that change care.',
                body: "A study isn't finished when the paper appears. We ask, project by project: how does this actually change how we counsel patients, run an ultrasound list, or manage a complicated pregnancy? When the answer is 'it doesn't,' we want to know why we did the work in the first place."
              },
            ].map(p => (
              <div key={p.n} style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 22, padding: '24px 0', borderTop: '1px solid var(--border)' }}>
                <div className="serif" style={{ fontSize: 36, fontWeight: 500, color: 'var(--maroon)', letterSpacing: '-0.02em', lineHeight: 1 }}>{p.n}</div>
                <div>
                  <h3 className="serif" style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{p.title}</h3>
                  <p style={{ color: 'var(--grey)', marginTop: 8, lineHeight: 1.7, fontSize: 14 }}>{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PULL QUOTE — editorial moment */}
      <section style={{ padding: '32px 32px 88px', maxWidth: 1000, margin: '0 auto' }}>
        <div className="card" style={{ padding: '48px 56px', background: 'var(--maroon)', color: '#F8EEE2', borderColor: 'transparent', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -80, bottom: -80, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,191,87,0.18), transparent 70%)' }} />
          <div style={{ position: 'relative' }}>
            <div className="serif" style={{ fontSize: 92, fontWeight: 600, lineHeight: 0.6, color: 'var(--gold)', marginBottom: 14 }}>"</div>
            <blockquote className="serif" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.35, letterSpacing: '-0.01em', margin: 0, maxWidth: 760, fontStyle: 'italic' }}>
              The best research questions are still walking past us in clinic. Our job is to notice them, slow down enough to listen, and then do the careful work of answering them.
            </blockquote>
            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gold)', color: 'var(--maroon-deep)', display: 'grid', placeItems: 'center', fontFamily: 'var(--ff-serif)', fontWeight: 700, fontSize: 16 }}>EA</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Dr. Eran Ashwal</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Principal Investigator, MFM Research Hub</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROJECT BINS — clinical categories */}
      <section id="projects" style={{ padding: '72px 32px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="eyebrow">Current projects</div>
            <h2 className="serif" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 6 }}>What we're working on right now</h2>
            <p style={{ color: 'var(--grey)', maxWidth: 620, marginTop: 8 }}>
              {activeProjects.length} active studies, organized by clinical focus. Click a project to see a quick review.
            </p>
          </div>
          <button className="btn" onClick={() => setShowLogin(true)}>
            <Icon name="eye" size={14} />
            See full project registry
          </button>
        </div>

        {/* Bin pills */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {BINS.map(b => {
            const n = activeProjects.filter(p => p.bin === b.id).length;
            const active = activeBin === b.id;
            return (
              <button key={b.id} onClick={() => setActiveBin(b.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '10px 16px', borderRadius: 999,
                               border: '1px solid', borderColor: active ? 'var(--maroon)' : 'var(--border)',
                               background: active ? 'var(--maroon)' : 'var(--paper)',
                               color: active ? '#F8EEE2' : 'var(--ink-2)',
                               fontSize: 13, fontWeight: 500, transition: 'all 0.15s', cursor: 'pointer' }}>
                <Icon name={b.icon} size={14} />
                {b.label}
                <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999,
                               background: active ? 'rgba(253,191,87,0.25)' : 'var(--bg-elevated)',
                               color: active ? 'var(--gold)' : 'var(--muted)', fontWeight: 600 }}>{n}</span>
              </button>
            );
          })}
        </div>

        {/* Active bin description card */}
        {(() => {
          const bin = BINS.find(b => b.id === activeBin);
          const items = activeProjects.filter(p => p.bin === activeBin);
          return (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, marginBottom: 28, alignItems: 'flex-start' }}>
                <div className={`bucket-cover ${bin.cover}`} style={{ height: 180, borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
                  <div className="bucket-cover-pattern" />
                  <div style={{ position: 'absolute', left: 22, bottom: 18, color: '#fff' }}>
                    <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>{items.length} active</div>
                    <div className="serif" style={{ fontSize: 22, fontWeight: 600, marginTop: 4, lineHeight: 1.2, maxWidth: 240 }}>{bin.label}</div>
                  </div>
                </div>
                <div style={{ paddingTop: 8 }}>
                  <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>{bin.desc}</p>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                  <div className="serif" style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-2)' }}>No active projects in this area right now.</div>
                  <p style={{ marginTop: 6, fontSize: 13 }}>Watch this space — we onboard new projects twice a year.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {items.map(p => {
                    const lead = personById(p.lead);
                    return (
                      <button key={p.id} onClick={() => setQuickProject(p)}
                              className="card card-hover"
                              style={{ padding: 18, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div className="mono" style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.05em' }}>{p.acronym}</div>
                          <HealthDot health={p.health} />
                        </div>
                        <div className="serif" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{p.title}</div>
                        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>{p.description}</p>
                        <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <StatusChip status={p.status} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Avatar user={lead} size="sm" />
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{lead?.name.split(' ').slice(-1)[0]}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}
      </section>

      {/* PEOPLE */}
      <section id="people" style={{ padding: '72px 32px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="eyebrow">Team</div>
        <h2 className="serif" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 6 }}>Clinicians, trainees and collaborators</h2>
        <p style={{ color: 'var(--grey)', maxWidth: 620, marginTop: 8, marginBottom: 28 }}>
          Our group is built around clinical fellows, residents, medical students and biostatistical collaborators — the people doing the day-to-day research work.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {team.map(p => (
            <div key={p.id} className="card card-hover" style={{ padding: 18 }}>
              <Avatar user={p} size="lg" />
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 12 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.role}</div>
              <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{p.training}</div>
              {p.focus && <div className="serif" style={{ fontSize: 13, marginTop: 10, color: 'var(--ink-2)', fontStyle: 'italic' }}>{p.focus}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* PUBLICATIONS */}
      <section id="publications" style={{ padding: '72px 32px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
          <div>
            <div className="eyebrow">Recent publications</div>
            <h2 className="serif" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 6 }}>Peer-reviewed output</h2>
            <p style={{ color: 'var(--grey)', maxWidth: 620, marginTop: 8 }}>
              Synced automatically from PubMed for author <strong style={{ color: 'var(--ink)' }}>Ashwal E</strong>. {PUBLICATIONS.length} publications shown.
            </p>
          </div>
          <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--status-green)', boxShadow: '0 0 0 3px var(--status-green-wash)' }} />
            <div>
              <div style={{ fontWeight: 600 }}>PubMed sync active</div>
              <div style={{ color: 'var(--muted)', fontSize: 11 }}>Last refreshed 2 hours ago</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ overflow: 'hidden' }}>
          {PUBLICATIONS.map((pub, i) => {
            const authorsParts = pub.authors.split('Ashwal E');
            return (
              <div key={pub.id} style={{ padding: '18px 22px', borderBottom: i === PUBLICATIONS.length - 1 ? 'none' : '1px solid var(--hairline)',
                                         display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: 20, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="serif" style={{ fontSize: 24, fontWeight: 600, color: 'var(--maroon)', lineHeight: 1 }}>{pub.year}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{pub.month}</div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="serif" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>{pub.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 5, lineHeight: 1.5 }}>
                    {authorsParts.length > 1 ? (
                      <>{authorsParts[0]}<strong style={{ color: 'var(--maroon)', background: 'var(--maroon-wash)', padding: '0 4px', borderRadius: 3 }}>Ashwal E</strong>{authorsParts.slice(1).join('Ashwal E')}</>
                    ) : pub.authors}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    <span style={{ fontStyle: 'italic', color: 'var(--ink-2)' }}>{pub.journal}</span>
                    <span> · {pub.volume} · {pub.pages}</span>
                    {pub.pmid && pub.pmid !== 'in-press' && <span> · <span className="mono" style={{ fontSize: 11 }}>PMID: {pub.pmid}</span></span>}
                    {pub.doi && pub.doi !== 'pending' && <span> · <span className="mono" style={{ fontSize: 11 }}>DOI: {pub.doi}</span></span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="chip chip-grey">{pub.type}</span>
                    {pub.status === 'Accepted' && <span className="chip chip-gold">In press</span>}
                    {pub.source === 'manual' && <span className="chip chip-maroon">Manual</span>}
                  </div>
                  {pub.doi && pub.doi !== 'pending' && (
                    <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer"
                       style={{ fontSize: 11, color: 'var(--maroon)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      Open <Icon name="arrowRight" size={10} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ACHIEVEMENTS — Awards · Grants · Presentations */}
      <Achievements />

      {/* CONTACT FOOTER */}
      <section id="contact" style={{ padding: '72px 32px 60px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="card" style={{ padding: 40, background: 'var(--maroon)', color: '#F8EEE2', borderColor: 'transparent', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--gold)' }}>Join the research hub</div>
            <h2 className="serif" style={{ fontSize: 32, fontWeight: 600, marginTop: 8, letterSpacing: '-0.02em', lineHeight: 1.2, color: '#F8EEE2' }}>
              Curious about MFM research? There’s a place for you here.
            </h2>
            <p style={{ marginTop: 14, opacity: 0.88, maxWidth: 540, lineHeight: 1.55 }}>
              We welcome medical students, residents, fellows, research volunteers and clinician collaborators with an interest in maternal-fetal medicine. Whether you want a focused short project, a year of immersive research, or an ongoing collaboration — reach out and tell us what you’re curious about.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-gold" style={{ justifyContent: 'center', padding: '12px 16px', fontSize: 14 }}
                    onClick={() => { window.location.href = 'mailto:eran.ashwal@example.ca?subject=Interest%20in%20MFM%20Research%20Hub'; }}>
              <Icon name="message" size={14} />
              Contact the admin
            </button>
            <div style={{ fontSize: 11, opacity: 0.7, textAlign: 'center', marginTop: 4 }}>
              Replies usually within a week.
            </div>
          </div>
        </div>

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, color: 'var(--muted)', fontSize: 12 }}>
          <div>© 2026 MFM Research Hub · Ontario, Canada</div>
          <div style={{ display: 'flex', gap: 18 }}>
            <span>Research operations prototype</span>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </section>

      {/* QUICK REVIEW MODAL */}
      {quickProject && <ProjectQuickReview project={quickProject} onClose={() => setQuickProject(null)} onSignIn={() => { setQuickProject(null); setShowLogin(true); }} />}
    </div>
  );
};

const Achievements = () => {
  const [tab, setTab] = React.useState('awards');

  const totalActiveFunding = GRANTS.filter(g => g.status === 'active').reduce((s, g) => s + g.amount, 0);
  const tabs = [
    { id: 'awards', label: 'Awards & honours', n: AWARDS.length, icon: 'star' },
    { id: 'grants', label: 'Grants & funding', n: GRANTS.length, icon: 'flag' },
    { id: 'presentations', label: 'Presentations', n: PRESENTATIONS.length, icon: 'message' },
  ];

  return (
    <section id="achievements" style={{ padding: '72px 32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
        <div>
          <div className="eyebrow">Recognition, funding & output</div>
          <h2 className="serif" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 6 }}>Achievements</h2>
          <p style={{ color: 'var(--grey)', maxWidth: 620, marginTop: 8 }}>
            Awards the group has received, funding that supports the work, and where we have presented our findings.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 28 }}>
          <div>
            <div className="serif" style={{ fontSize: 26, fontWeight: 600, color: 'var(--maroon)', letterSpacing: '-0.01em' }}>{AWARDS.length}</div>
            <div style={{ marginTop: 2, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>Awards</div>
          </div>
          <div>
            <div className="serif" style={{ fontSize: 26, fontWeight: 600, color: 'var(--maroon)', letterSpacing: '-0.01em' }}>${(totalActiveFunding / 1000).toFixed(0)}k</div>
            <div style={{ marginTop: 2, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>Active funding</div>
          </div>
          <div>
            <div className="serif" style={{ fontSize: 26, fontWeight: 600, color: 'var(--maroon)', letterSpacing: '-0.01em' }}>{PRESENTATIONS.length}</div>
            <div style={{ marginTop: 2, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>Presentations</div>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--bg-elevated)', borderRadius: 10, marginBottom: 24, width: 'fit-content', maxWidth: '100%', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ padding: '10px 18px', borderRadius: 7, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
                           background: tab === t.id ? 'var(--paper)' : 'transparent',
                           boxShadow: tab === t.id ? 'var(--shadow-1)' : 'none',
                           color: tab === t.id ? 'var(--ink)' : 'var(--muted)',
                           display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name={t.icon} size={13} />
            {t.label}
            <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 999, background: tab === t.id ? 'var(--maroon-wash)' : 'var(--border)', color: tab === t.id ? 'var(--maroon)' : 'var(--muted)', fontWeight: 600 }}>{t.n}</span>
          </button>
        ))}
      </div>

      {/* AWARDS */}
      {tab === 'awards' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {AWARDS.map((aw, i) => {
            const recipient = personById(aw.recipient);
            const tierColor = { international: 'var(--maroon)', national: 'var(--bayfront)', institutional: 'var(--kingsforest)' }[aw.tier] || 'var(--muted)';
            return (
              <div key={aw.id} style={{ padding: '20px 24px', borderBottom: i === AWARDS.length - 1 ? 'none' : '1px solid var(--hairline)', display: 'grid', gridTemplateColumns: '64px 1fr 200px', gap: 22, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="serif" style={{ fontSize: 22, fontWeight: 600, color: 'var(--maroon)', lineHeight: 1 }}>{aw.year}</div>
                  <Icon name="star" size={14} color="var(--gold-deep)" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="serif" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{aw.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontStyle: 'italic' }}>{aw.org}</div>
                  <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 8, lineHeight: 1.5 }}>{aw.desc}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <span className="chip" style={{ background: 'var(--bg-elevated)', color: tierColor, fontSize: 10, textTransform: 'capitalize', fontWeight: 600 }}>{aw.tier}</span>
                  {recipient && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Avatar user={recipient} size="sm" />
                      <span style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 500 }}>{recipient.name}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* GRANTS */}
      {tab === 'grants' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {GRANTS.map((g, i) => {
            const linkedProjects = g.projects.map(pid => PROJECTS.find(p => p.id === pid)).filter(Boolean);
            return (
              <div key={g.id} style={{ padding: '20px 24px', borderBottom: i === GRANTS.length - 1 ? 'none' : '1px solid var(--hairline)', display: 'grid', gridTemplateColumns: '1fr 120px', gap: 22, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className={`chip ${g.status === 'active' ? 'chip-green' : 'chip-grey'}`} style={{ fontSize: 10 }}>
                      <span className="chip-dot" />
                      {g.status === 'active' ? 'Active' : 'Completed'}
                    </span>
                    <span className="chip chip-grey" style={{ fontSize: 10 }}>{g.role}</span>
                    <span className="chip chip-grey" style={{ fontSize: 10 }}>{g.mechanism}</span>
                  </div>
                  <div className="serif" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{g.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, fontStyle: 'italic' }}>{g.funder}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="calendar" size={11} />
                    {g.start} → {g.end}
                  </div>
                  {linkedProjects.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Supports:</span>
                      {linkedProjects.map(p => (
                        <span key={p.id} className="mono" style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--maroon-wash)', color: 'var(--maroon)', fontWeight: 600 }}>{p.acronym}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="serif" style={{ fontSize: 24, fontWeight: 600, color: 'var(--maroon)', letterSpacing: '-0.01em', lineHeight: 1 }}>
                    ${(g.amount / 1000).toFixed(0)}k
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{g.currency}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PRESENTATIONS */}
      {tab === 'presentations' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {PRESENTATIONS.map((pr, i) => {
            const presenter = personById(pr.presenter);
            const linkedProject = pr.linkedProject ? PROJECTS.find(p => p.id === pr.linkedProject) : null;
            const typeColors = {
              oral: { bg: 'var(--maroon-wash)', fg: 'var(--maroon)' },
              poster: { bg: 'var(--bayfront-wash)', fg: 'var(--bayfront)' },
              invited: { bg: 'var(--gold-wash)', fg: '#8C6517' },
            };
            const tc = typeColors[pr.type];
            return (
              <div key={pr.id} style={{ padding: '20px 24px', borderBottom: i === PRESENTATIONS.length - 1 ? 'none' : '1px solid var(--hairline)', display: 'grid', gridTemplateColumns: '70px 1fr 200px', gap: 22, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="serif" style={{ fontSize: 22, fontWeight: 600, color: 'var(--maroon)', lineHeight: 1 }}>{pr.year}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginTop: 2 }}>{pr.month}</div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="chip" style={{ background: tc.bg, color: tc.fg, fontSize: 10, textTransform: 'capitalize', fontWeight: 600 }}>
                      {pr.type === 'oral' ? 'Oral presentation' : pr.type === 'poster' ? 'Poster' : 'Invited talk'}
                    </span>
                    {linkedProject && (
                      <span className="mono" style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--bg-elevated)', color: 'var(--muted)', fontWeight: 600 }}>{linkedProject.acronym}</span>
                    )}
                  </div>
                  <div className="serif" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{pr.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 5, fontStyle: 'italic' }}>{pr.conference} · {pr.location}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{pr.authors}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Presenter</div>
                  {presenter && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Avatar user={presenter} size="sm" />
                      <span style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 500 }}>{presenter.name}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

const ProjectQuickReview = ({ project, onClose, onSignIn }) => {
  const lead = personById(project.lead);
  const pi = personById(project.pi);
  const members = project.members.map(personById).filter(Boolean);
  const milestones = MILESTONES[project.id] || [];
  const doneCount = milestones.filter(m => m.status === 'done').length;
  const bin = BINS.find(b => b.id === project.bin);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 760 }} onClick={e => e.stopPropagation()}>
        <div style={{ position: 'relative', height: 96, background: 'var(--maroon)', overflow: 'hidden' }}>
          <div className="bucket-cover-pattern" />
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, color: '#F8EEE2', background: 'rgba(255,255,255,0.12)', borderRadius: 8, width: 30, height: 30, display: 'grid', placeItems: 'center' }}>
            <Icon name="close" size={16} />
          </button>
          <div style={{ position: 'absolute', left: 22, bottom: 14, color: '#F8EEE2', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.06em', opacity: 0.85 }}>{project.acronym}</span>
            {bin && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '3px 9px', background: 'rgba(255,255,255,0.14)', borderRadius: 999, color: 'var(--gold)' }}>
                <Icon name={bin.icon} size={11} /> {bin.label}
              </span>
            )}
          </div>
        </div>

        <div className="modal-b" style={{ padding: '24px 28px' }}>
          <h2 className="serif" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.25 }}>{project.title}</h2>
          <p style={{ marginTop: 10, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>{project.description}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 22, padding: '16px 0', borderTop: '1px solid var(--hairline)', borderBottom: '1px solid var(--hairline)' }}>
            <div>
              <div className="eyebrow">Status</div>
              <div style={{ marginTop: 6 }}><StatusChip status={project.status} /></div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>{healthLabel(project.health)} · {project.progress}% complete</div>
            </div>
            <div>
              <div className="eyebrow">Lead trainee</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <Avatar user={lead} size="sm" />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{lead?.name}</span>
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: 'var(--muted)' }}>{lead?.training}</div>
            </div>
            <div>
              <div className="eyebrow">Supervising PI</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <Avatar user={pi} size="sm" />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{pi?.name}</span>
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: 'var(--muted)' }}>{pi?.role}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 18 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Design</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{project.studyDesign}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{project.dataSource}</div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Timeline</div>
              <div style={{ fontSize: 13 }}>
                <strong>{fmtDate(project.start)}</strong> <span style={{ color: 'var(--muted)' }}>→</span> <strong>{fmtDate(project.target)}</strong>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{doneCount} of {milestones.length || '—'} milestones complete</div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Target journal</div>
              <div className="serif" style={{ fontSize: 13, fontStyle: 'italic' }}>{project.targetJournal}</div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>REB status</div>
              <span className={`chip ${project.reb === 'Approved' ? 'chip-green' : project.reb === 'Under review' ? 'chip-amber' : 'chip-grey'}`}>{project.reb}</span>
            </div>
          </div>

          {members.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Team ({members.length})</div>
              <AvatarStack users={members} max={8} size="sm" />
            </div>
          )}
        </div>

        <div className="modal-f">
          <div style={{ fontSize: 11, color: 'var(--muted)', flex: 1 }}>
            <Icon name="alert" size={12} /> Full project details, milestones and files require sign-in.
          </div>
          <button className="btn" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={onSignIn}>
            <Icon name="user" size={14} /> Sign in to open
          </button>
        </div>
      </div>
    </div>
  );
};

const LoginModal = ({ open, onClose, onSignIn }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [picked, setPicked] = useState(null);
  const [authErr, setAuthErr] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [signupMode, setSignupMode] = useState(false);
  const [signupNote, setSignupNote] = useState('');
  if (!open) return null;

  const accounts = [
    { user: PEOPLE[0], roleLabel: 'PI / Admin', desc: 'Full access to all projects, analytics, reports and trainees.' },
    { user: PEOPLE[5], roleLabel: 'MFM Fellow', desc: 'Sees own projects, submits updates, manages tasks.' },
    { user: PEOPLE[3], roleLabel: 'Resident', desc: 'Sees own projects, submits progress updates.' },
    { user: PEOPLE[10], roleLabel: 'Research Coordinator', desc: 'Operations, REB, agreements, files.' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 780, padding: 0 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 520 }}>
          {/* Brand side */}
          <div style={{ background: 'var(--maroon)', color: '#F8EEE2', padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -100, top: -100, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,191,87,0.2), transparent 70%)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ width: 44, height: 44, background: 'var(--gold)', borderRadius: 10, display: 'grid', placeItems: 'center', color: 'var(--maroon-deep)', fontFamily: 'var(--ff-serif)', fontWeight: 700, fontSize: 22 }}>M</div>
              <div style={{ marginTop: 24 }}>
                <div className="eyebrow" style={{ color: 'var(--gold)' }}>MFM Research Hub</div>
                <div className="serif" style={{ fontSize: 26, fontWeight: 600, marginTop: 6, lineHeight: 1.2 }}>Sign in to your trainee or supervisor workspace.</div>
              </div>
            </div>
            <div style={{ position: 'relative', zIndex: 1, fontSize: 12, opacity: 0.8 }}>
              <div style={{ marginBottom: 8, color: 'var(--gold)' }}>
                <Icon name="user" size={13} /> &nbsp;Sign in with your account email
              </div>
              Or use a demo account to browse the site without signing in.
            </div>
          </div>

          {/* Form */}
          <div style={{ padding: 36, display: 'flex', flexDirection: 'column' }}>
            <div className="row between">
              <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>{signupMode ? 'Create account' : 'Sign in'}</div>
              <button className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
            </div>

            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!window.AuthService && (
                <div style={{ padding: 10, background: 'var(--status-amber-wash)', color: 'var(--status-amber)', fontSize: 12, borderRadius: 6, border: '1px solid var(--status-amber)' }}>
                  Authentication is not initialized yet. Please push the latest code to your GitHub repo.
                </div>
              )}
              {authErr && (
                <div style={{ padding: 10, background: 'var(--status-red-wash)', color: 'var(--status-red)', fontSize: 12, borderRadius: 6, border: '1px solid var(--status-red)' }}>
                  {authErr}
                </div>
              )}
              {signupNote && (
                <div style={{ padding: 10, background: 'var(--status-green-wash)', color: 'var(--status-green)', fontSize: 12, borderRadius: 6, border: '1px solid var(--status-green)' }}>
                  {signupNote}
                </div>
              )}
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>Email</div>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.ca" style={{ width: '100%' }} />
              </div>
              <div>
                <div className="row between" style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)' }}>Password</div>
                  {!signupMode && (
                    <button className="btn-ghost" style={{ fontSize: 11, color: 'var(--maroon)', fontWeight: 500 }}
                            onClick={async () => {
                              if (!email) { setAuthErr('Enter your email above first.'); return; }
                              try {
                                await window.AuthService.resetPassword(email);
                                setSignupNote('Password reset email sent. Check your inbox.');
                                setAuthErr('');
                              } catch (e) { setAuthErr(e.message); }
                            }}>Forgot?</button>
                  )}
                </div>
                <input value={pwd} onChange={e => setPwd(e.target.value)} type="password" placeholder="••••••••" style={{ width: '100%' }} />
              </div>
              <button className="btn btn-primary" style={{ justifyContent: 'center', marginTop: 6 }}
                      disabled={authBusy || !email || !pwd || !window.AuthService}
                      onClick={async () => {
                        setAuthErr(''); setSignupNote(''); setAuthBusy(true);
                        try {
                          if (signupMode) {
                            await window.AuthService.signUp(email, pwd);
                            setSignupNote('Account created. Check your email to confirm, then sign in.');
                            setSignupMode(false);
                          } else {
                            await window.AuthService.signIn(email, pwd);
                            onClose();
                          }
                        } catch (e) { setAuthErr(e.message || 'Authentication failed'); }
                        finally { setAuthBusy(false); }
                      }}>
                {authBusy ? '…' : (signupMode ? 'Create account' : 'Sign in')}
              </button>
              <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
                {signupMode ? 'Already have an account? ' : "Don't have an account yet? "}
                <button className="btn-ghost" style={{ color: 'var(--maroon)', fontWeight: 500, fontSize: 11 }}
                        onClick={() => { setSignupMode(!signupMode); setAuthErr(''); setSignupNote(''); }}>
                  {signupMode ? 'Sign in' : 'Create one'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


Object.assign(window, { PublicLanding, LoginModal });
