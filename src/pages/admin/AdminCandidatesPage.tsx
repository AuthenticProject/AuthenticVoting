import React, { useState } from 'react';
import {
  Edit3,
  Upload,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  ArrowUp,
  ArrowDown,
  Eye,
  Tablet,
} from 'lucide-react';
import type { Candidate } from '../../types/election';
import { useElection } from '../../hooks/useElection';
import { Button } from '../../components/common/Button';
import { CandidateCard } from '../../components/kiosk/CandidateCard';
import { storageService } from '../../services/storageService';

export const AdminCandidatesPage: React.FC = () => {
  const {
    candidates,
    isCandidatesLocked,
    updateCandidate,
    addCandidate,
    deleteCandidate,
    reorderCandidates,
    election,
    setElectionStatusForDev,
  } = useElection();

  // Edit Modal State
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [formData, setFormData] = useState({
    candidate_number: 1,
    name: '',
    title_or_role: '',
    vision: '',
    photo_url: '',
  });
  const [previewPhoto, setPreviewPhoto] = useState<string>('');

  // Add Candidate Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCandidateData, setNewCandidateData] = useState({
    candidate_number: 1,
    name: '',
    title_or_role: '',
    vision: '',
    photo_url: '',
  });
  const [newPreviewPhoto, setNewPreviewPhoto] = useState<string>('');

  // Delete Confirmation State
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);

  // Kiosk Layout Preview State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Open Edit
  const handleOpenEdit = (candidate: Candidate) => {
    if (isCandidatesLocked) return;
    setEditingCandidate(candidate);
    setFormData({
      candidate_number: candidate.candidate_number,
      name: candidate.name,
      title_or_role: candidate.title_or_role || '',
      vision: candidate.vision || '',
      photo_url: candidate.photo_url,
    });
    setPreviewPhoto(candidate.photo_url);
    setValidationError(null);
  };

  const handleCloseEditModal = () => {
    setEditingCandidate(null);
    setValidationError(null);
  };

  // Open Add
  const handleOpenAdd = () => {
    if (isCandidatesLocked) return;
    const nextNum = candidates.length > 0 ? Math.max(...candidates.map((c) => c.candidate_number)) + 1 : 1;
    setNewCandidateData({
      candidate_number: nextNum,
      name: '',
      title_or_role: '',
      vision: '',
      photo_url: '',
    });
    setNewPreviewPhoto('');
    setValidationError(null);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setValidationError(null);
  };

  // Photo Upload Handler for Edit
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingCandidate) return;

    setValidationError(null);
    const { url, error } = await storageService.uploadAsset(file, 'candidates', editingCandidate.id);
    if (error || !url) {
      setValidationError(error || 'Gagal mengunggah foto.');
      return;
    }

    setPreviewPhoto(url);
    setFormData((prev) => ({ ...prev, photo_url: url }));
  };

  // Photo Upload Handler for Add
  const handleNewPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);
    const { url, error } = await storageService.uploadAsset(file, 'candidates', `new_${Date.now()}`);
    if (error || !url) {
      setValidationError(error || 'Gagal mengunggah foto.');
      return;
    }

    setNewPreviewPhoto(url);
    setNewCandidateData((prev) => ({ ...prev, photo_url: url }));
  };

  // Move candidate up in list order
  const handleMoveUp = async (index: number) => {
    if (isCandidatesLocked || index <= 0) return;
    const ordered = [...candidates];
    const temp = ordered[index];
    ordered[index] = ordered[index - 1];
    ordered[index - 1] = temp;
    await reorderCandidates(ordered.map((c) => c.id));
    setSuccessNotice(`Urutan Kandidat berhasil diperbarui.`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // Move candidate down in list order
  const handleMoveDown = async (index: number) => {
    if (isCandidatesLocked || index >= candidates.length - 1) return;
    const ordered = [...candidates];
    const temp = ordered[index];
    ordered[index] = ordered[index + 1];
    ordered[index + 1] = temp;
    await reorderCandidates(ordered.map((c) => c.id));
    setSuccessNotice(`Urutan Kandidat berhasil diperbarui.`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;

    if (!formData.name.trim()) {
      setValidationError('Nama lengkap kandidat wajib diisi.');
      return;
    }

    setIsSaving(true);
    setValidationError(null);
    try {
      await updateCandidate(editingCandidate.id, {
        candidate_number: Number(formData.candidate_number),
        name: formData.name.trim(),
        title_or_role: formData.title_or_role.trim(),
        vision: formData.vision.trim(),
        photo_url: formData.photo_url || editingCandidate.photo_url,
      });

      setSuccessNotice(`Data Kandidat 0${formData.candidate_number} berhasil disimpan.`);
      setTimeout(() => setSuccessNotice(null), 4000);
      handleCloseEditModal();
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Gagal memperbarui data kandidat.');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Add
  const handleSaveNewCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCandidatesLocked) return;

    if (!newCandidateData.name.trim()) {
      setValidationError('Nama lengkap kandidat wajib diisi.');
      return;
    }

    setIsSaving(true);
    setValidationError(null);
    try {
      await addCandidate({
        name: newCandidateData.name.trim(),
        title_or_role: newCandidateData.title_or_role.trim(),
        vision: newCandidateData.vision.trim(),
        photo_url: newCandidateData.photo_url.trim(),
      });

      setSuccessNotice('Kandidat baru berhasil ditambahkan ke daftar pemilihan.');
      setTimeout(() => setSuccessNotice(null), 4000);
      handleCloseAddModal();
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Gagal menambahkan kandidat baru.');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!candidateToDelete || isCandidatesLocked) return;

    setIsSaving(true);
    try {
      await deleteCandidate(candidateToDelete.id);
      setSuccessNotice(`Kandidat 0${candidateToDelete.candidate_number} (${candidateToDelete.name}) berhasil dihapus.`);
      setTimeout(() => setSuccessNotice(null), 4000);
      setCandidateToDelete(null);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Gagal menghapus kandidat.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-primary">
              Manajemen Kandidat Pemilihan
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-navy-primary/10 text-navy-primary font-bold text-xs">
              {candidates.length} Kandidat Aktif
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Daftar kandidat dinamis (3, 6, 8, 10, atau lebih). Tambah, ubah nomor urut, ganti foto, atur urutan, atau pratinjau tata letak bilik suara.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            leftIcon={<Eye className="w-4 h-4 text-gold-accent" />}
            onClick={() => setIsPreviewModalOpen(true)}
            className="text-xs font-bold border-slate-300 hover:border-gold-accent"
          >
            Pratinjau Bilik Suara
          </Button>

          {isCandidatesLocked ? (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
                <Lock className="w-4 h-4 text-amber-700" />
                <span>Kandidat Terkunci ({election.status === 'active' ? 'Voting Aktif' : 'Voting Ditutup'})</span>
              </div>
              <button
                onClick={() => setElectionStatusForDev('draft')}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-navy-primary text-xs font-bold transition-colors"
                title="Kembalikan status ke Draft untuk mengedit kandidat"
              >
                Ubah ke Draft
              </button>
            </div>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Mode Persiapan (Dapat Diedit)</span>
              </div>

              <Button
                type="button"
                variant="primary-gold"
                size="md"
                leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}
                onClick={handleOpenAdd}
                className="text-xs font-bold shadow-sm"
              >
                Tambah Kandidat
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successNotice}</span>
        </div>
      )}

      {/* Lock Banner if locked */}
      {isCandidatesLocked && (
        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 text-slate-700 text-xs sm:text-sm flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-navy-primary">Data Kandidat Telah Terkunci</p>
              <p className="text-slate-600 mt-0.5">
                Demi menjaga integritas suara, susunan nomor urut, foto, dan nama kandidat tidak dapat diubah saat pemungutan suara aktif atau ditutup.
                Tekan tombol "Ubah ke Draft" jika perlu menambah atau mengubah kandidat untuk pengujian.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Candidate Cards Grid: Responsive for any number of candidates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {candidates.map((candidate, idx) => {
          const formattedNumber = String(candidate.candidate_number).padStart(2, '0');
          return (
            <div
              key={candidate.id}
              className="stamp-card-container relative h-full flex flex-col justify-between group"
            >
              <div className="stamp-card flex flex-col justify-between h-full p-2.5 sm:p-3 border-2 border-slate-300 hover:border-gold-accent transition-colors bg-[#fefcf8]">
                <div className="relative flex flex-col justify-between h-full border border-dashed border-navy-primary/20 rounded p-2.5 sm:p-3 bg-white/90">
                  <div>
                    {/* Card Header with Number and Actions */}
                    <div className="pb-2.5 mb-2.5 border-b border-dashed border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-navy-primary text-gold-accent font-black text-sm flex items-center justify-center shadow-xs">
                          {formattedNumber}
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                            PRANGKO RESMI
                          </span>
                          <span className="text-xs font-bold text-navy-primary">
                            Kandidat #{formattedNumber}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Reorder Buttons (Move Up / Down) */}
                        {!isCandidatesLocked && (
                          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                            <button
                              onClick={() => handleMoveUp(idx)}
                              disabled={idx === 0}
                              className="p-1 rounded text-slate-600 hover:text-navy-primary disabled:opacity-30 disabled:pointer-events-none"
                              title="Geser ke Atas"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveDown(idx)}
                              disabled={idx === candidates.length - 1}
                              className="p-1 rounded text-slate-600 hover:text-navy-primary disabled:opacity-30 disabled:pointer-events-none"
                              title="Geser ke Bawah"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => handleOpenEdit(candidate)}
                          disabled={isCandidatesLocked}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                            isCandidatesLocked
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-navy-primary/5 hover:bg-navy-primary hover:text-white text-navy-primary'
                          }`}
                          title="Edit Profil Kandidat"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        {!isCandidatesLocked && candidates.length > 1 && (
                          <button
                            onClick={() => setCandidateToDelete(candidate)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Kandidat Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Photo Area with Postage Stamp Frame */}
                    <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-100 flex items-center justify-center mb-3">
                      <div className="stamp-frame w-full max-w-[240px]">
                        <div className="stamp-border p-1.5 bg-white">
                          <div className="w-full aspect-[4/4] bg-slate-100 overflow-hidden relative stamp-inner-border flex items-center justify-center">
                            {candidate.photo_url ? (
                              <img
                                src={candidate.photo_url}
                                alt={candidate.name}
                                className="w-full h-full object-cover object-top"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                                <User className="w-14 h-14 stroke-[1.5]" />
                                <span className="text-[11px] font-semibold mt-1">Belum Ada Foto</span>
                              </div>
                            )}

                            {/* Stamp Denomination Tag */}
                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-navy-primary/90 text-gold-accent font-black text-[8px] tracking-wider uppercase border border-gold-accent/40 shadow-xs">
                              #{formattedNumber}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Information */}
                    <div>
                      <h3 className="text-base font-extrabold text-navy-primary leading-snug">
                        {candidate.name}
                      </h3>
                      {candidate.title_or_role && (
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          {candidate.title_or_role}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-dashed border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="font-semibold text-slate-400">Edisi Pemilihan 5102</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Terdaftar
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT CANDIDATE MODAL */}
      {editingCandidate && (
        <div className="fixed inset-0 z-50 bg-navy-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-navy-primary text-gold-accent font-extrabold text-sm flex items-center justify-center">
                  0{formData.candidate_number}
                </div>
                <h3 className="text-lg font-extrabold text-navy-primary">
                  Ubah Data Kandidat #{String(formData.candidate_number).padStart(2, '0')}
                </h3>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {validationError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4">
              {/* Photo Preview & Upload */}
              <div>
                <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-2">
                  Foto Resmi Kandidat
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-28 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {previewPhoto ? (
                      <img
                        src={previewPhoto}
                        alt="Pratinjau"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-primary/5 hover:bg-navy-primary/10 text-navy-primary text-xs font-bold border border-navy-primary/20 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Unggah Berkas Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Format JPG, PNG, atau WEBP. Foto otomatis diperbarui.
                    </p>
                  </div>
                </div>
              </div>

              {/* Candidate Number */}
              <div>
                <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                  Nomor Urut Kandidat *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.candidate_number}
                  onChange={(e) => setFormData({ ...formData, candidate_number: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm font-semibold outline-none"
                  required
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Kaka Satria Nuradityanto"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm font-semibold outline-none"
                  required
                />
              </div>

              {/* Role / Region (Daerah) */}
              <div>
                <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                  Daerah / Asal Konsulat
                </label>
                <input
                  type="text"
                  value={formData.title_or_role}
                  onChange={(e) => setFormData({ ...formData, title_or_role: e.target.value })}
                  placeholder="Contoh: Jawa Timur / Ponorogo"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleCloseEditModal}
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
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CANDIDATE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold-accent text-navy-primary font-extrabold text-sm flex items-center justify-center">
                  +{candidates.length + 1}
                </div>
                <h3 className="text-lg font-extrabold text-navy-primary">
                  Tambah Kandidat Baru
                </h3>
              </div>
              <button
                onClick={handleCloseAddModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {validationError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewCandidate} className="mt-5 space-y-4">
              {/* Photo Preview & Upload */}
              <div>
                <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-2">
                  Foto Kandidat
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-28 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {newPreviewPhoto ? (
                      <img
                        src={newPreviewPhoto}
                        alt="Pratinjau"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-primary/5 hover:bg-navy-primary/10 text-navy-primary text-xs font-bold border border-navy-primary/20 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Pilih Berkas Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleNewPhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Format JPG, PNG, atau WEBP.
                    </p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                  Nama Lengkap Kandidat *
                </label>
                <input
                  type="text"
                  value={newCandidateData.name}
                  onChange={(e) =>
                    setNewCandidateData({ ...newCandidateData, name: e.target.value })
                  }
                  placeholder="Masukkan nama kandidat"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm font-semibold outline-none"
                  required
                />
              </div>

              {/* Role / Region */}
              <div>
                <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                  Daerah / Konsulat Asal
                </label>
                <input
                  type="text"
                  value={newCandidateData.title_or_role}
                  onChange={(e) =>
                    setNewCandidateData({ ...newCandidateData, title_or_role: e.target.value })
                  }
                  placeholder="Contoh: Jawa Timur"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleCloseAddModal}
                  disabled={isSaving}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary-gold"
                  size="md"
                  isLoading={isSaving}
                  leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}
                >
                  Tambahkan Kandidat
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {candidateToDelete && (
        <div className="fixed inset-0 z-50 bg-navy-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-navy-primary">
              Hapus Kandidat Ini?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Anda akan menghapus kandidat <strong>#{String(candidateToDelete.candidate_number).padStart(2, '0')} - {candidateToDelete.name}</strong> dari daftar pemilihan. Nomor urut kandidat lainnya akan otomatis disesuaikan.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setCandidateToDelete(null)}
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
                Ya, Hapus Kandidat
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VOTING LAYOUT PREVIEW MODAL */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1C1C1E] rounded-3xl max-w-6xl w-full p-6 sm:p-8 shadow-2xl border border-gold-accent/40 max-h-[92vh] flex flex-col text-white">
            <div className="flex items-center justify-between pb-4 border-b border-navy-light/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-accent/20 text-gold-accent flex items-center justify-center border border-gold-accent/30">
                  <Tablet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    Pratinjau Layar Bilik Suara Tablet (Kiosk Landscape)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Simulasi tampilan {candidates.length} kandidat pada tablet bilik suara pemilih
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-navy-secondary transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Simulated Tablet Screen */}
            <div className="flex-1 overflow-y-auto my-4 p-4 rounded-2xl bg-slate-50 border border-slate-300/80 min-h-[450px] flex flex-col justify-between">
              <div className="text-center py-2 shrink-0">
                <h4 className="text-lg sm:text-2xl font-black text-navy-primary">
                  {election.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  {election.subtitle}
                </p>
              </div>

              <div
                className={`grid gap-4 items-stretch justify-center py-4 ${
                  candidates.length <= 2
                    ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto w-full'
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
                {candidates.map((cand) => (
                  <div key={cand.id} className="w-full flex justify-center pointer-events-none">
                    <CandidateCard
                      candidate={cand}
                      isSelected={false}
                      isSubmitting={false}
                      onSelect={() => {}}
                    />
                  </div>
                ))}
              </div>

              <div className="text-center text-xs text-slate-400 py-2 border-t border-slate-200">
                Sentuh tombol PILIH pada kartu kandidat untuk langsung mencatat suara.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary-gold"
                size="md"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                Tutup Pratinjau
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
