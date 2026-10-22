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

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  isSelected,
  isSubmitting,
  disabled = false,
  onSelect,
}) => {
  const [imgError, setImgError] = React.useState(false);
  const formattedNumber = String(candidate.candidate_number).padStart(2, '0');

  const handleClick = () => {
    if (disabled || isSubmitting) return;
    onSelect(candidate);
  };

  const isCurrentSubmitting = isSubmitting && isSelected;

  return (
    <motion.div
      whileHover={!disabled && !isSubmitting ? { y: -6, scale: 1.018 } : undefined}
      whileTap={!disabled && !isSubmitting ? { scale: 0.985 } : undefined}
      onClick={handleClick}
      className={`
        stamp-card-container relative h-full flex flex-col justify-between
        cursor-pointer select-none transition-transform duration-200
        ${isSelected ? 'is-selected' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
      `}
      role="button"
      tabIndex={disabled || isSubmitting ? -1 : 0}
      aria-pressed={isSelected}
      aria-label={`Pilih Kandidat ${candidate.name}, Daerah ${candidate.title_or_role || 'Daerah'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Outer Card Wrapper with Vintage Filateli Border */}
      <div
        className={`
          stamp-card flex flex-col justify-between h-full p-3 sm:p-4
          transition-all duration-200 border-2
          ${
            isSelected
              ? 'border-gold-accent bg-gradient-to-b from-amber-50/90 via-white to-amber-50/70 shadow-lg'
              : 'border-slate-300/80 hover:border-gold-accent bg-white/95 backdrop-blur-sm'
          }
        `}
      >
        {/* Inner Card Container */}
        <div className="relative flex flex-col justify-between h-full">
          <div>
            {/* Top Status & Indicator (Simplified and Clean) */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-dashed border-slate-200">
              <span className="text-[11px] font-black tracking-wider text-navy-primary uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gold-accent" />
                KANDIDAT #{formattedNumber}
              </span>

              {isCurrentSubmitting ? (
                <div className="flex items-center gap-1 px-2.5 py-0.5 bg-gold-accent/20 text-navy-primary font-bold text-[11px] rounded-full border border-gold-accent/40 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-gold-dark" />
                  <span>Menyimpan...</span>
                </div>
              ) : isSelected ? (
                <div className="flex items-center gap-1 px-2.5 py-0.5 bg-gold-accent text-navy-primary font-bold text-[11px] rounded-full shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Dipilih</span>
                </div>
              ) : null}
            </div>

            {/* BIG VINTAGE POSTAGE STAMP PHOTO (Foto Prangko Jadul Gede & Bergerigi) */}
            <div className="flex items-center justify-center w-full my-1">
              <div className="vintage-stamp w-full">
                {/* Stamp Inner Border Engraving */}
                <div className="relative w-full aspect-[4/4.8] sm:aspect-[4/4.6] bg-slate-100 overflow-hidden flex items-center justify-center stamp-inner-border rounded-xs">
                  {!imgError ? (
                    <img
                      src={candidate.photo_url}
                      alt={candidate.name}
                      onError={() => setImgError(true)}
                      className={`w-full h-full object-cover object-top transition-transform duration-300 ${
                        isSelected ? 'scale-105' : 'hover:scale-102'
                      }`}
                      loading="eager"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200 text-slate-500 p-4">
                      <User className="w-20 h-20 text-slate-400 mb-2 stroke-[1.5]" />
                      <span className="text-xs font-semibold text-slate-600">Foto Kandidat</span>
                    </div>
                  )}

                  {/* Vintage Postmark Cancellation Seal (Cap Pos Prangko Antik) */}
                  <div className="absolute top-2.5 right-2.5 pointer-events-none select-none opacity-90">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-gold-dark/90 flex flex-col items-center justify-center text-[7px] font-black text-navy-primary -rotate-12 bg-white/70 backdrop-blur-[2px] shadow-sm">
                      <span className="tracking-tighter">RESMI</span>
                      <span className="text-[7px] text-gold-dark font-black tracking-widest">5102</span>
                    </div>
                  </div>

                  {/* Stamp Denomination Badge (Nomor Urut Filateli) */}
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded bg-navy-primary/95 text-gold-accent font-black text-xs sm:text-sm tracking-wider uppercase border border-gold-accent/50 shadow-md">
                    #{formattedNumber}
                  </div>

                  {/* Selection Overlay Tint */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-gold-accent/15 border-2 border-gold-accent pointer-events-none" />
                  )}
                </div>
              </div>
            </div>

            {/* Candidate Information: HANYA NAMA DAN DAERAH */}
            <div className="text-center pt-3 pb-2 px-1">
              <h2 className="text-xl sm:text-2xl font-black text-navy-primary tracking-tight leading-tight line-clamp-2">
                {candidate.name}
              </h2>
              <div className="mt-2 flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold bg-amber-50 text-gold-dark border border-gold-accent/40 shadow-xs">
                  <MapPin className="w-3.5 h-3.5 text-gold-dark shrink-0" />
                  <span className="truncate max-w-[240px]">
                    {candidate.title_or_role?.trim() || 'Konsulat / Daerah'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Large Touchscreen "PILIH" Button */}
          <div className="mt-3 pt-2 border-t border-dashed border-slate-200">
            <button
              type="button"
              disabled={disabled || isSubmitting}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className={`
                w-full min-h-[50px] sm:min-h-[54px] py-2.5 px-4 rounded-xl font-black text-base sm:text-lg flex items-center justify-center gap-2.5
                transition-all duration-150 select-none touch-manipulation shadow-md
                ${
                  isCurrentSubmitting
                    ? 'bg-gold-accent text-navy-primary cursor-wait shadow-gold-glow'
                    : disabled
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-gold-accent hover:bg-gold-light active:bg-gold-dark text-navy-primary hover:shadow-lg active:scale-98 border border-gold-light'
                }
              `}
              tabIndex={0}
            >
              {isCurrentSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-navy-primary stroke-[2.5]" />
                  <span className="tracking-wide">MENYIMPAN SUARA...</span>
                </>
              ) : (
                <span className="tracking-wide">PILIH</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
