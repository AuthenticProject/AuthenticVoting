import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Candidate, ElectionResultsSummary } from '../types/election';
import { calculateElectionResults, type RawCandidateTally } from '../lib/resultsCalculator';
import { electionService as mockElectionService } from './electionService';

export class ResultsRepository {
  /**
   * Fetches total votes count for the admin overview.
   */
  async getAdminTotalVotes(electionId: string, status?: string, startedAt?: string | null): Promise<number> {
    // Jika pemilihan berstatus DRAFT atau belum pernah dimulai, suara PASTI 0
    if (status === 'draft' || !startedAt) {
      return 0;
    }

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
   * Fetches live real-time election results breakdown for each candidate.
   * Works across active and closed states.
   */
  async getLiveResults(
    electionId: string,
    candidates: Candidate[] = [],
    status?: string,
    startedAt?: string | null
  ): Promise<ElectionResultsSummary | null> {
    // Jika pemilihan berstatus DRAFT atau belum dimulai, reset seluruh kandidat ke 0 suara
    if (status === 'draft' || !startedAt) {
      const zeroTallies: RawCandidateTally[] = candidates.map((cand) => ({
        candidate: cand,
        voteCount: 0,
      }));
      return calculateElectionResults(zeroTallies, 0);
    }

    // 1. Coba panggil RPC get_live_results dari Supabase jika tersedia
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('get_live_results', {
          p_election_id: electionId,
        });

        if (!error && data) {
          const raw = data as {
            total_votes: number;
            candidates: Array<{
              id: string;
              candidate_number: number;
              name: string;
              title_or_role?: string;
              vision?: string;
              photo_url?: string;
              vote_count: number;
              percentage: number;
            }>;
            winners: Array<{ id: string }>;
            is_tie: boolean;
          };

          const tallies: RawCandidateTally[] = raw.candidates.map((rc) => {
            const matched = candidates.find((c) => c.id === rc.id || c.candidate_number === rc.candidate_number);
            return {
              candidate: matched || {
                id: rc.id,
                election_id: electionId,
                candidate_number: rc.candidate_number,
                name: rc.name,
                title_or_role: rc.title_or_role || '',
                vision: rc.vision || '',
                photo_url: rc.photo_url || '',
              },
              voteCount: Number(rc.vote_count || 0),
            };
          });

          return calculateElectionResults(tallies, Number(raw.total_votes || 0));
        }
      } catch {
        // Lanjut ke fallback di bawah
      }

      // 2. Coba baca langsung dari tabel votes jika izin SELECT sudah dibuka (hanya yang masuk setelah startedAt)
      try {
        let voteQuery = supabase
          .from('votes')
          .select('candidate_id')
          .eq('election_id', electionId);

        if (startedAt) {
          voteQuery = voteQuery.gte('created_at', startedAt);
        }

        const { data: voteRows, error: vError } = await voteQuery;

        if (!vError && voteRows) {
          const counts: Record<string, number> = {};
          for (const row of voteRows) {
            counts[row.candidate_id] = (counts[row.candidate_id] || 0) + 1;
          }

          const tallies: RawCandidateTally[] = candidates.map((cand) => {
            let voteCount = counts[cand.id] || 0;
            const uuid1 = `00000000-0000-0000-0000-00000000001${cand.candidate_number}`;
            const uuid2 = `00000000-0000-0000-0000-00000000000${cand.candidate_number}`;
            if (counts[uuid1]) voteCount += counts[uuid1];
            if (counts[uuid2]) voteCount += counts[uuid2];

            return {
              candidate: cand,
              voteCount,
            };
          });

          return calculateElectionResults(tallies, voteRows.length);
        }
      } catch {
        // Lanjut ke fallback lokal
      }
    }

    // 3. Fallback: gunakan kalkulasi lokal
    return mockElectionService.getResults();
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

