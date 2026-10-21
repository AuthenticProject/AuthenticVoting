import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Users,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Scale,
  Lock,
  Vote,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useElection } from '../../hooks/useElection';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';

export const AdminAnnouncementPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { election, results } = useElection();

  const [presentationMode, setPresentationMode] = useState<'winner' | 'full'>('winner');
  const [isRevealed, setIsRevealed] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Authentication & Status Gate
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Election Closure Gate
  if (election.status !== 'closed' || !results) {
    return (
      <div className="min-h-screen bg-navy-primary flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full bg-navy-secondary/90 border border-navy-light/40 rounded-3xl p-8 backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Mode Presentasi Terkunci</h2>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            Mode presentasi proyektor hanya dapat dibuka setelah pemilihan resmi ditutup oleh panitia.
          </p>
          <Link
            to="/admin/results"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold-accent text-navy-900 font-bold hover:bg-gold-light transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Hasil Akhir</span>
          </Link>
        </div>
      </div>
    );
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const handleRevealWinner = () => {
    setIsRevealing(true);
    setTimeout(() => {
      setIsRevealing(false);
      setIsRevealed(true);
    }, 2400); // 2.4s elegant reveal animation
  };

  const handleResetReveal = () => {
    setIsRevealed(false);
    setIsRevealing(false);
  };

  const isTie = results.isTie;
  const isZero = results.isZeroVotes;
  const winners = results.winners;

  return (
    <div className="min-h-screen bg-navy-primary text-white flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background ambient pattern */}
      <div className="absolute inset-0 bg-institutional-pattern pointer-events-none opacity-50" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gold-accent/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Presentation Bar */}
      <header className="relative z-20 w-full px-6 py-4 flex items-center justify-between border-b border-navy-light/40 bg-navy-900/70 backdrop-blur-md">
        {/* Left: Back & Identity */}
        <div className="flex items-center gap-4">
          <Link
            to="/admin/results"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-navy-secondary transition-colors"
            title="Kembali ke Dashboard Admin"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Logo src={election.logo_url} size="sm" />
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-gold-light block">
                SIDANG PLENO PENGUMUMAN HASIL RESMI
              </span>
              <h1 className="text-sm sm:text-base font-extrabold text-white truncate max-w-lg">
                {results.electionTitle || election.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-navy-surface p-1 rounded-xl border border-navy-light/40">
          <button
            onClick={() => {
              setPresentationMode('winner');
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              presentationMode === 'winner'
                ? 'bg-gold-accent text-navy-900 shadow-md font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Pengumuman Pemenang</span>
          </button>
          <button
            onClick={() => setPresentationMode('full')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              presentationMode === 'full'
                ? 'bg-gold-accent text-navy-900 shadow-md font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Hasil Lengkap</span>
          </button>
        </div>

        {/* Right: Fullscreen Toggle */}
        <div className="flex items-center gap-2">
          {presentationMode === 'winner' && isRevealed && (
            <button
              onClick={handleResetReveal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-secondary hover:bg-navy-light text-slate-200 text-xs font-bold transition-colors border border-navy-light/40"
              title="Reset Animasi Reveal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ulangi Animasi</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-navy-secondary transition-colors"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh Proyektor (16:9)'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Presentation Stage */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 sm:p-12 max-w-7xl mx-auto w-full min-h-0">
        <AnimatePresence mode="wait">
          {presentationMode === 'winner' && (
            <motion.div
              key="mode-winner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center justify-center text-center py-4"
            >
              {!isRevealed && !isRevealing && (
                /* UNREVEALED INTRO STAGE */
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center max-w-xl"
                >
                  <Logo src={election.logo_url} size="xl" className="mb-6 drop-shadow-2xl" />
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-accent/20 border border-gold-accent/40 text-gold-light text-xs sm:text-sm font-bold uppercase tracking-widest mb-3">
                    <Sparkles className="w-4 h-4 text-gold-accent" />
                    Penetapan Hasil Pemilihan Resmi
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                    Pengumuman Hasil Pemilihan
                  </h2>
                  <p className="text-slate-300 text-sm sm:text-base mt-3 mb-8">
                    Voting telah resmi ditutup. Seluruh {results.totalVotes} suara sah telah dihitung dan diverifikasi.
                  </p>

                  <Button
                    variant="primary-gold"
                    size="xl"
                    leftIcon={<Trophy className="w-6 h-6 stroke-[2.5]" />}
                    onClick={handleRevealWinner}
                    className="px-12 py-5 text-xl font-extrabold rounded-2xl shadow-gold-glow animate-pulse"
                  >
                    TAMPILKAN PEMENANG
                  </Button>
                </motion.div>
              )}

              {isRevealing && (
                /* REVEAL ANIMATION IN PROGRESS (2.4s) */
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: [0.95, 1.05, 1] }}
                  transition={{ duration: 2.4, ease: 'easeInOut' }}
                  className="flex flex-col items-center"
                >
                  <div className="w-32 h-32 rounded-full border-4 border-gold-accent/40 border-t-gold-accent animate-spin mb-6 flex items-center justify-center">
                    <Trophy className="w-16 h-16 text-gold-accent" />
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-extrabold text-gold-light tracking-wide animate-pulse">
                    Membuka Hasil Perolehan Suara Terbanyak...
                  </h3>
                  <p className="text-slate-400 text-sm mt-2">Mohon perhatian hadirin sekalian</p>
                </motion.div>
              )}

              {isRevealed && (
                /* REVEALED WINNER DISPLAY */
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="w-full flex flex-col items-center"
                >
                  {isZero ? (
                    <div className="bg-navy-surface/80 p-8 rounded-3xl border border-navy-light max-w-md">
                      <Vote className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                      <h3 className="text-2xl font-bold">Tidak Ada Suara Masuk</h3>
                      <p className="text-slate-400 text-sm mt-1">
                        Belum ada suara yang terekam pada bilik suara pemilihan ini.
                      </p>
                    </div>
                  ) : isTie ? (
                    /* TIE DISPLAY */
                    <div className="w-full max-w-4xl flex flex-col items-center">
                      <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-300 text-sm font-extrabold uppercase tracking-widest mb-4">
                        <Scale className="w-5 h-5 text-amber-400" />
                        <span>HASIL SERI / IMBANG</span>
                      </div>
                      <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-2">
                        Perolehan Suara Tertinggi Sama
                      </h2>
                      <p className="text-slate-300 text-sm sm:text-base mb-8 max-w-xl">
                        Kandidat berikut memperoleh jumlah suara yang persis setara. Sistem tidak menetapkan pemenang tunggal.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full">
                        {winners.map((cand) => {
                          const candResult = results.candidateResults.find((r) => r.candidate.id === cand.id);
                          return (
                            <div
                              key={cand.id}
                              className="bg-navy-surface/90 rounded-3xl p-6 border-2 border-amber-400/60 shadow-2xl flex flex-col items-center"
                            >
                              <div className="w-40 h-48 rounded-2xl overflow-hidden border-2 border-amber-400 mb-4 shadow-xl">
                                <img src={cand.photo_url} alt={cand.name} className="w-full h-full object-cover object-top" />
                              </div>
                              <span className="px-3 py-1 rounded-full bg-amber-400 text-navy-900 font-extrabold text-xs mb-2">
                                Nomor Urut 0{cand.candidate_number}
                              </span>
                              <h3 className="text-xl font-extrabold text-white">{cand.name}</h3>
                              <p className="text-xs text-slate-400 mt-0.5">{cand.title_or_role}</p>
                              <div className="mt-4 pt-3 border-t border-navy-light/60 text-2xl font-extrabold text-amber-300">
                                {candResult?.voteCount} Suara ({candResult?.percentage.toFixed(2)}%)
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* SINGLE WINNER ANNOUNCEMENT */
                    <div className="w-full flex flex-col items-center max-w-3xl">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                        className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full bg-gold-accent/20 border-2 border-gold-accent text-gold-light text-sm sm:text-base font-extrabold uppercase tracking-widest mb-6 shadow-gold-glow"
                      >
                        <Trophy className="w-5 h-5 text-gold-accent" />
                        <span>Kandidat Terpilih Resmi</span>
                        <Sparkles className="w-5 h-5 text-gold-accent" />
                      </motion.div>

                      {/* Winner Portrait */}
                      {winners[0] && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2, type: 'spring', damping: 18 }}
                          className="relative mb-6"
                        >
                          <div className="w-56 h-68 sm:w-64 sm:h-80 rounded-3xl overflow-hidden border-4 border-gold-accent shadow-2xl ring-8 ring-gold-accent/25">
                            <img
                              src={winners[0].photo_url}
                              alt={winners[0].name}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-xl bg-gold-accent text-navy-900 font-extrabold text-sm uppercase tracking-wider shadow-lg border border-gold-light">
                            Nomor Urut 0{winners[0].candidate_number}
                          </div>
                        </motion.div>
                      )}

                      {/* Winner Name & Score */}
                      {winners[0] && (
                        <div>
                          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                            {winners[0].name}
                          </h2>
                          {winners[0].title_or_role && (
                            <p className="text-base sm:text-lg text-slate-300 font-medium mt-2">
                              {winners[0].title_or_role}
                            </p>
                          )}

                          {(() => {
                            const winResult = results.candidateResults.find((r) => r.candidate.id === winners[0].id);
                            return (
                              <div className="mt-6 inline-flex items-center gap-8 px-10 py-4 rounded-2xl bg-navy-surface border border-gold-accent/40 shadow-2xl">
                                <div className="text-left">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Total Suara
                                  </span>
                                  <span className="text-3xl sm:text-4xl font-extrabold text-gold-light">
                                    {winResult?.voteCount} Suara
                                  </span>
                                </div>
                                <div className="w-px h-12 bg-navy-light/60" />
                                <div className="text-left">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Persentase Sah
                                  </span>
                                  <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
                                    {winResult?.percentage.toFixed(2)}%
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
            </motion.div>
          )}

          {presentationMode === 'full' && (
            /* COMPLETE RESULTS STAGE (MODE B) */
            <motion.div
              key="mode-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="w-full flex flex-col items-center"
            >
              <div className="text-center mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-gold-light block mb-1">
                  Tabulasi Lengkap Dewan Formatur
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                  Perolehan Suara Resmi ({results.totalVotes} Suara Sah)
                </h2>
              </div>

              {/* Candidate Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
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
                            Hasil Seri
                          </span>
                        )}
                      </div>

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

                      <div className="mt-5 pt-4 border-t border-navy-light/40">
                        <div className="flex items-center justify-between text-sm font-extrabold mb-1.5">
                          <span className="text-slate-300">{item.voteCount} Suara</span>
                          <span className={isTop ? 'text-gold-light text-base' : 'text-slate-300'}>
                            {item.percentage.toFixed(2)}%
                          </span>
                        </div>
                        <div className="w-full h-3.5 bg-navy-900 rounded-full overflow-hidden border border-navy-light/40">
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

      {/* Footer Branding */}
      <footer className="relative z-10 w-full px-6 py-3 border-t border-navy-light/30 bg-navy-900/60 text-center text-xs text-slate-400">
        <span>Sistem Pemilihan Elektronik • Rekapitulasi Resmi Terenkripsi • Dokumen Sah Musyawarah</span>
      </footer>
    </div>
  );
};
