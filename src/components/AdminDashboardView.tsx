import { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  Check,
  Copy,
  Download,
  Eye,
  Home,
  Mail,
  Phone,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import {
  adminModerateOpportunity,
  adminResolveReport,
  adminSetStudentSuspension,
  adminSetStudentVerification,
  deleteIdea,
  exportStudentsToCsv,
  subscribeAdminReports,
  subscribeAllIdeasForAdmin,
  subscribeAuditLogs,
  subscribeOpportunities,
  subscribePublicStudents,
  subscribeStudentPrivateInfos,
} from '../lib/kluService';
import {
  ACADEMIC_YEARS,
  ADMIN_BOOTSTRAP_EMAIL,
  ARCHETYPES,
  BRANCHES,
  getArchetypeMeta,
  type AuditLog,
  type ContentReport,
  type Opportunity,
  type StartupIdea,
  type StudentPrivate,
  type StudentPublic,
} from '../types/klu';
import { TribePassCard } from './TribePassCard';

interface AdminDashboardViewProps {
  adminUid: string;
  adminEmail: string;
  ideas: StartupIdea[];
  onGoHome: () => void;
}

function formatFirestoreDate(ts?: { toDate?: () => Date }): string {
  if (!ts?.toDate) return 'Pending sync';
  try {
    return ts.toDate().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function AdminDashboardView({
  adminUid,
  adminEmail,
  ideas,
  onGoHome,
}: AdminDashboardViewProps) {
  const isAuthorizedAdmin =
    adminEmail.trim().toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase();
  const [adminTab, setAdminTab] = useState<
    'students' | 'opportunities' | 'ideas' | 'reports' | 'logs'
  >('students');

  const [allStudents, setAllStudents] = useState<StudentPublic[]>([]);
  const [privateMap, setPrivateMap] = useState<Record<string, StudentPrivate>>({});
  const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
  const [liveAllIdeas, setLiveAllIdeas] = useState<StartupIdea[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [selectedStudentUid, setSelectedStudentUid] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [campusFilter, setCampusFilter] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('ALL');

  useEffect(() => {
    if (!isAuthorizedAdmin) return;
    const unsubStudents = subscribePublicStudents(setAllStudents, true);
    const unsubOpps = subscribeOpportunities(setAllOpportunities, true);
    const unsubIdeas = subscribeAllIdeasForAdmin(setLiveAllIdeas);
    const unsubReports = subscribeAdminReports(setReports);
    const unsubLogs = subscribeAuditLogs(setAuditLogs);
    return () => {
      unsubStudents();
      unsubOpps();
      unsubIdeas();
      unsubReports();
      unsubLogs();
    };
  }, [isAuthorizedAdmin]);

  const studentUidsKey = useMemo(
    () => allStudents.map((s) => s.uid).sort().join(','),
    [allStudents]
  );

  useEffect(() => {
    if (!isAuthorizedAdmin) return;
    const uids = studentUidsKey ? studentUidsKey.split(',') : [];
    const unsubPrivate = subscribeStudentPrivateInfos(uids, setPrivateMap);
    return () => unsubPrivate();
  }, [isAuthorizedAdmin, studentUidsKey]);

  if (!isAuthorizedAdmin) {
    return (
      <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-8 text-center space-y-4">
        <p className="text-sm font-medium text-red-400">
          Access restricted to authorized KLU TRIBE administrator.
        </p>
        <button
          type="button"
          onClick={onGoHome}
          className="inline-flex items-center gap-2 rounded-xl border border-[#27272A] bg-[#09090B] px-4 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500"
        >
          <Home className="w-3.5 h-3.5" />
          Go To Home page
        </button>
      </div>
    );
  }

  const displayedIdeas = liveAllIdeas.length > 0 ? liveAllIdeas : ideas;

  const filteredStudents = allStudents.filter((s) => {
    if (branchFilter !== 'ALL' && s.branch !== branchFilter) return false;
    if (yearFilter !== 'ALL' && s.year !== yearFilter) return false;
    if (categoryFilter !== 'ALL' && s.primaryCategory !== categoryFilter) return false;
    if (campusFilter !== 'ALL' && s.campusMode !== campusFilter) return false;
    if (verificationFilter !== 'ALL' && s.verificationStatus !== verificationFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const priv = privateMap[s.uid];
      const hay = [
        s.fullName,
        s.memberNumber,
        s.maskedStudentId,
        priv?.kluStudentId || '',
        priv?.email || '',
        priv?.phone || '',
        priv?.gender || '',
        s.skills.join(' '),
        s.secondaryInterests.join(' '),
        s.careerGoal,
        s.bio,
        s.startupIdeaSummary,
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const verifiedCount = allStudents.filter((s) => s.verificationStatus === 'verified').length;
  const pendingVerifyCount = allStudents.filter((s) => s.verificationStatus === 'pending_review').length;
  const openReportsCount = reports.filter((r) => r.status === 'open').length;
  const pendingOppsCount = allOpportunities.filter((o) => o.approvalStatus === 'pending').length;

  const selectedStudent = selectedStudentUid
    ? allStudents.find((s) => s.uid === selectedStudentUid) || null
    : null;
  const selectedPrivate = selectedStudent ? privateMap[selectedStudent.uid] : undefined;

  const copyValue = async (label: string, val: string) => {
    if (!val) return;
    try {
      await navigator.clipboard.writeText(val);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 1600);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Admin Control Center</h1>
          <p className="text-sm text-zinc-400">
            Live student directory with real institutional IDs, private contacts, verification, opportunities, and audit logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex items-center gap-2 rounded-xl border border-[#27272A] bg-[#141417] px-4 py-2 text-xs font-semibold text-[#F5F5F5] hover:border-zinc-500 whitespace-nowrap shrink-0"
          >
            <Home className="w-3.5 h-3.5 text-emerald-400" />
            Go To Home page
          </button>

          <button
            type="button"
            onClick={() => exportStudentsToCsv(filteredStudents, privateMap)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export Full Live CSV
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-4">
          <p className="text-xs text-zinc-500">Total Registered</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{allStudents.length}</p>
        </div>
        <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-4">
          <p className="text-xs text-zinc-500">Verified Students</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-emerald-400">
            {verifiedCount}
          </p>
        </div>
        <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-4">
          <p className="text-xs text-zinc-500">Pending ID Review</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-amber-400">
            {pendingVerifyCount}
          </p>
        </div>
        <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-4">
          <p className="text-xs text-zinc-500">Pending Opportunities</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-blue-400">
            {pendingOppsCount}
          </p>
        </div>
        <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-4">
          <p className="text-xs text-zinc-500">Open Reports</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-red-400">
            {openReportsCount}
          </p>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[#27272A] pb-3">
        {[
          { id: 'students', label: `Students (${allStudents.length})` },
          { id: 'opportunities', label: `Opportunities (${allOpportunities.length})` },
          { id: 'ideas', label: `Startup Ideas (${displayedIdeas.length})` },
          { id: 'reports', label: `Reports (${openReportsCount} open)` },
          { id: 'logs', label: `Audit Logs (${auditLogs.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setAdminTab(t.id as typeof adminTab)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              adminTab === t.id
                ? 'bg-[#F5F5F5] text-zinc-950'
                : 'border border-[#27272A] bg-[#141417] text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {adminTab === 'students' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, KLU ID, email, phone, skill..."
              className="rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#F5F5F5]"
            />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#F5F5F5]"
            >
              <option value="ALL">All Branches</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#F5F5F5]"
            >
              <option value="ALL">All Years</option>
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#F5F5F5]"
            >
              <option value="ALL">All Categories</option>
              {ARCHETYPES.map((a) => (
                <option key={a.id} value={a.id}>{a.subtitle}</option>
              ))}
            </select>
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#F5F5F5]"
            >
              <option value="ALL">All Campus Modes</option>
              <option value="Hosteller">Hosteller</option>
              <option value="Day Scholar">Day Scholar</option>
            </select>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#F5F5F5]"
            >
              <option value="ALL">All Verification</option>
              <option value="pending_review">Pending Review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#27272A] bg-[#141417]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#27272A] text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Student & Member ID</th>
                  <th className="px-4 py-3 font-medium">Full KLU ID & Private Contact</th>
                  <th className="px-4 py-3 font-medium">Academic & Mode</th>
                  <th className="px-4 py-3 font-medium">Path, Skills & Roadmap</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                      No students match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const priv = privateMap[s.uid];
                    const arch = getArchetypeMeta(s.primaryCategory);
                    const roadmapDone = (s.roadmap || []).filter((r) => r.completed).length;
                    return (
                      <tr key={s.uid} className="hover:bg-[#09090B]/60 align-top">
                        <td className="px-4 py-3.5 space-y-1">
                          <p className="font-semibold text-[#F5F5F5]">{s.fullName}</p>
                          <p className="font-mono text-[11px] tabular-nums text-emerald-400">
                            #{s.memberNumber}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            Joined {formatFirestoreDate(s.createdAt)}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 space-y-1">
                          <p className="font-mono text-xs font-semibold tabular-nums text-[#F5F5F5]">
                            KLU ID: {priv?.kluStudentId || s.maskedStudentId}
                          </p>
                          <p className="text-[11px] text-zinc-300 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span>{priv?.email || 'Loading email...'}</span>
                          </p>
                          <p className="font-mono text-[11px] tabular-nums text-zinc-300 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span>{priv?.phone || '—'}</span>
                            {priv?.gender ? (
                              <span className="text-zinc-500 font-sans">· {priv.gender}</span>
                            ) : null}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 space-y-1 text-zinc-300">
                          <p className="font-medium text-[#F5F5F5]">
                            {s.branch} · {s.year}
                          </p>
                          <p className="font-mono text-[11px] text-zinc-400">{s.batch}</p>
                          <p className="text-[11px] text-zinc-400">
                            Mode: {s.campusMode || 'Unlisted'}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 space-y-1 max-w-xs">
                          <p className="font-medium" style={{ color: arch.accentHex }}>
                            {arch.subtitle} ({arch.name})
                          </p>
                          <p className="text-[11px] text-zinc-300 truncate">
                            Skills: {s.skills.length > 0 ? s.skills.join(', ') : 'None listed'}
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            Roadmap: <span className="font-mono">{roadmapDone}/{(s.roadmap || []).length}</span> · Startup: {s.startupInterest ? 'Yes' : 'No'}
                          </p>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`font-medium ${
                              s.isSuspended
                                ? 'text-red-400'
                                : s.verificationStatus === 'verified'
                                  ? 'text-emerald-400'
                                  : s.verificationStatus === 'rejected'
                                    ? 'text-red-400'
                                    : 'text-amber-400'
                            }`}
                          >
                            {s.isSuspended ? 'Suspended' : s.verificationStatus}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex flex-wrap justify-end items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentUid(s.uid)}
                              className="inline-flex items-center gap-1 rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-sky-300 hover:bg-sky-500/20 whitespace-nowrap shrink-0"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              All Details
                            </button>

                            {s.verificationStatus !== 'verified' && (
                              <button
                                type="button"
                                onClick={() =>
                                  adminSetStudentVerification(adminUid, adminEmail, s.uid, 'verified')
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-emerald-400 hover:bg-emerald-500/25 whitespace-nowrap shrink-0"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Verify
                              </button>
                            )}
                            {s.verificationStatus === 'pending_review' && (
                              <button
                                type="button"
                                onClick={() =>
                                  adminSetStudentVerification(adminUid, adminEmail, s.uid, 'rejected')
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-[#27272A] px-2.5 py-1 text-zinc-300 hover:text-red-400 whitespace-nowrap shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                adminSetStudentSuspension(adminUid, adminEmail, s.uid, !s.isSuspended)
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-[#27272A] px-2.5 py-1 text-zinc-300 hover:border-zinc-500 whitespace-nowrap shrink-0"
                            >
                              {s.isSuspended ? (
                                <>
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  Restore
                                </>
                              ) : (
                                <>
                                  <Ban className="w-3.5 h-3.5 text-red-400" />
                                  Suspend
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adminTab === 'opportunities' && (
        <div className="space-y-3">
          {allOpportunities.map((op) => (
            <div
              key={op.id}
              className="rounded-2xl border border-[#27272A] bg-[#141417] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <p className="text-xs text-zinc-400">
                  {op.category} · {op.organization} · Submitted by {op.submittedByName}
                </p>
                <p className="mt-1 font-display text-base font-semibold">{op.title}</p>
                <p className="text-xs text-zinc-500">Status: {op.approvalStatus}</p>
              </div>
              <div className="flex items-center gap-2">
                {op.approvalStatus !== 'approved' && (
                  <button
                    type="button"
                    onClick={() =>
                      adminModerateOpportunity(adminUid, adminEmail, op.id, 'approved')
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve
                  </button>
                )}
                {op.approvalStatus !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() =>
                      adminModerateOpportunity(adminUid, adminEmail, op.id, 'rejected')
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-[#27272A] px-3 py-1.5 text-xs text-red-400"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {adminTab === 'ideas' && (
        <div className="space-y-3">
          {displayedIdeas.map((idea) => (
            <div
              key={idea.id}
              className="rounded-2xl border border-[#27272A] bg-[#141417] p-5 flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-xs text-zinc-400">
                  {idea.authorName} ({idea.authorBranch}) · {idea.stage} · Visibility: {idea.visibility}
                </p>
                <p className="mt-1 font-display text-base font-semibold">{idea.title}</p>
              </div>
              <button
                type="button"
                onClick={() => deleteIdea(idea.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#27272A] px-3 py-1.5 text-xs text-red-400 hover:border-red-500/40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {adminTab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <p className="text-xs text-zinc-400">No reports filed.</p>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="rounded-2xl border border-[#27272A] bg-[#141417] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <p className="text-xs text-zinc-400">
                    Target: {rep.targetType} ({rep.targetId}) · Status: {rep.status}
                  </p>
                  <p className="mt-1 text-sm text-zinc-200">{rep.reason}</p>
                </div>
                {rep.status === 'open' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => adminResolveReport(adminUid, adminEmail, rep.id, 'resolved')}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950"
                    >
                      Resolve
                    </button>
                    <button
                      type="button"
                      onClick={() => adminResolveReport(adminUid, adminEmail, rep.id, 'dismissed')}
                      className="rounded-lg border border-[#27272A] px-3 py-1.5 text-xs text-zinc-300"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {adminTab === 'logs' && (
        <div className="rounded-2xl border border-[#27272A] bg-[#141417] divide-y divide-[#27272A]">
          {auditLogs.length === 0 ? (
            <p className="p-5 text-xs text-zinc-400">No administrative actions logged yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-mono font-medium text-emerald-400">{log.action}</span>
                  <span className="mx-2 text-zinc-600">·</span>
                  <span className="text-zinc-200">{log.details}</span>
                </div>
                <span className="font-mono text-zinc-500">
                  {log.adminEmail} · target {log.targetId.slice(0, 12)}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Full Live Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#27272A] bg-[#09090B] p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-[#27272A] pb-4">
              <div>
                <p className="text-xs font-medium text-sky-400">
                  Live Student Record · #{selectedStudent.memberNumber}
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-[#F5F5F5]">
                  {selectedStudent.fullName}
                </h2>
                <p className="mt-0.5 font-mono text-xs text-zinc-400">
                  UID: {selectedStudent.uid}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentUid(null)}
                className="rounded-xl border border-[#27272A] bg-[#141417] p-2 text-zinc-400 hover:text-white"
                aria-label="Close student details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Moderation Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#27272A] bg-[#141417] p-4">
              <div className="flex items-center gap-2 text-xs">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-zinc-300">
                  Verification:{' '}
                  <strong className="text-white">{selectedStudent.verificationStatus}</strong>
                </span>
                <span className="mx-1 text-zinc-600">·</span>
                <span className="text-zinc-300">
                  Account:{' '}
                  <strong className={selectedStudent.isSuspended ? 'text-red-400' : 'text-emerald-400'}>
                    {selectedStudent.isSuspended ? 'Suspended' : 'Active'}
                  </strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedStudent.verificationStatus !== 'verified' && (
                  <button
                    type="button"
                    onClick={() =>
                      adminSetStudentVerification(adminUid, adminEmail, selectedStudent.uid, 'verified')
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Approve Verification
                  </button>
                )}
                {selectedStudent.verificationStatus !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() =>
                      adminSetStudentVerification(adminUid, adminEmail, selectedStudent.uid, 'rejected')
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-1.5 text-xs text-red-400 hover:border-red-500/40"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject ID
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    adminSetStudentSuspension(
                      adminUid,
                      adminEmail,
                      selectedStudent.uid,
                      !selectedStudent.isSuspended
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-1.5 text-xs text-zinc-200 hover:border-zinc-500"
                >
                  {selectedStudent.isSuspended ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                      Restore Account
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5 text-red-400" />
                      Suspend Account
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Institutional & Private PII Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Private Identity & Contact (Live)
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400">Full KLU Student ID</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-white">
                        {selectedPrivate?.kluStudentId || 'Loading...'}
                      </span>
                      {selectedPrivate?.kluStudentId && (
                        <button
                          type="button"
                          onClick={() => copyValue('kluId', selectedPrivate.kluStudentId)}
                          className="text-zinc-500 hover:text-white"
                          title="Copy KLU ID"
                        >
                          {copiedField === 'kluId' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400">Masked Public ID</span>
                    <span className="font-mono text-zinc-300">{selectedStudent.maskedStudentId}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400">Verified Email</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-white truncate">
                        {selectedPrivate?.email || 'Loading...'}
                      </span>
                      {selectedPrivate?.email && (
                        <button
                          type="button"
                          onClick={() => copyValue('email', selectedPrivate.email)}
                          className="text-zinc-500 hover:text-white shrink-0"
                          title="Copy Email"
                        >
                          {copiedField === 'email' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400">Phone / WhatsApp</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white">
                        {selectedPrivate?.phone || '—'}
                      </span>
                      {selectedPrivate?.phone && (
                        <button
                          type="button"
                          onClick={() => copyValue('phone', selectedPrivate.phone)}
                          className="text-zinc-500 hover:text-white"
                          title="Copy Phone"
                        >
                          {copiedField === 'phone' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400">Gender</span>
                    <span className="text-zinc-200">{selectedPrivate?.gender || 'Not specified'}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400">Registered At</span>
                    <span className="font-mono text-zinc-300">
                      {formatFirestoreDate(selectedStudent.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400">Last Updated</span>
                    <span className="font-mono text-zinc-300">
                      {formatFirestoreDate(selectedStudent.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Academic, Path & Builder Profile
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400">Branch / Year / Batch</span>
                    <span className="text-white">
                      {selectedStudent.branch} · {selectedStudent.year} ({selectedStudent.batch})
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400">Campus Mode</span>
                    <span className="text-zinc-200">{selectedStudent.campusMode || 'Unlisted'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400">Primary Blueprint</span>
                    <span
                      className="font-semibold"
                      style={{ color: getArchetypeMeta(selectedStudent.primaryCategory).accentHex }}
                    >
                      {getArchetypeMeta(selectedStudent.primaryCategory).name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400">Allow Connections</span>
                    <span className="text-zinc-200">
                      {selectedStudent.allowConnections ? 'Enabled' : 'Paused'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-400">Startup Interest</span>
                    <span className="text-zinc-200">
                      {selectedStudent.startupInterest ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-[#27272A]">
                    <p className="text-zinc-400 mb-1">Core Skills</p>
                    <p className="text-zinc-200 leading-relaxed">
                      {selectedStudent.skills.length > 0 ? selectedStudent.skills.join(' · ') : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400 mb-1">Secondary Interests</p>
                    <p className="text-zinc-200 leading-relaxed">
                      {selectedStudent.secondaryInterests.length > 0
                        ? selectedStudent.secondaryInterests.join(' · ')
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio, Career Goal & Startup Idea */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-4 space-y-1.5">
                <p className="text-xs font-medium text-zinc-400">Career Goal</p>
                <p className="text-xs leading-relaxed text-zinc-200">
                  {selectedStudent.careerGoal || 'Not specified'}
                </p>
              </div>
              <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-4 space-y-1.5">
                <p className="text-xs font-medium text-zinc-400">Student Bio</p>
                <p className="text-xs leading-relaxed text-zinc-200">
                  {selectedStudent.bio || 'No bio added'}
                </p>
              </div>
              <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-4 space-y-1.5">
                <p className="text-xs font-medium text-zinc-400">Startup Idea Summary</p>
                <p className="text-xs leading-relaxed text-zinc-200">
                  {selectedStudent.startupIdeaSummary || 'No startup summary'}
                </p>
              </div>
            </div>

            {/* Live 4-Year Roadmap Progress */}
            <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                4-Year Roadmap Progress
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(selectedStudent.roadmap || []).map((step) => (
                  <div
                    key={step.year}
                    className={`rounded-xl border p-3.5 space-y-1.5 ${
                      step.completed
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : 'border-[#27272A] bg-[#09090B]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{step.label}</span>
                      <span className={step.completed ? 'text-emerald-400' : 'text-zinc-500'}>
                        {step.completed ? 'Done' : 'Active'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{step.goal}</p>
                    {step.notes && (
                      <p className="text-[11px] text-zinc-400 border-t border-white/10 pt-1.5">
                        Note: {step.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Live Tribe Pass Card Render */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Live Tribe Pass Preview
              </p>
              <TribePassCard student={selectedStudent} compact showActions={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
