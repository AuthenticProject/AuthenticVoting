import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ShieldCheck, Sparkles } from 'lucide-react';

interface SuccessScreenProps {
  onFinish: () => void;
  autoReturnSeconds?: number;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  onFinish,
  autoReturnSeconds = 2,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(autoReturnSeconds);

  useEffect(() => {
    // Exact timer for auto-returning to welcome screen
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className="h-full flex flex-col items-center justify-center py-6 px-4 sm:px-8 max-w-2xl mx-auto w-full text-center">
      {/* Background Subtle Gold Aura */}
      <div className="absolute w-80 h-80 rounded-full bg-gold-accent/15 blur-3xl pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 220 }}
        className="w-full bg-white rounded-3xl p-8 sm:p-12 shadow-card border-2 border-gold-accent/60 flex flex-col items-center relative overflow-hidden"
      >
        {/* Top Gold Ribbon Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-gold-light via-gold-accent to-gold-dark" />

        {/* Subtle Gold Success Animated Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: 'spring', damping: 14, stiffness: 200 }}
          className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-gold-50 to-gold-100 text-gold-dark flex items-center justify-center mb-6 border-4 border-gold-accent shadow-lg shadow-gold-accent/25"
        >
          {/* Subtle gold sparkle particles */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute -top-1 -right-1 text-gold-accent"
          >
            <Sparkles className="w-6 h-6 fill-gold-accent text-gold-accent" />
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          >
            <Check className="w-12 h-12 sm:w-14 sm:h-14 stroke-[3.5] text-navy-primary" />
          </motion.div>
        </motion.div>

        {/* Success Headings - Exact Copy */}
        <h2 className="text-3xl sm:text-5xl font-black text-navy-primary tracking-tight">
          TERIMA KASIH
        </h2>
        <p className="text-lg sm:text-2xl font-extrabold text-gold-dark mt-2.5">
          Suara Anda Berhasil Dicatat
        </p>

        {/* Verification badge */}
        <div className="my-6 py-3 px-5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs sm:text-sm text-slate-700 font-semibold flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-gold-dark shrink-0" />
          <span>Suara Anda telah tersimpan secara resmi, sah, dan terenkripsi di sistem bilik suara.</span>
        </div>

        {/* Auto Return Countdown & Progress Bar */}
        <div className="w-full mt-2 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
            <span>Kembali ke layar utama dalam</span>
            <span className="font-extrabold text-navy-primary bg-gold-accent/20 px-2.5 py-0.5 rounded-md border border-gold-accent/40">
              {secondsRemaining} detik
            </span>
          </div>

          {/* Animated Gold Progress Bar */}
          <div className="w-full max-w-xs h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <motion.div
              className="h-full bg-gradient-to-r from-gold-accent to-gold-dark rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: `${(secondsRemaining / autoReturnSeconds) * 100}%` }}
              transition={{ ease: 'linear', duration: 1 }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
