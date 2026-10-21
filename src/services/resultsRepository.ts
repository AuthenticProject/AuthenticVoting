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

        if (error) {
          console.warn('Gagal mengambil total suara dari Supabase RPC:', error.message);
          return 0;
        }

        return Number(data || 0);
      } catch {
        return 0;
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
          // If locked or forbidden, returns null cleanly
          return null;
        }

        return data as ElectionResultsSummary;
      } catch {
        return null;
      }
    }

    return mockElectionService.getResults();
  }
}

export const resultsRepository = new ResultsRepository();
