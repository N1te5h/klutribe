import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Download, ExternalLink, ShieldCheck, Clock, AlertCircle, Share2, Pencil } from 'lucide-react';
import { getArchetypeMeta, type StudentPublic } from '../types/klu';
import { KluTribeLogo } from './KluTribeLogo';
import titaniumCardSurfaceImg from '../assets/images/titanium_card_surface_1794551683597.jpg';

interface TribePassCardProps {
  student: StudentPublic;
  compact?: boolean;
  isPreview?: boolean;
  onEditClick?: () => void;
  showActions?: boolean;
  avatarUrl?: string;
}

export function TribePassCard({
  student,
  compact = false,
  isPreview = false,
  onEditClick,
  showActions = true,
  avatarUrl,
}: TribePassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<'card' | 'story' | null>(null);
  const [copied, setCopied] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);

  const archetype = getArchetypeMeta(student.primaryCategory);
  const publicPassUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?pass=${encodeURIComponent(student.memberNumber)}`
      : `https://klutribe.in/?pass=${student.memberNumber}`;

  const initials = student.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'KL';

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    setDownloading('card');
    setExportNote(null);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement('a');
      link.download = `KLU-TRIBE-${student.memberNumber}.png`;
      link.href = dataUrl;
      link.click();
      setExportNote('Pass PNG downloaded.');
    } catch {
      setExportNote('Export failed. Try again in a desktop browser.');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadStory = async () => {
    if (!storyRef.current) return;
    setDownloading('story');
    setExportNote(null);
    try {
      const dataUrl = await toPng(storyRef.current, {
        width: 1080,
        height: 1920,
        pixelRatio: 1,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `KLU-TRIBE-STORY-${student.memberNumber}.png`;
      link.href = dataUrl;
      link.click();
      setExportNote('1080x1920 Story PNG downloaded.');
    } catch {
      setExportNote('Story export failed. Try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicPassUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setExportNote('Copy failed — share URL manually.');
    }
  };

  const handleWhatsAppShare = () => {
    const text = `My KLU TRIBE Digital Student Pass (${archetype.name}) — ${student.memberNumber}. Verify at ${publicPassUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderVerificationLabel = () => {
    if (isPreview) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-300/90">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          Tribe Pass Preview
        </span>
      );
    }
    if (student.verificationStatus === 'verified') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          KLU Verified
        </span>
      );
    }
    if (student.verificationStatus === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400">
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          Verification Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        Pending ID Review
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Metallic Titanium Pass */}
      <div
        ref={cardRef}
        className={`relative overflow-hidden rounded-2xl border border-white/20 bg-[#0B0D13] text-[#F5F5F5] select-none shadow-[0_24px_64px_-16px_rgba(0,0,0,0.9)] ring-1 ring-inset ring-white/10 ${
          compact ? 'p-5' : 'p-6 sm:p-7'
        }`}
      >
        {/* Brushed Titanium Surface Backdrop with Diagonal Chamfer Sheen */}
        <img
          src={titaniumCardSurfaceImg}
          alt="Brushed titanium pass surface"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover opacity-50 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#090B11]/90 via-[#121622]/75 to-[#06070B]/95 pointer-events-none" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rotate-12 border-l border-white/15 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent"
        />

        {/* Subtle Top Metallic Edge Highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, ${archetype.accentHex}, #38BDF8, ${archetype.accentHex})`,
          }}
        />

        <div className="relative z-10 flex flex-col justify-between gap-6">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <KluTribeLogo variant="card" />
              <p className="mt-1.5 text-xs text-zinc-300/85">
                KL University Student Membership
              </p>
            </div>
            <div className="text-right">
              {renderVerificationLabel()}
              <p className="mt-1 font-mono text-xs tabular-nums text-zinc-300/85">
                {student.batch}
              </p>
            </div>
          </div>

          {/* Identity + Portrait + QR */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 items-end">
            <div className="space-y-4 min-w-0">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-[#141720] shadow-inner">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={student.fullName}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center font-display text-xl font-bold tracking-tight text-white"
                      style={{
                        background: `radial-gradient(circle at 30% 25%, ${archetype.accentHex}38, #0D1018 80%)`,
                      }}
                    >
                      {initials}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                    {student.fullName}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-200/90">
                    B.Tech {student.branch} <span className="mx-1.5 text-zinc-500">·</span> {student.year}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] tabular-nums text-zinc-400">
                    ID {student.maskedStudentId}
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3">
                <p
                  className="font-display text-base font-semibold tracking-tight"
                  style={{ color: archetype.accentHex }}
                >
                  {archetype.name}
                </p>
                <p className="mt-0.5 text-xs text-zinc-300/80">{archetype.motto}</p>
              </div>

              {!compact && student.skills.length > 0 && (
                <div className="border-t border-white/10 pt-3">
                  <p className="text-[11px] uppercase tracking-wider text-zinc-400">Core Skills</p>
                  <p className="mt-1 text-xs text-zinc-200 leading-relaxed">
                    {student.skills.slice(0, 5).join(' · ')}
                  </p>
                </div>
              )}
            </div>

            {/* Safe Public QR Code (No PII Encoded) */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
              <div className="rounded-xl border border-white/25 bg-white p-2 shadow-md">
                <QRCodeSVG
                  value={publicPassUrl}
                  size={compact ? 68 : 88}
                  bgColor="#FFFFFF"
                  fgColor="#09090B"
                  level="M"
                />
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[11px] text-zinc-400">Member ID</p>
                <p className="font-mono text-sm font-semibold tabular-nums text-white">
                  #{student.memberNumber}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {showActions && !isPreview && (
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadCard}
            disabled={downloading !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading === 'card' ? 'Exporting...' : 'Download PNG'}
          </button>

          <button
            type="button"
            onClick={handleDownloadStory}
            disabled={downloading !== null}
            className="inline-flex items-center gap-2 rounded-xl border border-[#27272A] bg-[#141417] px-4 py-2 text-xs font-medium text-[#F5F5F5] hover:border-zinc-500 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading === 'story' ? 'Rendering 1080x1920...' : 'Instagram Story (1080×1920)'}
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="inline-flex items-center gap-2 rounded-xl border border-[#27272A] bg-[#141417] px-4 py-2 text-xs font-medium text-[#F5F5F5] hover:border-zinc-500 transition-colors whitespace-nowrap shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            WhatsApp Status
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 rounded-xl border border-[#27272A] bg-[#141417] px-4 py-2 text-xs font-medium text-[#F5F5F5] hover:border-zinc-500 transition-colors whitespace-nowrap shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Link Copied' : 'Public Link'}
          </button>

          <a
            href={`/?pass=${encodeURIComponent(student.memberNumber)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#27272A] bg-[#141417] px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Verify View
          </a>

          {onEditClick && (
            <button
              type="button"
              onClick={onEditClick}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#27272A] bg-[#141417] px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              Update Card
            </button>
          )}
        </div>
      )}

      {exportNote && (
        <p className="text-xs text-zinc-400">{exportNote}</p>
      )}

      {/* Off-screen 1080x1920 Instagram Story Render Target */}
      {!isPreview && (
        <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
          <div
            ref={storyRef}
            style={{ width: '1080px', height: '1920px' }}
            className="relative flex flex-col justify-between bg-[#09090B] p-20 text-[#F5F5F5]"
          >
            <img
              src={titaniumCardSurfaceImg}
              alt=""
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#09090B]/90 via-[#141417]/80 to-[#09090B]/95" />
            <div
              className="absolute top-0 left-0 right-0 h-3"
              style={{ backgroundColor: archetype.accentHex }}
            />

            <div className="relative z-10 flex items-center justify-between border-b border-white/15 pb-12">
              <div>
                <KluTribeLogo variant="story" />
                <p className="mt-4 text-2xl text-zinc-400">KL University · Vaddeswaram</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl text-zinc-300">BATCH {student.batch}</p>
                <p className="mt-2 text-2xl font-medium" style={{ color: archetype.accentHex }}>
                  {student.verificationStatus === 'verified' ? 'KLU Verified Member' : 'Member Pass'}
                </p>
              </div>
            </div>

            <div className="relative z-10 space-y-14">
              <div>
                <p className="text-2xl text-zinc-400">Student Member</p>
                <h2 className="mt-3 font-display text-7xl font-bold tracking-tight leading-tight">
                  {student.fullName}
                </h2>
                <p className="mt-5 text-3xl text-zinc-300">
                  B.Tech {student.branch} · {student.year}
                </p>
              </div>

              <div className="border-t border-white/15 pt-12">
                <p className="text-2xl text-zinc-400">Selected Archetype</p>
                <p
                  className="mt-3 font-display text-5xl font-bold tracking-tight"
                  style={{ color: archetype.accentHex }}
                >
                  {archetype.name}
                </p>
                <p className="mt-4 text-3xl text-zinc-300">{archetype.motto}</p>
              </div>

              {student.skills.length > 0 && (
                <div className="border-t border-white/15 pt-12">
                  <p className="text-2xl text-zinc-400">Capabilities</p>
                  <p className="mt-4 text-3xl leading-relaxed text-zinc-200">
                    {student.skills.slice(0, 6).join(' · ')}
                  </p>
                </div>
              )}
            </div>

            <div className="relative z-10 flex items-end justify-between border-t border-white/15 pt-12">
              <div>
                <p className="text-2xl text-zinc-400">Member Identifier</p>
                <p className="mt-2 font-mono text-4xl font-semibold tabular-nums">
                  #{student.memberNumber}
                </p>
                <p className="mt-3 text-xl text-zinc-500">Your Campus. Your People. Your Future.</p>
              </div>
              <div className="rounded-3xl bg-white p-5">
                <QRCodeSVG value={publicPassUrl} size={200} bgColor="#FFFFFF" fgColor="#09090B" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
