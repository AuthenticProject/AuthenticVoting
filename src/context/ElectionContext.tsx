import React, { useState, useEffect, useCallback } from 'react';
import type {
  Candidate,
  Election,
  ElectionResultsSummary,
  ElectionStatus,
} from '../types/election';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { electionRepository } from '../services/electionRepository';
import { candidateRepository } from '../services/candidateRepository';
import { resultsRepository } from '../services/resultsRepository';
import { votingService } from '../services/votingService';
import { electionService as mockElectionService } from '../services/electionService';
import { ElectionContext } from '../hooks/useElection';

export const ElectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [election, setElection] = useState<Election>(() => mockElectionService.getElection());
  const [candidates, setCandidates] = useState<Candidate[]>(() => mockElectionService.getCandidates());
  const [totalVotes, setTotalVotes] = useState<number>(() => mockElectionService.getTotalVotesCount());
  const [results, setResults] = useState<ElectionResultsSummary | null>(() => mockElectionService.getResults());
  const [isLiveDatabase] = useState<boolean>(isSupabaseConfigured);

  const refreshData = useCallback(async () => {
    try {
      const el = await electionRepository.getElection();
      setElection(el);

      const cands = await candidateRepository.getCandidates(el.id);
      setCandidates(cands);

      const votes = await resultsRepository.getAdminTotalVotes(el.id);
      const liveRes = await resultsRepository.getLiveResults(el.id, cands);
      setResults(liveRes);
      setTotalVotes(Math.max(votes, liveRes?.totalVotes || 0));
    } catch (err) {
      console.warn('Error refreshing election data:', err);
    }
  }, []);

  // Initial load and Realtime synchronization setup
  useEffect(() => {
    let active = true;

    const fetchInitialData = async () => {
      try {
        const el = await electionRepository.getElection();
        if (!active) return;
        setElection(el);

        const cands = await candidateRepository.getCandidates(el.id);
        if (!active) return;
        setCandidates(cands);

        const votes = await resultsRepository.getAdminTotalVotes(el.id);
        const liveRes = await resultsRepository.getLiveResults(el.id, cands);
        if (!active) return;
        setResults(liveRes);
        setTotalVotes(Math.max(votes, liveRes?.totalVotes || 0));
      } catch (err) {
        console.warn('Error fetching initial election data:', err);
      }
    };

    void fetchInitialData();

    // Polling fallback to guarantee instant sync across multiple devices (mobile/desktop)
    const pollInterval = setInterval(() => {
      if (active) {
        void fetchInitialData();
      }
    }, 2000);

    if (isSupabaseConfigured) {
      const unsubElection = electionRepository.subscribeToElectionChanges(election.id, () => {
        void fetchInitialData();
      });

      const unsubCandidates = candidateRepository.subscribeToCandidateChanges(election.id, () => {
        void fetchInitialData();
      });

      const unsubVotes = resultsRepository.subscribeToVotesChanges(() => {
        void fetchInitialData();
      });

      return () => {
        active = false;
        clearInterval(pollInterval);
        unsubElection();
        unsubCandidates();
        unsubVotes();
      };
    }

    return () => {
      active = false;
      clearInterval(pollInterval);
    };
  }, [election.id]);

  const startElection = useCallback(async () => {
    await electionRepository.startElection(election.id);
    await refreshData();
  }, [election.id, refreshData]);

  const closeElection = useCallback(async () => {
    await electionRepository.closeElection(election.id);
    await refreshData();
  }, [election.id, refreshData]);

  const setElectionStatusForDev = useCallback(async (status: ElectionStatus) => {
    mockElectionService.setElectionStatus(status);
    await refreshData();
  }, [refreshData]);

  const addCandidate = useCallback(
    async (candidateData: { name: string; title_or_role?: string; vision?: string; photo_url?: string }) => {
      await candidateRepository.addCandidate(candidateData);
      await refreshData();
    },
    [refreshData]
  );

  const deleteCandidate = useCallback(
    async (id: string) => {
      await candidateRepository.deleteCandidate(id);
      await refreshData();
    },
    [refreshData]
  );

  const updateCandidate = useCallback(
    async (id: string, updates: Partial<Candidate>) => {
      await candidateRepository.updateCandidate(id, updates);
      await refreshData();
    },
    [refreshData]
  );

  const updateSettings = useCallback(
    async (updates: Partial<Pick<Election, 'title' | 'subtitle' | 'logo_url'>>) => {
      await electionRepository.updateSettings(election.id, updates);
      await refreshData();
    },
    [election.id, refreshData]
  );

  const recordVote = useCallback(
    async (candidateId: string, requestId: string): Promise<{ success: boolean; message: string; error?: string }> => {
      const res = await votingService.submitVote(candidateId, requestId);
      if (res.success) {
        await refreshData();
      }
      return res;
    },
    [refreshData]
  );

  const resetToDraft = useCallback(async () => {
    await electionRepository.resetToDraft(election.id);
    await refreshData();
  }, [election.id, refreshData]);

  const resetAllToDefault = useCallback(async () => {
    await electionRepository.resetToDraft(election.id);
    await refreshData();
  }, [election.id, refreshData]);

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
        isLiveDatabase,
        startElection,
        closeElection,
        setElectionStatusForDev,
        updateCandidate,
        addCandidate,
        deleteCandidate,
        updateSettings,
        recordVote,
        refreshData,
        resetAllToDefault,
        resetToDraft,
      }}
    >
      {children}
    </ElectionContext.Provider>
  );
};
