import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Plus,
  Edit3,
  Trash2,
  Tv,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  FileSpreadsheet,
  X,
  Save,
  Users,
  Layers,
  ExternalLink,
} from 'lucide-react';
import type {
  AnnouncementSession,
  AnnouncementSelectionMethod,
  AnnouncementStatus,
  TiePolicy,
} from '../../types/election';
import { useElection } from '../../hooks/useElection';
import { Button } from '../../components/common/Button';
import { exportService } from '../../services/exportService';

export const AdminAnnouncementsPage: React.FC = () => {
  const {
    election,
    candidates,
    announcementSessions,
    allocationSummary,
    addAnnouncementSession,
    updateAnnouncementSession,
    deleteAnnouncementSession,
    reorderAnnouncementSessions,
  } = useElection();

  // Edit / Create Modal State
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    display_order: number;
    selection_method: AnnouncementSelectionMethod;
    candidate_limit: number;
    exclusive_grouping: boolean;
    show_vote_counts: boolean;
    show_percentages: boolean;
    presentation_theme: string;
    announcement_status: AnnouncementStatus;
    tie_policy: TiePolicy;
    manual_candidate_ids: string[];
  }>({
    name: '',
    description: '',
    display_order: 1,
    selection_method: 'highest_votes',
    candidate_limit: 3,
    exclusive_grouping: true,
    show_vote_counts: true,
    show_percentages: true,
    presentation_theme: 'gold',
    announcement_status: 'draft',
    tie_policy: 'expand',
    manual_candidate_ids: [],
  });

  // Delete modal
  const [sessionToDelete, setSessionToDelete] = useState<AnnouncementSession | null>(null);

  // Preview modal for a specific session
  const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    const nextOrder = announcementSessions.length > 0
      ? Math.max(...announcementSessions.map((s) => s.display_order)) + 1
      : 1;

    setFormData({
      name: `Sesi Acara Pengumuman #${nextOrder}`,
      description: '',
      display_order: nextOrder,
      selection_method: nextOrder === 1 ? 'highest_votes' : 'next_ranking_group',
      candidate_limit: 3,
      exclusive_grouping: true,
      show_vote_counts: true,
      show_percentages: true,
      presentation_theme: 'gold',
      announcement_status: 'draft',
      tie_policy: 'expand',
      manual_candidate_ids: [],
    });
    setModalMode('create');
  };

  // Open Edit Modal
  const handleOpenEdit = (session: AnnouncementSession) => {
    setTargetSessionId(session.id);
    setFormData({
      name: session.name,
      description: session.description || '',
      display_order: session.display_order,
      selection_method: session.selection_method,
      candidate_limit: session.candidate_limit,
      exclusive_grouping: session.exclusive_grouping,
      show_vote_counts: session.show_vote_counts,
      show_percentages: session.show_percentages,
      presentation_theme: session.presentation_theme || 'gold',
      announcement_status: session.announcement_status,
      tie_policy: session.tie_policy || 'expand',
      manual_candidate_ids: session.manual_candidate_ids || [],
    });
    setModalMode('edit');
  };

  // Close Modal
  const handleCloseModal = () => {
    setModalMode(null);
    setTargetSessionId(null);
  };

  // Save Modal
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotice('error', 'Nama acara pengumuman wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      if (modalMode === 'create') {
        await addAnnouncementSession(formData);
        showNotice('success', 'Acara pengumuman baru berhasil ditambahkan.');
      } else if (modalMode === 'edit' && targetSessionId) {
        await updateAnnouncementSession(targetSessionId, formData);
        showNotice('success', 'Pengaturan acara pengumuman berhasil diperbarui.');
      }
      handleCloseModal();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Gagal menyimpan sesi pengumuman.');
    } finally {
      setIsSaving(false);
    }
  };

  // Move Session Up
  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const sorted = [...announcementSessions].sort((a, b) => a.display_order - b.display_order);
    const temp = sorted[index];
    sorted[index] = sorted[index - 1];
    sorted[index - 1] = temp;
    await reorderAnnouncementSessions(sorted.map((s) => s.id));
    showNotice('success', 'Urutan sesi acara berhasil diubah.');
  };

  // Move Session Down
  const handleMoveDown = async (index: number) => {
    const sorted = [...announcementSessions].sort((a, b) => a.display_order - b.display_order);
    if (index >= sorted.length - 1) return;
    const temp = sorted[index];
    sorted[index] = sorted[index + 1];
    sorted[index + 1] = temp;
    await reorderAnnouncementSessions(sorted.map((s) => s.id));
    showNotice('success', 'Urutan sesi acara berhasil diubah.');
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    setIsSaving(true);
    try {
      await deleteAnnouncementSession(sessionToDelete.id);
      showNotice('success', `Sesi acara "${sessionToDelete.name}" berhasil dihapus.`);
      setSessionToDelete(null);
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Gagal menghapus sesi acara.');
    } finally {
      setIsSaving(false);
    }
  };

  // Export event PDF
  const handleExportSessionPdf = (session: AnnouncementSession) => {
    const groupAlloc = allocationSummary.groups.find((g) => g.session.id === session.id);
    if (!groupAlloc) {
      showNotice('error', 'Data alokasi belum tersedia.');
      return;
    }
    const res = exportService.exportSessionToPdf(session, groupAlloc.candidates, election.title);
    if (res.success) {
      showNotice('success', `Laporan PDF "${session.name}" berhasil diunduh.`);
    } else {
      showNotice('error', res.error || 'Gagal mengekspor PDF.');
    }
  };

  // Export event Excel
  const handleExportSessionExcel = (session: AnnouncementSession) => {
    const groupAlloc = allocationSummary.groups.find((g) => g.session.id === session.id);
    if (!groupAlloc) {
      showNotice('error', 'Data alokasi belum tersedia.');
      return;
    }
    const res = exportService.exportSessionToExcel(session, groupAlloc.candidates, election.title);
    if (res.success) {
      showNotice('success', `Lembar Excel "${session.name}" berhasil diunduh.`);
    } else {
      showNotice('error', res.error || 'Gagal mengekspor Excel.');
    }
  };

  const sortedSessions = [...announcementSessions].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-navy-primary">
              Manajemen Acara Pengumuman
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-gold-accent/20 text-gold-dark font-extrabold text-xs border border-gold-accent/40">
              {announcementSessions.length} Sesi Acara
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Konfigurasi jumlah acara pengumuman, metode seleksi (suara tertinggi, terendah, peringkat lanjutan, manual), pembagian kandidat otomatis, dan presentasi proyektor.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="primary-gold"
            size="md"
            leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}
            onClick={handleOpenCreate}
            className="text-xs font-black shadow-sm"
          >
            Tambah Acara Pengumuman
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-3 border ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      {/* ALLOCATION SUMMARY & VALIDATION DASHBOARD (Phase 5) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-primary text-gold-accent flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-navy-primary">
                Ringkasan Alokasi Kandidat Antar Acara
              </h3>
              <p className="text-xs text-slate-500">
                Pemeriksaan validasi partisi kelompok kandidat berdasarkan hasil perolehan suara
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {allocationSummary.isValidPartition ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Alokasi Partisi Valid</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Perlu Penyesuaian Alokasi</span>
              </span>
            )}
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Total Kandidat</span>
            <span className="text-2xl font-black text-navy-primary mt-1 block">
              {allocationSummary.totalCandidates} <span className="text-xs font-normal text-slate-500">orang</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Jumlah Acara</span>
            <span className="text-2xl font-black text-navy-primary mt-1 block">
              {allocationSummary.totalEvents} <span className="text-xs font-normal text-slate-500">sesi</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Teralokasi</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              {allocationSummary.allocatedCandidatesCount} <span className="text-xs font-normal text-slate-500">orang</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Belum Teralokasi</span>
            <span className={`text-2xl font-black mt-1 block ${allocationSummary.unallocatedCandidates.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {allocationSummary.unallocatedCandidates.length} <span className="text-xs font-normal text-slate-500">orang</span>
            </span>
          </div>
        </div>

        {/* Warning messages if any */}
        {allocationSummary.validationErrors.length > 0 && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Catatan Validasi Pembagian Kelompok:</span>
            </div>
            <ul className="list-disc list-inside pl-1 text-[11px] text-amber-800/90 space-y-0.5">
              {allocationSummary.validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Duplicate assignments warning */}
        {allocationSummary.duplicateAssignments.length > 0 && (
          <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs">
            <span className="font-bold">Kandidat muncul di lebih dari 1 acara:</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {allocationSummary.duplicateAssignments.map((dup) => (
                <span key={dup.candidate.id} className="px-2 py-0.5 bg-rose-100 rounded text-rose-950 font-semibold text-[11px]">
                  {dup.candidate.name} ({dup.eventNames.join(' & ')})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ANNOUNCEMENT EVENTS LIST */}
      <div className="space-y-4">
        {sortedSessions.map((session, idx) => {
          const groupAlloc = allocationSummary.groups.find((g) => g.session.id === session.id);
          const allocatedList = groupAlloc?.candidates || [];
          const hasBoundaryTie = groupAlloc?.isTieAtBoundary;

          const methodLabel = {
            highest_votes: 'Suara Tertinggi',
            lowest_votes: 'Suara Terendah',
            next_ranking_group: 'Peringkat Berikutnya (Next Ranking Group)',
            manual: 'Pilihan Manual Admin',
          }[session.selection_method];

          const statusBadge = {
            draft: { label: 'Draft', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
            ready: { label: 'Siap Diumumkan', bg: 'bg-sky-100 text-sky-800 border-sky-300' },
            published: { label: 'Dipublikasikan', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
          }[session.announcement_status];

          return (
            <div
              key={session.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:border-gold-accent/60 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                {/* Left: Event Title & Details */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-navy-primary text-gold-accent font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                    #{session.display_order}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-navy-primary">
                        {session.name}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                      {session.exclusive_grouping && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          Partisi Eksklusif
                        </span>
                      )}
                    </div>
                    {session.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{session.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2 font-medium">
                      <span>Metode: <strong className="text-navy-primary">{methodLabel}</strong></span>
                      <span>•</span>
                      <span>Target: <strong className="text-navy-primary">{session.candidate_limit} Kandidat</strong></span>
                      <span>•</span>
                      <span>Teralokasi: <strong className="text-navy-primary">{allocatedList.length} Kandidat</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Order control */}
                  <div className="flex items-center bg-slate-100 rounded-xl p-0.5 mr-1">
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-navy-primary disabled:opacity-30 disabled:pointer-events-none"
                      title="Geser Acara ke Atas"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === sortedSessions.length - 1}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-navy-primary disabled:opacity-30 disabled:pointer-events-none"
                      title="Geser Acara ke Bawah"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Preview */}
                  <button
                    onClick={() => setPreviewSessionId(session.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    <span>Pratinjau</span>
                  </button>

                  {/* Open Presentation */}
                  <Link
                    to={`/admin/announcement/${session.id}`}
                    target="_blank"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold-accent hover:bg-gold-light text-navy-primary font-black text-xs shadow-sm transition-all"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Buka Presentasi</span>
                  </Link>

                  {/* Export PDF */}
                  <button
                    onClick={() => handleExportSessionPdf(session)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    title="Ekspor PDF Acara Ini"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>

                  {/* Export Excel */}
                  <button
                    onClick={() => handleExportSessionExcel(session)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-emerald-700 transition-colors"
                    title="Ekspor Excel Acara Ini"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEdit(session)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-navy-primary hover:text-white text-slate-600 transition-colors"
                    title="Edit Pengaturan Acara"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  {sortedSessions.length > 1 && (
                    <button
                      onClick={() => setSessionToDelete(session)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                      title="Hapus Acara Pengumuman Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Boundary Tie Warning (Phase 6) */}
              {hasBoundaryTie && (
                <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Peringatan Batas Suara Seimbang (Tie Boundary):</span>
                    <p className="mt-0.5 text-amber-800 leading-relaxed">
                      Terdapat kandidat dengan jumlah suara yang sama persis di ambang batas alokasi kelompok ini. Kebijakan tie aktif:{' '}
                      <strong className="underline">
                        {session.tie_policy === 'expand'
                          ? 'Perluas Kelompok (Menyertakan semua kandidat dengan suara seimbang)'
                          : session.tie_policy === 'manual'
                          ? 'Keputusan Administratif Manual'
                          : 'Batas Ketat'}
                      </strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Allocated Candidates Preview */}
              <div className="mt-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Kandidat Terpilih pada Acara Ini ({allocatedList.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {allocatedList.map((candRes) => (
                    <div
                      key={candRes.candidate.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {candRes.candidate.photo_url ? (
                          <img
                            src={candRes.candidate.photo_url}
                            alt={candRes.candidate.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-black text-gold-dark bg-gold-accent/20 px-1 rounded">
                            #{candRes.candidate.candidate_number}
                          </span>
                          <span className="text-xs font-bold text-navy-primary truncate">
                            {candRes.candidate.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          {election.status === 'closed' ? (
                            <span>{candRes.voteCount} Suara ({candRes.percentage}%)</span>
                          ) : (
                            <span className="text-slate-400 italic">Disembunyikan saat voting</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {allocatedList.length === 0 && (
                    <div className="col-span-full py-3 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Belum ada kandidat yang teralokasi ke dalam sesi acara ini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT ANNOUNCEMENT SESSION MODAL */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-navy-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-navy-primary text-gold-accent font-black text-sm flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-navy-primary">
                  {modalMode === 'create' ? 'Tambah Acara Pengumuman' : 'Edit Pengaturan Acara Pengumuman'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-5 space-y-4">
              {/* Event Name */}
              <div>
                <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                  Nama Acara Pengumuman *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Pengumuman Jenderal 5102"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm font-semibold outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                  Deskripsi / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan singkat sesi pengumuman"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm outline-none"
                />
              </div>

              {/* Selection Method */}
              <div>
                <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                  Metode Penentuan Kandidat *
                </label>
                <select
                  value={formData.selection_method}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      selection_method: e.target.value as AnnouncementSelectionMethod,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm font-semibold outline-none bg-white"
                >
                  <option value="highest_votes">A. SUARA TERTINGGI (Highest Votes)</option>
                  <option value="lowest_votes">B. SUARA TERENDAH (Lowest Votes)</option>
                  <option value="next_ranking_group">C. PERINGKAT BERIKUTNYA (Next Ranking Group)</option>
                  <option value="manual">D. PILIHAN MANUAL ADMIN (Manual Selection)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Semua metode menggunakan satu kali pemungutan suara resmi tanpa perlu voting ulang.
                </p>
              </div>

              {/* Candidate Limit & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                    Jumlah Kandidat Ditampilkan *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={candidates.length || 100}
                    value={formData.candidate_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, candidate_limit: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm font-semibold outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                    Status Acara Pengumuman
                  </label>
                  <select
                    value={formData.announcement_status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        announcement_status: e.target.value as AnnouncementStatus,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm font-semibold outline-none bg-white"
                  >
                    <option value="draft">DRAFT (Belum Dipublikasi)</option>
                    <option value="ready">READY (Siap Dipresentasikan)</option>
                    <option value="published">PUBLISHED (Diumumkan)</option>
                  </select>
                </div>
              </div>

              {/* Tie Policy Handling (Phase 6) */}
              <div>
                <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                  Kebijakan Suara Seimbang di Batas Kelompok (Tie Policy)
                </label>
                <select
                  value={formData.tie_policy}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tie_policy: e.target.value as TiePolicy,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm font-semibold outline-none bg-white"
                >
                  <option value="expand">1. PERLUAS KELOMPOK (Sertakan semua kandidat yang suaranya seimbang)</option>
                  <option value="manual">2. KEPUTUSAN MANUAL ADMIN (Ditandai sebagai penetapan administratif)</option>
                  <option value="strict">3. BATAS KETAT (Potong batas kuota dengan catatan seimbang)</option>
                </select>
              </div>

              {/* Checkboxes: Exclusive grouping, show counts, show percentages */}
              <div className="pt-2 space-y-2.5 border-t border-slate-100">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-navy-primary">
                  <input
                    type="checkbox"
                    checked={formData.exclusive_grouping}
                    onChange={(e) =>
                      setFormData({ ...formData, exclusive_grouping: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-gold-accent focus:ring-gold-accent border-slate-300"
                  />
                  <span>Kelompok Eksklusif (Kandidat yang sudah masuk acara sebelumnya tidak diduplikasi)</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-navy-primary">
                  <input
                    type="checkbox"
                    checked={formData.show_vote_counts}
                    onChange={(e) =>
                      setFormData({ ...formData, show_vote_counts: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-gold-accent focus:ring-gold-accent border-slate-300"
                  />
                  <span>Tampilkan Jumlah Suara pada Layar Presentasi</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-navy-primary">
                  <input
                    type="checkbox"
                    checked={formData.show_percentages}
                    onChange={(e) =>
                      setFormData({ ...formData, show_percentages: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-gold-accent focus:ring-gold-accent border-slate-300"
                  />
                  <span>Tampilkan Persentase pada Layar Presentasi</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary-gold"
                  size="md"
                  isLoading={isSaving}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Simpan Pengaturan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 bg-navy-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-navy-primary">
              Hapus Sesi Acara Pengumuman?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Anda akan menghapus sesi acara <strong>"{sessionToDelete.name}"</strong>. Data perolehan suara sah kandidat di database TIDAK akan terpengaruh.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setSessionToDelete(null)}
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleConfirmDelete}
                isLoading={isSaving}
                className="bg-rose-600 text-white hover:bg-rose-700 border-transparent font-bold"
              >
                Ya, Hapus Sesi Acara
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewSessionId && (
        <div className="fixed inset-0 z-50 bg-navy-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1C1C1E] rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-gold-accent/40 max-h-[90vh] flex flex-col text-white">
            <div className="flex items-center justify-between pb-4 border-b border-navy-light/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-accent/20 text-gold-accent flex items-center justify-center border border-gold-accent/30">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Pratinjau Kelompok: {sortedSessions.find((s) => s.id === previewSessionId)?.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Hasil alokasi kandidat untuk sesi acara ini berdasarkan peringkat resmi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewSessionId(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-navy-secondary transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 p-4 rounded-2xl bg-navy-secondary/60 border border-navy-light/40">
              {(() => {
                const groupAlloc = allocationSummary.groups.find((g) => g.session.id === previewSessionId);
                const list = groupAlloc?.candidates || [];
                if (list.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-sm">
                      Belum ada kandidat yang teralokasi ke acara ini.
                    </div>
                  );
                }
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {list.map((item) => (
                      <div
                        key={item.candidate.id}
                        className="bg-navy-primary p-4 rounded-2xl border border-gold-accent/30 flex flex-col items-center text-center"
                      >
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gold-accent/50 mb-3 bg-navy-secondary">
                          {item.candidate.photo_url ? (
                            <img
                              src={item.candidate.photo_url}
                              alt={item.candidate.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="w-10 h-10 text-slate-500 m-auto mt-6" />
                          )}
                        </div>
                        <span className="text-[10px] font-black text-gold-accent uppercase tracking-wider">
                          Peringkat #{item.rank}
                        </span>
                        <h4 className="text-base font-black text-white mt-1">
                          {item.candidate.name}
                        </h4>
                        <span className="text-xs text-slate-400">
                          Kandidat #{item.candidate.candidate_number}
                        </span>
                        {groupAlloc?.session.show_vote_counts && (
                          <div className="mt-3 px-3 py-1 rounded-full bg-gold-accent/20 text-gold-accent font-extrabold text-xs">
                            {item.voteCount} Suara {groupAlloc.session.show_percentages ? `(${item.percentage}%)` : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Link
                to={`/admin/announcement/${previewSessionId}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-accent text-navy-primary font-black text-xs"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka Mode Presentasi Layar Penuh</span>
              </Link>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setPreviewSessionId(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
