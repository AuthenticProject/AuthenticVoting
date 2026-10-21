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

  // Direct candidate submission from Selection Screen (No confirmation screen)
  const submitCandidateVote = useCallback(async (candidate: Candidate) => {
    if (isSubmitting) return;

    // If there is an unresolved submission error, prevent switching candidates
    if (submissionError && selectedCandidate && selectedCandidate.id !== candidate.id) {
      return;
    }

    setSelectedCandidate(candidate);
    setIsSubmitting(true);
    setSubmissionError(null);

    // Reuse existing requestId or create a fresh one if somehow missing
    const currentRequestId = requestId || generateRequestId();
    if (!requestId) {
      setRequestId(currentRequestId);
    }

    try {
      // Minimal visual feedback latency
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await recordVote(candidate.id, currentRequestId);

      if (result.success) {
        // Vote recorded successfully -> advance to Screen 3 (Success)
        setCurrentStep('success');
      } else {
        setSubmissionError(result.message || 'Gagal mencatat suara ke database. Sesi tetap tersimpan, silakan tekan Coba Lagi.');
      }
    } catch {
      setSubmissionError('Terjadi kendala saat merekam suara. ID sesi tetap tersimpan untuk dicoba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, submissionError, selectedCandidate, requestId, recordVote]);

  // Safe retry function reusing the exact same requestId and candidate
  const retryVote = useCallback(async () => {
    if (!selectedCandidate || isSubmitting) return;
    await submitCandidateVote(selectedCandidate);
  }, [selectedCandidate, isSubmitting, submitCandidateVote]);

  // Reset session for next voter in queue: keeps the kiosk on candidate selection screen
  const nextVoter = useCallback(() => {
    setSelectedCandidate(null);
    setRequestId(generateRequestId());
    setIsSubmitting(false);
    setSubmissionError(null);
    setCurrentStep('selection');
  }, []);

  // Full reset back to welcome screen (called on manual cancel or if election closed)
  const resetSession = useCallback(() => {
    setSelectedCandidate(null);
    setRequestId('');
    setIsSubmitting(false);
    setSubmissionError(null);
    setCurrentStep('welcome');
  }, []);

  // Auto-advance to candidate selection screen when election is active
  useState(() => {
    if (election.status === 'active') {
      setSelectedCandidate(null);
      setSubmissionError(null);
      setIsSubmitting(false);
      setRequestId(generateRequestId());
      setCurrentStep('selection');
    }
  });

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
    submitCandidateVote,
    retryVote,
    nextVoter,
    resetSession,
    toggleElectionStatusForTesting,
  };
};
