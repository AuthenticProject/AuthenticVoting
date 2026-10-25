import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Tablet,
  KeyRound,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { kioskSessionService } from '../../services/kioskSessionService';
import { useElection } from '../../hooks/useElection';
import { Button } from '../../components/common/Button';

export const AdminKioskManagementPage: React.FC = () => {
  const { election } = useElection();
  const [token, setToken] = useState<string>(() => kioskSessionService.getKioskToken() || '');
  const [deviceName, setDeviceName] = useState<string>(() => kioskSessionService.getKioskDeviceName());
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleGenerateNewToken = () => {
    const newToken = kioskSessionService.generatePairingToken(deviceName);
    setToken(newToken);
    setNotice({
      type: 'success',
      message: 'Token otorisasi tablet baru berhasil dibuat dan disimpan.',
    });
    setTimeout(() => setNotice(null), 4000);
  };

  const handleClearToken = () => {
    kioskSessionService.clearKioskToken();
    setToken('');
    setNotice({
      type: 'success',
      message: 'Otorisasi tablet berhasil dicabut.',
    });
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-navy-primary">
              Otorisasi Tablet Bilik Suara
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                token
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {token ? 'Tablet Terotorisasi' : 'Menunggu Otorisasi'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manajemen perangkat tablet fisik tunggal yang digunakan bergantian oleh seluruh pemilih di bilik suara resmi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/vote"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-accent hover:bg-gold-light text-navy-primary font-black text-xs shadow-sm transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Buka Layar Bilik Suara (/vote)</span>
          </Link>
        </div>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-3 border ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{notice.message}</span>
        </div>
      )}

      {/* Main Status & Pairing Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-navy-primary text-gold-accent flex items-center justify-center">
              <Tablet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-navy-primary">
                Konfigurasi Tablet Kiosk
              </h3>
              <p className="text-xs text-slate-500">
                Tablet fisik harus diotorisasi sebelum pemungutan suara dapat menerima pilihan pemilih.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                Nama Perangkat Tablet
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Contoh: Tablet Bilik Suara Utama"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-navy-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                PIN Otorisasi Standar
              </label>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-mono font-black text-lg text-navy-primary tracking-widest">
                  5102
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Dapat diketikkan langsung di layar /vote tablet
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-primary uppercase tracking-wider mb-1.5">
                Token Otorisasi Aktif
              </label>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-mono text-xs text-slate-600 truncate max-w-sm">
                  {token || 'Belum ada token otorisasi tersimpan'}
                </span>
                {token && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Aktif
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="primary-gold"
                size="md"
                leftIcon={<KeyRound className="w-4 h-4" />}
                onClick={handleGenerateNewToken}
              >
                Buat / Perbarui Token Otorisasi
              </Button>

              {token && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleClearToken}
                  className="border-rose-300 text-rose-700 hover:bg-rose-50"
                >
                  Cabut Otorisasi
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Operating Protocol & Security Guidance */}
        <div className="bg-[#1C1C1E] text-white rounded-3xl p-6 sm:p-7 border border-gold-accent/30 shadow-sm flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-accent/20 border border-gold-accent/40 text-gold-accent text-xs font-bold uppercase mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Protokol Pengawasan Fisik</span>
            </div>

            <h4 className="text-base font-black text-white mb-2">
              Prinsip 1 Tablet, Banyak Pemilih
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed space-y-2">
              Sesuai ketentuan Phase 1 & 13:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-300 mt-2 space-y-2 leading-relaxed">
              <li>
                <strong>Satu Orang, Satu Suara:</strong> Karena pemilih tidak menggunakan akun pribadi atau OTP, <span className="text-gold-light font-bold">pengawasan fisik langsung oleh Panitia</span> wajib dilakukan di depan bilik suara.
              </li>
              <li>
                <strong>Reset Otomatis 2 Detik:</strong> Setelah pemilih menekan "PILIH", layar sukses tampil selama tepat 2 detik, lalu otomatis kembali ke Layar Selamat Datang untuk pemilih berikutnya.
              </li>
              <li>
                <strong>Tanpa Penguncian Browser:</strong> Browser tablet tidak memblokir pemilih berikutnya sehingga dapat menerima ratusan suara berturut-turut.
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-navy-light/40 flex items-center justify-between text-xs text-slate-400">
            <span>Status Pemilihan:</span>
            <span className="font-extrabold uppercase text-gold-accent">
              {election.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
