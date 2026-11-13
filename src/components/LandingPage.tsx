import { useEffect, useState, type ComponentType } from 'react';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import {
  ArrowRight,
  ShieldCheck,
  Compass,
  Users,
  Briefcase,
  Lightbulb,
  GraduationCap,
  Calendar,
  TrendingUp,
  Rocket,
  Code2,
  Gem,
  Star,
  EyeOff,
  QrCode,
  BadgeCheck,
  Ticket,
} from 'lucide-react';
import { db } from '../lib/firebase';
import { ARCHETYPES, DEFAULT_ROADMAP, type ArchetypeId, type StudentPublic } from '../types/klu';
import { KluTribeLogo } from './KluTribeLogo';
import { TribePassCard } from './TribePassCard';
import heroArchitectureImg from '../assets/images/hero_klu_architecture_1794551682549.jpg';
import corporateArchitectImg from '../assets/images/card_corporate_architect_1794556081786.jpg';
import strategicBuilderImg from '../assets/images/card_strategic_builder_1794556082305.jpg';
import campusMaverickImg from '../assets/images/card_campus_maverick_1794556084634.jpg';
import day1HustlerImg from '../assets/images/card_day1_hustler_1794556082896.jpg';
import wildcardImg from '../assets/images/card_wildcard_1794556083866.jpg';
import journeyCampusSunsetImg from '../assets/images/journey_campus_sunset_1794557617135.jpg';
import journeyProgressTrackerImg from '../assets/images/journey_progress_tracker_1794557617435.jpg';
import journeyStartupBoardImg from '../assets/images/journey_startup_board_1794557618371.jpg';
import journeyHackathonSquadsImg from '../assets/images/journey_hackathon_squads_1794557620527.jpg';
import journeyCampusLifeImg from '../assets/images/journey_campus_life_1794557619375.jpg';
import passShowcaseCampusNightImg from '../assets/images/pass_showcase_campus_night_1794589067667.jpg';
import sampleStudentPortraitImg from '../assets/images/sample_student_portrait_1794589068766.jpg';
import privacyShieldSculptureImg from '../assets/images/privacy_shield_sculpture_1794589389010.jpg';

interface LandingPageProps {
  isSignedIn: boolean;
  hasProfile: boolean;
  onPrimaryAction: () => void;
  signingIn: boolean;
}

interface LiveStats {
  students: number | null;
  verified: number | null;
  ideas: number | null;
  projects: number | null;
  opportunities: number | null;
}

interface BentoCardVisual {
  image: string;
  alt: string;
  Icon: ComponentType<{ className?: string }>;
  buttonHex: string;
  tintHex: string;
  copy: string;
}

const BENTO_VISUALS: Record<ArchetypeId, BentoCardVisual> = {
  'corporate-architect': {
    image: corporateArchitectImg,
    alt: 'Engineering student looking toward modern tech towers at twilight',
    Icon: Briefcase,
    buttonHex: '#2563EB',
    tintHex: '#60A5FA',
    copy: 'Build your career with industry insights, high CGPA discipline, and real-world engineering skills.',
  },
  'strategic-builder': {
    image: strategicBuilderImg,
    alt: 'Student founder working by a high-rise window at dusk',
    Icon: Lightbulb,
    buttonHex: '#7C3AED',
    tintHex: '#A78BFA',
    copy: 'Turn your ideas into real ventures with co-founder matching, mentorship, and strong fundamentals.',
  },
  'campus-maverick': {
    image: campusMaverickImg,
    alt: 'University students celebrating together at sunset on campus',
    Icon: GraduationCap,
    buttonHex: '#EA580C',
    tintHex: '#FB923C',
    copy: 'Lead clubs, organize Samyak and Surabhi, compete in sports, and make campus life unforgettable.',
  },
  'day1-hustler': {
    image: day1HustlerImg,
    alt: 'Developer laptop workspace glowing with code and dark minimal gear',
    Icon: Users,
    buttonHex: '#10B981',
    tintHex: '#34D399',
    copy: 'Freelance, ship real software projects, and launch micro-startups from semester one.',
  },
  wildcard: {
    image: wildcardImg,
    alt: 'Explorer standing on a ridge looking over twilight mountains',
    Icon: Compass,
    buttonHex: '#6366F1',
    tintHex: '#818CF8',
    copy: 'Explore beyond the classroom with creative tech, interdisciplinary research, and personal milestones.',
  },
};

