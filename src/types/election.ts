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
}

export type KioskStep = 'welcome' | 'selection' | 'confirmation' | 'success';

export interface VoteSubmissionPayload {
  election_id: string;
  candidate_id: string;
  request_id: string;
}
