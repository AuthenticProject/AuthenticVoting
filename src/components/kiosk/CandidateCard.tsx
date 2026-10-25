import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, User, Check, MapPin } from 'lucide-react';
import type { Candidate } from '../../types/election';

interface CandidateCardProps {
  candidate: Candidate;
  isSelected: boolean;
  isSubmitting: boolean;
  disabled?: boolean;
  onSelect: (candidate: Candidate) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = React.memo(({
  candidate,
  isSelected,
  isSubmitting,
  disabled = false,
  onSelect,
}) => {
  const [imgError, setImgError] = React.useState(false);
  const formattedNumber = String(candidate.candidate_number).padStart(2, '0');

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || isSubmitting) return;
    onSelect(candidate);
  };

  const isCurrentSubmitting = isSubmitting && isSelected;

  return (
    <motion.div
      whileTap={!disabled && !isSubmitting ? { scale: 0.97 } : undefined}
      onClick={handleClick}
      className={`
        relative w-full max-w-[340px] sm:max-w-[360px] h-full flex flex-col justify-between
        cursor-pointer select-none touch-manipulation transform-gpu transition-all duration-150
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
      `}
      role="button"
      tabIndex={disabled || isSubmitting ? -1 : 0}
      aria-pressed={isSelected}
      aria-label={`Pilih Kandidat ${candidate.name}, ${candidate.title_or_role || ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!disabled && !isSubmitting) onSelect(candidate);
        }
      }}
    >
      {/* Outer Card Wrapper */}
      <div
        className={`
          flex flex-col justify-between h-full p-3 sm:p-4 rounded-2xl
          transition-all duration-150 border-2 shadow-xl
          ${
            isSelected
              ? 'border-gold-accent bg-[#2C2C32] shadow-gold-glow scale-[1.01]'
              : 'border-[#38383E] bg-[#222226] hover:border-gold-accent/80 hover:bg-[#28282E]'
          }
        `}
      >
        <div className="relative flex flex-col justify-between h-full">
          <div>
            {/* Top Bar: Number & Status */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#38383E]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-accent/15 border border-gold-accent/30 text-gold-accent text-xs font-black tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-accent" />
                CALON #{formattedNumber}
              </span>

              {isCurrentSubmitting ? (
                <div className="flex items-center gap-1 px-2.5 py-0.5 bg-gold-accent/20 text-gold-accent font-bold text-[11px] rounded-full border border-gold-accent/40 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-gold-accent" />
                  <span>Mencatat...</span>
                </div>
              ) : isSelected ? (
                <div className="flex items-center gap-1 px-2.5 py-0.5 bg-gold-accent text-[#1C1C1E] font-black text-[11px] rounded-full shadow-sm">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>DIPILIH</span>
                </div>
              ) : null}
            </div>

            {/* Candidate Photo */}
            <div className="flex items-center justify-center w-full my-1">
              <div className="relative w-full aspect-[4/3.8] bg-[#1C1C1E] rounded-xl overflow-hidden border border-[#3E3E46] flex items-center justify-center">
                {!imgError && candidate.photo_url ? (
                  <img
                    src={candidate.photo_url}
                    alt={candidate.name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover object-top transition-transform duration-200"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#1E1E22] text-slate-400 p-4">
                    <User className="w-16 h-16 text-slate-500 mb-1 stroke-[1.5]" />
                    <span className="text-[11px] font-semibold text-slate-400">Foto Kandidat</span>
                  </div>
                )}

                {/* Number Badge floating on photo */}
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-[#1C1C1E]/90 text-gold-accent font-black text-sm border border-gold-accent/40 shadow-md">
                  #{formattedNumber}
                </div>
              </div>
            </div>

            {/* Candidate Information */}
            <div className="text-center pt-2 pb-1 px-1 flex flex-col items-center">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug line-clamp-2 min-h-[44px] flex items-center justify-center">
                {candidate.name}
              </h2>
              {candidate.title_or_role && (
                <div className="mt-1 flex items-center justify-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1C1C1E] text-gold-accent border border-gold-accent/30 truncate max-w-[220px]">
                    <MapPin className="w-3 h-3 text-gold-accent shrink-0" />
                    <span className="truncate">{candidate.title_or_role}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* LARGE TOUCHSCREEN "PILIH" BUTTON */}
          <div className="mt-2 pt-2 border-t border-[#38383E]">
            <button
              type="button"
              disabled={disabled || isSubmitting}
              onClick={(e) => {
                e.stopPropagation();
                handleClick(e);
              }}
              className={`
                w-full min-h-[52px] sm:min-h-[56px] py-2.5 px-4 rounded-xl font-black text-lg sm:text-xl flex items-center justify-center gap-2.5
                transition-transform active:scale-95 select-none touch-manipulation shadow-lg tracking-wider
                ${
                  isCurrentSubmitting
                    ? 'bg-gold-accent text-[#1C1C1E] cursor-wait shadow-gold-glow'
                    : disabled
                    ? 'bg-[#353539] text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-gold-accent hover:bg-gold-light active:bg-gold-dark text-[#1C1C1E] shadow-gold-accent/30 border border-gold-light'
                }
              `}
              tabIndex={0}
            >
              {isCurrentSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#1C1C1E] stroke-[2.5]" />
                  <span>MENYIMPAN...</span>
                </>
              ) : (
                <span>PILIH</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

CandidateCard.displayName = 'CandidateCard';