interface JourneyFeatureCard {
  id: string;
  titleLine1: string;
  titleLine2: string;
  summary: string;
  image: string;
  alt: string;
  Icon: ComponentType<{ className?: string }>;
  accentHex: string;
}

const JOURNEY_CARDS: JourneyFeatureCard[] = [
  {
    id: 'progress-tracker',
    titleLine1: '4-Year',
    titleLine2: 'Progress Tracker',
    summary: 'Plan semester milestones from Year 1 fundamentals to Year 4 placements.',
    image: journeyProgressTrackerImg,
    alt: 'Minimal dark studio desk with laptop showing semester progress analytics',
    Icon: TrendingUp,
    accentHex: '#22D3EE',
  },
  {
    id: 'startup-board',
    titleLine1: 'Startup &',
    titleLine2: 'Co-Founder Board',
    summary: 'Publish ideas, match tech stacks, and build ventures across KLU branches.',
    image: journeyStartupBoardImg,
    alt: 'University engineering students collaborating around a laptop in an innovation lab',
    Icon: Rocket,
    accentHex: '#A855F7',
  },
  {
    id: 'hackathon-squads',
    titleLine1: 'Skill Exchange &',
    titleLine2: 'Hackathon Squads',
    summary: 'Swap Java, Python, or UI/UX skills and assemble verified hackathon teams.',
    image: journeyHackathonSquadsImg,
    alt: 'Student developer coding across dual monitors during an evening campus hackathon',
    Icon: Code2,
    accentHex: '#F97316',
  },
  {
    id: 'opportunities',
    titleLine1: 'Moderated Opportunities &',
    titleLine2: 'Campus Life',
    summary: 'Verified internships, scholarships, Samyak, Surabhi, clubs, and sports.',
    image: journeyCampusLifeImg,
    alt: 'Illuminated university campus festival lawn with warm string lights at twilight',
    Icon: Users,
    accentHex: '#10B981',
  },
];

const PASS_SELECTOR_ICONS: Record<ArchetypeId, ComponentType<{ className?: string }>> = {
  'corporate-architect': Briefcase,
  'strategic-builder': Rocket,
  'campus-maverick': Users,
  'day1-hustler': Code2,
  wildcard: Star,
};

