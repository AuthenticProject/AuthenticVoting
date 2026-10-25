import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Vote,
  Activity,
  PlayCircle,
  StopCircle,
  Calendar,
  Clock,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Database,
  RotateCcw,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { useElection } from '../../hooks/useElection';
import { Button } from '../../components/common/Button';
import { fireWinnerCannon } from '../../lib/confetti';

export const AdminOverviewPage: React.FC = () => {
  const {
    election,
    candidates,
    totalVotes,
    results,
    isLiveDatabase,
    startElection,
    closeElection,
    resetAllToDefault,
  } = useElection();

  const [showStartModal, setShowStartModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Calculate live per-candidate vote counts and percentages
  const candidateResults = candidates.map((cand) => {
    const res = results?.candidateResults?.find(
      (r) => r.candidate.id === cand.id || r.candidate.candidate_number === cand.candidate_number
    );
    const voteCount = res ? res.voteCount : 0;
    const percentage = res
      ? res.percentage
      : totalVotes > 0
      ? Number(((voteCount / totalVotes) * 100).toFixed(1))
      : 0;
    const isWinner = res ? res.isWinner : false;
    return {
      candidate: cand,
      voteCount,
      percentage,
      isWinner,
    };
  });

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handleConfirmStart = () => {
    startElection();
    setShowStartModal(false);
  };

  const handleConfirmClose = () => {
    if (confirmText.trim().toUpperCase() !== 'TUTUP') return;
    closeElection();
    setShowCloseModal(false);
    setConfirmText('');
    setTimeout(() => {
      fireWinnerCannon();
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Event Information */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-primary/5 text-navy-primary text-xs font-bold uppercase tracking-wider">
              Identitas Pemilihan Aktif
            </span>
            {isLiveDatabase ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>Supabase PostgreSQL Terhubung</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                <Database className="w-3.5 h-3.5 text-amber-600" />
                <span>Mode Simulasi Terisolasi (Kredensial Belum Dikonfigurasi)</span>
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-primary leading-tight">
            {election.title}
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {election.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gold-dark" />
              <span>Mulai: {formatDate(election.started_at)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gold-dark" />
              <span>Selesai: {formatDate(election.closed_at)}</span>
            </div>
          </div>
        </div>

        {/* Action Button: Start or Close Voting */}
        <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {election.status === 'draft' && (
            <Button
              variant="primary-gold"
              size="lg"
              leftIcon={<PlayCircle className="w-5 h-5 stroke-[2.5]" />}
              onClick={() => setShowStartModal(true)}
              className="shadow-gold-accent/20"
            >
              Mulai Voting Sekarang
            </Button>
          )}

          {election.status === 'active' && (
            <Button
              variant="danger"
              size="lg"
              leftIcon={<StopCircle className="w-5 h-5 stroke-[2.5]" />}
              onClick={() => setShowCloseModal(true)}
            >
              Tutup Voting Resmi
            </Button>
          )}

          {election.status === 'closed' && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary-gold"
                size="lg"
                leftIcon={<Sparkles className="w-5 h-5 fill-navy-primary stroke-[2.5]" />}
                onClick={() => fireWinnerCannon()}
                className="shadow-lg shadow-gold-accent/20 animate-pulse font-extrabold"
              >
                Rayakan Hasil (Animasi Emas)
              </Button>
              <Link to="/admin/results">
                <Button
                  variant="primary-navy"
                  size="lg"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Lihat Hasil Akhir
                </Button>
              </Link>
            </div>
          )}

          <Button
            variant="secondary"
            size="lg"
            leftIcon={<RotateCcw className="w-4 h-4 text-slate-500" />}
            onClick={() => {
              if (
                window.confirm(
                  'Kembalikan status pemilihan ke DRAFT? Perolehan suara akan direset ke 0, sementara data kandidat Anda tetap tersimpan aman tanpa perlu input ulang.'
                )
              ) {
                resetAllToDefault();
              }
            }}
            title="Kembalikan status ke DRAFT & reset suara (data kandidat tetap aman)"
          >
            Reset ke Draft
          </Button>

          <Link
            to="/vote"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy-primary font-bold text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Kiosk Layar Penuh</span>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Votes Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Total Suara Masuk
            </p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-navy-primary">
              {totalVotes}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {election.status === 'closed' ? 'Hasil akhir terkunci' : 'Tercatat di bilik suara'}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-navy-primary/10 text-navy-primary flex items-center justify-center">
            <Vote className="w-7 h-7" />
          </div>
        </div>

        {/* Candidate Count Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Jumlah Kandidat
            </p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-navy-primary">
              {candidates.length}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {election.status === 'draft' ? 'Dapat diedit' : 'Terkunci permanen'}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gold-accent/15 text-gold-dark flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
        </div>

        {/* Election Status Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Status Pemilihan
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-navy-primary capitalize">
              {election.status === 'draft' && 'Draft (Persiapan)'}
              {election.status === 'active' && 'Aktif Berjalan'}
              {election.status === 'closed' && 'Telah Ditutup'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {election.status === 'active' ? 'Menerima suara pemilih' : 'Akses bilik tertutup'}
            </p>
          </div>
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              election.status === 'active'
                ? 'bg-emerald-100 text-emerald-700'
                : election.status === 'draft'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Activity className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* REAL-TIME MONITORING & CANDIDATE BREAKDOWN (Phase 8 & 9) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl sm:text-2xl font-extrabold text-navy-primary">
                {election.status === 'closed'
                  ? 'Hasil Akhir Tabulasi Suara'
                  : 'Monitoring Aktivitas Pemungutan Suara'}
              </h3>
              {election.status === 'active' && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              {election.status === 'active'
                ? 'Monitoring Real-Time: Perolehan suara masing-masing kandidat terupdate otomatis secara langsung saat pemilih menekan tombol di bilik suara.'
                : 'Perolehan suara resmi seluruh kandidat setelah pemilihan ditutup.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{election.status === 'active' ? 'Bilik Aktif Real-Time' : 'Tersinkron'}</span>
            </span>
            <Link
              to="/admin/results"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-navy-primary hover:text-gold-dark transition-colors ml-2"
            >
              <span>{election.status === 'closed' ? 'Hasil Lengkap' : 'Tabulasi'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Candidate Results Cards with Live Progress Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {candidateResults.map(({ candidate, voteCount, percentage, isWinner }) => (
            <div
              key={candidate.id}
              className={`rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                isWinner && totalVotes > 0
                  ? 'bg-gradient-to-br from-amber-50/80 to-white border-gold-accent shadow-md shadow-gold-accent/10'
                  : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Leader Badge */}
              {isWinner && totalVotes > 0 && (
                <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold-accent text-navy-primary font-black text-[10px] uppercase tracking-wider shadow-sm">
                  <Trophy className="w-3 h-3 text-navy-primary" />
                  <span>Pemenang</span>
                </div>
              )}

              <div>
                {/* Candidate Header with Photo and Number */}
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="relative shrink-0">
                    <div className="stamp-frame p-1">
                      <div className="stamp-border p-1 bg-white">
                        <img
                          src={candidate.photo_url || '/logo.png'}
                          alt={candidate.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 object-cover object-top border border-amber-300/60"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black tracking-wider uppercase text-gold-dark bg-gold-accent/20 px-2 py-0.5 rounded-md border border-gold-accent/30 inline-block mb-1">
                      Kandidat #{String(candidate.candidate_number).padStart(2, '0')}
                    </span>
                    <h4 className="text-sm sm:text-base font-extrabold text-navy-primary truncate">
                      {candidate.name}
                    </h4>
                    {candidate.title_or_role && (
                      <p className="text-xs text-slate-500 font-medium truncate">
                        {candidate.title_or_role}
                      </p>
                    )}
                  </div>
                </div>

                {/* Vote Count and Percentage */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl sm:text-3xl font-black text-navy-primary">
                      {voteCount}{' '}
                      <span className="text-xs font-bold text-slate-500">Suara</span>
                    </span>
                    <span className="text-sm font-extrabold text-navy-primary">
                      {percentage}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gold-accent to-gold-dark rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Start Election Confirmation */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 bg-navy-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-gold-accent/20 text-gold-dark flex items-center justify-center mx-auto mb-4">
              <PlayCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-navy-primary text-center">
              Mulai Pemungutan Suara?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 text-center mt-2 leading-relaxed">
              Memulai pemilihan akan <strong>mengunci data kandidat dan pengaturan acara</strong> secara permanen. Bilik suara di tablet (/vote) akan segera aktif dan dapat menerima suara pemilih.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowStartModal(false)}
              >
                Batal
              </Button>
              <Button
                variant="primary-gold"
                size="md"
                onClick={handleConfirmStart}
              >
                Ya, Mulai Voting
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Close Election Confirmation (FINAL WARNING) */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-navy-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-rose-500">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-rose-700 text-center">
              Peringatan: Penutupan Voting bersifat Final!
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 text-center mt-2 leading-relaxed">
              Setelah voting ditutup, <strong>tidak ada suara baru yang dapat masuk</strong> dan bilik suara tidak dapat dibuka kembali. Tabulasi hasil akhir akan segera dibuka.
            </p>

            <div className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              Ketik kata <strong className="font-extrabold">TUTUP</strong> di bawah untuk mengonfirmasi penutupan resmi pemilihan:
            </div>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Ketik TUTUP"
              className="mt-3 w-full px-4 py-3 rounded-xl border-2 border-rose-300 focus:border-rose-600 outline-none text-center font-extrabold tracking-widest uppercase text-sm"
              autoFocus
            />

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setShowCloseModal(false);
                  setConfirmText('');
                }}
              >
                Batalkan
              </Button>
              <Button
                variant="danger"
                size="md"
                disabled={confirmText.trim().toUpperCase() !== 'TUTUP'}
                onClick={handleConfirmClose}
              >
                Tutup Voting Permanen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
