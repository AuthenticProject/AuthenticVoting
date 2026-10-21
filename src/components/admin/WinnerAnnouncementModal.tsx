import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  X,
  Maximize2,
  Minimize2,
  Users,
  Sparkles,
  Scale,
} from 'lucide-react';
import type { Election, ElectionResultsSummary } from '../../types/election';
import { Logo } from '../common/Logo';

interface WinnerAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  election: Election;
  results: ElectionResultsSummary;
}

export const WinnerAnnouncementModal: React.FC<WinnerAnnouncementModalProps> = ({
  isOpen,
  onClose,
  election,
  results,
}) => {
  const [activeMode, setActiveMode] = useState<'winner' | 'full'>('winner');
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen) return null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const isTie = results.isTie;
  const winners = results.winners;

  return (
    <div className="fixed inset-0 z-50 bg-navy-primary text-white flex flex-col overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-institutional-pattern pointer-events-none opacity-60" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gold-accent/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Presentation Top Control Bar */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-navy-light/40 bg-navy-900/60 backdrop-blur-md">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <Logo src={election.logo_url} size="sm" />
          <div>
            <span className="text-[11px] font-bold tracking-widest uppercase text-gold-light block">
              PENGUMUMAN RESMI HASIL PEMILIHAN
            </span>
            <h1 className="text-sm sm:text-base font-extrabold text-white truncate max-w-xl">
              {election.title}
            </h1>
          </div>
        </div>

        {/* Center: Presentation Mode Selector */}
        <div className="flex items-center gap-1.5 bg-navy-surface p-1 rounded-xl border border-navy-light/40">
          <button
            onClick={() => setActiveMode('winner')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'winner'
                ? 'bg-gold-accent text-navy-900 shadow-md font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>{isTie ? 'Hasil Imbang' : 'Pemenang'}</span>
          </button>
          <button
            onClick={() => setActiveMode('full')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'full'
                ? 'bg-gold-accent text-navy-900 shadow-md font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Hasil Lengkap (3 Kandidat)</span>
          </button>
        </div>

        {/* Right: Fullscreen & Exit */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-navy-secondary transition-colors"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh Proyektor'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-secondary hover:bg-rose-700 text-white text-xs font-bold transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Tutup</span>
          </button>
        </div>
      </header>

      {/* Main Presentation Viewport */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 sm:p-12 max-w-6xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeMode === 'winner' && (
            <motion.div
              key="winner-mode"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col items-center text-center"
            >
              {isTie ? (
                /* TIE STATE ANNOUNCEMENT */
                <div className="w-full flex flex-col items-center">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-sm font-bold uppercase tracking-wider mb-4">
                    <Scale className="w-5 h-5 text-amber-400" />
                    <span>Hasil Perolehan Suara Imbang (Tie)</span>
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-2">
                    Dua atau Lebih Kandidat Memperoleh Suara Tertinggi yang Sama
                  </h2>
                  <p className="text-slate-300 text-base sm:text-lg max-w-2xl mb-8">
                    Sesuai tata tertib pemilihan, sistem tidak menetapkan pemenang tunggal ketika perolehan suara tertinggi setara.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl w-full">
                    {winners.map((cand) => {
                      const candResult = results.candidateResults.find((r) => r.candidate.id === cand.id);
                      return (
                        <div
                          key={cand.id}
                          className="bg-navy-surface/80 rounded-3xl p-6 border-2 border-amber-400/50 shadow-2xl flex flex-col items-center backdrop-blur-md"
                        >
                          <div className="w-36 h-44 rounded-2xl overflow-hidden border-2 border-amber-400 mb-4 shadow-lg">
                            <img src={cand.photo_url} alt={cand.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-amber-400 text-navy-900 font-extrabold text-sm flex items-center justify-center mb-2">
                            0{cand.candidate_number}
                          </div>
                          <h3 className="text-xl font-bold text-white mb-1">{cand.name}</h3>
                          <div className="text-2xl font-extrabold text-amber-300">
                            {candResult?.voteCount} Suara ({candResult?.percentage}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* SINGLE WINNER CELEBRATION */
                <div className="w-full flex flex-col items-center">
                  {/* Glowing Laurel / Crown Badge */}
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-gradient-to-r from-gold-accent/20 via-gold-accent/30 to-gold-accent/20 border-2 border-gold-accent text-gold-light text-sm sm:text-base font-extrabold uppercase tracking-widest mb-6 shadow-gold-glow"
                  >
                    <Trophy className="w-5 h-5 text-gold-accent" />
                    <span>Kandidat Terpilih Resmi</span>
                    <Sparkles className="w-5 h-5 text-gold-accent" />
                  </motion.div>

                  {/* Winner Portrait with Gold Frame */}
                  {winners[0] && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', damping: 18, delay: 0.2 }}
                      className="relative mb-6"
                    >
                      <div className="w-48 h-60 sm:w-60 sm:h-72 rounded-3xl overflow-hidden border-4 border-gold-accent shadow-2xl ring-8 ring-gold-accent/20">
                        <img
                          src={winners[0].photo_url}
                          alt={winners[0].name}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-xl bg-gold-accent text-navy-900 font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg border border-gold-light">
                        Nomor Urut 0{winners[0].candidate_number}
                      </div>
                    </motion.div>
                  )}

                  {/* Winner Name & Details */}
                  {winners[0] && (
                    <div className="max-w-2xl mt-2">
                      <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                        {winners[0].name}
                      </h2>
                      {winners[0].title_or_role && (
                        <p className="text-base sm:text-lg text-slate-300 font-medium mt-2">
                          {winners[0].title_or_role}
                        </p>
                      )}

                      {/* Vote Score Highlight */}
                      {(() => {
                        const winResult = results.candidateResults.find((r) => r.candidate.id === winners[0].id);
                        return (
                          <div className="mt-6 inline-flex items-center gap-6 px-8 py-3.5 rounded-2xl bg-navy-surface border border-gold-accent/40 shadow-xl">
                            <div className="text-left">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                                Total Perolehan
                              </span>
                              <span className="text-2xl sm:text-3xl font-extrabold text-gold-light">
                                {winResult?.voteCount} Suara
                              </span>
                            </div>
                            <div className="w-px h-10 bg-navy-light/60" />
                            <div className="text-left">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                                Persentase Sah
                              </span>
                              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                                {winResult?.percentage}%
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeMode === 'full' && (
            /* FULL 3-CANDIDATE COMPARISON MODE */
            <motion.div
              key="full-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="w-full flex flex-col items-center"
            >
              <div className="text-center mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-gold-light block mb-1">
                  Tabulasi Hasil Akhir
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                  Perolehan Suara Lengkap ({results.totalVotes} Suara Masuk)
                </h2>
              </div>

              {/* 3 Columns Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                {results.candidateResults.map((item) => {
                  const isTop = item.isWinner || item.isTied;
                  return (
                    <div
                      key={item.candidate.id}
                      className={`
                        rounded-3xl p-6 border-2 flex flex-col justify-between transition-all backdrop-blur-md
                        ${
                          isTop
                            ? 'bg-navy-surface/90 border-gold-accent shadow-2xl ring-4 ring-gold-accent/20'
                            : 'bg-navy-surface/50 border-navy-light/40 opacity-80'
                        }
                      `}
                    >
                      {/* Top Rank Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="w-8 h-8 rounded-lg bg-navy-primary text-gold-light font-extrabold text-sm flex items-center justify-center border border-navy-light/40">
                          0{item.candidate.candidate_number}
                        </span>
                        {item.isWinner && (
                          <span className="px-3 py-1 rounded-full bg-gold-accent text-navy-900 font-extrabold text-xs shadow-sm flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5" /> Pemenang
                          </span>
                        )}
                        {item.isTied && (
                          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-xs border border-amber-500/40">
                            Imbang
                          </span>
                        )}
                      </div>

                      {/* Photo & Info */}
                      <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-navy-900 mb-4 border border-navy-light/40">
                        <img
                          src={item.candidate.photo_url}
                          alt={item.candidate.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug line-clamp-2">
                          {item.candidate.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          {item.candidate.title_or_role}
                        </p>
                      </div>

                      {/* Score & Bar */}
                      <div className="mt-5 pt-4 border-t border-navy-light/40">
                        <div className="flex items-center justify-between text-sm font-extrabold mb-1.5">
                          <span className="text-slate-300">{item.voteCount} Suara</span>
                          <span className={isTop ? 'text-gold-light text-base' : 'text-slate-300'}>
                            {item.percentage}%
                          </span>
                        </div>
                        <div className="w-full h-3 bg-navy-900 rounded-full overflow-hidden border border-navy-light/40">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              isTop ? 'bg-gradient-to-r from-gold-light to-gold-accent' : 'bg-slate-400'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
