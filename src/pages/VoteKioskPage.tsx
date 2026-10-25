import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { KioskLayout } from '../layouts/KioskLayout';
import { WelcomeScreen } from '../components/kiosk/WelcomeScreen';
import { CandidateSelectionScreen } from '../components/kiosk/CandidateSelectionScreen';
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
    submitCandidateVote,
    retryVote,
    nextVoter,
    resetSession,
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
            transition={{ duration: 0.15 }}
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
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.15 }}
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
            transition={{ duration: 0.15 }}
            className="h-full w-full flex flex-col"
          >
            <SuccessScreen
              onFinish={nextVoter}
              autoReturnSeconds={0.8}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </KioskLayout>
  );
};
