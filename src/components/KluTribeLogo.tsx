import { useState } from 'react';

interface KluTribeLogoProps {
  variant?: 'compact' | 'card' | 'full' | 'story';
  className?: string;
}

export function KluTribeLogo({ variant = 'compact', className = '' }: KluTribeLogoProps) {
  const [imgError, setImgError] = useState(false);

  const imgHeightClass =
    variant === 'story'
      ? 'h-24'
      : variant === 'full'
        ? 'h-10 sm:h-11'
        : variant === 'card'
          ? 'h-8'
          : 'h-7';

  if (imgError) {
    return (
      <span className="font-display text-sm font-bold tracking-[0.14em] text-[#F5F5F5] whitespace-nowrap shrink-0">
        KLU TRIBE
      </span>
    );
  }

  return (
    <img
      src="/assets/klu-tribe-logo.png"
      alt="KLU TRIBE — The Student Community of KL University"
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className={`w-auto object-contain shrink-0 select-none ${imgHeightClass} ${className}`}
    />
  );
}
