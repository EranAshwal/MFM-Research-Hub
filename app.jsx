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
  // Check URL for invite token — handle accept-invite flow first
  const inviteToken = new URLSearchParams(location.search).get('invite');

  const [, force] = useState(0);
  const [route, setRoute] = useState({ page: 'landing' });
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState('');
  const [collapsedFromUser, setCollapsedFromUser] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  // Global helper so any deeply-nested button can open the new-project modal
  useEffect(() => {
    window.__openNewProject = () => setShowNewProject(true);
    return () => { delete window.__openNewProject; };
  }, []);
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

  // Restore real Supabase session on mount + subscribe to auth changes
  useEffect(() => {
    if (!window.AuthService) return;
    const person = window.AuthService.getCurrentPerson();
    if (person) {
      setCurrentUser(person);
      setRoute({ page: 'dashboard' });
    }
    const off = window.AuthService.onChange((session, person) => {
      if (person) {
        setCurrentUser(person);
        if (!session || route.page === 'landing') setRoute({ page: 'dashboard' });
      } else {
        setCurrentUser(null);
        setRoute({ page: 'landing' });
      }
    });
    return off;
  }, []);

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

  const onSignOut = async () => {
    if (window.AuthService) {
      await window.AuthService.signOut();
    }
    setCurrentUser(null);
    setRoute({ page: 'landing' });
  };

  const addUpdate = async (u) => {
    try {
      await window.DataService.submitProgressUpdate(u);
      toast(`Update submitted`);
    } catch (err) {
      toast('Submit failed: ' + err.message, 'error');
    }
    setNotifs(n => [{ id: `n-${Date.now()}`, type: 'update', project: u.project, text: `${personById(u.user)?.name} submitted a progress update`, date: u.date, unread: true }, ...n]);
  };

  const sendNotification = async ({ recipients, projectId, message, template, channel }) => {
    if (!recipients?.length) return;
    const recipientNames = recipients.map(id => personById(id)?.name.split(' ').slice(-1)[0]).join(', ');
    setShowNotify(false);
    try {
      if (window.DataService) {
        await window.DataService.sendNotes({
          senderId: currentUser?.id,
          recipients,
          projectId: projectId || null,
          template: template || null,
          body: message,
          channel,
        });
      }
      toast(`Notification sent to ${recipientNames}`);
    } catch (e) {
      toast('Send failed: ' + (e.message || e), 'error');
      return;
    }
    // Add to in-app notifications feed (visual only)
    const newNotifs = recipients.map((rid, i) => ({
      id: `n-${Date.now()}-${i}`,
      type: 'update',
      project: projectId || (PROJECTS.find(p => p.lead === rid)?.id || PROJECTS[0]?.id),
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

  // ---- Accept-invite flow (URL ?invite=TOKEN) ----
  if (inviteToken) {
    return (
      <>
        <AcceptInviteScreen token={inviteToken} />
        <Toast toasts={toasts} />
      </>
    );
  }

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

  // ---- Pending approval gate ----
  // Signed in but not approved by admin yet — show waitlist screen.
  if (currentUser && !currentUser.isAdmin && !currentUser.isApproved) {
    return (
      <>
        <PendingApprovalScreen currentUser={currentUser} onSignOut={onSignOut} />
        <Toast toasts={toasts} />
      </>
    );
  }

  // ---- Authenticated shell ----
  let pageEl = null;
  if (route.page === 'dashboard') pageEl = <Dashboard navigate={navigate} tweaks={t} toast={toast} openReport={openReport} currentUser={currentUser} showOnboarding={showOnboarding} dismissOnboarding={() => setShowOnboarding(false)} />;
  else if (route.page === 'projects' && route.id) {
    const project = PROJECTS.find(p => p.id === route.id);
    if (!project) pageEl = <div className="page"><h2>Project not found</h2></div>;
    // Any signed-in user can view a project. Role-specific actions (edit,
    // approve updates, manage members) are gated inside ProjectDetail.
    else pageEl = <ProjectDetail project={project} route={route} navigate={navigate} toast={toast} updates={updates} addUpdate={addUpdate} openReport={openReport} />;
  }
  else if (route.page === 'projects') pageEl = <ProjectsRegistry navigate={navigate} search={search} tweaks={t} currentUser={currentUser} />;
  else if (route.page === 'inbox') pageEl = <InboxPage navigate={navigate} updates={updates} toast={toast} openReply={(update, project) => setAiReply({ update, project })} currentUser={currentUser} />;
  else if (route.page === 'deadlines') pageEl = <DeadlinesPage navigate={navigate} toast={toast} />;
  else if (route.page === 'tasks') pageEl = <MyTasksPage navigate={navigate} currentUser={currentUser} toast={toast} />;
  else if (route.page === 'updates') pageEl = <TraineeUpdatesPage navigate={navigate} updates={updates} />;
  else if (route.page === 'reports') pageEl = <ReportsPage openReport={openReport} />;
  else if (route.page === 'publications') pageEl = <PublicationsPage toast={toast} />;
  else if (route.page === 'calendar') pageEl = <CalendarPage navigate={navigate} />;
  else if (route.page === 'files') pageEl = <FilesGlobalPage navigate={navigate} />;
  else if (route.page === 'people') pageEl = <PeoplePage navigate={navigate} route={route} toast={toast} />;
  else if (route.page === 'users' && currentUser.isAdmin) pageEl = <UsersAdminPage toast={toast} />;
  else if (route.page === 'notes') pageEl = <NotesInboxPage currentUser={currentUser} navigate={navigate} toast={toast} />;
  else if (route.page === 'settings') pageEl = <SettingsPage tweaks={t} setTweak={setTweak} toast={toast} />;
  else pageEl = <Dashboard navigate={navigate} tweaks={t} toast={toast} openReport={openReport} currentUser={currentUser} showOnboarding={showOnboarding} dismissOnboarding={() => setShowOnboarding(false)} />;

  return (
    <div className="app-shell">
      <Sidebar route={route} navigate={navigate} collapsed={collapsed} currentUser={currentUser}
               awaitingReview={awaitingReview} awaitingUpdate={awaitingUpdate}
               mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)}
               onSignOut={onSignOut} />
      <div className={`mobile-scrim ${mobileOpen ? 'show' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className="main">
        <Topbar collapsed={collapsed} setCollapsed={setCollapsed} search={search} setSearch={setSearch}
                currentUser={currentUser} setShowNotif={setShowNotif} unreadCount={unreadCount}
                navigate={navigate} route={route}
                openMobile={() => setMobileOpen(true)}
                onSendNotification={() => setShowNotify(true)}
                onNewProject={() => setShowNewProject(true)} />
        {pageEl}
      </div>
      <MobileBottomNav route={route} navigate={navigate} onSendNotification={() => setShowNotify(true)} />
      <NotificationDrawer open={showNotif} onClose={() => setShowNotif(false)} notifications={notifs}
                          navigate={navigate} markRead={() => { setNotifs(notifs.map(n => ({ ...n, unread: false }))); }} />
      <SendNotificationModal open={showNotify} onClose={() => setShowNotify(false)} onSend={sendNotification} currentUser={currentUser} />
      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} toast={toast} navigate={navigate} currentUser={currentUser} />}
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

const __mfmRoot = ReactDOM.createRoot(document.getElementById('root'));
__mfmRoot.render(null); // placeholder; bootstrap re-renders the real App

window.mountApp = () => {
  __mfmRoot.render(<App />);
};
