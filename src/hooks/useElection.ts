import { useContext, createContext } from 'react';
import type {
  Candidate,
  Election,
  ElectionResultsSummary,
  ElectionStatus,
} from '../types/election';

export interface ElectionContextType {
  election: Election;
  candidates: Candidate[];
  totalVotes: number;
  isSettingsLocked: boolean;
  isCandidatesLocked: boolean;
  results: ElectionResultsSummary | null;
  startElection: () => void;
  closeElection: () => void;
  setElectionStatusForDev: (status: ElectionStatus) => void;
  updateCandidate: (id: string, updates: Partial<Candidate>) => void;
  updateSettings: (updates: Partial<Pick<Election, 'title' | 'subtitle' | 'logo_url'>>) => void;
  recordVote: (candidateId: string, requestId: string) => boolean;
  refreshData: () => void;
  resetAllToDefault: () => void;
}

export const ElectionContext = createContext<ElectionContextType | undefined>(undefined);

export const useElection = (): ElectionContextType => {
  const context = useContext(ElectionContext);
  if (!context) {
    throw new Error('useElection must be used within an ElectionProvider');
  }
  return context;
};
