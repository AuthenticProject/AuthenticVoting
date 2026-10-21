import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, RotateCcw, AlertCircle } from 'lucide-react';
import type { Candidate } from '../../types/election';
import { CandidateCard } from './CandidateCard';
import { Button } from '../common/Button';

interface CandidateSelectionScreenProps {
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  onSelectCandidate: (candidate: Candidate) => void;
  onProceedToConfirmation: () => void;
  onCancelSession: () => void;
}

export const CandidateSelectionScreen: React.FC<CandidateSelectionScreenProps> = ({
  candidates,
  selectedCandidate,
  onSelectCandidate,
  onProceedToConfirmation,
  onCancelSession,
}) => {
  return (
    <div className="h-full flex flex-col justify-between py-3 sm:py-4 px-4 sm:px-8 max-w-7xl mx-auto w-full">
      {/* Top Instruction Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-3 sm:mb-4 shrink-0"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-accent/15 border border-gold-accent/30 text-navy-primary font-bold text-xs uppercase tracking-wider mb-1">
          Langkah 1 dari 2
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-navy-primary">
          Pilih Salah Satu Kandidat
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
          Ketuk kartu kandidat untuk memilih, kemudian tekan tombol <span className="font-bold text-navy-primary">Lanjutkan</span> di bawah.
        </p>
      </motion.div>

      {/* Grid of 3 Candidates: Exactly 3 equal slots */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch min-h-0 py-1">
        {candidates.map((candidate) => (
          <div key={candidate.id} className="h-full">
            <CandidateCard
              candidate={candidate}
              isSelected={selectedCandidate?.id === candidate.id}
              onSelect={onSelectCandidate}
            />
          </div>
        ))}
      </div>

      {/* Bottom Sticky Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 pt-3 border-t border-slate-200/80 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/60 backdrop-blur-sm p-3 rounded-2xl"
      >
        {/* Left: Cancellation / Reset button */}
        <button
          type="button"
          onClick={onCancelSession}
          className="min-h-[48px] px-5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold text-sm flex items-center gap-2 transition-colors touch-manipulation"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>Batalkan Sesi</span>
        </button>

        {/* Center / Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
          {selectedCandidate ? (
            <span className="text-navy-primary font-bold flex items-center gap-1.5 bg-gold-accent/15 px-3 py-1.5 rounded-lg border border-gold-accent/30">
              Pilihan: No. {String(selectedCandidate.candidate_number).padStart(2, '0')} - {selectedCandidate.name}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-500">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Belum ada kandidat yang dipilih
            </span>
          )}
        </div>

        {/* Right: Proceed Button */}
        <div className="w-full sm:w-auto">
          <Button
            variant="primary-gold"
            size="lg"
            fullWidth
            disabled={!selectedCandidate}
            rightIcon={<ArrowRight className="w-5 h-5 stroke-[2.5]" />}
            onClick={onProceedToConfirmation}
            className="w-full sm:w-auto px-8 py-3.5 text-base sm:text-lg font-extrabold shadow-lg"
          >
            LANJUTKAN KE KONFIRMASI
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
