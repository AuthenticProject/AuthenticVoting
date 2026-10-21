import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { kioskSessionService } from './kioskSessionService';
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
    const kioskToken = kioskSessionService.getKioskToken();

    // 1. Live Supabase Backend Submission
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('submit_vote', {
          p_candidate_id: candidateId,
          p_request_id: requestId,
          p_kiosk_token: kioskToken || null,
        });

        if (error) {
          return {
            success: false,
            message: error.message || 'Gagal menyimpan suara ke server database.',
            error: error.message,
          };
        }

        const res = data as { success: boolean; message: string; idempotent?: boolean };
        return {
          success: res.success,
          message: res.message,
          idempotent: Boolean(res.idempotent),
        };
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : 'Terjadi kendala jaringan saat mengirimkan suara.',
          error: String(err),
        };
      }
    }

    // 2. Local Fallback Mode (When Supabase credentials are not yet set in .env)
    try {
      mockElectionService.recordVote(candidateId, requestId);
      return {
        success: true,
        message: 'Suara berhasil disimpan (Mode Simulasi Pengembang).',
        idempotent: false,
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Gagal menyimpan suara pada mode lokal.',
        error: String(err),
      };
    }
  }
}

export const votingService = new VotingService();
