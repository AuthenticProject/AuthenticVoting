import { useState, useCallback } from 'react';
import type { Candidate, Election, KioskStep } from '../types/election';
import { MOCK_CANDIDATES, MOCK_ELECTION } from '../lib/mockData';

export const useVoteSession = () => {
  const [election, setElection] = useState<Election>(MOCK_ELECTION);
  const [candidates] = useState<Candidate[]>(MOCK_CANDIDATES);
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

  // Submit vote (In Phase 1: Client flow verification without requiring Supabase credentials)
  const submitVote = useCallback(async () => {
    if (!selectedCandidate || isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // Simulate network request latency to test loading UI & disable double submissions
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Successfully processed in Phase 1 client flow
      setCurrentStep('success');
    } catch {
      setSubmissionError('Terjadi kendala jaringan saat merekam suara. ID sesi tetap tersimpan untuk dicoba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedCandidate, isSubmitting]);

  // Toggle election status for QA / testing screen states
  const toggleElectionStatusForTesting = useCallback((status: Election['status']) => {
    setElection((prev) => ({
      ...prev,
      status,
      started_at: status === 'active' ? new Date().toISOString() : prev.started_at,
      closed_at: status === 'closed' ? new Date().toISOString() : null,
    }));
  }, []);

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
