import { Component, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  type User
} from 'firebase/auth';
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  Code2,
  CreditCard,
  Home,
  Lightbulb,
  LogOut,
  Menu,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { auth, googleProvider, testFirestoreConnection } from './lib/firebase';
import {
  checkIsAdmin,
  subscribeCampusEvents,
  subscribeMyConnections,
  subscribeMyIdeas,
  subscribeMySubmittedOpportunities,
  subscribeOpportunities,
  subscribeProjects,
  subscribePublicIdeas,
  subscribePublicStudents,
  subscribeSkillExchanges,
} from './lib/kluService';
import {
  ADMIN_BOOTSTRAP_EMAIL,
  getArchetypeMeta,
  type CampusEvent,
  type Connection,
  type Opportunity,
  type ProjectTeam,
  type SkillExchange,
  type StartupIdea,
  type StudentPublic,
} from './types/klu';
import { LandingPage } from './components/LandingPage';
import { KluTribeLogo } from './components/KluTribeLogo';
import { PublicPassView } from './components/PublicPassView';
import { OnboardingFlow } from './components/OnboardingFlow';
import { DashboardHome } from './components/DashboardHome';
import { TribePassCard } from './components/TribePassCard';
import { NetworkView } from './components/NetworkView';
import { IdeaBoardView } from './components/IdeaBoardView';
import { SkillExchangeView } from './components/SkillExchangeView';
import { ProjectsView } from './components/ProjectsView';
import { OpportunitiesView } from './components/OpportunitiesView';
import { CampusView } from './components/CampusView';
import { LeaderboardView } from './components/LeaderboardView';
import { SettingsView } from './components/SettingsView';
import { AdminDashboardView } from './components/AdminDashboardView';

type WorkspaceTab =
  | 'dashboard'
  | 'pass'
  | 'network'
  | 'ideas'
  | 'skills'
  | 'projects'
  | 'opportunities'
  | 'campus'
  | 'leaderboard'
  | 'settings'
  | 'admin';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090B] text-[#F5F5F5] flex items-center justify-center p-6">
          <div className="max-w-md rounded-2xl border border-[#27272A] bg-[#141417] p-6 space-y-3">
            <h1 className="font-display text-lg font-semibold">Unable to complete operation</h1>
            <p className="text-xs text-zinc-400 break-words">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [publicPassParam, setPublicPassParam] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('pass');
  });

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [students, setStudents] = useState<StudentPublic[]>([]);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [publicIdeas, setPublicIdeas] = useState<StartupIdea[]>([]);
  const [myPrivateIdeas, setMyPrivateIdeas] = useState<StartupIdea[]>([]);
  const [skillExchanges, setSkillExchanges] = useState<SkillExchange[]>([]);
  const [projects, setProjects] = useState<ProjectTeam[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [myOppSubmissions, setMyOppSubmissions] = useState<Opportunity[]>([]);
  const [campusEvents, setCampusEvents] = useState<CampusEvent[]>([]);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('dashboard');
  const [showLanding, setShowLanding] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    testFirestoreConnection();
    const unsubAuth = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        const adminStatus = await checkIsAdmin(
          nextUser.uid,
          nextUser.email,
          nextUser.emailVerified
        );
        setIsAdmin(adminStatus);
        if (!adminStatus) {
          setActiveTab((prev) => (prev === 'admin' ? 'dashboard' : prev));
        }
      } else {
        setIsAdmin(false);
        setActiveTab((prev) => (prev === 'admin' ? 'dashboard' : prev));
      }
      setAuthReady(true);
    });
    return () => unsubAuth();
  }, []);

  // Subscribe to workspace collections only after auth is ready & user signed in
  useEffect(() => {
    if (!authReady || !user) {
      setStudents([]);
      setStudentsLoaded(false);
      setConnections([]);
      setPublicIdeas([]);
      setMyPrivateIdeas([]);
      setSkillExchanges([]);
      setProjects([]);
      setOpportunities([]);
      setMyOppSubmissions([]);
      setCampusEvents([]);
      return;
    }

    const unsubStudents = subscribePublicStudents((rows) => {
      setStudents(rows);
      setStudentsLoaded(true);
    });
    const unsubConns = subscribeMyConnections(user.uid, setConnections);
    const unsubIdeas = subscribePublicIdeas(setPublicIdeas);
    const unsubMyIdeas = subscribeMyIdeas(user.uid, setMyPrivateIdeas);
    const unsubSkills = subscribeSkillExchanges(setSkillExchanges);
    const unsubProjects = subscribeProjects(setProjects);
    const unsubOpps = subscribeOpportunities(setOpportunities);
    const unsubMyOpps = subscribeMySubmittedOpportunities(user.uid, setMyOppSubmissions);
    const unsubEvents = subscribeCampusEvents(setCampusEvents);

    return () => {
      unsubStudents();
      unsubConns();
      unsubIdeas();
      unsubMyIdeas();
      unsubSkills();
      unsubProjects();
      unsubOpps();
      unsubMyOpps();
      unsubEvents();
    };
  }, [authReady, user]);

  
