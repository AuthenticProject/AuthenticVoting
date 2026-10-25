import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Candidate } from '../types/election';
import { electionService as mockElectionService } from './electionService';

export class CandidateRepository {
  /**
   * Fetches all candidates for the specified election
   */
  async getCandidates(electionId: string): Promise<Candidate[]> {
    // Local candidate store contains the authoritative user-uploaded candidates and any newly added ones
    const localList = mockElectionService.getCandidates();
    if (localList && localList.length > 0) {
      return localList;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .eq('election_id', electionId)
          .order('candidate_number', { ascending: true });

        if (!error && data && data.length > 0) {
          return data as Candidate[];
        }
      } catch (err) {
        console.warn('Kendala memuat kandidat dari Supabase:', err);
      }
    }

    return mockElectionService.getCandidates();
  }

  /**
   * Adds a new candidate
   */
  async addCandidate(
    candidateData: { name: string; title_or_role?: string; vision?: string; photo_url?: string }
  ): Promise<Candidate> {
    const newCand = mockElectionService.addCandidate(candidateData);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('candidates').insert({
          id: newCand.id,
          election_id: newCand.election_id,
          candidate_number: newCand.candidate_number,
          name: newCand.name,
          title_or_role: newCand.title_or_role,
          vision: newCand.vision,
          photo_url: newCand.photo_url,
        });

        if (error) {
          console.warn('Catatan sinkronisasi Supabase tambah kandidat:', error.message);
        }
      } catch (err) {
        console.warn('Kendala tambah kandidat Supabase:', err);
      }
    }

    return newCand;
  }

  /**
   * Deletes a candidate by ID
   */
  async deleteCandidate(candidateId: string): Promise<{ success: boolean; error?: string }> {
    mockElectionService.deleteCandidate(candidateId);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('candidates').delete().eq('id', candidateId);
        if (error) {
          console.warn('Catatan sinkronisasi Supabase hapus kandidat:', error.message);
        }
      } catch (err) {
        console.warn('Kendala hapus kandidat Supabase:', err);
      }
    }

    return { success: true };
  }

  /**
   * Updates candidate information (permitted only while election is in DRAFT state)
   */
  async updateCandidate(
    candidateId: string,
    updates: Partial<Pick<Candidate, 'name' | 'title_or_role' | 'vision' | 'photo_url' | 'candidate_number'>>
  ): Promise<{ success: boolean; error?: string }> {
    // 1. Simpan selalu ke local storage terlebih dahulu agar perubahan langsung aktif
    mockElectionService.updateCandidate(candidateId, updates);

    // 2. Coba sinkronisasi ke Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const payload: Record<string, unknown> = {
          name: updates.name,
          title_or_role: updates.title_or_role,
          vision: updates.vision,
          photo_url: updates.photo_url,
          updated_at: new Date().toISOString(),
        };
        if (updates.candidate_number !== undefined) {
          payload.candidate_number = updates.candidate_number;
        }

        const { error } = await supabase
          .from('candidates')
          .update(payload)
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
   * Reorders candidates by IDs
   */
  async reorderCandidates(orderedIds: string[]): Promise<Candidate[]> {
    const updated = mockElectionService.reorderCandidates(orderedIds);

    if (isSupabaseConfigured && supabase) {
      try {
        for (let i = 0; i < orderedIds.length; i++) {
          await supabase
            .from('candidates')
            .update({ candidate_number: i + 1, updated_at: new Date().toISOString() })
            .eq('id', orderedIds[i]);
        }
      } catch (err) {
        console.warn('Kendala sinkronisasi urutan kandidat ke Supabase:', err);
      }
    }

    return updated;
  }

  /**
   * Subscribes to real-time candidate updates
   */
  subscribeToCandidateChanges(_electionId: string, onChange: () => void): () => void {
    if (!isSupabaseConfigured || !supabase) {
      return () => {};
    }

    const channel = supabase
      .channel('candidates-changes-global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidates',
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
