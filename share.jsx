/* MFM Research Hub — Share modal
   Lets a signed-in user pass the app along to a colleague.
   On phones it opens the native share sheet (Messages, Mail, WhatsApp, …);
   everywhere it offers explicit Email / Text message / Copy link actions.
*/

const ShareModal = ({ open, onClose, toast }) => {
  if (!open) return null;

  // Clean app URL — drop any ?invite / #hash so we share the front door.
  const url = (typeof location !== 'undefined')
    ? location.origin + location.pathname
    : '';
  const appName = 'MFM Research Hub';
  const blurb = `Take a look at the ${appName} — our Maternal-Fetal Medicine research workspace.`;
  const canNative = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const [copied, setCopied] = React.useState(false);

  const nativeShare = async () => {
    try {
      await navigator.share({ title: appName, text: blurb, url });
    } catch (e) {
      // user cancelled or unsupported — silent
    }
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`${appName}`);
    const body = encodeURIComponent(`${blurb}\n\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareText = () => {
    // sms:?&body= is the most broadly-compatible form across iOS/Android.
    const body = encodeURIComponent(`${blurb} ${url}`);
    window.location.href = `sms:?&body=${body}`;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch (e) {
      // Fallback for older/insecure contexts
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (_) {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast?.('Link copied to clipboard');
    setTimeout(() => setCopied(false), 1800);
  };

  const Row = ({ icon, label, sub, onClick, accent }) => (
    <button type="button" onClick={onClick}
            style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
                     padding: '13px 14px', borderRadius: 10, border: '1px solid var(--border)',
                     background: 'var(--paper)' }}>
      <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 9, display: 'grid', placeItems: 'center',
                     background: accent ? 'var(--maroon)' : 'var(--bg-elevated)',
                     color: accent ? '#fff' : 'var(--maroon)' }}>
        <Icon name={icon} size={18} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{label}</span>
        {sub && <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{sub}</span>}
      </span>
      <Icon name="chevronRight" size={15} color="var(--muted)" />
    </button>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>Share the Hub</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Invite a colleague to the workspace.</div>
          </div>
          <button type="button" className="btn-icon btn-ghost" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {canNative && (
            <Row icon="share" label="Share…" sub="Open your phone's share menu" onClick={nativeShare} accent />
          )}
          <Row icon="mail" label="Email" sub="Send a link by email" onClick={shareEmail} />
          <Row icon="phone" label="Text message" sub="Send a link by SMS" onClick={shareText} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
                        border: '1px solid var(--border)', borderRadius: 10, padding: '8px 8px 8px 14px', background: 'var(--bg-elevated)' }}>
            <Icon name="link" size={15} color="var(--muted)" />
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--ink-2)', fontFamily: 'var(--ff-mono, monospace)',
                           whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{url}</span>
            <button type="button" className="btn btn-sm btn-primary" onClick={copyLink} style={{ flexShrink: 0 }}>
              <Icon name={copied ? 'check' : 'copy'} size={13} /> {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ShareModal });