useEffect(() => {
  getRedirectResult(auth).catch((err) => {
    setAuthError(
      err instanceof Error
        ? err.message
        : 'Google Sign-In failed.'
    );
    setSigningIn(false);
  });
}, []);
  const handleSignOut = async () => {
    await signOut(auth);
    setActiveTab('dashboard');
    setShowLanding(false);
  };

  if (publicPassParam) {
    return (
      <ErrorBoundary>
        <PublicPassView
          memberNumber={publicPassParam}
          onExit={() => {
            setPublicPassParam(null);
            window.history.replaceState({}, '', window.location.pathname);
          }}
        />
      </ErrorBoundary>
    );
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#F5F5F5] flex items-center justify-center text-sm text-zinc-400">
        Loading KLU TRIBE...
      </div>
    );
  }

  const me = user ? students.find((s) => s.uid === user.uid) || null : null;

  // Landing Page when logged out or explicitly visiting landing
  if (!user || showLanding) {
    return (
      <ErrorBoundary>
        {authError && (
          <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-red-500/40 bg-[#141417] px-4 py-3 text-xs text-red-300">
            {authError}
          </div>
        )}
        <LandingPage
          isSignedIn={Boolean(user)}
          hasProfile={Boolean(me)}
          signingIn={signingIn}
          onPrimaryAction={() => {
            if (user) {
              setShowLanding(false);
            } else {
              handleGoogleSignIn();
            }
          }}
        />
      </ErrorBoundary>
    );
  }

  if (!studentsLoaded) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#F5F5F5] flex items-center justify-center text-sm text-zinc-400">
        Syncing your KLU TRIBE workspace...
      </div>
    );
  }

  // Onboarding when authenticated user doesn't have a student profile yet
  if (!me) {
    return (
      <ErrorBoundary>
        <OnboardingFlow
          uid={user.uid}
          email={user.email || ''}
          displayName={user.displayName || ''}
          onComplete={() => setActiveTab('pass')}
          onSignOut={handleSignOut}
        />
      </ErrorBoundary>
    );
  }

  if (me.isSuspended) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#F5F5F5] flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-[#27272A] bg-[#141417] p-6 space-y-4">
          <h1 className="font-display text-xl font-bold text-red-400">Account Suspended</h1>
          <p className="text-sm text-zinc-400">
            This KLU TRIBE account has been suspended by campus moderators. Contact administration if you believe this is an error.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-xl border border-[#27272A] px-4 py-2 text-xs text-zinc-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Merge public ideas and own private ideas without duplicates
  const mergedIdeas = [
    ...publicIdeas,
    ...myPrivateIdeas.filter((priv) => !publicIdeas.some((pub) => pub.id === priv.id)),
  ];

  const pendingIncoming = connections.filter((c) => c.status === 'pending' && c.toUid === me.uid);

  const navItems: { id: WorkspaceTab; label: string; icon: typeof Home }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'pass', label: 'My Tribe Pass', icon: CreditCard },
    { id: 'network', label: 'Tribe Network', icon: Users },
    { id: 'ideas', label: 'Idea Board', icon: Lightbulb },
    { id: 'skills', label: 'Skill Exchange', icon: ArrowLeftRight },
    { id: 'projects', label: 'Projects & Teams', icon: Code2 },
    { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
    { id: 'campus', label: 'Campus Life', icon: Calendar },
    { id: 'leaderboard', label: 'Leaderboard', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const isAuthorizedAdmin = Boolean(
    isAdmin &&
      user.emailVerified &&
      user.email?.trim().toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase()
  );

  if (isAuthorizedAdmin) {
    navItems.push({ id: 'admin', label: 'Admin Console', icon: Shield });
  }

  const activeNavLabel = navItems.find((n) => n.id === activeTab)?.label || 'Dashboard';

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#09090B] text-[#F5F5F5] flex">
        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-[#27272A] bg-[#09090B]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272A]">
            <button
              type="button"
              onClick={() => setShowLanding(true)}
              className="inline-flex items-center hover:opacity-90 transition-opacity"
              aria-label="KLU TRIBE Home"
            >
              <KluTribeLogo variant="compact" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-[#141417] text-emerald-400 border border-[#27272A]'
                      : 'text-zinc-400 hover:text-[#F5F5F5] hover:bg-[#141417]/50'
                  }`}
                >
                  <span className="inline-flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </span>
                  {item.id === 'network' && pendingIncoming.length > 0 && (
                    <span className="font-mono text-[11px] text-emerald-400">
                      {pendingIncoming.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-[#27272A] p-4 space-y-2.5">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#F5F5F5] truncate">{me.fullName}</p>
              <p className="font-mono text-[11px] text-zinc-500">#{me.memberNumber}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowLanding(true)}
              className="w-full inline-flex items-center gap-2 rounded-xl border border-[#27272A] bg-[#141417] px-3 py-2 text-xs text-zinc-200 hover:border-zinc-500 hover:text-white transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-emerald-400" />
              Go To Home page
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full inline-flex items-center gap-2 rounded-xl border border-[#27272A] bg-[#141417] px-3 py-2 text-xs text-zinc-300 hover:text-white"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/75"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-64 bg-[#09090B] border-r border-[#27272A] flex flex-col justify-between p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
                  <KluTribeLogo variant="compact" />
                  <button type="button" onClick={() => setMobileMenuOpen(false)}>
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium ${
                          activeTab === item.id
                            ? 'bg-[#141417] text-emerald-400 border border-[#27272A]'
                            : 'text-zinc-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLanding(true);
                  }}
                  className="w-full inline-flex items-center gap-2 rounded-xl border border-[#27272A] bg-[#141417] px-3 py-2 text-xs text-zinc-200"
                >
                  <Home className="w-3.5 h-3.5 text-emerald-400" />
                  Go To Home page
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full inline-flex items-center gap-2 rounded-xl border border-[#27272A] px-3 py-2 text-xs text-zinc-300"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Viewport */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0 pb-16 lg:pb-0">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 border-b border-[#27272A] bg-[#09090B]/95 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden rounded-lg border border-[#27272A] p-2 text-zinc-300"
                  aria-label="Open menu"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <span className="text-xs text-zinc-400">
                  KLU TRIBE <span className="mx-1.5 text-zinc-600">/</span>{' '}
                  <span className="text-[#F5F5F5] font-medium">{activeNavLabel}</span>
                </span>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 relative">
                <button
                  type="button"
                  onClick={() => setShowLanding(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#27272A] bg-[#141417] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500 hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  <Home className="w-3.5 h-3.5 text-emerald-400" />
                  Go To Home page
                </button>

                <button
                  type="button"
                  onClick={() => setShowNotifications((v) => !v)}
                  className="relative rounded-xl border border-[#27272A] bg-[#141417] p-2 text-zinc-300 hover:text-white"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {pendingIncoming.length > 0 && (
                    <span className="absolute -top-1 -right-1 rounded-full bg-emerald-500 px-1.5 text-[10px] font-mono font-bold text-zinc-950">
                      {pendingIncoming.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('pass')}
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-[#27272A] bg-[#141417] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500 whitespace-nowrap shrink-0"
                >
                  {me.fullName.split(' ')[0]} · #{me.memberNumber}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-12 w-72 rounded-2xl border border-[#27272A] bg-[#141417] p-4 shadow-xl z-40 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">Notifications</p>
                      <button
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="text-zinc-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {pendingIncoming.length === 0 ? (
                      <p className="text-xs text-zinc-400">No pending connection requests.</p>
                    ) : (
                      <div className="space-y-2">
                        {pendingIncoming.map((req) => (
                          <button
                            key={req.id}
                            type="button"
                            onClick={() => {
                              setActiveTab('network');
                              setShowNotifications(false);
                            }}
                            className="w-full text-left rounded-xl border border-[#27272A] bg-[#09090B] p-2.5 text-xs hover:border-emerald-500"
                          >
                            <span className="font-medium text-[#F5F5F5]">{req.fromName}</span> sent a connection request.
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
            {activeTab === 'dashboard' && (
              <DashboardHome
                me={me}
                allStudents={students}
                connections={connections}
                events={campusEvents}
                onNavigate={(tab) => setActiveTab(tab as WorkspaceTab)}
              />
            )}

            {activeTab === 'pass' && (
              <div className="max-w-2xl space-y-6">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">
                    Premium Digital Tribe Pass
                  </h1>
                  <p className="text-sm text-zinc-400">
                    Your official KL University digital membership card. QR verification encodes only your safe public identifier.
                  </p>
                </div>
                <TribePassCard
                  student={me}
                  onEditClick={() => setActiveTab('settings')}
                />
                <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-5 space-y-2">
                  <p className="text-xs text-zinc-400">Selected Archetype & Secondary Interests</p>
                  <p
                    className="font-display text-base font-semibold"
                    style={{ color: getArchetypeMeta(me.primaryCategory).accentHex }}
                  >
                    {getArchetypeMeta(me.primaryCategory).name}
                  </p>
                  {me.secondaryInterests.length > 0 && (
                    <p className="text-xs text-zinc-300">
                      Secondary Interests: {me.secondaryInterests.join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'network' && (
              <NetworkView me={me} students={students} connections={connections} />
            )}

            {activeTab === 'ideas' && (
              <IdeaBoardView
                me={me}
                ideas={mergedIdeas}
                students={students}
                connections={connections}
              />
            )}

            {activeTab === 'skills' && (
              <SkillExchangeView
                me={me}
                exchanges={skillExchanges}
                students={students}
                connections={connections}
              />
            )}

            {activeTab === 'projects' && <ProjectsView me={me} projects={projects} />}

            {activeTab === 'opportunities' && (
              <OpportunitiesView
                me={me}
                isAdmin={isAuthorizedAdmin}
                opportunities={opportunities}
                mySubmissions={myOppSubmissions}
              />
            )}

            {activeTab === 'campus' && <CampusView me={me} events={campusEvents} />}

            {activeTab === 'leaderboard' && (
              <LeaderboardView
                students={students}
                ideas={publicIdeas}
                projects={projects}
                events={campusEvents}
              />
            )}

            {activeTab === 'settings' && <SettingsView me={me} />}

            {activeTab === 'admin' && isAuthorizedAdmin && (
              <AdminDashboardView
                adminUid={user.uid}
                adminEmail={user.email || ''}
                ideas={mergedIdeas}
                onGoHome={() => setShowLanding(true)}
              />
            )}
          </main>
        </div>

        {/* Compact Mobile Bottom Nav (4 core items, <= 15% viewport height) */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden grid grid-cols-4 border-t border-[#27272A] bg-[#09090B]/95 backdrop-blur-sm">
          {[
            { id: 'dashboard' as WorkspaceTab, label: 'Home', icon: Home },
            { id: 'pass' as WorkspaceTab, label: 'Pass', icon: CreditCard },
            { id: 'network' as WorkspaceTab, label: 'Tribe', icon: Users },
            { id: 'ideas' as WorkspaceTab, label: 'Ideas', icon: Lightbulb },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium ${
                  active ? 'text-emerald-400' : 'text-zinc-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </ErrorBoundary>
  );
}
