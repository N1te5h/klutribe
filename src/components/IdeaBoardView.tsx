import { useState, type FormEvent } from 'react';
import { Lightbulb, Plus, Trash2, Users, Check, X } from 'lucide-react';
import {
  createStartupIdea,
  deleteIdea,
  sendConnectionRequest,
  toggleIdeaInterest,
} from '../lib/kluService';
import {
  CURATED_SKILLS,
  getArchetypeMeta,
  type Connection,
  type StartupIdea,
  type StudentPublic,
} from '../types/klu';

interface IdeaBoardViewProps {
  me: StudentPublic;
  ideas: StartupIdea[];
  students: StudentPublic[];
  connections: Connection[];
}

export function IdeaBoardView({ me, ideas, students, connections }: IdeaBoardViewProps) {
  const [subTab, setSubTab] = useState<'ideas' | 'cofounders'>('ideas');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [stage, setStage] = useState<StartupIdea['stage']>('Concept');
  const [rolesNeeded, setRolesNeeded] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['React / Next.js']);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [submitting, setSubmitting] = useState(false);

  const [cofounderSkillFilter, setCofounderSkillFilter] = useState('ALL');
  const [connectingUid, setConnectingUid] = useState<string | null>(null);

  const toggleReqSkill = (skill: string) => {
    setRequiredSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : prev.length < 8 ? [...prev, skill] : prev
    );
  };

  const handleSubmitIdea = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createStartupIdea({
        authorUid: me.uid,
        authorName: me.fullName,
        authorBranch: me.branch,
        title,
        description,
        problem,
        solution,
        stage,
        requiredSkills,
        rolesNeeded,
        visibility,
      });
      setTitle('');
      setDescription('');
      setProblem('');
      setSolution('');
      setRolesNeeded('');
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const cofounders = students.filter((s) => {
    if (s.uid === me.uid || !s.startupInterest) return false;
    if (cofounderSkillFilter !== 'ALL' && !s.skills.includes(cofounderSkillFilter)) return false;
    return true;
  });

  const isConnectedOrPending = (uid: string) =>
    connections.some((c) => c.participantUids.includes(uid));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Startup & Idea Board</h1>
          <p className="text-sm text-zinc-400">
            Pitch campus ventures, recruit builders, and match with potential KL University co-founders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center rounded-xl border border-[#27272A] bg-[#141417] p-1">
            <button
              type="button"
              onClick={() => setSubTab('ideas')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'ideas' ? 'bg-[#F5F5F5] text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Idea Board ({ideas.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('cofounders')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'cofounders' ? 'bg-[#F5F5F5] text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Co-founder Matching ({cofounders.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Post Idea
          </button>
        </div>
      </div>

      {subTab === 'ideas' && (
        <>
          {ideas.length === 0 ? (
            <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-10 text-center space-y-3">
              <Lightbulb className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="font-medium text-sm">No startup ideas posted yet</p>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Share the first campus product concept, AI tool, or marketplace idea and attract engineers and designers from KL University.
              </p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950"
              >
                Post First Idea
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {ideas.map((idea) => {
                const interested = idea.interestedUids.includes(me.uid);
                const isMine = idea.authorUid === me.uid;
                return (
                  <div
                    key={idea.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#27272A] bg-[#141417] p-6 space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-zinc-400">
                            {idea.stage} · {idea.authorName} ({idea.authorBranch})
                            {idea.visibility === 'private' ? ' · Private Draft' : ''}
                          </p>
                          <h2 className="mt-1 font-display text-lg font-semibold text-[#F5F5F5]">
                            {idea.title}
                          </h2>
                        </div>
                        {isMine && (
                          <button
                            type="button"
                            onClick={() => deleteIdea(idea.id)}
                            className="text-zinc-500 hover:text-red-400 transition-colors"
                            title="Delete Idea"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <p className="text-sm text-zinc-300 leading-relaxed">{idea.description}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-[#27272A] pt-3 text-xs">
                        <div>
                          <p className="text-zinc-500">Problem</p>
                          <p className="mt-0.5 text-zinc-300">{idea.problem}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Solution</p>
                          <p className="mt-0.5 text-zinc-300">{idea.solution}</p>
                        </div>
                      </div>

                      <div className="text-xs space-y-1 border-t border-[#27272A] pt-3">
                        <p className="text-zinc-400">
                          Roles Needed: <span className="text-zinc-200">{idea.rolesNeeded}</span>
                        </p>
                        {idea.requiredSkills.length > 0 && (
                          <p className="text-zinc-500">
                            Skills: {idea.requiredSkills.join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#27272A] pt-3.5">
                      <span className="font-mono text-xs tabular-nums text-zinc-400">
                        {idea.interestedUids.length} interested
                      </span>
                      {idea.visibility === 'public' && (
                        <button
                          type="button"
                          onClick={() => toggleIdeaInterest(idea, me.uid)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${
                            interested
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                              : 'bg-emerald-500 text-zinc-950 font-semibold hover:bg-emerald-400'
                          }`}
                        >
                          {interested && <Check className="w-3.5 h-3.5" />}
                          {interested ? 'Interested' : "I'm Interested"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {subTab === 'cofounders' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#27272A] bg-[#141417] p-4">
            <p className="text-xs text-zinc-300">
              Students who explicitly opted into Startup & Co-founder Matching
            </p>
            <select
              value={cofounderSkillFilter}
              onChange={(e) => setCofounderSkillFilter(e.target.value)}
              className="rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#F5F5F5]"
            >
              <option value="ALL">All Skills</option>
              {CURATED_SKILLS.map((sk) => (
                <option key={sk} value={sk}>{sk}</option>
              ))}
            </select>
          </div>

          {cofounders.length === 0 ? (
            <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-8 text-center space-y-2">
              <Users className="w-5 h-5 text-zinc-500 mx-auto" />
              <p className="text-sm font-medium">No co-founder matches for this filter yet</p>
              <p className="text-xs text-zinc-400">
                Students who toggle startup interest in onboarding or settings appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {cofounders.map((peer) => {
                const arch = getArchetypeMeta(peer.primaryCategory);
                const already = isConnectedOrPending(peer.uid);
                return (
                  <div
                    key={peer.uid}
                    className="rounded-2xl border border-[#27272A] bg-[#141417] p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display text-base font-semibold">{peer.fullName}</h3>
                          <p className="text-xs text-zinc-400">
                            {peer.branch} · {peer.year}
                          </p>
                        </div>
                        <span className="text-xs font-medium" style={{ color: arch.accentHex }}>
                          {arch.subtitle}
                        </span>
                      </div>
                      {peer.startupIdeaSummary && (
                        <p className="text-xs text-zinc-200 leading-relaxed">
                          Focus: {peer.startupIdeaSummary}
                        </p>
                      )}
                      <p className="text-xs text-zinc-500">{peer.skills.slice(0, 5).join(' · ')}</p>
                    </div>

                    <button
                      type="button"
                      disabled={already || connectingUid === peer.uid}
                      onClick={async () => {
                        setConnectingUid(peer.uid);
                        try {
                          await sendConnectionRequest(me, peer, 'Interested in exploring co-founder collaboration!');
                        } finally {
                          setConnectingUid(null);
                        }
                      }}
                      className="w-full rounded-xl border border-[#27272A] bg-[#09090B] py-2 text-xs font-medium text-zinc-200 hover:border-emerald-500 disabled:opacity-50"
                    >
                      {already ? 'Connection Active / Pending' : connectingUid === peer.uid ? 'Sending...' : 'Request Co-founder Chat'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Post Idea Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
          <form
            onSubmit={handleSubmitIdea}
            className="w-full max-w-xl rounded-2xl border border-[#27272A] bg-[#141417] p-6 space-y-4 my-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Post Startup Idea</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Project Name *</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Campus Marketplace"
                  className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#F5F5F5]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Current Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as StartupIdea['stage'])}
                  className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#F5F5F5]"
                >
                  {['Concept', 'Validation', 'Prototype', 'MVP', 'Launched'].map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Description *</label>
              <textarea
                required
                minLength={10}
                maxLength={800}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#F5F5F5]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Problem *</label>
                <input
                  type="text"
                  required
                  minLength={5}
                  maxLength={400}
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#F5F5F5]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Solution *</label>
                <input
                  type="text"
                  required
                  minLength={5}
                  maxLength={400}
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#F5F5F5]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Team Members Needed *</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={160}
                  value={rolesNeeded}
                  onChange={(e) => setRolesNeeded(e.target.value)}
                  placeholder="e.g. 1 App Developer, 1 UI Designer"
                  className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#F5F5F5]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Visibility</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                  className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#F5F5F5]"
                >
                  <option value="public">Public (Visible on Idea Board)</option>
                  <option value="private">Private (Only visible to me)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Required Skills</label>
              <div className="flex flex-wrap gap-1.5">
                {CURATED_SKILLS.slice(0, 10).map((sk) => (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => toggleReqSkill(sk)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] ${
                      requiredSkills.includes(sk)
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                        : 'border-[#27272A] bg-[#09090B] text-zinc-400'
                    }`}
                  >
                    {sk}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              {submitting ? 'Publishing...' : 'Publish Startup Idea'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
