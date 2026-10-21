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
  Lock,
  Database,
  RotateCcw,
} from 'lucide-react';
import { useElection } from '../../hooks/useElection';
import { Button } from '../../components/common/Button';

export const AdminOverviewPage: React.FC = () => {
  const {
    election,
    totalVotes,
    isLiveDatabase,
    startElection,
    closeElection,
    resetAllToDefault,
  } = useElection();

  const [showStartModal, setShowStartModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

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
            <Link to="/admin/results">
              <Button
                variant="primary-navy"
                size="lg"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Lihat Hasil Akhir
              </Button>
            </Link>
          )}

          <Button
            variant="secondary"
            size="lg"
            leftIcon={<RotateCcw className="w-4 h-4 text-slate-500" />}
            onClick={() => {
              if (window.confirm('Reset status pemilihan ke DRAFT? Suara akan dikosongkan dan data kandidat dapat diedit kembali.')) {
                resetAllToDefault();
              }
            }}
            title="Kembalikan status ke DRAFT & reset suara"
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
              3
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

      {/* Privacy Notice Card */}
      <div className="bg-navy-primary/5 rounded-2xl p-5 border border-navy-primary/10 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-navy-primary text-gold-accent flex items-center justify-center shrink-0 mt-0.5">
          <Lock className="w-5 h-5" />
        </div>
        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          <span className="font-bold text-navy-primary block text-sm mb-0.5">
            Kerahasiaan Hasil Pemilihan Terjamin
          </span>
          Sesuai aturan ketat pemungutan suara resmi, rincian perolehan suara per kandidat dan peringkat tidak akan ditampilkan kepada siapa pun (termasuk administrator) selama voting berstatus Draft atau Aktif. Tabulasi lengkap hanya dapat dibuka setelah status pemilihan resmi diubah menjadi <strong>Ditutup</strong>.
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
