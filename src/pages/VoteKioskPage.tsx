import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { KioskLayout } from '../layouts/KioskLayout';
import { WelcomeScreen } from '../components/kiosk/WelcomeScreen';
import { CandidateSelectionScreen } from '../components/kiosk/CandidateSelectionScreen';
import { ConfirmationScreen } from '../components/kiosk/ConfirmationScreen';
import { SuccessScreen } from '../components/kiosk/SuccessScreen';
import { useVoteSession } from '../hooks/useVoteSession';

export const VoteKioskPage: React.FC = () => {
  const {
    election,
    candidates,
    currentStep,
    selectedCandidate,
    isSubmitting,
    submissionError,
    startVoting,
    selectCandidate,
    proceedToConfirmation,
    backToSelection,
    resetSession,
    submitVote,
    toggleElectionStatusForTesting,
  } = useVoteSession();

  return (
    <KioskLayout
      election={election}
      currentStep={currentStep}
      onResetSession={resetSession}
      onStatusChange={toggleElectionStatusForTesting}
    >
      <AnimatePresence mode="wait">
        {currentStep === 'welcome' && (
          <motion.div
            key="step-welcome"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
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
            transition={{ duration: 0.25 }}
            className="h-full w-full flex flex-col"
          >
            <CandidateSelectionScreen
              candidates={candidates}
              selectedCandidate={selectedCandidate}
              onSelectCandidate={selectCandidate}
              onProceedToConfirmation={proceedToConfirmation}
              onCancelSession={resetSession}
            />
          </motion.div>
        )}

        {currentStep === 'confirmation' && selectedCandidate && (
          <motion.div
            key="step-confirmation"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="h-full w-full flex flex-col"
          >
            <ConfirmationScreen
              candidate={selectedCandidate}
              isSubmitting={isSubmitting}
              submissionError={submissionError}
              onConfirm={submitVote}
              onBack={backToSelection}
            />
          </motion.div>
        )}

        {currentStep === 'success' && (
          <motion.div
            key="step-success"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full flex flex-col"
          >
            <SuccessScreen
              onFinish={resetSession}
              autoReturnSeconds={5}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </KioskLayout>
  );
};
