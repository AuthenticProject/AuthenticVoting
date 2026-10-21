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
  FileDown,
  FileSpreadsheet,
  Clock,
  Vote,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { useElection } from '../../hooks/useElection';
import { Button } from '../../components/common/Button';
import { VoteDistributionChart } from '../../components/admin/VoteDistributionChart';
import { exportService } from '../../services/exportService';

export const AdminResultsPage: React.FC = () => {
  const { election, results, totalVotes } = useElection();
  const [exportNotice, setExportNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const handleExportPdf = () => {
    if (!results) return;
    const res = exportService.exportToPdf(results);
    if (res.success) {
      setExportNotice({ type: 'success', message: 'Laporan PDF resmi berhasil diunduh.' });
    } else {
      setExportNotice({ type: 'error', message: res.error || 'Gagal membuat dokumen PDF.' });
    }
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handleExportExcel = () => {
    if (!results) return;
    const res = exportService.exportToExcel(results);
    if (res.success) {
      setExportNotice({ type: 'success', message: 'Lembar kerja Excel (.xlsx) berhasil diunduh.' });
    } else {
      setExportNotice({ type: 'error', message: res.error || 'Gagal membuat dokumen Excel.' });
    }
    setTimeout(() => setExportNotice(null), 4000);
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
            <p>• Ekspor PDF dan Excel dinonaktifkan sebelum pemilihan ditutup.</p>
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
  const isZero = results.isZeroVotes;
  const winners = results.winners;

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hasil Akhir Resmi — Pemilihan Telah Ditutup</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-primary leading-tight">
            Rekapitulasi Suara & Tabulasi Hasil
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {results.electionTitle || election.title}
          </p>
        </div>

        {/* Action Buttons: Export & Fullscreen */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<FileDown className="w-4 h-4 text-rose-600" />}
            onClick={handleExportPdf}
            className="text-xs font-bold"
          >
            Unduh PDF
          </Button>

          <Button
            variant="secondary"
            size="md"
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            onClick={handleExportExcel}
            className="text-xs font-bold"
          >
            Unduh Excel
          </Button>

          <Link to="/admin/announcement">
            <Button
              variant="primary-gold"
              size="md"
              leftIcon={<Tv className="w-4 h-4" />}
              className="text-xs font-extrabold shadow-gold-accent/20"
            >
              Mode Presentasi Proyektor
            </Button>
          </Link>
        </div>
      </div>

      {/* Export Feedback Notification */}
      {exportNotice && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-3 ${
            exportNotice.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border border-rose-300 text-rose-800'
          }`}
        >
          {exportNotice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{exportNotice.message}</span>
        </div>
      )}

      {/* SECTION A: ELECTION SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Status</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-navy-primary">
            Selesai
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Voting resmi ditutup</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <Vote className="w-4 h-4 text-gold-dark" />
            <span>Total Suara Sah</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-navy-primary">
            {results.totalVotes}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Partisipasi tercatat</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-navy-primary" />
            <span>Jumlah Kandidat</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-navy-primary">
            {results.candidateResults.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Slot resmi terverifikasi</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4 text-slate-600" />
            <span>Waktu Ditutup</span>
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-navy-primary truncate">
            {formatDate(results.closedAt)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Terkunci permanen</div>
        </div>
      </div>

      {/* SECTION D: WINNER SUMMARY HERO */}
      <div className="bg-gradient-to-br from-navy-primary via-navy-secondary to-navy-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-navy-light/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-accent/10 rounded-full blur-3xl pointer-events-none" />

        {isZero ? (
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
              <Vote className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold">Belum Ada Suara Masuk</h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-1">
                Tidak ada pemilih yang memberikan suara sebelum pemilihan ditutup. Pemenang tidak dapat ditentukan.
              </p>
            </div>
          </div>
        ) : isTie ? (
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/20 text-amber-300 border-2 border-amber-400 flex items-center justify-center shrink-0">
              <Scale className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300 block mb-1">
                Kondisi Khusus — Hasil Seri
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold">
                Hasil Imbang (Tie Result)
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                Kandidat ({winners.map((w) => w.name).join(' & ')}) memperoleh jumlah suara terbanyak yang persis sama ({results.candidateResults.find((r) => r.isTied)?.voteCount} suara). Sesuai aturan pemilihan resmi, sistem tidak mengarang pemenang tunggal.
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
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md bg-gold-accent text-navy-900 font-extrabold text-[10px] uppercase shadow-md">
                Pemenang
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-accent/20 border border-gold-accent/40 text-gold-light text-xs font-bold uppercase tracking-wider mb-2">
                <Trophy className="w-3.5 h-3.5 text-gold-accent" />
                <span>Pemenang Terpilih Resmi</span>
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
                    <span className="px-3.5 py-1.5 rounded-xl bg-navy-surface border border-gold-accent/40 text-gold-light">
                      Perolehan: {winResult?.voteCount} Suara
                    </span>
                    <span className="px-3.5 py-1.5 rounded-xl bg-navy-surface border border-gold-accent/40 text-emerald-400">
                      Persentase: {winResult?.percentage.toFixed(2)}%
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* SECTION C: VOTE DISTRIBUTION CHART (Recharts) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-navy-primary" />
            <h3 className="text-base sm:text-lg font-extrabold text-navy-primary">
              Grafik Distribusi Suara (Horizontal Bar Chart)
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Recharts Visualization
          </span>
        </div>

        <VoteDistributionChart candidateResults={results.candidateResults} />
      </div>

      {/* SECTION B: CANDIDATE RESULTS (Sorted Descending) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base sm:text-lg font-extrabold text-navy-primary">
            Rincian Peringkat & Perolehan Kandidat
          </h3>
          <span className="text-xs font-bold text-slate-500">
            Diurutkan berdasarkan perolehan suara terbanyak
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.candidateResults.map((item, index) => {
            const isTop = item.isWinner || item.isTied;
            return (
              <div
                key={item.candidate.id}
                className={`
                  rounded-2xl p-5 border-2 flex flex-col justify-between transition-all
                  ${
                    isTop
                      ? 'bg-gradient-to-b from-gold-50/50 to-white border-gold-accent shadow-md ring-2 ring-gold-accent/20'
                      : 'bg-white border-slate-200'
                  }
                `}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Peringkat #{index + 1}
                    </span>
                    {item.isWinner && (
                      <span className="px-2.5 py-0.5 rounded-full bg-gold-accent text-navy-900 font-extrabold text-[10px] flex items-center gap-1 shadow-sm">
                        <Trophy className="w-3 h-3" /> Pemenang
                      </span>
                    )}
                    {item.isTied && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px] border border-amber-300">
                        Hasil Seri
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <img
                        src={item.candidate.photo_url}
                        alt={item.candidate.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Nomor Urut 0{item.candidate.candidate_number}
                      </span>
                      <h4 className="text-sm font-extrabold text-navy-primary leading-snug line-clamp-2">
                        {item.candidate.name}
                      </h4>
                      {item.candidate.title_or_role && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {item.candidate.title_or_role}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-600">{item.voteCount} Suara</span>
                    <span className={isTop ? 'text-gold-dark text-sm font-extrabold' : 'text-navy-primary'}>
                      {item.percentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className={`h-full rounded-full ${
                        isTop ? 'bg-gradient-to-r from-gold-light via-gold-accent to-gold-dark' : 'bg-navy-primary'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
