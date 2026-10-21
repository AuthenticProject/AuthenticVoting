import React, { useState, useCallback } from 'react';
import type {
  Candidate,
  Election,
  ElectionResultsSummary,
  ElectionStatus,
} from '../types/election';
import { electionService } from '../services/electionService';
import { ElectionContext } from '../hooks/useElection';

export const ElectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [election, setElection] = useState<Election>(() => electionService.getElection());
  const [candidates, setCandidates] = useState<Candidate[]>(() => electionService.getCandidates());
  const [totalVotes, setTotalVotes] = useState<number>(() => electionService.getTotalVotesCount());
  const [results, setResults] = useState<ElectionResultsSummary | null>(() => electionService.getResults());

  const refreshData = useCallback(() => {
    const currentElection = electionService.getElection();
    setElection(currentElection);
    setCandidates(electionService.getCandidates());
    setTotalVotes(electionService.getTotalVotesCount());
    setResults(electionService.getResults());
  }, []);

  const startElection = useCallback(() => {
    const updated = electionService.startElection();
    setElection(updated);
    refreshData();
  }, [refreshData]);

  const closeElection = useCallback(() => {
    const updated = electionService.closeElection();
    setElection(updated);
    refreshData();
  }, [refreshData]);

  const setElectionStatusForDev = useCallback((status: ElectionStatus) => {
    const updated = electionService.setElectionStatus(status);
    setElection(updated);
    refreshData();
  }, [refreshData]);

  const updateCandidate = useCallback((id: string, updates: Partial<Candidate>) => {
    const updatedCandidates = electionService.updateCandidate(id, updates);
    setCandidates(updatedCandidates);
    refreshData();
  }, [refreshData]);

  const updateSettings = useCallback((updates: Partial<Pick<Election, 'title' | 'subtitle' | 'logo_url'>>) => {
    const updatedElection = electionService.updateElectionSettings(updates);
    setElection(updatedElection);
    refreshData();
  }, [refreshData]);

  const recordVote = useCallback((candidateId: string, requestId: string): boolean => {
    const success = electionService.recordVote(candidateId, requestId);
    if (success) {
      refreshData();
    }
    return success;
  }, [refreshData]);

  const resetAllToDefault = useCallback(() => {
    electionService.resetToDefault();
    refreshData();
  }, [refreshData]);

  const isSettingsLocked = election.status !== 'draft';
  const isCandidatesLocked = election.status !== 'draft';

  return (
    <ElectionContext.Provider
      value={{
        election,
        candidates,
        totalVotes,
        isSettingsLocked,
        isCandidatesLocked,
        results,
        startElection,
        closeElection,
        setElectionStatusForDev,
        updateCandidate,
        updateSettings,
        recordVote,
        refreshData,
        resetAllToDefault,
      }}
    >
      {children}
    </ElectionContext.Provider>
  );
};
