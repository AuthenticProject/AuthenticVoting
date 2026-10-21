import { useState, useCallback } from 'react';
import type { Candidate, Election, KioskStep } from '../types/election';
import { useElection } from './useElection';

export const useVoteSession = () => {
  const {
    election,
    candidates,
    recordVote,
    setElectionStatusForDev,
  } = useElection();

  const [currentStep, setCurrentStep] = useState<KioskStep>('welcome');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [requestId, setRequestId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Generate unique request UUID for voting interaction idempotency
  const generateRequestId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  // Start new voting interaction from Welcome Screen
  const startVoting = useCallback(() => {
    setSelectedCandidate(null);
    setSubmissionError(null);
    setIsSubmitting(false);
    setRequestId(generateRequestId());
    setCurrentStep('selection');
  }, []);

  // Candidate selection
  const selectCandidate = useCallback((candidate: Candidate) => {
    setSelectedCandidate(candidate);
  }, []);

  // Move from selection to confirmation
  const proceedToConfirmation = useCallback(() => {
    if (!selectedCandidate) return;
    setSubmissionError(null);
    setCurrentStep('confirmation');
  }, [selectedCandidate]);

  // Go back from confirmation to selection
  const backToSelection = useCallback(() => {
    if (isSubmitting) return;
    setSubmissionError(null);
    setCurrentStep('selection');
  }, [isSubmitting]);

  // Reset or cancel session back to welcome screen
  const resetSession = useCallback(() => {
    setSelectedCandidate(null);
    setRequestId('');
    setIsSubmitting(false);
    setSubmissionError(null);
    setCurrentStep('welcome');
  }, []);

  // Submit vote with double-submission protection and requestId idempotency
  const submitVote = useCallback(async () => {
    if (!selectedCandidate || isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // Simulate network request latency to test loading UI & disable double submissions
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Record vote via shared election service
      recordVote(selectedCandidate.id, requestId);

      // Successfully processed in voting flow
      setCurrentStep('success');
    } catch {
      setSubmissionError('Terjadi kendala saat merekam suara. ID sesi tetap tersimpan untuk dicoba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedCandidate, isSubmitting, recordVote, requestId]);

  // Toggle election status for QA / testing screen states
  const toggleElectionStatusForTesting = useCallback((status: Election['status']) => {
    setElectionStatusForDev(status);
  }, [setElectionStatusForDev]);

  return {
    election,
    candidates,
    currentStep,
    selectedCandidate,
    requestId,
    isSubmitting,
    submissionError,
    startVoting,
    selectCandidate,
    proceedToConfirmation,
    backToSelection,
    resetSession,
    submitVote,
    toggleElectionStatusForTesting,
  };
};
