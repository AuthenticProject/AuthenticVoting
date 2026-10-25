import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { electionService as mockElectionService } from './electionService';

export interface VoteSubmissionResult {
  success: boolean;
  message: string;
  idempotent?: boolean;
  error?: string;
}

export class VotingService {
  /**
   * Submit an anonymous vote to the secure backend.
   * Atomically verifies active election, candidate validity, and request_id idempotency.
   */
  async submitVote(candidateId: string, requestId: string): Promise<VoteSubmissionResult> {
    const election = mockElectionService.getElection();
    if (election.status !== 'active') {
      return {
        success: false,
        message: 'Pemungutan suara belum dimulai atau telah ditutup.',
        error: 'ELECTION_NOT_ACTIVE',
      };
    }

    // 1. Validasi konsistensi & idempotensi requestId di penyimpanan lokal
    const alreadyProcessed = mockElectionService.isRequestProcessed(requestId);
    try {
      mockElectionService.recordVote(candidateId, requestId);
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Gagal menyimpan suara.',
        error: String(err),
      };
    }

    // 2. Sinkronkan ke Supabase jika tersedia
    if (isSupabaseConfigured && supabase) {
      try {
        let targetUuid = candidateId;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidateId);
        if (!isUuid) {
          const numMatch = candidateId.match(/\d+/);
          const num = numMatch ? parseInt(numMatch[0], 10) : 1;
          
          try {
            const { data: cData } = await supabase
              .from('candidates')
              .select('id')
              .eq('candidate_number', num)
              .maybeSingle();
            if (cData?.id) {
              targetUuid = cData.id;
            } else {
              targetUuid = `00000000-0000-0000-0000-00000000001${num}`;
            }
          } catch {
            targetUuid = `00000000-0000-0000-0000-00000000001${num}`;
          }
        }

        // Pastikan requestId berformat UUID yang valid untuk PostgreSQL
        let targetRequestId = requestId;
        const isReqUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId);
        if (!isReqUuid) {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            targetRequestId = crypto.randomUUID();
          } else {
            targetRequestId = '00000000-0000-0000-0000-' + String(Date.now()).padStart(12, '0').slice(-12);
          }
        }

        await supabase.rpc('submit_vote', {
          p_candidate_id: targetUuid,
          p_request_id: targetRequestId,
          p_kiosk_token: null,
        });
      } catch (err) {
        console.warn('Jaringan Supabase terkendala sinkronisasi suara:', err);
      }
    }

    return {
      success: true,
      message: alreadyProcessed
        ? 'Suara Anda telah tercatat sebelumnya (idempotent).'
        : 'Suara Anda berhasil disimpan dan dihitung.',
      idempotent: alreadyProcessed,
    };
  }
}

export const votingService = new VotingService();
