import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Candidate } from '../types/election';
import { electionService as mockElectionService } from './electionService';

export class CandidateRepository {
  /**
   * Fetches all three candidates for the specified election
   */
  async getCandidates(electionId: string): Promise<Candidate[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .eq('election_id', electionId)
          .order('candidate_number', { ascending: true });

        if (error) {
          console.warn('Gagal memuat kandidat dari Supabase, beralih ke data lokal:', error.message);
          return mockElectionService.getCandidates();
        }

        if (data && data.length > 0) {
          const localList = mockElectionService.getCandidates();
          return data.map((d) => {
            const local = localList.find((l) => l.id === d.id || l.candidate_number === d.candidate_number);
            return {
              id: d.id,
              election_id: d.election_id,
              candidate_number: d.candidate_number,
              name: local?.name ?? d.name,
              title_or_role: local?.title_or_role ?? (d.title_or_role || ''),
              vision: local?.vision ?? (d.vision || ''),
              photo_url: local?.photo_url ?? (d.photo_url || ''),
            };
          });
        }
      } catch (err) {
        console.warn('Kendala memuat kandidat dari Supabase:', err);
        return mockElectionService.getCandidates();
      }
    }

    return mockElectionService.getCandidates();
  }

  /**
   * Updates candidate information (permitted only while election is in DRAFT state)
   */
  async updateCandidate(
    candidateId: string,
    updates: Partial<Pick<Candidate, 'name' | 'title_or_role' | 'vision' | 'photo_url'>>
  ): Promise<{ success: boolean; error?: string }> {
    // 1. Simpan selalu ke local storage terlebih dahulu agar perubahan langsung aktif
    mockElectionService.updateCandidate(candidateId, updates);

    // 2. Coba sinkronisasi ke Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('candidates')
          .update({
            name: updates.name,
            title_or_role: updates.title_or_role,
            vision: updates.vision,
            photo_url: updates.photo_url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', candidateId);

        if (error) {
          console.warn('Catatan sinkronisasi Supabase kandidat:', error.message);
        }
      } catch (err) {
        console.warn('Kendala update kandidat Supabase:', err);
      }
    }

    return { success: true };
  }

  /**
   * Subscribes to real-time candidate updates
   */
  subscribeToCandidateChanges(electionId: string, onChange: () => void): () => void {
    if (!isSupabaseConfigured || !supabase) {
      return () => {};
    }

    const channel = supabase
      .channel(`candidates-${electionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidates',
          filter: `election_id=eq.${electionId}`,
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

export const candidateRepository = new CandidateRepository();
