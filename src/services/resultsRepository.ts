import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { ElectionResultsSummary } from '../types/election';
import { electionService as mockElectionService } from './electionService';

export class ResultsRepository {
  /**
   * Fetches total votes count for the admin overview.
   * Does NOT return per-candidate counts during active voting.
   */
  async getAdminTotalVotes(electionId: string): Promise<number> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('get_admin_total_votes', {
          p_election_id: electionId,
        });

        if (!error && data !== null && data !== undefined) {
          const remoteCount = Number(data);
          const localCount = mockElectionService.getTotalVotesCount();
          return Math.max(remoteCount, localCount);
        }
      } catch {
        // fallback
      }
    }

    return mockElectionService.getTotalVotesCount();
  }

  /**
   * Fetches full final results breakdown.
   * STRICT: Backend rejects request if election is NOT closed!
   */
  async getFinalResults(electionId: string): Promise<ElectionResultsSummary | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('get_final_results', {
          p_election_id: electionId,
        });

        if (error) {
          return mockElectionService.getResults();
        }

        return data as ElectionResultsSummary;
      } catch {
        return mockElectionService.getResults();
      }
    }

    return mockElectionService.getResults();
  }
}

export const resultsRepository = new ResultsRepository();
