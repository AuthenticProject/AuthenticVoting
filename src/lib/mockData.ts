import type { Candidate, Election } from '../types/election';
import savedCandidates from './saved_candidates.json';

export const MOCK_ELECTION: Election = {
  id: 'el-mubes-2026',
  title: 'Pemilihan jendral 5102',
  subtitle: 'Pondok Modern Darussalam Gontor',
  logo_url: '/logo.png',
  status: 'draft',
  started_at: null,
  closed_at: null,
  created_at: '2026-10-20T00:00:00Z',
  updated_at: '2026-10-20T00:00:00Z',
};

export const MOCK_CANDIDATES: Candidate[] = (savedCandidates as Candidate[]).map((c, idx) => ({
  id: c.id || `cand-0${idx + 1}`,
  election_id: 'el-mubes-2026',
  candidate_number: c.candidate_number || idx + 1,
  name: c.name,
  title_or_role: c.title_or_role || '',
  vision: c.vision || '',
  photo_url: c.photo_url || '',
}));
