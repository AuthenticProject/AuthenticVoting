import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  Trophy,
  BarChart3,
  Tv,
  CheckCircle2,
  Scale,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useElection } from '../../hooks/useElection';
import { Button } from '../../components/common/Button';
import { WinnerAnnouncementModal } from '../../components/admin/WinnerAnnouncementModal';

export const AdminResultsPage: React.FC = () => {
  const { election, results, totalVotes } = useElection();
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  const isClosed = election.status === 'closed';

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleDateString('id-ID', {
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

  // 1. LOCKED STATE (DRAFT or ACTIVE)
  if (!isClosed || !results) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-xl bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-card flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-600 border-2 border-amber-200 flex items-center justify-center mb-6 shadow-sm">
            <Lock className="w-10 h-10 stroke-[2.2]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-3">
            Status: {election.status === 'draft' ? 'Voting Belum Dimulai' : 'Voting Sedang Berlangsung'}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-primary">
            Hasil Pemilihan Masih Terkunci
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-md leading-relaxed">
            Hasil pemilihan hanya dapat dilihat setelah voting resmi ditutup oleh panitia administrator.
          </p>

          <div className="mt-6 w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-left space-y-1.5">
            <div className="font-bold text-navy-primary flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-gold-dark" />
              <span>Standar Kerahasiaan Pemilihan Elektronik:</span>
            </div>
            <p>• Suara per kandidat, peringkat, dan persentase tidak dapat diakses.</p>
            <p>• Total suara masuk saat ini: <strong>{totalVotes} suara</strong> (hanya agregat global).</p>
          </div>

          <Link to="/admin" className="mt-8">
            <Button
              variant="primary-navy"
              size="lg"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Kembali ke Dashboard Kontrol
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 2. UNLOCKED FINAL RESULTS STATE (CLOSED)
  const isTie = results.isTie;
  const winners = results.winners;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hasil Akhir Resmi — Pemilihan Telah Ditutup</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-primary leading-tight">
            Rekapitulasi Suara Resmi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ditutup pada: {formatDate(results.closedAt)} • Total suara sah masuk: <strong>{results.totalVotes} suara</strong>
          </p>
        </div>

        {/* Action Button: Fullscreen Projector Mode */}
        <div className="shrink-0">
          <Button
            variant="primary-gold"
            size="lg"
            leftIcon={<Tv className="w-5 h-5 stroke-[2.2]" />}
            onClick={() => setShowAnnouncement(true)}
            className="shadow-gold-accent/25"
          >
            Mode Pengumuman Proyektor
          </Button>
        </div>
      </div>

      {/* Winner / Tie Hero Card */}
      <div className="bg-gradient-to-br from-navy-primary via-navy-secondary to-navy-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-navy-light/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-accent/10 rounded-full blur-3xl pointer-events-none" />

        {isTie ? (
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/20 text-amber-300 border-2 border-amber-400 flex items-center justify-center shrink-0">
              <Scale className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300 block mb-1">
                Kondisi Khusus
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold">
                Hasil Imbang (Tie Result)
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                Terdapat lebih dari satu kandidat yang memperoleh jumlah suara terbanyak yang sama ({winners.map((w) => w.name).join(' & ')}). Sistem tidak menetapkan pemenang tunggal.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-28 h-36 sm:w-32 sm:h-40 rounded-2xl overflow-hidden border-2 border-gold-accent shadow-lg">
                <img
                  src={winners[0]?.photo_url}
                  alt={winners[0]?.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md bg-gold-accent text-navy-900 font-extrabold text-[10px] uppercase">
                Pemenang
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-accent/20 border border-gold-accent/40 text-gold-light text-xs font-bold uppercase tracking-wider mb-2">
                <Trophy className="w-3.5 h-3.5 text-gold-accent" />
                <span>Kandidat Peraih Suara Terbanyak</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                {winners[0]?.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
                {winners[0]?.title_or_role}
              </p>

              {(() => {
                const winResult = results.candidateResults.find((r) => r.candidate.id === winners[0]?.id);
                return (
                  <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm font-bold">
                    <span className="px-3 py-1.5 rounded-xl bg-navy-surface border border-navy-light/40 text-gold-light">
                      Perolehan: {winResult?.voteCount} Suara
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-navy-surface border border-navy-light/40 text-emerald-400">
                      Persentase: {winResult?.percentage}%
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Horizontal Bar Chart & Detailed Breakdown */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-navy-primary" />
            <h3 className="text-lg font-extrabold text-navy-primary">
              Distribusi Suara 3 Kandidat
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Total {results.totalVotes} Suara Sah
          </span>
        </div>

        {/* Horizontal Bar Chart Bars */}
        <div className="space-y-6">
          {results.candidateResults.map((item) => {
            const isTop = item.isWinner || item.isTied;
            return (
              <div key={item.candidate.id} className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-navy-primary text-gold-accent font-extrabold text-xs flex items-center justify-center">
                      0{item.candidate.candidate_number}
                    </span>
                    <span className="font-extrabold text-navy-primary">
                      {item.candidate.name}
                    </span>
                    {item.isWinner && (
                      <span className="px-2 py-0.5 rounded-full bg-gold-accent/20 text-gold-dark font-extrabold text-[10px] border border-gold-accent/40">
                        Pemenang
                      </span>
                    )}
                    {item.isTied && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px] border border-amber-300">
                        Imbang
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 font-extrabold text-slate-700">
                    <span>{item.voteCount} Suara</span>
                    <span className="w-14 text-right text-navy-primary text-base">
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    style={{ width: `${item.percentage}%` }}
                    className={`h-full rounded-full transition-all duration-700 ${
                      isTop
                        ? 'bg-gradient-to-r from-gold-light via-gold-accent to-gold-dark'
                        : 'bg-navy-light/60'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Phase 2 Mock Data Notice */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Sistem Pemilihan Elektronik • Rekapitulasi Otomatis</span>
          <span>Catatan: Data hasil dalam mode simulasi terintegrasi Fase 2</span>
        </div>
      </div>

      {/* Fullscreen Presentation Modal */}
      <WinnerAnnouncementModal
        isOpen={showAnnouncement}
        onClose={() => setShowAnnouncement(false)}
        election={election}
        results={results}
      />
    </div>
  );
};
