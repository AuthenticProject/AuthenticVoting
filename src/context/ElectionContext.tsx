import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Candidate,
  Election,
  ElectionResultsSummary,
  ElectionStatus,
  AnnouncementSession,
  AllocationSummary,
} from '../types/election';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { electionRepository } from '../services/electionRepository';
import { candidateRepository } from '../services/candidateRepository';
import { resultsRepository } from '../services/resultsRepository';
import { votingService } from '../services/votingService';
import { announcementRepository } from '../services/announcementRepository';
import { announcementService } from '../services/announcementService';
import { electionService as mockElectionService } from '../services/electionService';
import { ElectionContext } from '../hooks/useElection';

export const ElectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [election, setElection] = useState<Election>(() => mockElectionService.getElection());
  const [candidates, setCandidates] = useState<Candidate[]>(() => mockElectionService.getCandidates());
  const [totalVotes, setTotalVotes] = useState<number>(() => mockElectionService.getTotalVotesCount());
  const [lastVoteTimestamp, setLastVoteTimestamp] = useState<string | null>(null);
  const [results, setResults] = useState<ElectionResultsSummary | null>(() => mockElectionService.getResults());
  const [announcementSessions, setAnnouncementSessions] = useState<AnnouncementSession[]>([]);
  const [isLiveDatabase] = useState<boolean>(isSupabaseConfigured);

  const refreshData = useCallback(async () => {
    try {
      const el = await electionRepository.getElection();
      setElection(el);

      const cands = await candidateRepository.getCandidates(el.id);
      setCandidates(cands);

      const sessions = await announcementRepository.getSessions(el.id);
      setAnnouncementSessions(sessions);

      if (el.status === 'draft') {
        setTotalVotes(0);
        setLastVoteTimestamp(null);
        const zeroRes = await resultsRepository.getLiveResults(el.id, cands, 'draft', null);
        setResults(zeroRes);
      } else {
        const votes = await resultsRepository.getAdminTotalVotes(el.id, el.status, el.started_at);
        const liveRes = await resultsRepository.getLiveResults(el.id, cands, el.status, el.started_at);
        setResults(liveRes);
        setTotalVotes(Math.max(votes, liveRes?.totalVotes || 0));
        if (liveRes && liveRes.totalVotes > 0) {
          setLastVoteTimestamp(new Date().toISOString());
        }
      }
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

        const sessions = await announcementRepository.getSessions(el.id);
        if (!active) return;
        setAnnouncementSessions(sessions);

        if (el.status === 'draft') {
          if (!active) return;
          setTotalVotes(0);
          setLastVoteTimestamp(null);
          const zeroRes = await resultsRepository.getLiveResults(el.id, cands, 'draft', null);
          setResults(zeroRes);
        } else {
          const votes = await resultsRepository.getAdminTotalVotes(el.id, el.status, el.started_at);
          const liveRes = await resultsRepository.getLiveResults(el.id, cands, el.status, el.started_at);
          if (!active) return;
          setResults(liveRes);
          setTotalVotes(Math.max(votes, liveRes?.totalVotes || 0));
          if (liveRes && liveRes.totalVotes > 0) {
            setLastVoteTimestamp(new Date().toISOString());
          }
        }
      } catch (err) {
        console.warn('Error fetching initial election data:', err);
      }
    };

    void fetchInitialData();

    // Polling fallback to guarantee instant sync across physical tablet and admin
    const pollInterval = setInterval(() => {
      if (active) {
        void fetchInitialData();
      }
    }, 1000);

    if (isSupabaseConfigured) {
      const unsubElection = electionRepository.subscribeToElectionChanges(election.id, () => {
        void fetchInitialData();
      });

      const unsubCandidates = candidateRepository.subscribeToCandidateChanges(election.id, () => {
        void fetchInitialData();
      });

      const unsubVotes = resultsRepository.subscribeToVotesChanges(() => {
        setLastVoteTimestamp(new Date().toISOString());
        void fetchInitialData();
      });

      const unsubSessions = announcementRepository.subscribeToSessionsChanges(election.id, () => {
        void fetchInitialData();
      });

      return () => {
        active = false;
        clearInterval(pollInterval);
        unsubElection();
        unsubCandidates();
        unsubVotes();
        unsubSessions();
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

  const reorderCandidates = useCallback(
    async (orderedIds: string[]) => {
      await candidateRepository.reorderCandidates(orderedIds);
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

  const addAnnouncementSession = useCallback(
    async (data: Omit<AnnouncementSession, 'id' | 'election_id' | 'created_at' | 'updated_at'>) => {
      const created = await announcementRepository.createSession(election.id, data);
      await refreshData();
      return created;
    },
    [election.id, refreshData]
  );

  const updateAnnouncementSession = useCallback(
    async (id: string, updates: Partial<AnnouncementSession>) => {
      await announcementRepository.updateSession(id, updates);
      await refreshData();
    },
    [refreshData]
  );

  const deleteAnnouncementSession = useCallback(
    async (id: string) => {
      await announcementRepository.deleteSession(id);
      await refreshData();
    },
    [refreshData]
  );

  const reorderAnnouncementSessions = useCallback(
    async (orderedIds: string[]) => {
      await announcementRepository.reorderSessions(orderedIds);
      await refreshData();
    },
    [refreshData]
  );

  const recordVote = useCallback(
    async (candidateId: string, requestId: string): Promise<{ success: boolean; message: string; error?: string }> => {
      const res = await votingService.submitVote(candidateId, requestId);
      if (res.success) {
        setLastVoteTimestamp(new Date().toISOString());
        await refreshData();
      }
      return res;
    },
    [refreshData]
  );

  const resetToDraft = useCallback(async () => {
    setTotalVotes(0);
    setLastVoteTimestamp(null);
    setResults(null);
    await electionRepository.resetToDraft(election.id);
    await refreshData();
  }, [election.id, refreshData]);

  const resetAllToDefault = useCallback(async () => {
    await resetToDraft();
  }, [resetToDraft]);

  const isSettingsLocked = election.status !== 'draft';
  const isCandidatesLocked = election.status !== 'draft';

  // Compute dynamic candidate allocation summary
  const allocationSummary: AllocationSummary = useMemo(() => {
    return announcementService.calculateAllocation(
      announcementSessions,
      candidates,
      results,
      election.status
    );
  }, [announcementSessions, candidates, results, election.status]);

  return (
    <ElectionContext.Provider
      value={{
        election,
        candidates,
        totalVotes,
        lastVoteTimestamp,
        isSettingsLocked,
        isCandidatesLocked,
        results,
        isLiveDatabase,
        announcementSessions,
        allocationSummary,
        startElection,
        closeElection,
        setElectionStatusForDev,
        updateCandidate,
        addCandidate,
        deleteCandidate,
        reorderCandidates,
        updateSettings,
        addAnnouncementSession,
        updateAnnouncementSession,
        deleteAnnouncementSession,
        reorderAnnouncementSessions,
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
