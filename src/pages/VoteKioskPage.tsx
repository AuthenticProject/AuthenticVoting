import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tablet, KeyRound, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { KioskLayout } from '../layouts/KioskLayout';
import { WelcomeScreen } from '../components/kiosk/WelcomeScreen';
import { CandidateSelectionScreen } from '../components/kiosk/CandidateSelectionScreen';
import { SuccessScreen } from '../components/kiosk/SuccessScreen';
import { useVoteSession } from '../hooks/useVoteSession';
import { Button } from '../components/common/Button';

export const VoteKioskPage: React.FC = () => {
  const {
    election,
    candidates,
    currentStep,
    selectedCandidate,
    isSubmitting,
    submissionError,
    isTabletAuthorized,
    authorizeTablet,
    startVoting,
    submitCandidateVote,
    retryVote,
    nextVoter,
    resetSession,
    toggleElectionStatusForTesting,
  } = useVoteSession();

  const [authPin, setAuthPin] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPin.trim()) {
      setAuthError('Silakan masukkan PIN otorisasi administrator.');
      return;
    }
    const res = authorizeTablet(authPin);
    if (!res.success) {
      setAuthError(res.message);
    } else {
      setAuthError(null);
    }
  };

  return (
    <KioskLayout
      election={election}
      currentStep={currentStep}
      onResetSession={resetSession}
      onStatusChange={toggleElectionStatusForTesting}
    >
      {/* Tablet Authorization Gate */}
      {!isTabletAuthorized ? (
        <div className="h-full flex flex-col items-center justify-center p-4 sm:p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-navy-primary/10 text-navy-primary flex items-center justify-center mx-auto mb-4 border border-navy-primary/20">
              <Tablet className="w-8 h-8 text-navy-primary" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Otorisasi Tablet Diperlukan</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-navy-primary mb-2">
              Bilik Suara Belum Diotorisasi
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mb-6 leading-relaxed">
              Sebelum digunakan oleh para pemilih, perangkat tablet fisik ini harus diotorisasi secara resmi oleh Panitia Administrator.
            </p>

            <form onSubmit={handleAuthorize} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  PIN Otorisasi Administrator
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={authPin}
                    onChange={(e) => {
                      setAuthPin(e.target.value);
                      setAuthError(null);
                    }}
                    placeholder="Masukkan PIN (Default: 5102)"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-navy-primary font-bold focus:outline-none focus:ring-2 focus:ring-gold-accent focus:bg-white text-sm"
                  />
                </div>
                {authError && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authError}</span>
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary-gold"
                fullWidth
                size="lg"
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="font-extrabold shadow-md"
              >
                Otorisasi Tablet Ini
              </Button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              Otorisasi cukup dilakukan satu kali untuk seluruh rangkaian pemungutan suara pada tablet ini.
            </div>
          </motion.div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {currentStep === 'welcome' && (
            <motion.div
              key="step-welcome"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full flex flex-col"
            >
              <WelcomeScreen
                election={election}
                onStartVoting={startVoting}
              />
            </motion.div>
          )}

          {currentStep === 'selection' && (
            <motion.div
              key="step-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full flex flex-col"
            >
              <CandidateSelectionScreen
                candidates={candidates}
                selectedCandidate={selectedCandidate}
                isSubmitting={isSubmitting}
                submissionError={submissionError}
                onSelectCandidate={submitCandidateVote}
                onRetry={retryVote}
                onCancelSession={resetSession}
              />
            </motion.div>
          )}

          {currentStep === 'success' && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full flex flex-col"
            >
              <SuccessScreen
                onFinish={nextVoter}
                autoReturnSeconds={2}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </KioskLayout>
  );
};
