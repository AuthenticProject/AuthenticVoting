import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import type { Candidate } from '../../types/election';
import { CandidateCard } from './CandidateCard';
import { Button } from '../common/Button';

interface CandidateSelectionScreenProps {
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  isSubmitting: boolean;
  submissionError: string | null;
  onSelectCandidate: (candidate: Candidate) => void;
  onRetry: () => void;
  onCancelSession: () => void;
}

export const CandidateSelectionScreen: React.FC<CandidateSelectionScreenProps> = ({
  candidates,
  selectedCandidate,
  isSubmitting,
  submissionError,
  onSelectCandidate,
  onRetry,
  onCancelSession,
}) => {
  return (
    <div className="h-full flex flex-col justify-between py-2 sm:py-3 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Top Header & Instructions */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-2 shrink-0 bg-white/80 backdrop-blur-md py-2 px-6 rounded-2xl border border-slate-200/70 shadow-sm max-w-2xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-gold-accent/20 border border-gold-accent/40 text-navy-primary font-bold text-xs uppercase tracking-wider mb-1">
          Langkah Pemilihan
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-navy-primary">
          Pilih Salah Satu Kandidat
        </h2>
        <p className="text-xs sm:text-sm text-slate-700 mt-0.5 font-medium">
          Tekan tombol <span className="font-extrabold text-navy-primary bg-gold-accent/30 px-2 py-0.5 rounded border border-gold-accent/50">PILIH</span> pada kandidat untuk langsung merekam suara Anda.
        </p>
      </motion.div>

      {/* Submission Error Banner with Safe Retry Option */}
      {submissionError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-3 p-3.5 sm:p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-rose-900 shrink-0"
        >
          <div className="flex items-center gap-3 text-left w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-rose-200/80 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <p className="font-extrabold text-sm sm:text-base text-rose-950">
                Gagal Menyimpan Suara
              </p>
              <p className="text-xs sm:text-sm text-rose-800 line-clamp-2">
                {submissionError}
              </p>
              <p className="text-[11px] text-rose-700/90 mt-0.5">
                ID transaksi dipertahankan untuk keamanan suara. Silakan tekan tombol Coba Lagi di samping.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onCancelSession}
              disabled={isSubmitting}
              className="text-xs sm:text-sm border-rose-300 text-rose-900 hover:bg-rose-100"
            >
              Batalkan
            </Button>
            <Button
              type="button"
              variant="primary-gold"
              size="md"
              isLoading={isSubmitting}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={onRetry}
              className="text-xs sm:text-sm font-extrabold shadow-md px-5"
            >
              Coba Lagi
            </Button>
          </div>
        </motion.div>
      )}

      {/* Dynamic Candidate Grid: Responsive for 1, 2, 3, 4, 5+ candidates */}
      <div
        className={`flex-1 grid gap-4 sm:gap-6 lg:gap-8 items-center justify-center min-h-0 py-2 overflow-y-auto ${
          candidates.length <= 2
            ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto w-full'
            : candidates.length === 3
            ? 'grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto w-full'
            : candidates.length === 4
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto w-full'
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto w-full'
        }`}
      >
        {candidates.map((candidate) => {
          const isSelected = selectedCandidate?.id === candidate.id;
          // While submitting, all cards are disabled
          // If there is an unresolved error, only the previously chosen candidate is allowed to retry
          const isCardDisabled = isSubmitting || (!!submissionError && !isSelected);

          return (
            <div key={candidate.id} className="w-full flex justify-center">
              <CandidateCard
                candidate={candidate}
                isSelected={isSelected}
                isSubmitting={isSubmitting}
                disabled={isCardDisabled}
                onSelect={onSelectCandidate}
              />
            </div>
          );
        })}
      </div>

      {/* Bottom Bar: Status & Cancellation */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 pt-2 border-t border-slate-200/80 shrink-0 flex items-center justify-between gap-3 bg-white/70 backdrop-blur-sm px-4 py-2.5 rounded-2xl"
      >
        {/* Left: Cancellation / Reset button */}
        <button
          type="button"
          onClick={onCancelSession}
          disabled={isSubmitting}
          className="min-h-[44px] px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors touch-manipulation"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>Batalkan Sesi</span>
        </button>

        {/* Center / Right: Dynamic status text */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600">
          {isSubmitting ? (
            <span className="flex items-center gap-2 text-navy-primary font-bold bg-gold-accent/20 px-3.5 py-1.5 rounded-xl border border-gold-accent/40 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-navy-primary" />
              Menyimpan suara ke server...
            </span>
          ) : (
            <span className="text-slate-500 text-xs hidden sm:inline">
              Ketuk tombol PILIH pada foto kandidat di atas
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
};
