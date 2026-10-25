import type {
  Candidate,
  Election,
  ElectionResultsSummary,
} from '../types/election';
import { MOCK_CANDIDATES, MOCK_ELECTION } from '../lib/mockData';
import { safeStorage } from '../lib/storageHelper';
import { calculateElectionResults } from '../lib/resultsCalculator';

const ELECTION_KEY = 'evoting_election_data';
const CANDIDATES_KEY = 'evoting_candidates_data';
const VOTES_TALLY_KEY = 'evoting_votes_tally';
const PROCESSED_REQUESTS_KEY = 'evoting_processed_requests';

interface VotesTally {
  total: number;
  byCandidate: Record<string, number>;
}

export class ElectionService {
  private getStoredElection(): Election {
    try {
      const data = safeStorage.getItem(ELECTION_KEY);
      if (data) {
        const election = JSON.parse(data);
        let changed = false;
        if (election.title === 'PEMILIHAN JENDRAL & DEWAN KEHORMATAN') {
          election.title = 'Pemilihan jendral 5102';
          election.subtitle = 'Pondok Modern Darussalam Gontor';
          changed = true;
        }
        if (!election.logo_url || election.logo_url === '/assets/logo-garuda.svg') {
          election.logo_url = '/logo.png';
          changed = true;
        }
        if (changed) {
          this.saveElection(election);
        }
        return election;
      }
    } catch {
      // fallback
    }
    return MOCK_ELECTION;
  }

  private saveElection(election: Election): void {
    try {
      safeStorage.setItem(ELECTION_KEY, JSON.stringify(election));
    } catch {
      // fallback
    }
  }

  private getStoredCandidates(): Candidate[] {
    try {
      const data = safeStorage.getItem(CANDIDATES_KEY);
      if (data) {
        const parsed: Candidate[] = JSON.parse(data);
        // Automatically purge obsolete military dummy mock candidates if detected
        const hasLegacyDummy = parsed.some(
          (c) =>
            c.name.includes('Bambang Soedirman') ||
            c.name.includes('Joko Hartono') ||
            c.name.includes('Hendra Gunawan')
        );
        if (hasLegacyDummy) {
          this.saveCandidates(MOCK_CANDIDATES);
          return MOCK_CANDIDATES;
        }
        return parsed;
      }
    } catch {
      // fallback
    }
    return MOCK_CANDIDATES;
  }

