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
      whileHover={!disabled && !isSubmitting ? { y: -5, scale: 1.015 } : undefined}
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
      aria-label={`Pilih Kandidat nomor urut ${formattedNumber}, ${candidate.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Authentic Stamp Perforated Card Body (Tepi Bergerigi Prangko) */}
      <div
        className={`
          stamp-card flex flex-col justify-between h-full p-2.5 sm:p-3.5
          transition-all duration-200 border-2
          ${
            isSelected
              ? 'border-gold-accent bg-gradient-to-b from-amber-50/80 via-white to-amber-50/50 shadow-inner'
              : 'border-slate-300/90 hover:border-gold-accent bg-[#fefcf8]'
          }
        `}
      >
        {/* Inner Stamp Engraving Border with Vintage Guilloche Feel */}
        <div className="relative flex flex-col justify-between h-full border-1.5 border-dashed border-navy-primary/20 rounded p-2.5 sm:p-3 bg-white/85">
          <div>
            {/* Top Header: Candidate Number & Authentic Postage Stamp Badges */}
            <div className="relative flex items-center justify-between pb-2.5 mb-2.5 border-b border-dashed border-slate-200">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div
                  className={`
                    w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-black text-base sm:text-lg transition-all shadow-xs
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
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gold-dark">
                    PRANGKO RESMI
                  </span>
                  <span className="text-xs font-black text-navy-primary tracking-tight">
                    Kandidat #{formattedNumber}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              {isCurrentSubmitting ? (
                <div className="flex items-center gap-1 px-2.5 py-0.5 bg-gold-accent/20 text-navy-primary font-bold text-[11px] rounded-full border border-gold-accent/40 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-gold-dark" />
                  <span>Menyimpan...</span>
                </div>
              ) : isSelected ? (
                <div className="flex items-center gap-1 px-2.5 py-0.5 bg-gold-accent text-navy-primary font-bold text-[11px] rounded-full shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Dipilih</span>
                </div>
              ) : (
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                  Edisi Pemilihan
                </div>
              )}
            </div>

            {/* Candidate Photo Section - Inner Commemorative Stamp Frame */}
            <div className="p-2 sm:p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 flex items-center justify-center mb-2.5">
              <div className="stamp-frame w-full max-w-[280px]">
                <div className="stamp-border p-1.5 sm:p-2 bg-white">
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
                    <div className="absolute top-2 right-2 pointer-events-none select-none opacity-85">
                      <div className="w-11 h-11 rounded-full border-2 border-dashed border-gold-dark/80 flex flex-col items-center justify-center text-[7px] font-black text-navy-primary -rotate-12 bg-white/60 backdrop-blur-[2px] shadow-xs">
                        <span className="tracking-tighter">RESMI</span>
                        <span className="text-[6px] text-gold-dark font-extrabold tracking-widest">5102</span>
                      </div>
                    </div>

                    {/* Stamp Denomination Tag */}
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-navy-primary/90 text-gold-accent font-black text-[9px] sm:text-[10px] tracking-wider uppercase border border-gold-accent/40 shadow-xs backdrop-blur-xs">
                      NOMOR #{formattedNumber}
                    </div>

                    {/* Selection Overlay Tint */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-gold-accent/15 border-2 border-gold-accent pointer-events-none" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate Information */}
            <div className="text-center sm:text-left">
              <h2 className="text-base sm:text-lg font-extrabold text-navy-primary leading-snug line-clamp-2">
                {candidate.name}
              </h2>
              {candidate.title_or_role && (
                <p className="text-xs font-medium text-slate-500 mt-0.5 line-clamp-1">
                  {candidate.title_or_role}
                </p>
              )}
              {candidate.vision && (
                <p className="text-xs text-slate-600 mt-2 italic line-clamp-2 bg-amber-50/40 p-2 rounded border border-dashed border-gold-accent/30 text-left">
                  "{candidate.vision}"
                </p>
              )}
            </div>
          </div>

          {/* Large Touchscreen "PILIH" Button */}
          <div className="mt-3 pt-2.5 border-t border-dashed border-slate-200">
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
