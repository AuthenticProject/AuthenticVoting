import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';

interface SuccessScreenProps {
  onFinish: () => void;
  autoReturnSeconds?: number;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  onFinish,
  autoReturnSeconds = 5,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(autoReturnSeconds);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      onFinish();
      return;
    }

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
  }, [secondsRemaining, onFinish]);

  return (
    <div className="h-full flex flex-col items-center justify-center py-6 px-4 sm:px-8 max-w-2xl mx-auto w-full text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="w-full bg-white rounded-3xl p-8 sm:p-12 shadow-card border-2 border-emerald-500/30 flex flex-col items-center relative overflow-hidden"
      >
        {/* Top Emerald Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-700" />

        {/* Animated Success Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', damping: 15 }}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 border-4 border-emerald-500 shadow-lg shadow-emerald-500/20"
        >
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Check className="w-14 h-14 sm:w-16 sm:h-16 stroke-[3]" />
          </motion.div>
        </motion.div>

        {/* Success Headings */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-primary tracking-tight">
          Terima Kasih!
        </h2>
        <p className="text-lg sm:text-xl font-bold text-emerald-700 mt-2">
          Suara Anda Berhasil Disimpan
        </p>

        <div className="my-6 py-3 px-5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-600 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Transaksi pemungutan suara telah tercatat secara sah dan terenkripsi.</span>
        </div>

        {/* Auto Return Progress & Button */}
        <div className="w-full mt-4 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
            <span>Kembali ke layar utama secara otomatis dalam</span>
            <span className="font-bold text-navy-primary bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300">
              {secondsRemaining}s
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-xs h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <motion.div
              className="h-full bg-emerald-600 rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: `${(secondsRemaining / autoReturnSeconds) * 100}%` }}
              transition={{ ease: 'linear', duration: 1 }}
            />
          </div>

          <Button
            variant="primary-navy"
            size="lg"
            onClick={onFinish}
            rightIcon={<ArrowRight className="w-5 h-5" />}
            className="mt-2 w-full max-w-xs rounded-xl"
          >
            Selesai Sekarang
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
