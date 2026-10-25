import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Maximize2,
  Minimize2,
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Lock,
  ChevronRight,
  ChevronLeft,
  Crown,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useElection } from '../../hooks/useElection';
import { Logo } from '../../components/common/Logo';

export const AdminAnnouncementPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    election,
    results,
    announcementSessions,
    allocationSummary,
    updateAnnouncementSession,
  } = useElection();

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active session
  const activeSession =
    announcementSessions.find((s) => s.id === sessionId) ||
    announcementSessions[0] ||
    null;

  // Allocated candidates for this specific event
  const currentGroupAlloc = allocationSummary.groups.find(
    (g) => g.session.id === activeSession?.id
  );
  const candidatesInGroup = currentGroupAlloc?.candidates || [];

  // Reveal stage: number of candidates revealed so far (0 = none, candidatesInGroup.length = all)
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [isRevealing, setIsRevealing] = useState(false);

  // Reset revealed count when session changes
  useEffect(() => {
    setRevealedCount(0);
    setIsRevealing(false);
  }, [activeSession?.id]);

  // Authentication Gate
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Election Status Gate (Phase 8: Confidentiality during voting)
  if (election.status !== 'closed' || !results) {
    return (
      <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full bg-[#29292D] border border-navy-light/40 rounded-3xl p-8 backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black mb-2">Mode Presentasi Terkunci</h2>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            {election.status === 'active'
              ? 'Pemungutan suara sedang berlangsung di bilik suara. Demi menjaga kerahasiaan dan integritas, layar presentasi hasil baru dapat dibuka setelah pemilihan resmi ditutup oleh panitia.'
              : 'Pemilihan belum dimulai (Draft). Silakan mulai dan selesaikan pemungutan suara terlebih dahulu.'}
          </p>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold-accent text-navy-primary font-black hover:bg-gold-light transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard Admin</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full bg-[#29292D] border border-navy-light/40 rounded-3xl p-8">
          <h2 className="text-xl font-bold mb-4">Sesi Acara Tidak Ditemukan</h2>
          <Link
            to="/admin/announcements"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-accent text-navy-primary font-bold text-sm"
          >
            <span>Buka Manajemen Acara</span>
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

  // Reveal ordered list: reverse order so #1 rank is revealed LAST!
  // E.g., if ranks are 1, 2, 3: order of reveal is 3 -> 2 -> 1 (Grand Winner)!
  const revealOrder = [...candidatesInGroup].reverse();

  const handleNextReveal = () => {
    if (revealedCount < revealOrder.length) {
      setIsRevealing(true);
      setTimeout(() => {
        setIsRevealing(false);
        setRevealedCount((prev) => prev + 1);
      }, 500);
    }
  };

  const handlePrevReveal = () => {
    if (revealedCount > 0) {
      setRevealedCount((prev) => prev - 1);
    }
  };

  const handleRevealAll = () => {
    setRevealedCount(revealOrder.length);
  };

  const handleResetReveal = () => {
    setRevealedCount(0);
  };

  const handlePublishStatus = async (newStatus: 'ready' | 'published') => {
    await updateAnnouncementSession(activeSession.id, {
      announcement_status: newStatus,
    });
  };

  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white flex flex-col justify-between relative overflow-hidden select-none font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gold-accent/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Top Presentation Bar */}
      <header className="relative z-30 w-full px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between border-b border-navy-light/40 bg-[#1C1C1E]/90 backdrop-blur-md gap-4">
        {/* Left: Back & Event Identity */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/admin/announcements"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-navy-secondary transition-colors"
            title="Kembali ke Manajemen Acara"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-3">
            <Logo src={election.logo_url} size="sm" />
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase text-gold-accent block">
                SIDANG PLENO PENGUMUMAN • PONDOK MODERN DARUSSALAM GONTOR
              </span>
              <h1 className="text-sm sm:text-base font-black text-white">
                {activeSession.name}
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Session Switcher (for laptop operator) */}
        <div className="flex items-center gap-2">
          <select
            value={activeSession.id}
            onChange={(e) => navigate(`/admin/announcement/${e.target.value}`)}
            className="px-3 py-1.5 rounded-xl bg-[#29292D] border border-navy-light/50 text-xs font-bold text-gold-accent focus:outline-none"
          >
            {announcementSessions.map((s) => (
              <option key={s.id} value={s.id}>
                #{s.display_order} {s.name}
              </option>
            ))}
          </select>

          {activeSession.announcement_status !== 'published' ? (
            <button
              onClick={() => handlePublishStatus('published')}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-[11px] font-extrabold transition-colors"
              title="Tandai Sesi Ini Resmi Diumumkan"
            >
              Publikasikan
            </button>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
              Terpublikasi
            </span>
          )}
        </div>

        {/* Right: Reveal Controls & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevReveal}
            disabled={revealedCount === 0}
            className="p-2 rounded-xl bg-navy-secondary hover:bg-navy-light disabled:opacity-30 disabled:pointer-events-none text-slate-200 transition-colors"
            title="Mundur Satu Langkah"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleNextReveal}
            disabled={revealedCount >= revealOrder.length || isRevealing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold-accent hover:bg-gold-light text-navy-primary font-black text-xs shadow-gold-glow disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {revealedCount >= revealOrder.length
                ? 'Semua Terungkap'
                : `Buka Calon (${revealedCount + 1}/${revealOrder.length})`}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleRevealAll}
            className="px-3 py-2 rounded-xl bg-navy-secondary hover:bg-navy-light text-slate-200 text-xs font-bold transition-colors"
            title="Buka Seluruh Kandidat Sekaligus"
          >
            Buka Semua
          </button>

          <button
            onClick={handleResetReveal}
            className="p-2 rounded-xl bg-navy-secondary hover:bg-navy-light text-slate-300 transition-colors"
            title="Reset Tampilan"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-navy-secondary hover:bg-navy-light text-slate-300 transition-colors"
            title="Layar Penuh Proyektor (16:9)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Presentation Stage (Projector 16:9 Optimized) */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 py-6 relative z-10 w-full max-w-7xl mx-auto">
        {/* Banner Announcement Title */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gold-accent/20 border border-gold-accent/40 text-gold-accent text-xs font-black uppercase tracking-widest mb-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>HASIL KEPUTUSAN SIDANG PLENO</span>
          </motion.div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {activeSession.name}
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            {election.subtitle || 'Pondok Modern Darussalam Gontor'}
          </p>
        </div>

        {/* Dynamic Candidates Reveal Cards Grid */}
        <div
          className={`grid gap-6 sm:gap-8 items-stretch justify-center w-full ${
            candidatesInGroup.length <= 2
              ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl'
              : candidatesInGroup.length === 3
              ? 'grid-cols-1 md:grid-cols-3 max-w-5xl'
              : candidatesInGroup.length === 4
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl'
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl'
          }`}
        >
          {candidatesInGroup.map((candRes) => {
            // Check if this candidate is revealed based on revealOrder
            const revealIndex = revealOrder.findIndex((ro) => ro.candidate.id === candRes.candidate.id);
            const isCardRevealed = revealIndex !== -1 && revealIndex < revealedCount;
            const isWinnerInGroup = candRes.rank === 1;

            return (
              <div
                key={candRes.candidate.id}
                className="w-full flex flex-col items-center justify-between"
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCardRevealed ? 1 : 0.98,
                    opacity: isCardRevealed ? 1 : 0.75,
                  }}
                  transition={{ duration: 0.4 }}
                  className={`
                    w-full rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between items-center text-center relative overflow-hidden
                    ${
                      isCardRevealed
                        ? isWinnerInGroup
                          ? 'bg-gradient-to-b from-[#29292D] to-[#1C1C1E] border-2 border-gold-accent shadow-2xl shadow-gold-accent/25'
                          : 'bg-[#29292D] border border-navy-light/60 shadow-xl'
                        : 'bg-[#29292D]/40 border border-dashed border-navy-light/40 backdrop-blur-sm'
                    }
                  `}
                >
                  {/* Winner Crown Tag */}
                  {isCardRevealed && isWinnerInGroup && (
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gold-accent text-navy-primary flex items-center justify-center shadow-lg"
                    >
                      <Crown className="w-5 h-5 fill-navy-primary" />
                    </motion.div>
                  )}

                  {/* Top Rank Badge */}
                  <div className="mb-4 w-full flex items-center justify-between">
                    <span
                      className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                        isCardRevealed
                          ? 'bg-gold-accent text-navy-primary shadow-xs'
                          : 'bg-navy-light text-slate-400'
                      }`}
                    >
                      {isCardRevealed ? `Peringkat #${candRes.rank}` : 'Belum Dibuka'}
                    </span>

                    <span className="text-xs font-bold text-slate-400">
                      No. Urut #{String(candRes.candidate.candidate_number).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Candidate Photo / Concealed Silhouette */}
                  <div className="w-40 sm:w-48 aspect-[4/4.5] rounded-2xl overflow-hidden mb-4 relative bg-[#1C1C1E] border-2 border-gold-accent/40 shadow-inner flex items-center justify-center">
                    {isCardRevealed ? (
                      <motion.img
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        src={candRes.candidate.photo_url}
                        alt={candRes.candidate.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-navy-900/60">
                        <Lock className="w-12 h-12 text-gold-accent/50 mb-2 stroke-[1.8]" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                          Terkunci
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Candidate Identity */}
                  <div className="w-full">
                    {isCardRevealed ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                          {candRes.candidate.name}
                        </h3>
                        {candRes.candidate.title_or_role && (
                          <p className="text-xs font-bold text-gold-light mt-1">
                            {candRes.candidate.title_or_role}
                          </p>
                        )}
                      </motion.div>
                    ) : (
                      <div className="h-10 flex items-center justify-center">
                        <span className="text-sm font-extrabold text-slate-500 tracking-wider">
                          •••••••••••••••••
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Optional Vote Counts and Percentages (Phase 3 & 7) */}
                  {isCardRevealed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 pt-3 border-t border-navy-light/40 w-full flex items-center justify-center gap-3 text-xs"
                    >
                      {activeSession.show_vote_counts && (
                        <span className="font-extrabold text-white bg-navy-surface px-3 py-1 rounded-xl border border-navy-light/40">
                          {candRes.voteCount} Suara
                        </span>
                      )}
                      {activeSession.show_percentages && (
                        <span className="font-black text-gold-accent bg-gold-accent/15 px-3 py-1 rounded-xl border border-gold-accent/30">
                          {candRes.percentage}%
                        </span>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer Branding Bar */}
      <footer className="relative z-20 w-full px-6 py-3 border-t border-navy-light/40 bg-[#1C1C1E]/80 backdrop-blur-md flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gold-accent animate-pulse" />
          <span className="font-semibold text-slate-300">
            Sistem Sidang Pleno Pemilihan Elektronik 5102
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Proyektor 16:9 • Pondok Modern Darussalam Gontor
        </div>
      </footer>
    </div>
  );
};
