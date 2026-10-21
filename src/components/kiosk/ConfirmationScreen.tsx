import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowLeft, AlertTriangle, ShieldCheck, User } from 'lucide-react';
import type { Candidate } from '../../types/election';
import { Button } from '../common/Button';

interface ConfirmationScreenProps {
  candidate: Candidate;
  isSubmitting: boolean;
  submissionError: string | null;
  onConfirm: () => void;
  onBack: () => void;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  candidate,
  isSubmitting,
  submissionError,
  onConfirm,
  onBack,
}) => {
  const [imgError, setImgError] = React.useState(false);
  const formattedNumber = String(candidate.candidate_number).padStart(2, '0');

  return (
    <div className="h-full flex flex-col justify-between py-4 px-4 sm:px-8 max-w-4xl mx-auto w-full">
      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-2 shrink-0"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-accent/15 border border-gold-accent/30 text-navy-primary font-bold text-xs uppercase tracking-wider mb-2">
          Langkah 2 dari 2 — Konfirmasi Pilihan
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-primary">
          Apakah Anda yakin dengan pilihan ini?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Pilihan yang telah dikonfirmasi akan dicatat secara permanen dan tidak dapat diubah kembali.
        </p>
      </motion.div>

      {/* Candidate Summary Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 flex flex-col items-center justify-center my-3"
      >
        <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-card border-2 border-gold-accent/60 relative overflow-hidden">
          {/* Top Gold Ribbon Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-gold-light via-gold-accent to-gold-dark" />

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Candidate Photo */}
            <div className="relative w-36 h-44 sm:w-44 sm:h-52 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-md shrink-0">
              {!imgError ? (
                <img
                  src={candidate.photo_url}
                  alt={candidate.name}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200 text-slate-500">
                  <User className="w-16 h-16 mb-1 text-slate-400" />
                  <span className="text-xs">Foto Resmi</span>
                </div>
              )}

              {/* Number Badge */}
              <div className="absolute top-2 left-2 w-9 h-9 rounded-xl bg-navy-primary text-gold-accent font-extrabold text-base flex items-center justify-center border border-gold-accent/40 shadow-sm">
                {formattedNumber}
              </div>
            </div>

            {/* Candidate Details */}
            <div className="flex-1 text-center sm:text-left">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 bg-navy-primary/5 text-navy-primary rounded-full border border-navy-primary/10 mb-2">
                Kandidat Terpilih
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-navy-primary leading-snug">
                {candidate.name}
              </h3>
              {candidate.title_or_role && (
                <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                  {candidate.title_or_role}
                </p>
              )}

              {candidate.vision && (
                <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 italic">
                  "{candidate.vision}"
                </div>
              )}

              <div className="mt-4 flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Pilihan Sah & Terverifikasi</span>
              </div>
            </div>
          </div>

          {/* Submission Error Notification if any */}
          {submissionError && (
            <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Gagal Menyimpan Suara</p>
                <p className="text-rose-700 mt-0.5">{submissionError}</p>
                <p className="text-rose-600 text-[11px] mt-1">
                  ID Transaksi tetap tersimpan. Silakan tekan tombol 'Coba Lagi' di bawah.
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Buttons: KEMBALI & YA, KONFIRMASI PILIHAN */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 pt-3 border-t border-slate-200/80 shrink-0 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 bg-white/70 backdrop-blur-sm p-4 rounded-2xl"
      >
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled={isSubmitting}
          leftIcon={<ArrowLeft className="w-5 h-5" />}
          onClick={onBack}
          className="w-full sm:w-auto min-w-[160px]"
        >
          KEMBALI
        </Button>

        <Button
          type="button"
          variant="primary-gold"
          size="xl"
          isLoading={isSubmitting}
          rightIcon={<CheckCircle2 className="w-6 h-6 stroke-[2.5]" />}
          onClick={onConfirm}
          className="w-full sm:w-auto px-10 py-4 text-lg font-extrabold shadow-gold-glow"
        >
          {submissionError ? 'COBA LAGI SIMPAN SUARA' : 'YA, KONFIRMASI PILIHAN'}
        </Button>
      </motion.div>
    </div>
  );
};
