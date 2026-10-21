import type { Candidate, Election } from '../types/election';

export const MOCK_ELECTION: Election = {
  id: 'el-mubes-2026',
  title: 'PEMILIHAN JENDRAL & DEWAN KEHORMATAN',
  subtitle: 'Musyawarah Akbar Nasional Periode 2026 – 2031',
  logo_url: '/assets/logo-garuda.svg',
  status: 'active',
  started_at: '2026-10-21T08:00:00Z',
  closed_at: null,
  created_at: '2026-10-20T00:00:00Z',
  updated_at: '2026-10-21T08:00:00Z',
};

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 'cand-01',
    election_id: 'el-mubes-2026',
    candidate_number: 1,
    name: 'Letjen (Purn.) Dr. Bambang Soedirman, M.Si',
    title_or_role: 'Calon Jendral Kehormatan',
    vision: 'Integritas, Pengabdian Berkelanjutan, dan Ketegasan Moral.',
    // High quality professional portrait
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=600&h=750&q=80',
  },
  {
    id: 'cand-02',
    election_id: 'el-mubes-2026',
    candidate_number: 2,
    name: 'Marsdya (Purn.) Ir. H. Joko Hartono, M.Sc',
    title_or_role: 'Calon Jendral Kehormatan',
    vision: 'Modernisasi Transformasi Institusi, Soliditas, dan Transparansi.',
    // High quality professional portrait
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?fit=crop&w=600&h=750&q=80',
  },
  {
    id: 'cand-03',
    election_id: 'el-mubes-2026',
    candidate_number: 3,
    name: 'Mayjen (Purn.) Prof. Dr. Hendra Gunawan, S.E., M.M.',
    title_or_role: 'Calon Jendral Kehormatan',
    vision: 'Kesejahteraan Anggota, Kepemimpinan Kolektif, dan Martabat Bangsa.',
    // High quality professional portrait
    photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?fit=crop&w=600&h=750&q=80',
  },
];
