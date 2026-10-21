import type {
  Candidate,
  Election,
  ElectionResultsSummary,
  CandidateResult,
} from '../types/election';
import { MOCK_CANDIDATES, MOCK_ELECTION } from '../lib/mockData';

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
      const data = localStorage.getItem(ELECTION_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return MOCK_ELECTION;
  }

  private saveElection(election: Election): void {
    try {
      localStorage.setItem(ELECTION_KEY, JSON.stringify(election));
    } catch {
      // fallback
    }
  }

  private getStoredCandidates(): Candidate[] {
    try {
      const data = localStorage.getItem(CANDIDATES_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return MOCK_CANDIDATES;
  }

  private saveCandidates(candidates: Candidate[]): void {
    try {
      localStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates));
    } catch {
      // fallback
    }
  }

  private getStoredTally(): VotesTally {
    try {
      const data = localStorage.getItem(VOTES_TALLY_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    // Default initial mock tally with plausible baseline for dev demo
    return {
      total: 68,
      byCandidate: {
        'cand-01': 28,
        'cand-02': 24,
        'cand-03': 16,
      },
    };
  }

  private saveTally(tally: VotesTally): void {
    try {
      localStorage.setItem(VOTES_TALLY_KEY, JSON.stringify(tally));
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
   * For QA/testing convenience in Phase 2
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

  updateCandidate(id: string, updates: Partial<Pick<Candidate, 'name' | 'title_or_role' | 'photo_url' | 'vision'>>): Candidate[] {
    const election = this.getStoredElection();
    if (election.status !== 'draft') {
      throw new Error('Data kandidat terkunci. Perubahan hanya diperbolehkan sebelum pemilihan dimulai.');
    }

    const currentList = this.getStoredCandidates();
    const updatedList = currentList.map((c) => (c.id === id ? { ...c, ...updates } : c));
    this.saveCandidates(updatedList);
    return updatedList;
  }

  getTotalVotesCount(): number {
    return this.getStoredTally().total;
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

    // Check request_id uniqueness
    let processed: string[] = [];
    try {
      const stored = localStorage.getItem(PROCESSED_REQUESTS_KEY);
      if (stored) processed = JSON.parse(stored);
    } catch {
      processed = [];
    }

    if (processed.includes(requestId)) {
      // Idempotent: already recorded, do not duplicate
      return true;
    }

    // Increment tally
    const tally = this.getStoredTally();
    tally.total += 1;
    tally.byCandidate[candidateId] = (tally.byCandidate[candidateId] || 0) + 1;
    this.saveTally(tally);

    // Mark requestId as processed
    processed.push(requestId);
    try {
      localStorage.setItem(PROCESSED_REQUESTS_KEY, JSON.stringify(processed));
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

    // Calculate candidate percentages & map results
    const results: CandidateResult[] = candidates.map((cand) => {
      const count = tally.byCandidate[cand.id] || 0;
      const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
      return {
        candidate: cand,
        voteCount: count,
        percentage: Number(pct.toFixed(1)),
        isWinner: false,
        isTied: false,
      };
    });

    // Determine highest vote count
    const highestVote = Math.max(...results.map((r) => r.voteCount), 0);
    const topCandidates = results.filter((r) => r.voteCount === highestVote && highestVote > 0);

    const isTie = topCandidates.length > 1;

    results.forEach((r) => {
      if (r.voteCount === highestVote && highestVote > 0) {
        if (isTie) {
          r.isTied = true;
        } else {
          r.isWinner = true;
        }
      }
    });

    return {
      totalVotes,
      candidateResults: results,
      isTie,
      winners: topCandidates.map((r) => r.candidate),
      closedAt: election.closed_at ?? null,
    };
  }

  /**
   * Reset mock data back to defaults (for QA / testing convenience)
   */
  resetToDefault(): void {
    localStorage.removeItem(ELECTION_KEY);
    localStorage.removeItem(CANDIDATES_KEY);
    localStorage.removeItem(VOTES_TALLY_KEY);
    localStorage.removeItem(PROCESSED_REQUESTS_KEY);
  }
}

export const electionService = new ElectionService();
