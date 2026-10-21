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
} from 'lucide-react';
import type { Candidate } from '../../types/election';
import { useElection } from '../../hooks/useElection';
import { Button } from '../../components/common/Button';
import { storageService } from '../../services/storageService';

export const AdminCandidatesPage: React.FC = () => {
  const {
    candidates,
    isCandidatesLocked,
    updateCandidate,
    addCandidate,
    deleteCandidate,
    election,
    setElectionStatusForDev,
  } = useElection();

  // Edit Modal State
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title_or_role: '',
    vision: '',
    photo_url: '',
  });
  const [previewPhoto, setPreviewPhoto] = useState<string>('');

  // Add Candidate Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCandidateData, setNewCandidateData] = useState({
    name: '',
    title_or_role: '',
    vision: '',
    photo_url: '',
  });
  const [newPreviewPhoto, setNewPreviewPhoto] = useState<string>('');

  // Delete Confirmation State
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Open Edit
  const handleOpenEdit = (candidate: Candidate) => {
    if (isCandidatesLocked) return;
    setEditingCandidate(candidate);
    setFormData({
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
    setNewCandidateData({
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
        name: formData.name.trim(),
        title_or_role: formData.title_or_role.trim(),
        vision: formData.vision.trim(),
        photo_url: formData.photo_url || editingCandidate.photo_url,
      });

      setSuccessNotice(`Data Kandidat 0${editingCandidate.candidate_number} berhasil disimpan.`);
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

  const nextNumber =
    candidates.length > 0 ? Math.max(...candidates.map((c) => c.candidate_number)) + 1 : 1;

  return (
    <div className="space-y-6">
      {/* Header and Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-primary">
              Manajemen Kandidat Resmi
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-navy-primary/10 text-navy-primary font-bold text-xs">
              {candidates.length} Kandidat
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola daftar kandidat resmi pemilihan. Tambah, edit foto profil & visi, atau hapus kandidat sebelum pemungutan suara dibuka.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
                Tekan tombol "Ubah ke Draft" di kanan atas jika Anda perlu menambah atau mengubah kandidat.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Candidate Cards Grid: Responsive for any number of candidates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {candidates.map((candidate) => {
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

                      <div className="flex items-center gap-1.5">
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

                    {/* Photo Area with Commemorative Postage Stamp Frame */}
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
                      {candidate.vision && (
                        <div className="mt-2.5 p-2 rounded-lg bg-amber-50/40 border border-dashed border-gold-accent/30 text-xs text-slate-600 italic">
                          "{candidate.vision}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-dashed border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="font-semibold text-slate-400">Edisi Pemilihan</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi
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
                  0{editingCandidate.candidate_number}
                </div>
                <h3 className="text-lg font-extrabold text-navy-primary">
                  Ubah Data Kandidat #{String(editingCandidate.candidate_number).padStart(2, '0')}
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

              {/* Role / Title */}
              <div>
                <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                  Jabatan / Keterangan
                </label>
                <input
                  type="text"
                  value={formData.title_or_role}
                  onChange={(e) => setFormData({ ...formData, title_or_role: e.target.value })}
                  placeholder="Contoh: Calon Jendral Kehormatan"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm outline-none"
                />
              </div>

              {/* Vision */}
              <div>
                <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                  Visi / Motto Singkat
                </label>
                <textarea
                  value={formData.vision}
                  onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                  placeholder="Visi atau moto pengabdian kandidat..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm outline-none resize-none"
                />
              </div>

              {/* Photo URL Alternative */}
              <div>
                <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                  Atau URL Gambar Langsung
                </label>
                <input
                  type="text"
                  value={formData.photo_url}
                  onChange={(e) => {
                    setFormData({ ...formData, photo_url: e.target.value });
                    setPreviewPhoto(e.target.value);
                  }}
                  placeholder="https://... atau data:image..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs font-mono outline-none"
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
                <div className="w-8 h-8 rounded-lg bg-navy-primary text-gold-accent font-extrabold text-sm flex items-center justify-center">
                  0{nextNumber}
                </div>
                <h3 className="text-lg font-extrabold text-navy-primary">
                  Tambah Kandidat Baru #{String(nextNumber).padStart(2, '0')}
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
                  Foto Resmi Kandidat
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-28 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {newPreviewPhoto ? (
                      <img
                        src={newPreviewPhoto}
                        alt="Pratinjau Foto"
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
                        onChange={handleNewPhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Pilih foto berorientasi potret (JPG, PNG, atau WEBP).
                    </p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  value={newCandidateData.name}
                  onChange={(e) =>
                    setNewCandidateData({ ...newCandidateData, name: e.target.value })
                  }
                  placeholder="Contoh: Ahmad Fauzan, S.Pd"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm font-semibold outline-none"
                  required
                />
              </div>

              {/* Role / Title */}
              <div>
                <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                  Jabatan / Keterangan
                </label>
                <input
                  type="text"
                  value={newCandidateData.title_or_role}
                  onChange={(e) =>
                    setNewCandidateData({ ...newCandidateData, title_or_role: e.target.value })
                  }
                  placeholder="Contoh: Calon Jendral 5102"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm outline-none"
                />
              </div>

              {/* Vision */}
              <div>
                <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                  Visi / Motto Singkat
                </label>
                <textarea
                  value={newCandidateData.vision}
                  onChange={(e) =>
                    setNewCandidateData({ ...newCandidateData, vision: e.target.value })
                  }
                  placeholder="Visi pengabdian dan komitmen kepemimpinan..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm outline-none resize-none"
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
                  Simpan Kandidat Baru
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
              <Trash2 className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h3 className="text-lg font-extrabold text-navy-primary">
              Hapus Kandidat {String(candidateToDelete.candidate_number).padStart(2, '0')}?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus <span className="font-bold text-navy-primary">{candidateToDelete.name}</span> dari daftar pemilihan? Nomor urut kandidat lainnya akan otomatis disesuaikan berurutan.
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
                variant="danger"
                size="md"
                isLoading={isSaving}
                onClick={handleConfirmDelete}
              >
                Ya, Hapus Kandidat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