export function LandingPage({
  isSignedIn,
  hasProfile,
  onPrimaryAction,
  signingIn,
}: LandingPageProps) {
  const [previewArchetype, setPreviewArchetype] = useState<ArchetypeId>('day1-hustler');
  const [stats, setStats] = useState<LiveStats>({
    students: null,
    verified: null,
    ideas: null,
    projects: null,
    opportunities: null,
  });

  useEffect(() => {
    let active = true;
    async function loadRealCounts() {
      try {
        const [studentsSnap, verifiedSnap, ideasSnap, projectsSnap, oppsSnap] = await Promise.all([
          getCountFromServer(query(collection(db, 'students'), where('isSuspended', '==', false))),
          getCountFromServer(
            query(
              collection(db, 'students'),
              where('isSuspended', '==', false),
              where('verificationStatus', '==', 'verified')
            )
          ),
          getCountFromServer(query(collection(db, 'ideas'), where('visibility', '==', 'public'))),
          getCountFromServer(
            query(collection(db, 'projects'), where('status', 'in', ['recruiting', 'active', 'completed']))
          ),
          getCountFromServer(
            query(collection(db, 'opportunities'), where('approvalStatus', '==', 'approved'))
          ),
        ]);
        if (!active) return;
        setStats({
          students: studentsSnap.data().count,
          verified: verifiedSnap.data().count,
          ideas: ideasSnap.data().count,
          projects: projectsSnap.data().count,
          opportunities: oppsSnap.data().count,
        });
      } catch {
        // Keep null if offline or rules prevent read before boot
      }
    }
    loadRealCounts();
    return () => {
      active = false;
    };
  }, []);

  const sampleStudent: StudentPublic = {
    uid: 'preview',
    memberNumber: 'KLU-000001',
    maskedStudentId: '2600••••42',
    fullName: 'Aarav Reddy',
    branch: 'CSE',
    year: '1st Year',
    batch: '2026–2030',
    primaryCategory: previewArchetype,
    secondaryInterests: ['Hackathons', 'Startup Co-founding'],
    skills: ['TypeScript', 'Python', 'AI / ML', 'UI/UX Design'],
    bio: 'Preview member card',
    careerGoal: 'Build campus software products',
    startupInterest: true,
    startupIdeaSummary: '',
    campusMode: '',
    verificationStatus: 'pending_review',
    isSuspended: false,
    allowConnections: true,
    roadmap: DEFAULT_ROADMAP,
    categoryUpdatedAtMs: 0,
  };

  const ctaLabel = signingIn
    ? 'Connecting...'
    : isSignedIn
      ? hasProfile
        ? 'Open Dashboard'
        : 'Complete Setup'
      : 'Claim Your Tribe Pass';

  const handleSelectArchetype = (id: ArchetypeId) => {
    setPreviewArchetype(id);
    const el = document.getElementById('tribe-pass-preview');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const topRowArchetypes = ARCHETYPES.slice(0, 3);
  const bottomRowArchetypes = ARCHETYPES.slice(3, 5);

  return (
    <div className="min-h-screen bg-[#07080D] text-[#F5F5F5]">
      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07080D]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3.5 sm:px-8">
          <a
            href="#top"
            className="inline-flex items-center whitespace-nowrap shrink-0"
          >
            <KluTribeLogo variant="compact" />
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a
              href="#community"
              className="relative py-1 font-medium text-[#F5F5F5] whitespace-nowrap shrink-0 after:absolute after:inset-x-0 after:-bottom-[15px] after:h-[2px] after:bg-gradient-to-r after:from-[#22D3EE] after:to-[#6366F1]"
            >
              Community
            </a>
            <a
              href="#ideas"
              className="py-1 text-zinc-400 hover:text-[#F5F5F5] transition-colors whitespace-nowrap shrink-0"
            >
              Ideas
            </a>
            <a
              href="#opportunities"
              className="py-1 text-zinc-400 hover:text-[#F5F5F5] transition-colors whitespace-nowrap shrink-0"
            >
              Opportunities
            </a>
            <a
              href="#about"
              className="py-1 text-zinc-400 hover:text-[#F5F5F5] transition-colors whitespace-nowrap shrink-0"
            >
              About
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={onPrimaryAction}
              disabled={signingIn}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#6366F1] px-4 py-2 text-xs font-semibold text-white shadow-[0_0_24px_-4px_rgba(56,189,248,0.45)] hover:from-[#38BDF8] hover:to-[#818CF8] transition-all disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <Users className="w-3.5 h-3.5" />
              {isSignedIn ? (hasProfile ? 'Dashboard' : 'Continue Setup') : 'Join Community'}
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Nocturnal Twilight Hero + Overlapping 5-Card Bento Showcase */}
        <section className="relative overflow-hidden border-b border-white/[0.08] bg-[#07080D]">
          {/* Right-side Architectural Twilight Campus Backdrop */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] sm:h-[560px] lg:h-[620px]">
            <img
              src={heroArchitectureImg}
              alt="Modern KL University engineering pavilion illuminated at twilight"
              referrerPolicy="no-referrer"
              className="ml-auto h-full w-full lg:w-[70%] object-cover object-center opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07080D] via-[#07080D]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07080D] via-[#07080D]/25 to-[#07080D]/40" />
          </div>

          {/* Subtle ambient bottom twilight arc */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#3B82F6]/10 via-transparent to-transparent" />

          <div className="relative mx-auto max-w-6xl px-5 pt-12 pb-16 sm:px-8 sm:pt-16 lg:pt-20 lg:pb-20">
            {/* Hero Editorial Copy */}
            <div className="max-w-xl space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#38BDF8]">
                Connect · Learn · Grow
              </p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[4rem] font-extrabold tracking-tight leading-[1.03] text-white">
                Your Campus.
                <span className="block bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#818CF8] bg-clip-text text-transparent">
                  Your Tribe.
                </span>
              </h1>
              <p className="max-w-md text-sm sm:text-base leading-relaxed text-zinc-300/90">
                Build your future with like-minded KL University peers, verify your campus identity, discover opportunities, and be part of something bigger.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={onPrimaryAction}
                  disabled={signingIn}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#6366F1] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_28px_-6px_rgba(56,189,248,0.5)] hover:from-[#38BDF8] hover:to-[#818CF8] transition-all disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  {ctaLabel}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#tribe-pass-preview"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-200 backdrop-blur-sm hover:border-white/30 hover:bg-white/[0.08] transition-colors whitespace-nowrap shrink-0"
                >
                  Preview Tribe Pass
                </a>
              </div>
            </div>

            {/* Overlapping Asymmetric 5-Card Bento Grid */}
            <div id="community" className="mt-12 sm:mt-14 space-y-4">
              {/* Row 1: 3 Cards (01, 02, 03) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topRowArchetypes.map((arch) => {
                  const visual = BENTO_VISUALS[arch.id];
                  const Icon = visual.Icon;
                  const isSelected = previewArchetype === arch.id;

                  return (
                    <button
                      key={arch.id}
                      type="button"
                      onClick={() => handleSelectArchetype(arch.id)}
                      className={`group relative flex min-h-[218px] flex-col justify-between overflow-hidden rounded-2xl border bg-[#0C0D12] p-5 sm:p-6 text-left transition-all duration-300 ${
                        isSelected
                          ? 'border-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]'
                          : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      <img
                        src={visual.image}
                        alt={visual.alt}
                        referrerPolicy="no-referrer"
                        className="pointer-events-none absolute inset-y-0 right-0 h-full w-[68%] object-cover object-center opacity-80 transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0C0D12] via-[#0C0D12]/90 to-transparent" />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0C0D12]/90 via-transparent to-[#0C0D12]/35" />

                      <div className="relative z-10 flex items-center gap-3">
                        <span className="font-mono text-xs tabular-nums text-zinc-400">
                          {arch.index}
                        </span>
                        <span
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-[#0C0D12]/80 backdrop-blur-sm"
                          style={{
                            borderColor: `${visual.tintHex}40`,
                            color: visual.tintHex,
                          }}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span
                          className="text-xs font-semibold tracking-wide"
                          style={{ color: visual.tintHex }}
                        >
                          {arch.subtitle}
                        </span>
                      </div>

                      <div className="relative z-10 mt-6 flex items-end justify-between gap-3">
                        <div className="space-y-1.5 max-w-[15rem]">
                          <h2 className="font-display text-lg sm:text-xl font-bold leading-snug text-[#F5F5F5]">
                            {arch.name}
                          </h2>
                          <p className="text-xs leading-relaxed text-zinc-300/85">
                            {visual.copy}
                          </p>
                        </div>

                        <span
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200 group-hover:translate-x-0.5"
                          style={{ backgroundColor: visual.buttonHex }}
                          aria-hidden="true"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Row 2: 2 Wide Cards (04, 05) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bottomRowArchetypes.map((arch) => {
                  const visual = BENTO_VISUALS[arch.id];
                  const Icon = visual.Icon;
                  const isSelected = previewArchetype === arch.id;

                  return (
                    <button
                      key={arch.id}
                      type="button"
                      onClick={() => handleSelectArchetype(arch.id)}
                      className={`group relative flex min-h-[205px] flex-col justify-between overflow-hidden rounded-2xl border bg-[#0C0D12] p-5 sm:p-6 text-left transition-all duration-300 ${
                        isSelected
                          ? 'border-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]'
                          : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      <img
                        src={visual.image}
                        alt={visual.alt}
                        referrerPolicy="no-referrer"
                        className="pointer-events-none absolute inset-y-0 right-0 h-full w-[62%] object-cover object-center opacity-80 transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0C0D12] via-[#0C0D12]/90 to-transparent" />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0C0D12]/90 via-transparent to-[#0C0D12]/35" />

                      <div className="relative z-10 flex items-center gap-3">
                        <span className="font-mono text-xs tabular-nums text-zinc-400">
                          {arch.index}
                        </span>
                        <span
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-[#0C0D12]/80 backdrop-blur-sm"
                          style={{
                            borderColor: `${visual.tintHex}40`,
                            color: visual.tintHex,
                          }}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span
                          className="text-xs font-semibold tracking-wide"
                          style={{ color: visual.tintHex }}
                        >
                          {arch.subtitle}
                        </span>
                      </div>

                      <div className="relative z-10 mt-6 flex items-end justify-between gap-4">
                        <div className="space-y-1.5 max-w-[18rem]">
                          <h2 className="font-display text-lg sm:text-xl font-bold leading-snug text-[#F5F5F5]">
                            {arch.name}
                          </h2>
                          <p className="text-xs sm:text-sm leading-relaxed text-zinc-300/85">
                            {visual.copy}
                          </p>
                        </div>

                        <span
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200 group-hover:translate-x-0.5"
                          style={{ backgroundColor: visual.buttonHex }}
                          aria-hidden="true"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Real Live Statistics Strip (Zero Fake Numbers) */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 border-t border-white/[0.08] pt-8">
              <div>
                <p className="text-xs text-zinc-500">Registered Students</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#F5F5F5]">
                  {stats.students !== null ? stats.students : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Verified KLU IDs</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#38BDF8]">
                  {stats.verified !== null ? stats.verified : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Startup Ideas</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#F5F5F5]">
                  {stats.ideas !== null ? stats.ideas : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Active Projects</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#F5F5F5]">
                  {stats.projects !== null ? stats.projects : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Approved Opportunities</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#F5F5F5]">
                  {stats.opportunities !== null ? stats.opportunities : '—'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Tribe Pass Preview */}
        <section
          id="tribe-pass-preview"
          className="relative overflow-hidden border-b border-white/[0.08] bg-[#07080D] py-16 sm:py-24"
        >
          {/* Nocturnal Campus Backdrop */}
          <div className="pointer-events-none absolute inset-0">
            <img
              src={passShowcaseCampusNightImg}
              alt="KL University campus architecture at twilight behind Tribe Pass display"
              referrerPolicy="no-referrer"
              className="ml-auto h-full w-full lg:w-[72%] object-cover object-center opacity-65"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07080D] via-[#07080D]/88 to-[#07080D]/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07080D] via-transparent to-[#07080D]/60" />
          </div>

          <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-6">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#38BDF8]">
                  <Gem className="h-3.5 w-3.5" />
                  Digital Identity
                </p>
                <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.05] text-white">
                  The Titanium
                  <span className="block bg-gradient-to-r from-[#22D3EE] via-[#38BDF8] to-[#818CF8] bg-clip-text text-transparent">
                    Tribe Pass
                  </span>
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-zinc-300/90 max-w-md">
                  Your verified identity at KLU — unlock opportunities, build connections, and carry a high-resolution digital student card across your campus journey.
                </p>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  {ARCHETYPES.map((arch) => {
                    const SelectorIcon = PASS_SELECTOR_ICONS[arch.id];
                    const isSelected = previewArchetype === arch.id;
                    return (
                      <button
                        key={arch.id}
                        type="button"
                        onClick={() => setPreviewArchetype(arch.id)}
                        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition-all whitespace-nowrap shrink-0 border ${
                          isSelected
                            ? 'border-[#38BDF8]/70 bg-gradient-to-r from-[#0EA5E9]/25 to-[#6366F1]/25 text-white shadow-[0_0_20px_-4px_rgba(56,189,248,0.45)]'
                            : 'border-white/15 bg-[#0C0D12]/80 text-zinc-300 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        <span style={{ color: arch.accentHex }}>
                          <SelectorIcon className="h-3.5 w-3.5" />
                        </span>
                        {arch.subtitle}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onPrimaryAction}
                    disabled={signingIn}
                    className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#0EA5E9] via-[#3B82F6] to-[#6366F1] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_32px_-6px_rgba(56,189,248,0.55)] hover:from-[#38BDF8] hover:to-[#818CF8] transition-all disabled:opacity-60 whitespace-nowrap shrink-0"
                  >
                    {isSignedIn ? (hasProfile ? 'Open Your Tribe Pass' : 'Complete Setup') : 'Get Your Tribe Pass'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 relative pb-8">
                {/* Ambient Under-Card Metallic Glow */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-10 bottom-2 h-14 rounded-[100%] bg-gradient-to-r from-[#0EA5E9]/35 via-[#38BDF8]/45 to-[#6366F1]/35 blur-xl"
                />

                <div className="relative z-10">
                  <TribePassCard
                    student={sampleStudent}
                    avatarUrl={sampleStudentPortraitImg}
                    isPreview
                    showActions={false}
                  />
                </div>

                {/* Brushed Metal Display Plinth */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none relative mx-auto -mt-3 h-7 w-[92%] rounded-[100%] border border-white/15 bg-gradient-to-b from-[#1B202C] via-[#0E1118] to-[#07080D] shadow-[0_12px_30px_rgba(0,0,0,0.9)]"
                >
                  <div className="absolute inset-x-6 bottom-0 h-[1.5px] rounded-full bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent opacity-80" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Four-Year Campus Journey Showcase */}
        <section id="ideas" className="relative overflow-hidden border-b border-white/[0.08] bg-[#07080D]">
          {/* Sunset KLU Campus Architectural Backdrop */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[440px] sm:h-[490px]">
            <img
              src={journeyCampusSunsetImg}
              alt="KL University glass engineering campus illuminated at golden twilight"
              referrerPolicy="no-referrer"
              className="ml-auto h-full w-full lg:w-[72%] object-cover object-center opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07080D] via-[#07080D]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07080D] via-[#07080D]/30 to-[#07080D]/45" />
          </div>

          <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 space-y-12">
            {/* Editorial Headline Block */}
            <div className="max-w-xl space-y-4">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#38BDF8]">
                <Calendar className="h-3.5 w-3.5" />
                Four-Year Utility
              </p>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.06] text-white">
                Your 4-Year
                <span className="block bg-gradient-to-r from-[#22D3EE] via-[#38BDF8] to-[#6366F1] bg-clip-text text-transparent">
                  Campus Journey
                </span>
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-zinc-300/90">
                From Day One to Convocation — Plan, Build, Learn and Grow Together.
              </p>
              <div className="pt-1">
                <div className="h-[3px] w-14 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#6366F1]" />
              </div>
            </div>

            {/* 2x2 Atmospheric Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {JOURNEY_CARDS.map((card) => {
                const Icon = card.Icon;
                return (
                  <button
                    key={card.id}
                    id={card.id === 'opportunities' ? 'opportunities' : undefined}
                    type="button"
                    onClick={onPrimaryAction}
                    disabled={signingIn}
                    style={{ borderColor: `${card.accentHex}45` }}
                    className="group relative flex min-h-[218px] flex-col justify-between overflow-hidden rounded-2xl border bg-[#0C0D12] p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#10121A] disabled:opacity-60"
                  >
                    <img
                      src={card.image}
                      alt={card.alt}
                      referrerPolicy="no-referrer"
                      className="pointer-events-none absolute inset-y-0 right-0 h-full w-[72%] object-cover object-center opacity-85 transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0C0D12] via-[#0C0D12]/88 to-transparent" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0C0D12]/90 via-transparent to-[#0C0D12]/30" />

                    {/* Top-Left Icon Badge */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-[#0C0D12]/80 backdrop-blur-sm"
                        style={{
                          borderColor: `${card.accentHex}55`,
                          color: card.accentHex,
                        }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>

                    {/* Bottom Title + Accent Rule + Action Arrow */}
                    <div className="relative z-10 mt-8 flex items-end justify-between gap-4">
                      <div className="space-y-2.5 max-w-[17rem]">
                        <h3 className="font-display text-xl sm:text-[1.35rem] font-bold leading-snug text-white">
                          <span className="block">{card.titleLine1}</span>
                          <span className="block">{card.titleLine2}</span>
                        </h3>
                        <p className="text-xs leading-relaxed text-zinc-300/85">
                          {card.summary}
                        </p>
                        <div
                          className="h-[3px] w-10 rounded-full"
                          style={{ backgroundColor: card.accentHex }}
                        />
                      </div>

                      <span
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-[#0C0D12]/70 backdrop-blur-sm transition-transform duration-200 group-hover:translate-x-0.5"
                        style={{
                          borderColor: `${card.accentHex}85`,
                          color: card.accentHex,
                        }}
                        aria-hidden="true"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Privacy Promise */}
        <section
          id="about"
          className="relative overflow-hidden border-b border-white/[0.08] bg-[#07080D] py-16 sm:py-24"
        >
          {/* Subtle Ambient Sapphire Halo on Right */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[8%] top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-[#3B82F6]/15 blur-3xl"
          />

          <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#38BDF8]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Privacy Promise
                </p>

                <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.06] text-white">
                  Your Data Stays
                  <span className="block bg-gradient-to-r from-[#22D3EE] via-[#38BDF8] to-[#818CF8] bg-clip-text text-transparent">
                    Private & Secure
                  </span>
                </h2>

                <p className="max-w-md text-sm sm:text-base leading-relaxed text-zinc-300/90">
                  A student-first platform built with isolated private records, real institutional verification, and strict data protection. Direct messaging unlocks only after mutual connection acceptance.
                </p>

                <div className="pt-0.5">
                  <div className="h-[3px] w-14 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#6366F1]" />
                </div>

                {/* Three Core Privacy Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  <div className="rounded-2xl border border-[#38BDF8]/25 bg-[#0C0D12]/90 p-4 text-center space-y-2.5">
                    <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#38BDF8]">
                      <EyeOff className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold leading-snug text-white">
                      No Public Contact Details
                    </p>
                    <p className="text-[11px] leading-relaxed text-zinc-400">
                      Phone, email & unmasked ID stay private
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#38BDF8]/25 bg-[#0C0D12]/90 p-4 text-center space-y-2.5">
                    <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#38BDF8]">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold leading-snug text-white">
                      QR = Safe Profile ID
                    </p>
                    <p className="text-[11px] leading-relaxed text-zinc-400">
                      Encodes only your public pass link
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#38BDF8]/25 bg-[#0C0D12]/90 p-4 text-center space-y-2.5">
                    <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#38BDF8]">
                      <BadgeCheck className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold leading-snug text-white">
                      Verified After Review
                    </p>
                    <p className="text-[11px] leading-relaxed text-zinc-400">
                      Checked against institutional ID
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onPrimaryAction}
                    disabled={signingIn}
                    className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#0EA5E9] via-[#3B82F6] to-[#6366F1] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_32px_-6px_rgba(56,189,248,0.55)] hover:from-[#38BDF8] hover:to-[#818CF8] transition-all disabled:opacity-60 whitespace-nowrap shrink-0"
                  >
                    <Ticket className="h-4 w-4" />
                    {ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Right Column: Brushed Titanium Shield Sculpture */}
              <div className="lg:col-span-6 relative">
                <div className="relative overflow-hidden rounded-3xl">
                  <img
                    src={privacyShieldSculptureImg}
                    alt="Brushed titanium security shield with padlock emblem on a campus pedestal"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-[460px] object-cover object-center"
                  />
                  {/* Soft Edge-Blending Scrims into #07080D */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#07080D] via-transparent to-[#07080D]/90" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07080D] via-transparent to-[#07080D]/80" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="py-10">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="space-y-2.5">
            <KluTribeLogo variant="full" />
            <p>KL University B.Tech Community · Vaddeswaram, Andhra Pradesh</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#community" className="hover:text-zinc-300 transition-colors">Paths</a>
            <a href="#ideas" className="hover:text-zinc-300 transition-colors">Ecosystem</a>
            <a href="#about" className="hover:text-zinc-300 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
