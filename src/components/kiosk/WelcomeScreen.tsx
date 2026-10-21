import React from 'react';
import { motion } from 'framer-motion';
import { Vote, ArrowRight, ShieldAlert, Clock } from 'lucide-react';
import type { Election } from '../../types/election';
import { Logo } from '../common/Logo';
import { Button } from '../common/Button';

interface WelcomeScreenProps {
  election: Election;
  onStartVoting: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  election,
  onStartVoting,
}) => {
  const isDraft = election.status === 'draft';
  const isClosed = election.status === 'closed';
  const isActive = election.status === 'active';

  return (
    <div className="relative min-h-full flex flex-col justify-between py-6 px-4 sm:px-8 max-w-5xl mx-auto w-full">
      {/* Decorative institutional background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-accent/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Banner / Event Emblem */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center pt-2 sm:pt-4"
      >
        <div className="inline-flex flex-col items-center">
          <Logo size="xl" className="mb-4 sm:mb-6" />
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-navy-primary/5 border border-navy-primary/15 text-navy-primary text-xs sm:text-sm font-bold tracking-wide uppercase mb-3">
            <span className="w-2 h-2 rounded-full bg-gold-accent animate-pulse" />
            Sistem Pemilihan Elektronik Kiosk
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-navy-primary tracking-tight max-w-3xl leading-tight">
            {election.title}
          </h1>
          <p className="mt-3 text-sm sm:text-lg text-slate-600 font-medium max-w-2xl">
            {election.subtitle}
          </p>
        </div>
      </motion.div>

      {/* Central Interactive / Status Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="my-6 sm:my-8 flex flex-col items-center justify-center"
      >
        {isActive && (
          <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card text-center flex flex-col items-center">
            {/* Elegant Ballot Box Icon Illustration */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-navy-primary to-navy-secondary text-gold-accent flex items-center justify-center mb-5 shadow-lg border border-navy-light/40">
              <Vote className="w-10 h-10 stroke-[1.8]" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-navy-primary mb-2">
              Bilik Suara Siap
            </h2>
            <p className="text-slate-600 text-sm mb-6 max-w-xs leading-relaxed">
              Silakan dekati layar dan tekan tombol di bawah untuk menentukan suara Anda secara langsung.
            </p>

            <Button
              variant="primary-gold"
              size="xl"
              fullWidth
              rightIcon={<ArrowRight className="w-6 h-6 stroke-[2.5]" />}
              onClick={onStartVoting}
              className="text-lg sm:text-xl font-extrabold py-4 rounded-2xl shadow-gold-glow"
            >
              MULAI VOTING
            </Button>
          </div>
        )}

        {isDraft && (
          <div className="w-full max-w-md bg-amber-50/90 backdrop-blur-md rounded-3xl p-8 border border-amber-200 shadow-card text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-amber-900 mb-2">
              Voting Belum Dimulai
            </h2>
            <p className="text-amber-800 text-sm leading-relaxed">
              Proses pemungutan suara belum dibuka oleh panitia acara. Mohon menunggu instruksi resmi dari panitia pengawas.
            </p>
          </div>
        )}

        {isClosed && (
          <div className="w-full max-w-md bg-slate-100/90 backdrop-blur-md rounded-3xl p-8 border border-slate-300 shadow-card text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Voting Telah Ditutup
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Waktu pemungutan suara telah resmi berakhir. Seluruh data suara tersimpan aman dan terenkripsi.
            </p>
          </div>
        )}
      </motion.div>

      {/* Footer / Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center text-xs text-slate-500 pb-2"
      >
        <p className="font-semibold text-slate-600">
          Setiap peserta berhak memberikan 1 (satu) suara sah kepada kandidat pilihan.
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Pengawasan fisik dilakukan langsung oleh Panitia Pemilihan di lokasi.
        </p>
      </motion.div>
    </div>
  );
};
