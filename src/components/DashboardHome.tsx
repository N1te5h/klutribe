import { useState } from 'react';
import { CheckCircle2, Circle, Clock, ShieldCheck, ArrowRight, UserPlus, Sparkles } from 'lucide-react';
import { sendConnectionRequest, updateStudentProfile } from '../lib/kluService';
import {
  getArchetypeMeta,
  type CampusEvent,
  type Connection,
  type RoadmapYear,
  type StudentPublic,
} from '../types/klu';
import { TribePassCard } from './TribePassCard';

interface DashboardHomeProps {
  me: StudentPublic;
  allStudents: StudentPublic[];
  connections: Connection[];
  events: CampusEvent[];
  onNavigate: (tab: string) => void;
}

export function DashboardHome({
  me,
  allStudents,
  connections,
  events,
  onNavigate,
}: DashboardHomeProps) {
  const [roadmap, setRoadmap] = useState<RoadmapYear[]>(me.roadmap);
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [connectingUid, setConnectingUid] = useState<string | null>(null);

  const archetype = getArchetypeMeta(me.primaryCategory);
  const acceptedCount = connections.filter((c) => c.status === 'accepted').length;
  const pendingIncoming = connections.filter((c) => c.status === 'pending' && c.toUid === me.uid);
  const myEventsCount = events.filter((ev) => ev.attendeeUids.includes(me.uid)).length;

  const connectedOrPendingUids = new Set(
    connections.flatMap((c) => c.participantUids)
  );

  // Recommend peers based on shared skills, branch, or startup interest
  const recommendedPeers = allStudents
    .filter((s) => s.uid !== me.uid && s.allowConnections && !connectedOrPendingUids.has(s.uid))
    .map((s) => {
      const sharedSkills = s.skills.filter((sk) => me.skills.includes(sk)).length;
      const sameBranch = s.branch === me.branch ? 1 : 0;
      const startupBonus = me.startupInterest && s.startupInterest ? 2 : 0;
      return { student: s, score: sharedSkills * 2 + sameBranch + startupBonus };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const handleToggleYearDone = async (idx: number) => {
    const next = roadmap.map((item, i) =>
      i === idx ? { ...item, completed: !item.completed } : item
    );
    setRoadmap(next);
    setSavingRoadmap(true);
    try {
      await updateStudentProfile(me.uid, { roadmap: next });
      setSavedNotice('4-Year Progress saved.');
      setTimeout(() => setSavedNotice(null), 2000);
    } finally {
      setSavingRoadmap(false);
    }
  };

  const handleGoalChange = (idx: number, goal: string) => {
    setRoadmap((prev) => prev.map((item, i) => (i === idx ? { ...item, goal } : item)));
  };

  const handleSaveRoadmapGoals = async () => {
    setSavingRoadmap(true);
    try {
      await updateStudentProfile(me.uid, { roadmap });
      setSavedNotice('Roadmap goals updated.');
      setTimeout(() => setSavedNotice(null), 2500);
    } finally {
      setSavingRoadmap(false);
    }
  };

  const handleQuickConnect = async (peer: StudentPublic) => {
    setConnectingUid(peer.uid);
    try {
      await sendConnectionRequest(me, peer, `Hi ${peer.fullName.split(' ')[0]}, connecting from KLU TRIBE!`);
    } finally {
      setConnectingUid(null);
    }
  };

  const completedYears = roadmap.filter((r) => r.completed).length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Main Content Area */}
      <div className="xl:col-span-8 space-y-6">
        {/* Welcome & Status Banner */}
        <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-zinc-400">
                {archetype.name} <span className="mx-1.5 text-zinc-600">·</span> B.Tech {me.branch} <span className="mx-1.5 text-zinc-600">·</span> {me.year}
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#F5F5F5]">
                Welcome back, {me.fullName.split(' ')[0]}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {me.verificationStatus === 'verified' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  KLU ID Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
                  <Clock className="w-4 h-4" />
                  Verification Pending Review
                </span>
              )}
            </div>
          </div>

          {/* Real KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[#27272A] pt-4">
            <div>
              <p className="text-xs text-zinc-500">Connections</p>
              <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums">{acceptedCount}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Pending Requests</p>
              <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-blue-400">
                {pendingIncoming.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Campus Activities</p>
              <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums">{myEventsCount}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">4-Year Milestones</p>
              <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-emerald-400">
                {completedYears}/4
              </p>
            </div>
          </div>
        </div>

        {/* Compact Tribe Pass */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">My Tribe Pass</h2>
            <button
              type="button"
              onClick={() => onNavigate('pass')}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              Full Pass & Downloads
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <TribePassCard
            student={me}
            compact
            showActions={false}
          />
        </div>

        {/* 4-Year Progress Tracker */}
        <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Your 4-Year Progress Tracker</h2>
              <p className="text-xs text-zinc-400">
                Define and update your annual B.Tech objectives across all four years at KL University.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveRoadmapGoals}
              disabled={savingRoadmap}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {savingRoadmap ? 'Saving...' : 'Save Milestones'}
            </button>
          </div>

          {savedNotice && <p className="text-xs text-emerald-400">{savedNotice}</p>}

          <div className="space-y-3">
            {roadmap.map((item, idx) => (
              <div
                key={item.year}
                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-[#27272A] bg-[#09090B] p-4"
              >
                <button
                  type="button"
                  onClick={() => handleToggleYearDone(idx)}
                  className="inline-flex items-center gap-2.5 text-left shrink-0"
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-zinc-600 hover:text-zinc-400" />
                  )}
                  <span className="font-mono text-xs font-semibold tabular-nums text-zinc-300 w-14">
                    {item.label}
                  </span>
                </button>
                <input
                  type="text"
                  maxLength={140}
                  value={item.goal}
                  onChange={(e) => handleGoalChange(idx, e.target.value)}
                  className={`flex-1 bg-transparent text-sm focus:outline-none border-b border-transparent focus:border-emerald-500 pb-0.5 ${
                    item.completed ? 'text-zinc-400 line-through' : 'text-[#F5F5F5]'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Recommended Connections & Quick Actions */}
      <aside className="xl:col-span-4 space-y-6">
        <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Recommended Peers</h2>
            <button
              type="button"
              onClick={() => onNavigate('network')}
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              Browse All
            </button>
          </div>

          {recommendedPeers.length === 0 ? (
            <p className="text-xs leading-relaxed text-zinc-400">
              No new peer recommendations right now. As more KL University students join, matching peers by branch and skills will appear here.
            </p>
          ) : (
            <div className="divide-y divide-[#27272A]">
              {recommendedPeers.map(({ student }) => {
                const peerArch = getArchetypeMeta(student.primaryCategory);
                return (
                  <div key={student.uid} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-[#F5F5F5] truncate">
                          {student.fullName}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {student.branch} · {student.year} ·{' '}
                          <span style={{ color: peerArch.accentHex }}>{peerArch.subtitle}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickConnect(student)}
                        disabled={connectingUid === student.uid}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#27272A] bg-[#09090B] px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:border-emerald-500 transition-colors shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {connectingUid === student.uid ? 'Sending...' : 'Connect'}
                      </button>
                    </div>
                    {student.skills.length > 0 && (
                      <p className="text-xs text-zinc-500 truncate">
                        {student.skills.slice(0, 3).join(' · ')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Career Goal & Quick Links */}
        <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Active Career Direction
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">
            {me.careerGoal || 'Set your 4-year career goal in Settings to align recommendations.'}
          </p>
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => onNavigate('ideas')}
              className="rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500 transition-colors"
            >
              Idea Board
            </button>
            <button
              type="button"
              onClick={() => onNavigate('opportunities')}
              className="rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500 transition-colors"
            >
              Opportunities
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