  public saveCandidates(candidates: Candidate[]): void {
    try {
      safeStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates));
    } catch {
      // fallback
    }
  }

  private getStoredTally(): VotesTally {
    try {
      const data = safeStorage.getItem(VOTES_TALLY_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // If tally contains old dummy baseline (28 votes for cand-01, or total 68/69), reset to pure 0
        if (
          parsed.byCandidate?.['cand-01'] === 28 ||
          parsed.total === 68 ||
          parsed.total === 69
        ) {
          const cleanTally: VotesTally = { total: 0, byCandidate: {} };
          this.saveTally(cleanTally);
          return cleanTally;
        }
        return parsed;
      }
    } catch {
      // fallback
    }
    return {
      total: 0,
      byCandidate: {},
    };
  }

  public saveTally(tally: VotesTally): void {
    try {
      safeStorage.setItem(VOTES_TALLY_KEY, JSON.stringify(tally));
    } catch {
      // fallback
    }
  }

  getElection(): Election {
    return this.getStoredElection();
  }

  updateElectionSettings(updates: Partial<Pick<Election, 'title' | 'subtitle' | 'logo_url'>>): Election {
    const current = this.getStoredElection();
    if (current.status !== 'draft') {
      throw new Error('Pengaturan pemilihan hanya dapat diubah saat status DRAFT (sebelum voting dimulai).');
    }
    const updated: Election = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveElection(updated);
    return updated;
  }

  startElection(): Election {
    const current = this.getStoredElection();
    if (current.status !== 'draft') {
      throw new Error('Pemilihan hanya dapat dimulai dari status DRAFT.');
    }
    const updated: Election = {
      ...current,
      status: 'active',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.saveElection(updated);
    return updated;
  }

  closeElection(): Election {
    const current = this.getStoredElection();
    if (current.status !== 'active') {
      throw new Error('Hanya pemilihan berstatus AKTIF yang dapat ditutup.');
    }
    const updated: Election = {
      ...current,
      status: 'closed',
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.saveElection(updated);
    return updated;
  }

  /**
   * For QA/testing convenience in Phase 2 & 3
   */
  setElectionStatus(status: Election['status']): Election {
    const current = this.getStoredElection();
    const updated: Election = {
      ...current,
      status,
      started_at: status === 'active' || status === 'closed' ? current.started_at || new Date().toISOString() : null,
      closed_at: status === 'closed' ? current.closed_at || new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    this.saveElection(updated);
    return updated;
  }

  getCandidates(): Candidate[] {
    return this.getStoredCandidates();
  }

  addCandidate(candidateData: {
    name: string;
    title_or_role?: string;
    vision?: string;
    photo_url?: string;
  }): Candidate {
    const election = this.getStoredElection();
    if (election.status !== 'draft') {
      throw new Error('Data kandidat terkunci. Penambahan kandidat hanya diperbolehkan saat status DRAFT (sebelum pemilihan dimulai).');
    }

    const currentList = this.getStoredCandidates();
    const nextNumber =
      currentList.length > 0
        ? Math.max(...currentList.map((c) => c.candidate_number)) + 1
        : 1;

    const newCandidate: Candidate = {
      id: `cand-${Date.now()}`,
      election_id: election.id,
      candidate_number: nextNumber,
      name: candidateData.name.trim(),
      title_or_role: (candidateData.title_or_role || '').trim(),
      vision: (candidateData.vision || '').trim(),
      photo_url: candidateData.photo_url || '',
    };

    const updatedList = [...currentList, newCandidate];
    this.saveCandidates(updatedList);
    return newCandidate;
  }

  deleteCandidate(id: string): Candidate[] {
    const election = this.getStoredElection();
    if (election.status !== 'draft') {
      throw new Error('Data kandidat terkunci. Penghapusan kandidat hanya diperbolehkan saat status DRAFT.');
    }

    const currentList = this.getStoredCandidates();
    if (currentList.length <= 1) {
      throw new Error('Minimal harus ada 1 kandidat dalam pemilihan.');
    }

    const remaining = currentList.filter(
      (c) =>
        c.id !== id &&
        c.candidate_number !== Number(id) &&
        !id.endsWith(`1${c.candidate_number}`)
    );

    // Re-index candidate numbers sequentially (1, 2, 3...)
    const reindexed = remaining.map((c, index) => ({
      ...c,
      candidate_number: index + 1,
    }));

    this.saveCandidates(reindexed);
    return reindexed;
  }

  updateCandidate(id: string, updates: Partial<Pick<Candidate, 'name' | 'title_or_role' | 'photo_url' | 'vision'>>): Candidate[] {
    const election = this.getStoredElection();
    if (election.status !== 'draft') {
      throw new Error('Data kandidat terkunci. Perubahan hanya diperbolehkan sebelum pemilihan dimulai.');
    }

    const currentList = this.getStoredCandidates();
    const updatedList = currentList.map((c) => {
      // Cocokkan berdasarkan ID persis, atau nomor urut kandidat jika ID berupa UUID Supabase
      const match =
        c.id === id ||
        c.candidate_number === Number(id) ||
        (id.endsWith('11') && c.candidate_number === 1) ||
        (id.endsWith('12') && c.candidate_number === 2) ||
        (id.endsWith('13') && c.candidate_number === 3);

      return match ? { ...c, ...updates } : c;
    });
    this.saveCandidates(updatedList);
    return updatedList;
  }

  reorderCandidates(candidateIds: string[]): Candidate[] {
    const election = this.getStoredElection();
    if (election.status !== 'draft') {
      throw new Error('Data kandidat terkunci. Pengurutan hanya diperbolehkan saat status DRAFT.');
    }

    const currentList = this.getStoredCandidates();
    const ordered: Candidate[] = [];

    candidateIds.forEach((id, index) => {
      const found = currentList.find((c) => c.id === id);
      if (found) {
        ordered.push({
          ...found,
          candidate_number: index + 1,
        });
      }
    });

    // Add any remaining candidates not in candidateIds
    currentList.forEach((c) => {
      if (!ordered.some((oc) => oc.id === c.id)) {
        ordered.push({
          ...c,
          candidate_number: ordered.length + 1,
        });
      }
    });

    this.saveCandidates(ordered);
    return ordered;
  }

  getTotalVotesCount(): number {
    return this.getStoredTally().total;
  }

  /**
   * Checks if a request_id has already been processed.
   */
  isRequestProcessed(requestId: string): boolean {
    try {
      const stored = safeStorage.getItem(PROCESSED_REQUESTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.includes(requestId);
        } else if (typeof parsed === 'object' && parsed !== null) {
          return Boolean(parsed[requestId]);
        }
      }
    } catch {
      return false;
    }
    return false;
  }

  /**
   * Records a vote from the kiosk.
   * Enforces request_id idempotency.
   */
  recordVote(candidateId: string, requestId: string): boolean {
    const election = this.getStoredElection();
    if (election.status !== 'active') {
      throw new Error('Voting sedang tidak aktif atau telah ditutup.');
    }

    // Check request_id uniqueness & candidate consistency
    let processedMap: Record<string, string> = {};
    try {
      const stored = safeStorage.getItem(PROCESSED_REQUESTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((id) => {
            processedMap[id] = candidateId;
          });
        } else if (typeof parsed === 'object' && parsed !== null) {
          processedMap = parsed;
        }
      }
    } catch {
      processedMap = {};
    }

    if (processedMap[requestId]) {
      if (processedMap[requestId] === candidateId) {
        // Idempotent: already recorded for this exact candidate, do not duplicate
        return true;
      }
      // Reused request ID with a different candidate must be rejected
      throw new Error('ID Request telah digunakan untuk kandidat berbeda.');
    }

    // Increment tally
    const tally = this.getStoredTally();
    tally.total += 1;
    tally.byCandidate[candidateId] = (tally.byCandidate[candidateId] || 0) + 1;
    this.saveTally(tally);

    // Mark requestId as processed
    processedMap[requestId] = candidateId;
    try {
      safeStorage.setItem(PROCESSED_REQUESTS_KEY, JSON.stringify(processedMap));
    } catch {
      // ignore
    }

    return true;
  }

  /**
   * Final Results Calculation.
   * STRICT: Returns null if election is NOT closed!
   */
  getResults(): ElectionResultsSummary | null {
    const election = this.getStoredElection();
    if (election.status !== 'closed') {
      return null;
    }

    const candidates = this.getStoredCandidates();
    const tally = this.getStoredTally();
    const totalVotes = tally.total;

    const rawTallies = candidates.map((cand) => ({
      candidate: cand,
      voteCount: tally.byCandidate[cand.id] || 0,
    }));

    return calculateElectionResults(
      rawTallies,
      totalVotes,
      election.closed_at ?? null,
      election.started_at ?? null,
      election.title
    );
  }

  /**
   * Reset election status to DRAFT.
   * Clears votes tally and processed requests,
   * but PRESERVES all uploaded/saved candidates.
   */
  resetToDraft(): Election {
    const current = this.getStoredElection();
    const updated: Election = {
      ...current,
      status: 'draft',
      started_at: null,
      closed_at: null,
      updated_at: new Date().toISOString(),
    };
    this.saveElection(updated);
    // Clear votes tally and processed requests completely
    safeStorage.removeItem(VOTES_TALLY_KEY);
    safeStorage.removeItem(PROCESSED_REQUESTS_KEY);
    // DO NOT clear CANDIDATES_KEY!
    return updated;
  }

  /**
   * Reset mock data back to defaults (for QA / testing convenience).
   * Safely preserves user-uploaded candidates.
   */
  resetToDefault(): void {
    this.resetToDraft();
  }
}

export const electionService = new ElectionService();
