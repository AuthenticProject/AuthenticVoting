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
  isLiveDatabase: boolean;
  startElection: () => Promise<void>;
  closeElection: () => Promise<void>;
  setElectionStatusForDev: (status: ElectionStatus) => Promise<void>;
  updateCandidate: (id: string, updates: Partial<Candidate>) => Promise<void>;
  updateSettings: (updates: Partial<Pick<Election, 'title' | 'subtitle' | 'logo_url'>>) => Promise<void>;
  recordVote: (candidateId: string, requestId: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
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
