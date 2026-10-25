import { useContext, createContext } from 'react';
import type {
  Candidate,
  Election,
  ElectionResultsSummary,
  ElectionStatus,
  AnnouncementSession,
  AllocationSummary,
} from '../types/election';

export interface ElectionContextType {
  election: Election;
  candidates: Candidate[];
  totalVotes: number;
  lastVoteTimestamp: string | null;
  isSettingsLocked: boolean;
  isCandidatesLocked: boolean;
  results: ElectionResultsSummary | null;
  isLiveDatabase: boolean;
  announcementSessions: AnnouncementSession[];
  allocationSummary: AllocationSummary;
  startElection: () => Promise<void>;
  closeElection: () => Promise<void>;
  setElectionStatusForDev: (status: ElectionStatus) => Promise<void>;
  updateCandidate: (id: string, updates: Partial<Candidate>) => Promise<void>;
  addCandidate: (candidate: { name: string; title_or_role?: string; vision?: string; photo_url?: string }) => Promise<void>;
  deleteCandidate: (id: string) => Promise<void>;
  reorderCandidates: (orderedIds: string[]) => Promise<void>;
  updateSettings: (updates: Partial<Pick<Election, 'title' | 'subtitle' | 'logo_url'>>) => Promise<void>;
  addAnnouncementSession: (data: Omit<AnnouncementSession, 'id' | 'election_id' | 'created_at' | 'updated_at'>) => Promise<AnnouncementSession>;
  updateAnnouncementSession: (id: string, updates: Partial<AnnouncementSession>) => Promise<void>;
  deleteAnnouncementSession: (id: string) => Promise<void>;
  reorderAnnouncementSessions: (orderedIds: string[]) => Promise<void>;
  recordVote: (candidateId: string, requestId: string) => Promise<{ success: boolean; message: string; error?: string }>;
  refreshData: () => Promise<void>;
  resetAllToDefault: () => void;
  resetToDraft: () => Promise<void>;
}

export const ElectionContext = createContext<ElectionContextType | undefined>(undefined);

export const useElection = (): ElectionContextType => {
  const context = useContext(ElectionContext);
  if (!context) {
    throw new Error('useElection must be used within an ElectionProvider');
  }
  return context;
};
