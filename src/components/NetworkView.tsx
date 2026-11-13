import { useEffect, useState, type FormEvent } from 'react';
import {
  Check,
  Flag,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import {
  createContentReport,
  respondConnectionRequest,
  sendConnectionRequest,
  sendDirectMessage,
  subscribeConnectionMessages,
} from '../lib/kluService';
import {
  ACADEMIC_YEARS,
  ARCHETYPES,
  BRANCHES,
  getArchetypeMeta,
  type Connection,
  type DirectMessage,
  type StudentPublic,
} from '../types/klu';

interface NetworkViewProps {
  me: StudentPublic;
  students: StudentPublic[];
  connections: Connection[];
}

export function NetworkView({ me, students, connections }: NetworkViewProps) {
  const [tab, setTab] = useState<'discover' | 'requests' | 'messages'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [campusFilter, setCampusFilter] = useState<string>('ALL');
  const [startupOnly, setStartupOnly] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<StudentPublic | null>(null);
  const [connectNote, setConnectNote] = useState('');
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const [activeChatConnId, setActiveChatConnId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const [reportingUid, setReportingUid] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const acceptedConnections = connections.filter((c) => c.status === 'accepted');
  const incomingRequests = connections.filter((c) => c.status === 'pending' && c.toUid === me.uid);
  const outgoingRequests = connections.filter((c) => c.status === 'pending' && c.fromUid === me.uid);

  useEffect(() => {
    if (!activeChatConnId) {
      setMessages([]);
      return;
    }
    const unsub = subscribeConnectionMessages(activeChatConnId, setMessages);
    return () => unsub();
  }, [activeChatConnId]);

  const getConnectionForPeer = (peerUid: string): Connection | undefined =>
    connections.find((c) => c.participantUids.includes(peerUid));

  const filteredStudents = students.filter((s) => {
    if (s.uid === me.uid) return false;
    if (branchFilter !== 'ALL' && s.branch !== branchFilter) return false;
    if (yearFilter !== 'ALL' && s.year !== yearFilter) return false;
    if (categoryFilter !== 'ALL' && s.primaryCategory !== categoryFilter) return false;
    if (campusFilter !== 'ALL' && s.campusMode !== campusFilter) return false;
    if (startupOnly && !s.startupInterest) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hay = `${s.fullName} ${s.branch} ${s.skills.join(' ')} ${s.bio} ${s.careerGoal}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const handleConnect = async (peer: StudentPublic) => {
    setSendingTo(peer.uid);
    try {
      await sendConnectionRequest(me, peer, connectNote || 'Let us connect on KLU TRIBE.');
      setConnectNote('');
      setSelectedStudent(null);
      setFeedback(`Connection request sent to ${peer.fullName}.`);
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setSendingTo(null);
    }
  };

  const handleSendMsg = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeChatConnId || !messageDraft.trim()) return;
    setSendingMsg(true);
    try {
      await sendDirectMessage(activeChatConnId, me.uid, me.fullName, messageDraft);
      setMessageDraft('');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleReportSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reportingUid || reportReason.trim().length < 5) return;
    await createContentReport({
      reporterUid: me.uid,
      targetType: 'student',
      targetId: reportingUid,
      reason: reportReason,
    });
    setReportingUid(null);
    setReportReason('');
    setFeedback('Report submitted to moderators.');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Tribe Network</h1>
          <p className="text-sm text-zinc-400">
            Discover B.Tech peers across branches. Phone numbers, emails, and full IDs remain strictly private.
          </p>
        </div>

        {/* Segmented Control */}
        <div className="inline-flex items-center rounded-xl border border-[#27272A] bg-[#141417] p-1">
          <button
            type="button"
            onClick={() => setTab('discover')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              tab === 'discover' ? 'bg-[#F5F5F5] text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Discover ({filteredStudents.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('requests')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              tab === 'requests' ? 'bg-[#F5F5F5] text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Requests ({incomingRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('messages')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              tab === 'messages' ? 'bg-[#F5F5F5] text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Messages ({acceptedConnections.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-2.5 text-xs text-emerald-300">
          {feedback}
        </div>
      )}

      {tab === 'discover' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, skill, or bio..."
                className="w-full rounded-xl border border-[#27272A] bg-[#09090B] pl-9 pr-3 py-2 text-xs text-[#F5F5F5] focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#F5F5F5] focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Branches</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#F5F5F5] focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Years</option>
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#F5F5F5] focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Archetypes</option>
              {ARCHETYPES.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#F5F5F5] focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">Campus Mode (Opt-in)</option>
              <option value="Hosteller">Hosteller</option>
              <option value="Day Scholar">Day Scholar</option>
            </select>

            <label className="lg:col-span-6 flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={startupOnly}
                onChange={(e) => setStartupOnly(e.target.checked)}
                className="h-3.5 w-3.5 accent-emerald-500"
              />
              Show students interested in Startups & Co-founding only
            </label>
          </div>

          {/* Directory Grid */}
          {filteredStudents.length === 0 ? (
            <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-8 text-center space-y-2">
              <p className="font-medium text-sm">No matching students found</p>
              <p className="text-xs text-zinc-400">
                Try clearing filters or invite classmates from KL University to join KLU TRIBE.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStudents.map((student) => {
                const arch = getArchetypeMeta(student.primaryCategory);
                const conn = getConnectionForPeer(student.uid);
                return (
                  <div
                    key={student.uid}
                    className="flex flex-col justify-between rounded-2xl border border-[#27272A] bg-[#141417] p-5 space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-display text-base font-semibold text-[#F5F5F5] truncate">
                              {student.fullName}
                            </h3>
                            {student.verificationStatus === 'verified' && (
                              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-zinc-400">
                            {student.branch} · {student.year}
                            {student.campusMode ? ` · ${student.campusMode}` : ''}
                          </p>
                        </div>
                        <span className="font-mono text-[11px] text-zinc-500 shrink-0">
                          #{student.memberNumber}
                        </span>
                      </div>

                      <p className="text-xs font-medium" style={{ color: arch.accentHex }}>
                        {arch.name}
                      </p>

                      {student.bio && (
                        <p className="text-xs leading-relaxed text-zinc-300 line-clamp-2">
                          {student.bio}
                        </p>
                      )}

                      {student.skills.length > 0 && (
                        <p className="text-xs text-zinc-500">
                          {student.skills.slice(0, 4).join(' · ')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-[#27272A] pt-3.5">
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(student)}
                        className="text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                      >
                        View Profile
                      </button>

                      {conn?.status === 'accepted' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveChatConnId(conn.id);
                            setTab('messages');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Message
                        </button>
                      ) : conn?.status === 'pending' ? (
                        <span className="text-xs text-zinc-500">
                          {conn.fromUid === me.uid ? 'Request Sent' : 'Pending Your Reply'}
                        </span>
                      ) : student.allowConnections ? (
                        <button
                          type="button"
                          onClick={() => handleConnect(student)}
                          disabled={sendingTo === student.uid}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Connect
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-500">Connections Closed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-5 space-y-4">
            <h2 className="font-display text-base font-semibold">Incoming Requests</h2>
            {incomingRequests.length === 0 ? (
              <p className="text-xs text-zinc-400">No pending connection requests.</p>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-xl border border-[#27272A] bg-[#09090B] p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#F5F5F5]">{req.fromName}</p>
                      {req.note && <p className="mt-0.5 text-xs text-zinc-400">{req.note}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => respondConnectionRequest(req.id, 'accepted')}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => respondConnectionRequest(req.id, 'declined')}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#27272A] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500"
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-5 space-y-4">
            <h2 className="font-display text-base font-semibold">Sent Requests</h2>
            {outgoingRequests.length === 0 ? (
              <p className="text-xs text-zinc-400">No outgoing pending requests.</p>
            ) : (
              <div className="space-y-3">
                {outgoingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-xl border border-[#27272A] bg-[#09090B] p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#F5F5F5]">{req.toName}</p>
                      <p className="text-xs text-zinc-500">Awaiting acceptance</p>
                    </div>
                    <span className="text-xs text-amber-400">Pending</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 rounded-2xl border border-[#27272A] bg-[#141417] overflow-hidden min-h-[420px]">
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#27272A] p-4 space-y-2">
            <p className="text-xs font-medium text-zinc-400 px-2 pb-2">
              Mutual Connections
            </p>
            {acceptedConnections.length === 0 ? (
              <p className="px-2 text-xs text-zinc-500">
                Messaging unlocks once a peer accepts your connection request.
              </p>
            ) : (
              acceptedConnections.map((conn) => {
                const peerName = conn.fromUid === me.uid ? conn.toName : conn.fromName;
                return (
                  <button
                    key={conn.id}
                    type="button"
                    onClick={() => setActiveChatConnId(conn.id)}
                    className={`w-full text-left rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                      activeChatConnId === conn.id
                        ? 'bg-[#09090B] text-emerald-400 font-medium border border-[#27272A]'
                        : 'text-zinc-300 hover:bg-[#09090B]/60'
                    }`}
                  >
                    {peerName}
                  </button>
                );
              })
            )}
          </div>

          <div className="lg:col-span-8 flex flex-col justify-between p-5">
            {!activeChatConnId ? (
              <div className="m-auto text-center space-y-1.5">
                <p className="text-sm font-medium text-zinc-300">Select a mutual connection</p>
                <p className="text-xs text-zinc-500">
                  Direct messages are protected by mutual-consent rules.
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[320px] pr-1">
                  {messages.length === 0 ? (
                    <p className="text-xs text-zinc-500">No messages yet. Say hello!</p>
                  ) : (
                    messages.map((m) => {
                      const mine = m.senderUid === me.uid;
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                              mine
                                ? 'bg-emerald-500 text-zinc-950 font-medium'
                                : 'border border-[#27272A] bg-[#09090B] text-zinc-200'
                            }`}
                          >
                            {m.body}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendMsg} className="mt-4 flex items-center gap-2 border-t border-[#27272A] pt-3">
                  <input
                    type="text"
                    maxLength={1000}
                    value={messageDraft}
                    onChange={(e) => setMessageDraft(e.target.value)}
                    placeholder="Write a message..."
                    className="flex-1 rounded-xl border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-xs text-[#F5F5F5] focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingMsg || !messageDraft.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Profile Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#27272A] bg-[#141417] p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold">{selectedStudent.fullName}</h2>
                <p className="text-xs text-zinc-400">
                  B.Tech {selectedStudent.branch} · {selectedStudent.year} · #{selectedStudent.memberNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-zinc-300">
              <p className="text-xs font-medium" style={{ color: getArchetypeMeta(selectedStudent.primaryCategory).accentHex }}>
                {getArchetypeMeta(selectedStudent.primaryCategory).name}
              </p>
              {selectedStudent.bio && <p className="leading-relaxed">{selectedStudent.bio}</p>}
              {selectedStudent.careerGoal && (
                <p className="text-xs text-zinc-400">
                  Goal: <span className="text-zinc-200">{selectedStudent.careerGoal}</span>
                </p>
              )}
              {selectedStudent.skills.length > 0 && (
                <p className="text-xs text-zinc-400">
                  Skills: <span className="text-zinc-200">{selectedStudent.skills.join(' · ')}</span>
                </p>
              )}
              {selectedStudent.secondaryInterests.length > 0 && (
                <p className="text-xs text-zinc-400">
                  Interests: <span className="text-zinc-200">{selectedStudent.secondaryInterests.join(' · ')}</span>
                </p>
              )}
            </div>

            {!getConnectionForPeer(selectedStudent.uid) && selectedStudent.allowConnections && (
              <div className="space-y-2 border-t border-[#27272A] pt-4">
                <input
                  type="text"
                  maxLength={240}
                  value={connectNote}
                  onChange={(e) => setConnectNote(e.target.value)}
                  placeholder="Optional intro note..."
                  className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3.5 py-2 text-xs text-[#F5F5F5] focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleConnect(selectedStudent)}
                  disabled={sendingTo === selectedStudent.uid}
                  className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
                >
                  Send Connection Request
                </button>
              </div>
            )}

            <div className="flex justify-end border-t border-[#27272A] pt-3">
              <button
                type="button"
                onClick={() => {
                  setReportingUid(selectedStudent.uid);
                  setSelectedStudent(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400"
              >
                <Flag className="w-3.5 h-3.5" />
                Report Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingUid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <form
            onSubmit={handleReportSubmit}
            className="w-full max-w-md rounded-2xl border border-[#27272A] bg-[#141417] p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Report Student Profile</h3>
              <button type="button" onClick={() => setReportingUid(null)} className="text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              required
              minLength={5}
              maxLength={400}
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe impersonation, spam, or policy violation..."
              className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-xs text-[#F5F5F5] focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-red-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-400"
            >
              Submit Report
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
