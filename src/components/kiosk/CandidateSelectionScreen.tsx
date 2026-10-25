import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, AlertTriangle, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
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

export const CandidateSelectionScreen: React.FC<CandidateSelectionScreenProps> = React.memo(({
  candidates,
  selectedCandidate,
  isSubmitting,
  submissionError,
  onSelectCandidate,
  onRetry,
  onCancelSession,
}) => {
  return (
    <div className="h-full flex flex-col justify-between py-2 sm:py-3 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full select-none">
      {/* Top Header & Compact Instructions */}
      <div className="text-center mb-2 shrink-0 bg-[#242428]/90 backdrop-blur-md py-2 px-5 rounded-2xl border border-[#3E3E44] max-w-xl mx-auto shadow-lg">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-accent/20 border border-gold-accent/40 text-gold-accent font-black text-[11px] uppercase tracking-wider mb-0.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-gold-accent" />
          <span>Bilik Suara Resmi</span>
        </div>
        <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
          Ketuk Tombol <span className="text-gold-accent underline underline-offset-4 font-black">PILIH</span> Pada Calon Pilihan Anda
        </h2>
      </div>

      {/* Submission Error Banner with Safe Retry Option */}
      {submissionError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-2 p-3 sm:p-3.5 rounded-2xl bg-rose-950/90 border-2 border-rose-500 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-rose-100 shrink-0"
        >
          <div className="flex items-center gap-3 text-left w-full sm:w-auto">
            <div className="w-9 h-9 rounded-xl bg-rose-800 text-rose-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-white">
                Gagal Menyimpan Suara
              </p>
              <p className="text-xs text-rose-200 line-clamp-2">
                {submissionError}
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
              className="text-xs border-rose-400 text-rose-200 hover:bg-rose-900"
            >
              Batalkan
            </Button>
            <Button
              type="button"
              variant="primary-gold"
              size="md"
              isLoading={isSubmitting}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={onRetry}
              className="text-xs font-black shadow-md px-4"
            >
              Coba Lagi
            </Button>
          </div>
        </motion.div>
      )}

      {/* Dynamic Candidate Grid: Optimized for Landscape Tablet Ergonomics */}
      <div
        className={`flex-1 grid gap-3 sm:gap-4 lg:gap-6 items-stretch justify-center min-h-0 py-1 overflow-y-auto ${
          candidates.length <= 2
            ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto w-full'
            : candidates.length === 3
            ? 'grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto w-full'
            : candidates.length === 4
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto w-full'
            : candidates.length <= 6
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-5xl mx-auto w-full'
            : candidates.length <= 8
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 max-w-6xl mx-auto w-full'
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 max-w-7xl mx-auto w-full'
        }`}
      >
        {candidates.map((candidate) => {
          const isSelected = selectedCandidate?.id === candidate.id;
          const isCardDisabled = isSubmitting || (!!submissionError && !isSelected);

          return (
            <div key={candidate.id} className="w-full h-full flex justify-center">
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

      {/* Bottom Status Bar */}
      <div className="mt-2 pt-2 border-t border-[#35353A] shrink-0 flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl bg-[#222226]/80 backdrop-blur-sm">
        <button
          type="button"
          onClick={onCancelSession}
          disabled={isSubmitting}
          className="min-h-[40px] px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2C2C32] disabled:opacity-50 disabled:pointer-events-none font-semibold text-xs flex items-center gap-1.5 transition-colors touch-manipulation"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          {isSubmitting ? (
            <span className="flex items-center gap-2 text-gold-accent font-black bg-gold-accent/20 px-3 py-1 rounded-lg border border-gold-accent/40 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-gold-accent" />
              Menyimpan suara...
            </span>
          ) : (
            <span className="text-slate-400 text-xs">
              Satu ketukan langsung merekam suara sah
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

CandidateSelectionScreen.displayName = 'CandidateSelectionScreen';
