/* MFM Research Hub — top-level app: router, state, tweaks, theme */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "shell": "maroon",
  "density": "comfortable",
  "dashboard": "cards",
  "sidebar": "labels",
  "cardVariant": "rich"
}/*EDITMODE-END*/;

function App() {
  const [route, setRoute] = useState({ page: 'landing' });
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState('');
  const [collapsedFromUser, setCollapsedFromUser] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [report, setReport] = useState(null); // { type, project }
  const [aiReply, setAiReply] = useState(null); // { update, project }
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [updates, setUpdates] = useState(UPDATES);
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const [toasts, setToasts] = useState([]);
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply theme + shell to body
  useEffect(() => {
    document.documentElement.dataset.theme = t.theme;
    document.documentElement.dataset.shell = t.theme === 'dark' ? 'dark' : t.shell;
    document.documentElement.dataset.density = t.density;
  }, [t.theme, t.shell, t.density]);

  // Navigate
  const navigate = (next) => {
    if (next.page !== 'landing' && !currentUser && next.page !== 'login') {
      // require login for app pages
      setShowLogin(true);
      return;
    }
    setRoute(next);
    setShowNotif(false);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Toasts
  const toast = (text, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(ts => [...ts, { id, text, type }]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 3200);
  };

  const onSignIn = (user) => {
    setCurrentUser(user);
    setShowLogin(false);
    setRoute({ page: 'dashboard' });
    toast(`Welcome back, ${user.name.split(' ')[0]}`);
  };

  const onSignOut = () => {
    setCurrentUser(null);
    setRoute({ page: 'landing' });
  };

  const addUpdate = (u) => {
    setUpdates(arr => [u, ...arr]);
    setNotifs(n => [{ id: `n-${Date.now()}`, type: 'update', project: u.project, text: `${personById(u.user)?.name} submitted a progress update`, date: u.date, unread: true }, ...n]);
  };

  const sendNotification = ({ recipients, projectId, message }) => {
    const recipientNames = recipients.map(id => personById(id)?.name.split(' ').slice(-1)[0]).join(', ');
    setShowNotify(false);
    toast(`Notification sent to ${recipientNames}`);
    // Add to notifications feed
    const newNotifs = recipients.map((rid, i) => ({
      id: `n-${Date.now()}-${i}`,
      type: 'update',
      project: projectId || (PROJECTS.find(p => p.lead === rid)?.id || PROJECTS[0].id),
      text: `You sent a notification to ${personById(rid)?.name}`,
      date: new Date().toISOString().slice(0, 10),
      unread: false,
    }));
    setNotifs(n => [...newNotifs, ...n]);
  };

  const unreadCount = notifs.filter(n => n.unread).length;
  const awaitingReview = PROJECTS.filter(p => p.awaitingReview).length;
  const awaitingUpdate = PROJECTS.filter(p => p.awaitingUpdate).length;

  const collapsed = t.sidebar === 'icons' || collapsedFromUser;
  const setCollapsed = (v) => {
    setCollapsedFromUser(v);
    setTweak('sidebar', v ? 'icons' : 'labels');
  };

  // Open report
  const openReport = (type, project = null) => setReport({ type, project });

  // ---- Landing / login flow ----
  if (route.page === 'landing' || !currentUser) {
    return (
      <>
        <PublicLanding navigate={navigate} setShowLogin={setShowLogin} />
        <LoginModal open={showLogin} onClose={() => setShowLogin(false)} onSignIn={onSignIn} />
        <Toast toasts={toasts} />
      </>
    );
  }

  // ---- Authenticated shell ----
  let pageEl = null;
  if (route.page === 'dashboard') pageEl = <Dashboard navigate={navigate} tweaks={t} toast={toast} openReport={openReport} currentUser={currentUser} showOnboarding={showOnboarding} dismissOnboarding={() => setShowOnboarding(false)} />;
  else if (route.page === 'projects' && route.id) {
    const project = PROJECTS.find(p => p.id === route.id);
    if (project) pageEl = <ProjectDetail project={project} route={route} navigate={navigate} toast={toast} updates={updates} addUpdate={addUpdate} openReport={openReport} />;
    else pageEl = <div className="page"><h2>Project not found</h2></div>;
  }
  else if (route.page === 'projects') pageEl = <ProjectsRegistry navigate={navigate} search={search} tweaks={t} />;
  else if (route.page === 'inbox') pageEl = <InboxPage navigate={navigate} updates={updates} toast={toast} openReply={(update, project) => setAiReply({ update, project })} />;
  else if (route.page === 'deadlines') pageEl = <DeadlinesPage navigate={navigate} toast={toast} />;
  else if (route.page === 'tasks') pageEl = <MyTasksPage navigate={navigate} currentUser={currentUser} toast={toast} />;
  else if (route.page === 'updates') pageEl = <TraineeUpdatesPage navigate={navigate} updates={updates} />;
  else if (route.page === 'reports') pageEl = <ReportsPage openReport={openReport} />;
  else if (route.page === 'publications') pageEl = <PublicationsPage toast={toast} />;
  else if (route.page === 'calendar') pageEl = <CalendarPage navigate={navigate} />;
  else if (route.page === 'files') pageEl = <FilesGlobalPage navigate={navigate} />;
  else if (route.page === 'people') pageEl = <PeoplePage navigate={navigate} route={route} />;
  else if (route.page === 'settings') pageEl = <SettingsPage tweaks={t} setTweak={setTweak} toast={toast} />;
  else pageEl = <Dashboard navigate={navigate} tweaks={t} toast={toast} openReport={openReport} currentUser={currentUser} showOnboarding={showOnboarding} dismissOnboarding={() => setShowOnboarding(false)} />;

  return (
    <div className="app-shell">
      <Sidebar route={route} navigate={navigate} collapsed={collapsed} currentUser={currentUser}
               awaitingReview={awaitingReview} awaitingUpdate={awaitingUpdate}
               mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className={`mobile-scrim ${mobileOpen ? 'show' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className="main">
        <Topbar collapsed={collapsed} setCollapsed={setCollapsed} search={search} setSearch={setSearch}
                currentUser={currentUser} setShowNotif={setShowNotif} unreadCount={unreadCount}
                navigate={navigate} route={route}
                openMobile={() => setMobileOpen(true)}
                onSendNotification={() => setShowNotify(true)} />
        {pageEl}
      </div>
      <MobileBottomNav route={route} navigate={navigate} onSendNotification={() => setShowNotify(true)} />
      <NotificationDrawer open={showNotif} onClose={() => setShowNotif(false)} notifications={notifs}
                          navigate={navigate} markRead={() => { setNotifs(notifs.map(n => ({ ...n, unread: false }))); }} />
      <SendNotificationModal open={showNotify} onClose={() => setShowNotify(false)} onSend={sendNotification} currentUser={currentUser} />
      <ReportModal open={!!report} onClose={() => setReport(null)} type={report?.type} project={report?.project} toast={toast} />
      {aiReply && <AIReplyModal open={true} update={aiReply.update} project={aiReply.project}
                                 onClose={() => setAiReply(null)}
                                 onSend={(msg) => { toast('Reply sent to ' + personById(aiReply.update.user)?.name.split(' ').slice(-1)[0]); setAiReply(null); }} />}
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} onSignIn={onSignIn} />
      <Toast toasts={toasts} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme">
          <TweakRadio label="Mode" value={t.theme} onChange={(v) => setTweak('theme', v)}
                      options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
          {t.theme === 'light' && (
            <TweakRadio label="Shell" value={t.shell} onChange={(v) => setTweak('shell', v)}
                        options={[{ value: 'maroon', label: 'Maroon' }, { value: 'neutral', label: 'Neutral' }]} />
          )}
        </TweakSection>
        <TweakSection label="Layout">
          <TweakRadio label="Sidebar" value={t.sidebar} onChange={(v) => setTweak('sidebar', v)}
                      options={[{ value: 'labels', label: 'Labels' }, { value: 'icons', label: 'Icons only' }]} />
          <TweakRadio label="Density" value={t.density} onChange={(v) => setTweak('density', v)}
                      options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]} />
        </TweakSection>
        <TweakSection label="Dashboard">
          <TweakRadio label="Layout" value={t.dashboard} onChange={(v) => setTweak('dashboard', v)}
                      options={[{ value: 'cards', label: 'Card-heavy' }, { value: 'table', label: 'Table-dense' }]} />
          <TweakRadio label="Project cards" value={t.cardVariant} onChange={(v) => setTweak('cardVariant', v)}
                      options={[{ value: 'rich', label: 'Rich' }, { value: 'minimal', label: 'Minimal' }]} />
        </TweakSection>
        <TweakSection label="Session">
          <TweakButton label="Open landing page" onClick={() => { setCurrentUser(null); setRoute({ page: 'landing' }); }} />
          <TweakButton label="Sign out" onClick={onSignOut} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(null); // placeholder; bootstrap mounts the real App

window.mountApp = () => {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
};
