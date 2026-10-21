import React from 'react';
import { motion } from 'framer-motion';
import { Check, User } from 'lucide-react';
import type { Candidate } from '../../types/election';

interface CandidateCardProps {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: (candidate: Candidate) => void;
  disabled?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  isSelected,
  onSelect,
  disabled = false,
}) => {
  const [imgError, setImgError] = React.useState(false);
  const formattedNumber = String(candidate.candidate_number).padStart(2, '0');

  return (
    <motion.div
      whileHover={!disabled ? { y: -4 } : undefined}
      whileTap={!disabled ? { scale: 0.99 } : undefined}
      onClick={() => !disabled && onSelect(candidate)}
      className={`
        relative flex flex-col justify-between h-full rounded-2xl overflow-hidden
        cursor-pointer transition-all duration-200 border-2 bg-white
        ${
          isSelected
            ? 'border-gold-accent shadow-card-selected ring-4 ring-gold-accent/20 bg-gradient-to-b from-gold-50/50 to-white'
            : 'border-slate-200 hover:border-gold-accent/60 shadow-card hover:shadow-card-hover'
        }
        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
      `}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Kandidat nomor urut ${formattedNumber}, ${candidate.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!disabled) onSelect(candidate);
        }
      }}
    >
      {/* Top Banner: Candidate Number Tag */}
      <div className="relative flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div
            className={`
              w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-extrabold text-lg sm:text-xl transition-all shadow-sm
              ${
                isSelected
                  ? 'bg-gradient-to-br from-gold-accent to-gold-dark text-navy-900 border border-gold-light'
                  : 'bg-navy-primary text-white'
              }
            `}
          >
            {formattedNumber}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Nomor Urut
            </span>
            <span className="text-xs font-bold text-navy-primary">
              Kandidat Resmi
            </span>
          </div>
        </div>

        {/* Selected Checkmark Badge */}
        {isSelected ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 px-3 py-1 bg-gold-accent text-navy-900 font-bold text-xs rounded-full shadow-sm"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>TERPILIH</span>
          </motion.div>
        ) : (
          <span className="text-xs font-semibold text-slate-400">
            Ketuk untuk memilih
          </span>
        )}
      </div>

      {/* Candidate Photo Section - Responsive Aspect Ratio */}
      <div className="relative w-full aspect-[4/4.5] sm:aspect-[4/4.2] bg-slate-100 overflow-hidden flex items-center justify-center">
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
            <span className="text-xs font-medium text-slate-600">Foto Resmi</span>
          </div>
        )}

        {/* Selection Overlay Tint */}
        {isSelected && (
          <div className="absolute inset-0 bg-gold-accent/10 border-b-2 border-gold-accent/40" />
        )}
      </div>

      {/* Candidate Information & Vision */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-navy-primary leading-snug line-clamp-2">
            {candidate.name}
          </h2>
          {candidate.title_or_role && (
            <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-1">
              {candidate.title_or_role}
            </p>
          )}
          {candidate.vision && (
            <p className="text-xs text-slate-600 mt-2.5 italic line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              "{candidate.vision}"
            </p>
          )}
        </div>

        {/* Large Touch Target Selection Button */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            className={`
              w-full min-h-[48px] py-3 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2
              transition-all duration-150 select-none touch-manipulation shadow-sm
              ${
                isSelected
                  ? 'bg-gold-accent hover:bg-gold-light text-navy-900 border border-gold-light shadow-gold-accent/20 font-extrabold'
                  : 'bg-navy-primary/5 hover:bg-navy-primary hover:text-white text-navy-primary border border-navy-primary/20'
              }
            `}
            tabIndex={-1}
          >
            {isSelected ? (
              <>
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>PILIHAN ANDA</span>
              </>
            ) : (
              <span>PILIH KANDIDAT #{formattedNumber}</span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
