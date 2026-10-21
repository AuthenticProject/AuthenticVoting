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

        if (error || !data || data.length === 0) {
          console.warn('Gagal memuat kandidat dari Supabase:', error?.message);
          return mockElectionService.getCandidates();
        }

        return data.map((d) => ({
          id: d.id,
          election_id: d.election_id,
          candidate_number: d.candidate_number,
          name: d.name,
          title_or_role: d.title_or_role || '',
          vision: d.vision || '',
          photo_url: d.photo_url || '',
        }));
      } catch {
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
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Gagal memperbarui kandidat.' };
      }
    }

    mockElectionService.updateCandidate(candidateId, updates);
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
