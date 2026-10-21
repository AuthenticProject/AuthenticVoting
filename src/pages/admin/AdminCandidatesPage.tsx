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
} from 'lucide-react';
import type { Candidate } from '../../types/election';
import { useElection } from '../../hooks/useElection';
import { Button } from '../../components/common/Button';
import { storageService } from '../../services/storageService';

export const AdminCandidatesPage: React.FC = () => {
  const { candidates, isCandidatesLocked, updateCandidate, election } = useElection();

  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title_or_role: '',
    vision: '',
    photo_url: '',
  });
  const [previewPhoto, setPreviewPhoto] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

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

  const handleCloseModal = () => {
    setEditingCandidate(null);
    setValidationError(null);
  };

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;

    if (!formData.name.trim()) {
      setValidationError('Nama lengkap kandidat wajib diisi.');
      return;
    }

    updateCandidate(editingCandidate.id, {
      name: formData.name.trim(),
      title_or_role: formData.title_or_role.trim(),
      vision: formData.vision.trim(),
      photo_url: formData.photo_url || editingCandidate.photo_url,
    });

    setSuccessNotice(`Data Kandidat 0${editingCandidate.candidate_number} berhasil diperbarui.`);
    setTimeout(() => setSuccessNotice(null), 4000);
    handleCloseModal();
  };

  return (
    <div className="space-y-6">
      {/* Header and Lock Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-primary">
            Manajemen Kandidat Resmi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tersedia tepat 3 slot kandidat untuk pemilihan tunggal ini.
          </p>
        </div>

        {isCandidatesLocked ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
            <Lock className="w-4 h-4 text-amber-700" />
            <span>Kandidat Terkunci ({election.status === 'active' ? 'Voting Aktif' : 'Voting Ditutup'})</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Mode Persiapan (Dapat Diedit)</span>
          </div>
        )}
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
        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 text-slate-700 text-xs sm:text-sm flex items-start gap-3">
          <Lock className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-navy-primary">Data Kandidat Telah Terkunci</p>
            <p className="text-slate-600 mt-0.5">
              Demi menjaga integritas suara yang telah atau sedang masuk, nomor urut, foto, dan nama kandidat tidak dapat diubah setelah pemungutan suara resmi dibuka.
            </p>
          </div>
        </div>
      )}

      {/* Candidate Cards Grid: Exactly 3 candidates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {candidates.map((candidate) => {
          const formattedNumber = String(candidate.candidate_number).padStart(2, '0');
          return (
            <div
              key={candidate.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-navy-primary text-gold-accent font-extrabold text-base flex items-center justify-center">
                    {formattedNumber}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Nomor Urut
                    </span>
                    <span className="text-xs font-bold text-navy-primary">
                      Kandidat {formattedNumber}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEdit(candidate)}
                  disabled={isCandidatesLocked}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isCandidatesLocked
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-navy-primary/5 hover:bg-navy-primary hover:text-white text-navy-primary'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isCandidatesLocked ? 'Terkunci' : 'Edit'}</span>
                </button>
              </div>

              {/* Photo Area */}
              <div className="w-full aspect-[4/4] bg-slate-100 overflow-hidden relative">
                <img
                  src={candidate.photo_url}
                  alt={candidate.name}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    // Fallback to placeholder avatar
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Information */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-navy-primary leading-snug">
                    {candidate.name}
                  </h3>
                  {candidate.title_or_role && (
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      {candidate.title_or_role}
                    </p>
                  )}
                  {candidate.vision && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
                      "{candidate.vision}"
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Slot ID: {candidate.id}</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Sah
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT MODAL */}
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
                onClick={handleCloseModal}
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

            <form onSubmit={handleSave} className="mt-5 space-y-4">
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
                      Format JPG, PNG, atau WEBP. Maksimum 5MB.
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
                  placeholder="Contoh: Letjen (Purn.) Dr. Bambang Soedirman, M.Si"
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
                  Atau URL Gambar Eksternal
                </label>
                <input
                  type="url"
                  value={formData.photo_url}
                  onChange={(e) => {
                    setFormData({ ...formData, photo_url: e.target.value });
                    setPreviewPhoto(e.target.value);
                  }}
                  placeholder="https://..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs font-mono outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleCloseModal}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary-gold"
                  size="md"
                >
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
