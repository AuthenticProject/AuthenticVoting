import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Candidate, ElectionResultsSummary } from '../types/election';
import { calculateElectionResults, type RawCandidateTally } from '../lib/resultsCalculator';
import { electionService as mockElectionService } from './electionService';

export class ResultsRepository {
  /**
   * Fetches total votes count for the admin overview.
   */
  async getAdminTotalVotes(electionId: string, status?: string, startedAt?: string | null): Promise<number> {
    if (status === 'draft' || !startedAt) {
      return 0;
    }

    const localCount = mockElectionService.getTotalVotesCount();
    let remoteCount = 0;

    if (isSupabaseConfigured && supabase) {
      try {
        const targetElectionId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(electionId)
          ? electionId
          : '00000000-0000-0000-0000-000000000001';

        const { data, error } = await supabase.rpc('get_admin_total_votes', {
          p_election_id: targetElectionId,
        });

        if (!error && data !== null && data !== undefined) {
          remoteCount = Number(data);
        } else {
          // Fallback direct count from votes table
          const { count } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('election_id', targetElectionId);
          if (count !== null && count !== undefined) {
            remoteCount = count;
          }
        }
      } catch {
        // fallback
      }
    }

    return Math.max(remoteCount, localCount);
  }

  /**
   * Fetches live real-time election results breakdown for each candidate.
   * Works across active and closed states.
   */
  async getLiveResults(
    electionId: string,
    candidates: Candidate[] = [],
    status?: string,
    startedAt?: string | null
  ): Promise<ElectionResultsSummary | null> {
    if (status === 'draft' || !startedAt) {
      const zeroTallies: RawCandidateTally[] = candidates.map((cand) => ({
        candidate: cand,
        voteCount: 0,
      }));
      return calculateElectionResults(zeroTallies, 0);
    }

    const localRes = mockElectionService.getLiveResults();
    const candidateCounts: Record<number, number> = {};

    // Seed with local tallies
    if (localRes?.candidateResults) {
      for (const cr of localRes.candidateResults) {
        candidateCounts[cr.candidate.candidate_number] = cr.voteCount;
      }
    }

    // Overlay Supabase tallies if available
    if (isSupabaseConfigured && supabase) {
      try {
        const targetElectionId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(electionId)
          ? electionId
          : '00000000-0000-0000-0000-000000000001';

        // 1. Try RPC get_live_results
        const { data, error } = await supabase.rpc('get_live_results', {
          p_election_id: targetElectionId,
        });

        if (!error && data && Array.isArray((data as { candidates?: Array<{ candidate_number: number; vote_count: number }> }).candidates)) {
          const raw = data as { candidates: Array<{ candidate_number: number; vote_count: number }> };
          for (const c of raw.candidates) {
            candidateCounts[c.candidate_number] = Math.max(
              candidateCounts[c.candidate_number] || 0,
              Number(c.vote_count || 0)
            );
          }
        } else {
          // 2. Direct count from votes table
          const { data: voteRows } = await supabase
            .from('votes')
            .select('candidate_id')
            .eq('election_id', targetElectionId);

          if (voteRows && voteRows.length > 0) {
            const countsByCandidateId: Record<string, number> = {};
            for (const r of voteRows) {
              countsByCandidateId[r.candidate_id] = (countsByCandidateId[r.candidate_id] || 0) + 1;
            }

            for (const cand of candidates) {
              const num = cand.candidate_number;
              const uuid1 = `00000000-0000-0000-0000-00000000001${num}`;
              const uuid2 = `00000000-0000-0000-0000-00000000000${num}`;
              const cnt = (countsByCandidateId[cand.id] || 0) + (countsByCandidateId[uuid1] || 0) + (countsByCandidateId[uuid2] || 0);
              candidateCounts[num] = Math.max(candidateCounts[num] || 0, cnt);
            }
          }
        }
      } catch (err) {
        console.warn('Gagal membaca hasil live dari Supabase, menggunakan lokal:', err);
      }
    }

    const tallies: RawCandidateTally[] = candidates.map((cand) => ({
      candidate: cand,
      voteCount: candidateCounts[cand.candidate_number] || 0,
    }));

    const totalVotes = tallies.reduce((sum, t) => sum + t.voteCount, 0);
    return calculateElectionResults(tallies, totalVotes);
  }

  /**
   * Fetches full final results breakdown.
   * Strictly returns null if election is not closed!
   */
  async getFinalResults(electionId: string, candidates: Candidate[] = []): Promise<ElectionResultsSummary | null> {
    const el = mockElectionService.getElection();
    if (el.status !== 'closed') {
      return null;
    }
    return this.getLiveResults(electionId, candidates, 'closed', el.started_at);
  }

  /**
   * Realtime subscription for incoming votes
   */
  subscribeToVotesChanges(onChange: () => void): () => void {
    if (!isSupabaseConfigured || !supabase) {
      return () => {};
    }

    const channel = supabase
      .channel('votes-realtime-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
        },
        () => {
          onChange();
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }
}

export const resultsRepository = new ResultsRepository();

