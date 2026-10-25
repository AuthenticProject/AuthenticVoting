export type ElectionStatus = 'draft' | 'active' | 'closed';

export interface Election {
  id: string;
  title: string;
  subtitle: string;
  logo_url?: string;
  status: ElectionStatus;
  started_at?: string | null;
  closed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Candidate {
  id: string;
  election_id: string;
  candidate_number: number;
  name: string;
  title_or_role?: string;
  photo_url: string;
  vision?: string;
  created_at?: string;
  updated_at?: string;
}

export type KioskStep = 'welcome' | 'selection' | 'success';

export interface VoteSubmissionPayload {
  election_id: string;
  candidate_id: string;
  request_id: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'election_officer';
}

export interface CandidateResult {
  candidate: Candidate;
  voteCount: number;
  percentage: number;
  isWinner: boolean;
  isTied: boolean;
  rank?: number;
}

export interface ElectionResultsSummary {
  totalVotes: number;
  candidateResults: CandidateResult[];
  isTie: boolean;
  isZeroVotes: boolean;
  winners: Candidate[];
  closedAt: string | null;
  startedAt?: string | null;
  electionTitle?: string;
  calculatedAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

// ==========================================
// ANNOUNCEMENT SESSIONS & GROUP ALLOCATION TYPES
// ==========================================

export type AnnouncementSelectionMethod = 
  | 'highest_votes' 
  | 'lowest_votes' 
  | 'next_ranking_group' 
  | 'manual';

export type AnnouncementStatus = 'draft' | 'ready' | 'published';

export type TiePolicy = 'expand' | 'manual' | 'strict';

export interface AnnouncementSession {
  id: string;
  election_id: string;
  name: string;
  description?: string;
  display_order: number;
  selection_method: AnnouncementSelectionMethod;
  candidate_limit: number;
  exclusive_grouping: boolean;
  show_vote_counts: boolean;
  show_percentages: boolean;
  presentation_theme?: string;
  announcement_status: AnnouncementStatus;
  tie_policy: TiePolicy;
  manual_candidate_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AnnouncementSessionCandidate {
  id: string;
  session_id: string;
  candidate_id: string;
  display_order: number;
  assignment_type: 'auto' | 'manual';
  candidate?: Candidate;
}

export interface GroupCandidateAllocation {
  session: AnnouncementSession;
  candidates: Array<CandidateResult & { rank: number; isTieAtBoundary?: boolean }>;
  isTieAtBoundary: boolean;
  tiedCandidates: CandidateResult[];
}

export interface AllocationSummary {
  totalCandidates: number;
  totalEvents: number;
  allocatedCandidatesCount: number;
  unallocatedCandidates: Candidate[];
  duplicateAssignments: Array<{ candidate: Candidate; eventNames: string[] }>;
  isValidPartition: boolean;
  validationErrors: string[];
  groups: GroupCandidateAllocation[];
}

export interface KioskSessionInfo {
  token: string;
  deviceName: string;
  isAuthorized: boolean;
  pairedAt?: string;
  lastActiveAt?: string;
}
