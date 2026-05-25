/* MFM Research Hub — report generation modal with realistic preview */

const ReportModal = ({ open, onClose, type, project, toast }) => {
  if (!open) return null;

  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState('pdf');
  const [recipients, setRecipients] = useState('');
  const [includeSections, setIncludeSections] = useState({
    summary: true, milestones: true, tasks: true, updates: true, files: true, activity: false
  });

  const titleMap = {
    summary: 'One-page project summary',
    trainee: 'Trainee progress report',
    overdue: 'Overdue items report',
    reb: 'REB / ethics status report',
    pubpipe: 'Publication pipeline report',
    detail: 'Full detailed project report',
    portfolio: 'Monthly portfolio report',
  };
  const reportTitle = titleMap[type] || 'Report';

  const isPortfolio = !project;
  const projects = isPortfolio ? PROJECTS.filter(p => !['Archived', 'Completed'].includes(p.status)) : [project];

  const doExport = () => {
    setExporting(true);
    try {
      // Find the rendered report DOM and snapshot it
      const reportEl = document.getElementById('mfm-report-body');
      if (!reportEl) throw new Error('Report preview not ready');
      const inlineCSS = `
        body { font-family: 'Inter', system-ui, sans-serif; background: #f6f4ef; color: #1a1d23; margin: 0; padding: 40px 0; }
        .report-paper { background: #fff; max-width: 720px; margin: 0 auto; padding: 40px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 4px; font-size: 13px; line-height: 1.65; }
        h1 { font-family: Georgia, serif; font-size: 26px; font-weight: 600; margin: 6px 0 8px; line-height: 1.2; color: #1a1d23; }
        .eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #7A003C; margin-bottom: 6px; }
        section { margin-bottom: 22px; }
        section .eyebrow { color: #6b7280; }
        ul { padding-left: 18px; margin-top: 6px; }
        li { margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
        th, td { padding: 6px 4px; text-align: left; border-bottom: 1px solid #eee; }
        th { font-weight: 600; color: #6b7280; }
        .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 10px; color: #888; }
        .header { padding-bottom: 20px; border-bottom: 4px solid #7A003C; }
        .meta { font-size: 12px; color: #6b7280; margin-top: 8px; }
        @media print { body { background: white; padding: 0; } .report-paper { box-shadow: none; max-width: none; padding: 0.6in; } }
      `;
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${reportTitle}</title><style>${inlineCSS}</style></head><body><div class="report-paper">${reportEl.innerHTML}</div></body></html>`;

      const fileBase = `${(project?.acronym || 'portfolio')}-${type}-${new Date().toISOString().slice(0,10)}`;

      if (format === 'pdf') {
        // Open a new window with print-ready report; user uses browser's Save-as-PDF
        const win = window.open('', '_blank');
        if (!win) throw new Error('Pop-up blocked. Allow pop-ups for mfmhub.ca and try again.');
        win.document.write(html);
        win.document.close();
        setTimeout(() => { try { win.print(); } catch {} }, 500);
        toast(`Report opened — use your browser's "Save as PDF" in the print dialog`);
      } else if (format === 'docx') {
        // Word can open HTML files saved as .doc — simplest cross-platform path
        const blob = new Blob([html], { type: 'application/msword' });
        downloadBlob(blob, `${fileBase}.doc`);
        toast('Report downloaded — open in Word');
      } else if (format === 'md') {
        const md = htmlToMarkdown(reportEl);
        const blob = new Blob([md], { type: 'text/markdown' });
        downloadBlob(blob, `${fileBase}.md`);
        toast('Markdown downloaded');
      }

      // If recipients are listed, open a mailto: with the report summary
      if (recipients.trim()) {
        const subject = encodeURIComponent(`${reportTitle} — ${project?.acronym || 'MFM Portfolio'} — ${new Date().toLocaleDateString()}`);
        const body = encodeURIComponent(
          `Hi,\n\nPlease find attached the ${reportTitle.toLowerCase()} for ${project?.title || 'the MFM research portfolio'}.\n\n` +
          `The full file was just downloaded to my computer — I'll attach it to this email before sending.\n\n` +
          `Generated from the MFM Research Hub.\n\nBest,\nDr. Eran Ashwal`
        );
        window.location.href = `mailto:${recipients.trim()}?subject=${subject}&body=${body}`;
      }
    } catch (err) {
      toast(`Export failed: ${err.message}`, 'error');
    }
    setExporting(false);
  };

  // Helpers
  const downloadBlob = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
  };

  const htmlToMarkdown = (el) => {
    // Cheap-and-cheerful HTML → MD converter for our limited report shapes
    let md = '';
    el.querySelectorAll(':scope > section, :scope > div').forEach(s => {
      const eyebrow = s.querySelector('.eyebrow');
      if (eyebrow) md += `\n## ${eyebrow.textContent}\n\n`;
      s.querySelectorAll('p').forEach(p => { md += `${p.textContent.trim()}\n\n`; });
      s.querySelectorAll('ul li').forEach(li => { md += `- ${li.textContent.trim()}\n`; });
      const table = s.querySelector('table');
      if (table) {
        const headers = [...table.querySelectorAll('thead th')].map(t => t.textContent.trim());
        if (headers.length) {
          md += `\n| ${headers.join(' | ')} |\n| ${headers.map(()=>'---').join(' | ')} |\n`;
          [...table.querySelectorAll('tbody tr')].forEach(tr => {
            const cells = [...tr.querySelectorAll('td')].map(c => c.textContent.trim());
            md += `| ${cells.join(' | ')} |\n`;
          });
          md += '\n';
        }
      }
    });
    return `# ${reportTitle}\n\n_${new Date().toLocaleDateString()}_\n\n${md}`;
  };

  const copyShareLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast('Page link copied'); }
    catch { toast('Could not copy — copy URL manually', 'error'); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 1080, maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>{reportTitle}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {isPortfolio ? 'All active projects' : `${project.acronym} · ${project.title}`}
            </div>
          </div>
          <button className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar options */}
          <div style={{ borderRight: '1px solid var(--border)', padding: 18, overflow: 'auto', background: 'var(--bg-elevated)' }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Format</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
              {[{ id: 'pdf', label: 'PDF' }, { id: 'docx', label: 'Word' }, { id: 'md', label: 'Markdown' }].map(f => (
                <button key={f.id} onClick={() => setFormat(f.id)}
                        style={{ flex: 1, padding: '8px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: '1px solid', borderColor: format === f.id ? 'var(--maroon)' : 'var(--border)', background: format === f.id ? 'var(--maroon-wash)' : 'var(--paper)', color: format === f.id ? 'var(--maroon)' : 'var(--ink-2)' }}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="eyebrow" style={{ marginBottom: 8 }}>Include sections</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              {[
                { id: 'summary', label: 'Executive summary' },
                { id: 'milestones', label: 'Milestones & timeline' },
                { id: 'tasks', label: 'Open tasks' },
                { id: 'updates', label: 'Recent progress updates' },
                { id: 'files', label: 'File inventory' },
                { id: 'activity', label: 'Full activity log' },
              ].map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, borderRadius: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={includeSections[s.id]}
                         onChange={e => setIncludeSections({ ...includeSections, [s.id]: e.target.checked })}
                         style={{ accentColor: 'var(--maroon)' }} />
                  {s.label}
                </label>
              ))}
            </div>

            <div className="divider" />
            <div className="eyebrow" style={{ marginBottom: 8 }}>Email to (optional)</div>
            <input value={recipients} onChange={e => setRecipients(e.target.value)}
                   placeholder="address1@…, address2@…" style={{ width: '100%', fontSize: 12 }} />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Opens your email app pre-filled. Attach the downloaded file before sending.</div>

            <div className="divider" />
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              <Icon name="alert" size={12} /> Reports never include patient-identifiable data. Generated reports are watermarked with the requester and timestamp.
            </div>
          </div>

          {/* Preview */}
          <div style={{ overflow: 'auto', background: 'var(--bg-elevated)', padding: 24 }}>
            <div id="mfm-report-body" style={{ background: 'var(--paper)', maxWidth: 720, margin: '0 auto', boxShadow: 'var(--shadow-2)', borderRadius: 4 }}>
              {/* Cover */}
              <div style={{ padding: '36px 40px 28px', borderBottom: '4px solid var(--maroon)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
                  <div>
                    <div className="eyebrow" style={{ color: 'var(--maroon)' }}>{reportTitle.toUpperCase()}</div>
                    <h1 className="serif" style={{ fontSize: 26, fontWeight: 600, marginTop: 6, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                      {isPortfolio ? 'MFM Research Portfolio — May 2026' : project.title}
                    </h1>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                      Prepared by Dr. Eran Ashwal · {fmtDate('2026-05-24')} · MFM Research Hub
                    </div>
                  </div>
                  <div style={{ width: 40, height: 40, background: 'var(--maroon)', borderRadius: 6, display: 'grid', placeItems: 'center', color: 'var(--gold)', fontFamily: 'var(--ff-serif)', fontWeight: 700, fontSize: 22 }}>M</div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '24px 40px 40px', fontSize: 13, lineHeight: 1.65, color: 'var(--ink-2)' }}>
                {includeSections.summary && (
                  <section style={{ marginBottom: 22 }}>
                    <div className="eyebrow" style={{ color: 'var(--muted)' }}>Executive summary</div>
                    {isPortfolio ? (
                      <p style={{ marginTop: 8 }}>
                        The MFM research portfolio currently includes <strong>{projects.length} active projects</strong>, of which {PROJECTS.filter(p => p.health === 'green').length} are on track, {PROJECTS.filter(p => p.health === 'amber').length} need attention, and {PROJECTS.filter(p => p.awaitingReview).length} await PI review. Three projects are in the final stages: <strong>FGR-GDM</strong> manuscript is ready for PI review, <strong>CARDIO-PE</strong> has been submitted to journal, and <strong>ACS-TIMING</strong> is in internal review. Recruitment milestones for <strong>DOPPLER-CEL</strong> are now four days overdue and warrant immediate follow-up.
                      </p>
                    ) : (
                      <p style={{ marginTop: 8 }}>
                        <strong>{project.acronym}</strong> is a {project.studyDesign.toLowerCase()} currently in the <strong>{project.status}</strong> phase, with <strong>{project.progress}% completion</strong>. The project began {fmtDate(project.start)} with a target completion of {fmtDate(project.target)}. Lead trainee {personById(project.lead)?.name} is responsible for day-to-day execution under supervision of {personById(project.pi)?.name}. The project is currently rated as <strong>{healthLabel(project.health).toLowerCase()}</strong>{project.awaitingReview ? '; an item is currently awaiting PI review' : ''}.
                      </p>
                    )}
                  </section>
                )}

                {!isPortfolio && includeSections.summary && (
                  <section style={{ marginBottom: 22 }}>
                    <div className="eyebrow" style={{ color: 'var(--muted)' }}>Recommended PI actions</div>
                    <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                      <li>Confirm cut-points for risk categorization with biostatistician.</li>
                      <li>Review and approve the latest progress update from {personById(project.lead)?.name}.</li>
                      <li>Schedule check-in before the next milestone ({fmtDate(project.nextDue)}).</li>
                    </ul>
                  </section>
                )}

                {includeSections.milestones && (
                  <section style={{ marginBottom: 22 }}>
                    <div className="eyebrow" style={{ color: 'var(--muted)' }}>Milestones & timeline</div>
                    {isPortfolio ? (
                      <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ textAlign: 'left', padding: '6px 4px', fontWeight: 600, color: 'var(--muted)' }}>Project</th>
                            <th style={{ textAlign: 'left', padding: '6px 4px', fontWeight: 600, color: 'var(--muted)' }}>Next milestone</th>
                            <th style={{ textAlign: 'left', padding: '6px 4px', fontWeight: 600, color: 'var(--muted)' }}>Due</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projects.slice(0, 8).map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                              <td style={{ padding: '6px 4px' }}><strong className="mono">{p.acronym}</strong></td>
                              <td style={{ padding: '6px 4px' }}>{p.nextMilestone}</td>
                              <td style={{ padding: '6px 4px', color: new Date(p.nextDue) < new Date('2026-05-24') ? 'var(--status-red)' : 'inherit' }}>{fmtDate(p.nextDue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ marginTop: 10 }}>
                        {(MILESTONES[project.id] || []).slice(0, 6).map(m => {
                          const isDone = m.status === 'done';
                          return (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8, fontSize: 12 }}>
                              <span style={{ width: 14, height: 14, borderRadius: '50%', background: isDone ? 'var(--status-green)' : m.status === 'in_progress' ? 'var(--maroon)' : 'var(--border-strong)', display: 'inline-grid', placeItems: 'center', color: '#fff', flexShrink: 0, marginTop: 2 }}>
                                {isDone && <Icon name="check" size={8} stroke={3.5} />}
                              </span>
                              <div style={{ flex: 1 }}>
                                <strong style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--muted)' : 'var(--ink)' }}>{m.title}</strong>
                                <span style={{ color: 'var(--muted)' }}> · {fmtDate(m.due)} · {personById(m.owner)?.name}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}

                {includeSections.tasks && !isPortfolio && (
                  <section style={{ marginBottom: 22 }}>
                    <div className="eyebrow" style={{ color: 'var(--muted)' }}>Open tasks</div>
                    <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                      {(TASKS[project.id] || []).filter(t => t.status !== 'done').slice(0, 5).map(t => (
                        <li key={t.id} style={{ marginBottom: 4 }}>
                          {t.title} — <span style={{ color: 'var(--muted)' }}>{personById(t.owner)?.name}, due {fmtDate(t.due)} ({t.priority})</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {includeSections.updates && (
                  <section style={{ marginBottom: 22 }}>
                    <div className="eyebrow" style={{ color: 'var(--muted)' }}>Recent progress updates</div>
                    <div style={{ marginTop: 10 }}>
                      {UPDATES.filter(u => isPortfolio || u.project === project.id).slice(0, 3).map(u => {
                        const p = PROJECTS.find(p => p.id === u.project);
                        return (
                          <div key={u.id} style={{ marginBottom: 10, padding: 10, background: 'var(--bg-elevated)', borderRadius: 4, fontSize: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong>{personById(u.user)?.name}</strong>
                              <span style={{ color: 'var(--muted)' }}>{p?.acronym} · {fmtDate(u.date)}</span>
                            </div>
                            <p style={{ marginTop: 4 }}>{u.completed}</p>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {includeSections.files && !isPortfolio && (
                  <section style={{ marginBottom: 22 }}>
                    <div className="eyebrow" style={{ color: 'var(--muted)' }}>File inventory</div>
                    <p style={{ marginTop: 6 }}>
                      {project.fileCount} files across nine folders. Latest uploads include the multivariable model (v3, May 22), Table 1 descriptive stats (v2, May 15), and Figure 1 (May 18).
                    </p>
                  </section>
                )}

                {includeSections.activity && !isPortfolio && (
                  <section>
                    <div className="eyebrow" style={{ color: 'var(--muted)' }}>Activity log (excerpt)</div>
                    <ul style={{ marginTop: 6, paddingLeft: 18, fontSize: 12, color: 'var(--muted)' }}>
                      {ACTIVITY.filter(a => a.project === project.id).slice(0, 4).map(a => (
                        <li key={a.id}>{fmtDate(a.date)} — {personById(a.user)?.name} {a.text}{a.detail ? `: ${a.detail}` : ''}</li>
                      ))}
                    </ul>
                  </section>
                )}

                <div style={{ marginTop: 36, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)' }}>
                  <span>MFM Research Hub · Generated by Dr. Eran Ashwal</span>
                  <span>Page 1 of 1 · {fmtDate('2026-05-24')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-f">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={copyShareLink}>
            <Icon name="link" size={14} /> Copy page link
          </button>
          <button className="btn btn-primary" onClick={doExport} disabled={exporting}>
            {exporting ? (
              <><span className="skel" style={{ width: 14, height: 14, borderRadius: '50%' }} /> Generating…</>
            ) : (
              <>
                {format === 'pdf' && <><Icon name="download" size={14} /> {recipients ? 'Download + email' : 'Download as PDF'}</>}
                {format === 'docx' && <><Icon name="download" size={14} /> {recipients ? 'Download + email' : 'Download as Word'}</>}
                {format === 'md' && <><Icon name="download" size={14} /> {recipients ? 'Download + email' : 'Download as Markdown'}</>}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

window.ReportModal = ReportModal;
