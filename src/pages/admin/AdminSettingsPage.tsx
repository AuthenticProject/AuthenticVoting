import React, { useState } from 'react';
import {
  Lock,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { useElection } from '../../hooks/useElection';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { storageService } from '../../services/storageService';

export const AdminSettingsPage: React.FC = () => {
  const { election, isSettingsLocked, updateSettings, setElectionStatusForDev } = useElection();

  const [formData, setFormData] = useState({
    title: election.title,
    subtitle: election.subtitle,
    logo_url: election.logo_url || '',
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [prevElection, setPrevElection] = useState(election);
  if (prevElection !== election && !isSaving && !isUploading) {
    setPrevElection(election);
    setFormData({
      title: election.title,
      subtitle: election.subtitle,
      logo_url: election.logo_url || '',
    });
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSettingsLocked) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);
    setIsUploading(true);
    try {
      const { url, error } = await storageService.uploadAsset(file, 'logos', 'event_logo');
      if (error || !url) {
        setValidationError(error || 'Gagal mengunggah berkas logo.');
        return;
      }

      setFormData((prev) => ({ ...prev, logo_url: url }));
    } catch {
      setValidationError('Terjadi kendala saat memproses berkas logo.');
    } finally {
      setIsUploading(false);
      // Reset input value so re-selecting same file triggers onChange
      e.target.value = '';
    }
  };

  const handleResetLogo = () => {
    if (isSettingsLocked) return;
    setFormData((prev) => ({ ...prev, logo_url: '' }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSettingsLocked) return;

    if (!formData.title.trim()) {
      setValidationError('Nama Pemilihan wajib diisi.');
      return;
    }

    setIsSaving(true);
    setValidationError(null);
    try {
      await updateSettings({
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        logo_url: formData.logo_url,
      });

      setSuccessMessage('Pengaturan acara dan lambang berhasil disimpan dan diterapkan ke bilik suara.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-primary">
            Pengaturan Acara Pemilihan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Konfigurasi identitas acara, judul resmi, dan branding tampilan bilik suara.
          </p>
        </div>

        {isSettingsLocked ? (
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>Pengaturan Terkunci ({election.status === 'active' ? 'Voting Aktif' : 'Voting Ditutup'})</span>
            </div>
            <button
              onClick={() => setElectionStatusForDev('draft')}
              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-navy-primary text-xs font-bold transition-colors"
              title="Kembalikan status ke Draft untuk mengubah pengaturan"
            >
              Ubah ke Draft
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dapat Dikonfigurasi (Status Draft)</span>
          </div>
        )}
      </div>

      {/* Success Notice */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Locked Notice */}
      {isSettingsLocked && (
        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 text-slate-700 text-xs sm:text-sm flex items-start gap-3">
          <Lock className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-navy-primary">Pengaturan Telah Dikunci</p>
            <p className="text-slate-600 mt-0.5">
              Identitas acara tidak dapat diubah kembali saat pemungutan suara sedang berlangsung atau telah ditutup.
              Tekan tombol "Ubah ke Draft" di atas jika Anda ingin membuka kunci untuk mengedit logo atau nama acara.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
          <h3 className="text-lg font-extrabold text-navy-primary mb-4 pb-3 border-b border-slate-100">
            Identitas Pemilihan
          </h3>

          {validationError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                Nama Pemilihan (Judul Acara) *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={isSettingsLocked}
                placeholder="Contoh: Pemilihan jendral 5102"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm font-bold outline-none disabled:bg-slate-50 disabled:text-slate-500"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Akan ditampilkan di layar sambutan bilik suara dan seluruh laporan hasil.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                Subjudul Acara
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                disabled={isSettingsLocked}
                placeholder="Contoh: Pondok Modern Darussalam Gontor"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-navy-primary focus:ring-2 focus:ring-navy-primary/20 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Keterangan institusi, periode kepengurusan, atau tempat musyawarah.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                Logo / Lambang Acara
              </label>
              <div className="flex items-center gap-4">
                {/* Visual Logo Container with Live Preview */}
                <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border-2 border-slate-200 shadow-sm overflow-hidden p-2 relative">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-gold-accent" />
                  ) : (
                    <Logo src={formData.logo_url} size="md" />
                  )}
                </div>

                {!isSettingsLocked && (
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-primary text-white hover:bg-navy-secondary text-xs font-bold transition-colors shadow-sm">
                      <Upload className="w-4 h-4 text-gold-accent" />
                      <span>{formData.logo_url ? 'Ganti Logo' : 'Unggah Logo Acara'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleLogoUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>

                    {formData.logo_url && (
                      <button
                        type="button"
                        onClick={handleResetLogo}
                        className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold transition-colors border border-slate-200"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Gunakan Lambang Default</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Format didukung: PNG, JPG, WEBP, atau SVG. Logo akan otomatis tampil di bilik suara dan lembar hasil.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <Button
                type="submit"
                variant="primary-gold"
                size="md"
                isLoading={isSaving}
                disabled={isSettingsLocked || isUploading}
              >
                {isSettingsLocked ? 'Pengaturan Terkunci' : 'Simpan Pengaturan'}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Preview: 5 cols */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gold-dark" />
              <h3 className="text-sm font-extrabold text-navy-primary uppercase tracking-wider">
                Pratinjau Bilik Suara Kiosk
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Live Preview
            </span>
          </div>

          {/* Miniaturized Kiosk Frame */}
          <div className="w-full rounded-2xl bg-slate-kiosk border-2 border-slate-200 overflow-hidden shadow-inner p-6 flex flex-col items-center justify-center text-center aspect-[4/3] relative">
            <div className="absolute top-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 pb-2 border-b border-slate-200/70">
              <span>● ● ●</span>
              <span>Tablet Kiosk 1920×1200</span>
            </div>

            <div className="mt-4 flex flex-col items-center">
              <Logo src={formData.logo_url} size="md" className="mb-3" />
              <div className="px-2 py-0.5 rounded-full bg-navy-primary/5 text-navy-primary text-[9px] font-bold uppercase tracking-wider mb-1">
                E-Voting Kiosk
              </div>
              <h4 className="text-xs sm:text-sm font-extrabold text-navy-primary line-clamp-2 max-w-xs leading-snug">
                {formData.title || 'Judul Pemilihan'}
              </h4>
              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 max-w-xs">
                {formData.subtitle || 'Subjudul Acara'}
              </p>

              <div className="mt-4 py-2 px-6 rounded-xl bg-gold-accent text-navy-primary font-extrabold text-xs shadow-sm flex items-center gap-1.5">
                <span>MULAI MEMILIH</span>
                <ArrowRight className="w-3 h-3 stroke-[3]" />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center mt-3">
            Tampilan pratinjau langsung merefleksikan layar selamat datang pada bilik suara tablet kiosk.
          </p>
        </div>
      </div>
    </div>
  );
};
