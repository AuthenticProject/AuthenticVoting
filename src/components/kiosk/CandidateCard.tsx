import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, User, Check } from 'lucide-react';
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
      whileHover={!disabled && !isSubmitting ? { y: -4 } : undefined}
      whileTap={!disabled && !isSubmitting ? { scale: 0.985 } : undefined}
      onClick={handleClick}
      className={`
        relative flex flex-col justify-between h-full rounded-2xl overflow-hidden
        cursor-pointer transition-all duration-200 border-2 bg-white
        ${
          isSelected
            ? 'border-gold-accent shadow-card-selected ring-4 ring-gold-accent/20 bg-gradient-to-b from-gold-50/50 to-white'
            : 'border-slate-200 hover:border-gold-accent/60 shadow-card hover:shadow-card-hover'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
      `}
      role="button"
      tabIndex={disabled || isSubmitting ? -1 : 0}
      aria-pressed={isSelected}
      aria-label={`Pilih Kandidat nomor urut ${formattedNumber}, ${candidate.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Top Banner: Candidate Number Tag */}
      <div className="relative flex items-center justify-between p-3 sm:p-3.5 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <div
            className={`
              w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-extrabold text-lg sm:text-xl transition-all shadow-sm
              ${
                isSelected
                  ? 'bg-gradient-to-br from-gold-accent to-gold-dark text-navy-primary border border-gold-light'
                  : 'bg-navy-primary text-gold-accent border border-gold-accent/30'
              }
            `}
          >
            {formattedNumber}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Nomor Urut
            </span>
            <span className="text-xs font-bold text-navy-primary">
              Kandidat Resmi
            </span>
          </div>
        </div>

        {/* Status Badge */}
        {isCurrentSubmitting ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-gold-accent/20 text-navy-primary font-bold text-xs rounded-full border border-gold-accent/40 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-gold-dark" />
            <span>Menyimpan...</span>
          </div>
        ) : isSelected ? (
          <div className="flex items-center gap-1 px-2.5 py-1 bg-gold-accent text-navy-primary font-bold text-xs rounded-full shadow-sm">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Dipilih</span>
          </div>
        ) : (
          <span className="text-[11px] sm:text-xs font-medium text-slate-400">
            Kandidat #{formattedNumber}
          </span>
        )}
      </div>

      {/* Candidate Photo Section - Commemorative Postage Stamp Frame (Bingkai Prangko) */}
      <div className="p-3 sm:p-4 bg-slate-50/70 flex items-center justify-center">
        <div className="stamp-frame w-full max-w-[280px]">
          <div className="stamp-border p-2 bg-white">
            <div className="relative w-full aspect-[4/4.2] sm:aspect-[4/3.9] bg-slate-100 overflow-hidden flex items-center justify-center stamp-inner-border">
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
                  <User className="w-16 h-16 text-slate-400 mb-2 stroke-[1.5]" />
                  <span className="text-xs font-medium text-slate-600">Foto Resmi</span>
                </div>
              )}

              {/* Commemorative Postmark Seal (Cap Pos Prangko) */}
              <div className="absolute top-2 right-2 pointer-events-none select-none opacity-80">
                <div className="w-11 h-11 rounded-full border-2 border-dashed border-gold-dark/80 flex flex-col items-center justify-center text-[7px] font-black text-navy-primary -rotate-12 bg-white/50 backdrop-blur-[2px] shadow-xs">
                  <span className="tracking-tighter">RESMI</span>
                  <span className="text-[6px] text-gold-dark font-extrabold tracking-widest">5102</span>
                </div>
              </div>

              {/* Stamp Denomination Tag */}
              <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-navy-primary/90 text-gold-accent font-black text-[9px] sm:text-[10px] tracking-wider uppercase border border-gold-accent/40 shadow-xs backdrop-blur-xs">
                KANDIDAT #{formattedNumber}
              </div>

              {/* Selection / Submitting Overlay Tint */}
              {isSelected && (
                <div className="absolute inset-0 bg-gold-accent/15 border-2 border-gold-accent" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Information & Large PILIH Button */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-navy-primary leading-snug line-clamp-2">
            {candidate.name}
          </h2>
          {candidate.title_or_role && (
            <p className="text-xs font-medium text-slate-500 mt-0.5 line-clamp-1">
              {candidate.title_or_role}
            </p>
          )}
          {candidate.vision && (
            <p className="text-xs text-slate-600 mt-2 italic line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
              "{candidate.vision}"
            </p>
          )}
        </div>

        {/* Large Touchscreen "PILIH" Button */}
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          <button
            type="button"
            disabled={disabled || isSubmitting}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className={`
              w-full min-h-[52px] sm:min-h-[56px] py-3 px-4 rounded-xl font-extrabold text-base sm:text-lg flex items-center justify-center gap-2.5
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
    </motion.div>
  );
};
