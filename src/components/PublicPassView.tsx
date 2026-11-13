import { useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck, Clock } from 'lucide-react';
import { fetchPublicPassByMemberNumber } from '../lib/kluService';
import { getArchetypeMeta, type StudentPublic } from '../types/klu';
import { TribePassCard } from './TribePassCard';

interface PublicPassViewProps {
  memberNumber: string;
  onExit: () => void;
}

export function PublicPassView({ memberNumber, onExit }: PublicPassViewProps) {
  const [student, setStudent] = useState<StudentPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchPublicPassByMemberNumber(memberNumber)
      .then((res) => {
        if (active) {
          setStudent(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [memberNumber]);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F5F5F5] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-[#F5F5F5] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to KLU TRIBE
          </button>
          <span className="font-mono text-xs text-zinc-500">Public Pass Verification</span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-8 text-sm text-zinc-400">
            Verifying member pass #{memberNumber}...
          </div>
        ) : !student ? (
          <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-8 space-y-3">
            <h1 className="font-display text-xl font-semibold">Pass Not Found</h1>
            <p className="text-sm text-zinc-400">
              No active KLU TRIBE member pass was found for identifier <span className="font-mono text-zinc-200">{memberNumber}</span>.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">
                  {student.fullName}
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  B.Tech {student.branch} · {student.year} · {getArchetypeMeta(student.primaryCategory).name}
                </p>
              </div>
              {student.verificationStatus === 'verified' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  Institutional ID Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
                  <Clock className="w-4 h-4" />
                  Verification Pending
                </span>
              )}
            </div>

            <TribePassCard student={student} showActions={false} />

            {student.bio && (
              <div className="rounded-2xl border border-[#27272A] bg-[#141417] p-5 space-y-2">
                <p className="text-xs text-zinc-400">About Member</p>
                <p className="text-sm leading-relaxed text-zinc-200">{student.bio}</p>
              </div>
            )}

            <p className="text-xs text-zinc-500">
              For student privacy, phone numbers, email addresses, and full university registration IDs are never exposed on public verification links.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
