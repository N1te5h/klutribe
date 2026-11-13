import { useState, type FormEvent } from 'react';
import { Check, ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';
import { createStudentAccount } from '../lib/kluService';
import {
  ACADEMIC_YEARS,
  ARCHETYPES,
  BRANCHES,
  CURATED_SKILLS,
  DEFAULT_ROADMAP,
  SECONDARY_INTERESTS,
  type AcademicYear,
  type ArchetypeId,
  type Branch,
  type CampusMode,
  type GenderOption,
} from '../types/klu';
import { KluTribeLogo } from './KluTribeLogo';

interface OnboardingFlowProps {
  uid: string;
  email: string;
  displayName: string;
  onComplete: () => void;
  onSignOut: () => void;
}

export function OnboardingFlow({
  uid,
  email,
  displayName,
  onComplete,
  onSignOut,
}: OnboardingFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Student Verification + Core Academic Details
  const [fullName, setFullName] = useState(displayName || '');
  const [kluStudentId, setKluStudentId] = useState('');
  const [branch, setBranch] = useState<Branch>('CSE');
  const [year, setYear] = useState<AcademicYear>('1st Year');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<GenderOption>('');
  const [campusMode, setCampusMode] = useState<CampusMode>('');

  // Step 2: Profile, Skills & Startup Intent
  const [skills, setSkills] = useState<string[]>(['React / Next.js']);
  const [bio, setBio] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  const [startupInterest, setStartupInterest] = useState(false);
  const [startupIdeaSummary, setStartupIdeaSummary] = useState('');

  // Step 3: Choose Your Path
  const [primaryCategory, setPrimaryCategory] = useState<ArchetypeId>('day1-hustler');
  const [secondaryInterests, setSecondaryInterests] = useState<string[]>([]);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : prev.length < 12 ? [...prev, skill] : prev
    );
  };

  const toggleSecondary = (interest: string) => {
    setSecondaryInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((s) => s !== interest)
        : prev.length < 5
          ? [...prev, interest]
          : prev
    );
  };

  const validateStep1 = (): boolean => {
    if (fullName.trim().length < 2) {
      setError('Enter your full name (at least 2 characters).');
      return false;
    }
    const cleanId = kluStudentId.trim();
    if (!/^[a-zA-Z0-9]{6,20}$/.test(cleanId)) {
      setError('Enter a valid 10-digit KL University Student ID (6–20 alphanumeric characters).');
      return false;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      setError('Enter a valid 10-digit mobile number (stored privately, never public).');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createStudentAccount({
        uid,
        email,
        fullName,
        kluStudentId,
        branch,
        year,
        phone: phone.replace(/\s+/g, ''),
        gender,
        campusMode,
        primaryCategory,
        secondaryInterests,
        skills,
        bio,
        careerGoal,
        startupInterest,
        startupIdeaSummary,
        roadmap: DEFAULT_ROADMAP,
      });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F5F5F5] px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Top Row */}
        <div className="flex items-center justify-between border-b border-[#27272A] pb-5">
          <div>
            <KluTribeLogo variant="compact" />
            <p className="mt-1.5 text-xs text-zinc-400">Signed in as {email}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="text-xs text-zinc-400 hover:text-[#F5F5F5] transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Stepper Indicator */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { num: 1, label: '01. ID & Academics' },
            { num: 2, label: '02. Skills & Goals' },
            { num: 3, label: '03. Choose Your Path' },
          ].map((item) => (
            <button
              key={item.num}
              type="button"
              onClick={() => {
                if (item.num === 1 || validateStep1()) {
                  setStep(item.num as 1 | 2 | 3);
                }
              }}
              className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                step === item.num
                  ? 'border-emerald-500 bg-[#141417] text-[#F5F5F5]'
                  : step > item.num
                    ? 'border-[#27272A] bg-[#141417] text-emerald-400'
                    : 'border-[#27272A] bg-[#09090B] text-zinc-500'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-6 sm:p-8 space-y-6">
              <div className="space-y-1.5">
                <h1 className="font-display text-2xl font-bold tracking-tight">
                  Student Verification & Profile
                </h1>
                <p className="text-sm text-zinc-400">
                  Your KLU ID enters institutional verification review. Full ID, phone number, and Gmail remain strictly private.
                </p>
              </div>

              <div className="rounded-xl border border-[#27272A] bg-[#09090B] p-4 flex items-start gap-3 text-xs text-zinc-300">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Google login confirms your email account, not KL University enrollment. Your pass starts as <strong className="text-amber-300">Pending ID Review</strong> until verified against campus records.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Karthikeya Varma"
                    className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F5F5] focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">KLU Student ID * (Private)</label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={kluStudentId}
                    onChange={(e) => setKluStudentId(e.target.value)}
                    placeholder="e.g. 2600031042"
                    className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 font-mono text-sm text-[#F5F5F5] focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">B.Tech Branch *</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value as Branch)}
                    className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F5F5] focus:border-emerald-500 focus:outline-none"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Current Year *</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value as AcademicYear)}
                    className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F5F5] focus:border-emerald-500 focus:outline-none"
                  >
                    {ACADEMIC_YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Mobile Number * (Private)</label>
                  <input
                    type="tel"
                    required
                    maxLength={16}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 font-mono text-sm text-[#F5F5F5] focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Gender (Optional)</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as GenderOption)}
                    className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F5F5] focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Skip / Leave blank</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-300">
                  Campus Mode (Optional — only shown in filters if opted in)
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {(['', 'Hosteller', 'Day Scholar'] as CampusMode[]).map((mode) => (
                    <button
                      key={mode || 'none'}
                      type="button"
                      onClick={() => setCampusMode(mode)}
                      className={`rounded-xl border px-4 py-2 text-xs font-medium transition-colors ${
                        campusMode === mode
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-[#27272A] bg-[#09090B] text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {mode || 'Keep Private'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
                >
                  Continue to Skills
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-6 sm:p-8 space-y-6">
              <div className="space-y-1.5">
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  Skills, Goals & Startup Intent
                </h2>
                <p className="text-sm text-zinc-400">
                  Help peers discover you for projects, skill swaps, and co-founder matches.
                </p>
              </div>

              <div className="space-y-2.5">
                <label className="text-xs font-medium text-zinc-300">
                  Select Skills ({skills.length}/12)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CURATED_SKILLS.map((skill) => {
                    const active = skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                            : 'border-[#27272A] bg-[#09090B] text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {active && <Check className="w-3 h-3" />}
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Short Bio (Optional)</label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="What are you learning, building, or exploring at KL University?"
                  className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F5F5] focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">4-Year Career Goal (Optional)</label>
                <input
                  type="text"
                  maxLength={200}
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="e.g. Systems Engineer / Build an AI SaaS before graduation"
                  className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F5F5] focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-3 border-t border-[#27272A] pt-4">
                <label className="flex items-center gap-3 text-sm text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={startupInterest}
                    onChange={(e) => setStartupInterest(e.target.checked)}
                    className="h-4 w-4 rounded border-[#27272A] bg-[#09090B] accent-emerald-500"
                  />
                  Interested in startup building or co-founder matching
                </label>

                {startupInterest && (
                  <input
                    type="text"
                    maxLength={280}
                    value={startupIdeaSummary}
                    onChange={(e) => setStartupIdeaSummary(e.target.value)}
                    placeholder="Optional 1-line startup idea or problem domain"
                    className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F5F5] focus:border-emerald-500 focus:outline-none"
                  />
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-[#F5F5F5]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
                >
                  Choose Your Path
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-6 sm:p-8 space-y-6">
              <div className="space-y-1.5">
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  Choose Your Primary Archetype
                </h2>
                <p className="text-sm text-zinc-400">
                  Pick your primary direction for the next 90 days, plus optional secondary interests so you never feel boxed in.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {ARCHETYPES.map((arch) => {
                  const selected = primaryCategory === arch.id;
                  return (
                    <button
                      key={arch.id}
                      type="button"
                      onClick={() => setPrimaryCategory(arch.id)}
                      className={`text-left rounded-xl border p-4 transition-colors ${
                        selected
                          ? 'border-emerald-500 bg-[#09090B]'
                          : 'border-[#27272A] bg-[#09090B]/60 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-display text-base font-semibold text-[#F5F5F5]">
                            {arch.index}. {arch.name}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-400">{arch.description}</p>
                        </div>
                        <span
                          className="text-xs font-medium shrink-0"
                          style={{ color: arch.accentHex }}
                        >
                          {arch.subtitle}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2.5 border-t border-[#27272A] pt-4">
                <label className="text-xs font-medium text-zinc-300">
                  Secondary Interests (Optional · up to 5)
                </label>
                <div className="flex flex-wrap gap-2">
                  {SECONDARY_INTERESTS.map((interest) => {
                    const active = secondaryInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleSecondary(interest)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                            : 'border-[#27272A] bg-[#09090B] text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-[#F5F5F5]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Generating Tribe Pass...' : 'Generate My Tribe Pass'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
