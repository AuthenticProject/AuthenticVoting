import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Election } from '../types/election';
import { electionService as mockElectionService } from './electionService';

export class ElectionRepository {
  /**
   * Fetch election data
   */
  async getElection(): Promise<Election> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('elections')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (error) {
          console.warn('Gagal memuat pemilihan dari Supabase, beralih ke data lokal:', error.message);
          return mockElectionService.getElection();
        }

        if (data) {
          const local = mockElectionService.getElection();
          const isLegacySupabaseTitle = data.title === 'PEMILIHAN JENDRAL & DEWAN KEHORMATAN';
          return {
            id: data.id,
            title: isLegacySupabaseTitle ? local.title : (local.title || data.title),
            subtitle: isLegacySupabaseTitle ? local.subtitle : (local.subtitle ?? (data.subtitle || '')),
            logo_url: local.logo_url ?? (data.logo_url || ''),
            status: local.status,
            started_at: local.started_at,
            closed_at: local.closed_at,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        }
      } catch (err) {
        console.warn('Kendala koneksi Supabase, menggunakan data lokal:', err);
        return mockElectionService.getElection();
      }
    }

    return mockElectionService.getElection();
  }

  /**
   * Update election settings (permitted only while DRAFT)
   */
  async updateSettings(electionId: string, updates: Partial<Pick<Election, 'title' | 'subtitle' | 'logo_url'>>): Promise<{ success: boolean; error?: string }> {
    mockElectionService.updateElectionSettings(updates);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('elections')
          .update({
            title: updates.title,
            subtitle: updates.subtitle,
            logo_url: updates.logo_url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', electionId);

        if (error) {
          console.warn('Catatan sinkronisasi pengaturan Supabase:', error.message);
        }
      } catch (err) {
        console.warn('Kendala sinkronisasi pengaturan Supabase:', err);
      }
    }

    return { success: true };
  }

  /**
   * Start election (transitions DRAFT -> ACTIVE via RPC)
   */
  async startElection(electionId: string): Promise<{ success: boolean; error?: string }> {
    mockElectionService.startElection();

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.rpc('start_election', {
          p_election_id: electionId,
        });

        if (error) {
          console.warn('Catatan start_election Supabase:', error.message);
        }
      } catch (err) {
        console.warn('Kendala start_election Supabase:', err);
      }
    }

    return { success: true };
  }

  /**
   * Close election (transitions ACTIVE -> CLOSED via RPC)
   */
  async closeElection(electionId: string): Promise<{ success: boolean; error?: string }> {
    mockElectionService.closeElection();

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.rpc('close_election', {
          p_election_id: electionId,
        });

        if (error) {
          console.warn('Catatan close_election Supabase:', error.message);
        }
      } catch (err) {
        console.warn('Kendala close_election Supabase:', err);
      }
    }

    return { success: true };
  }

  /**
   * Subscribes to real-time status changes
   */
  subscribeToElectionChanges(electionId: string, onChange: (election: Partial<Election>) => void): () => void {
    if (!isSupabaseConfigured || !supabase) {
      return () => {};
    }

    const channel = supabase
      .channel(`election-${electionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'elections',
          filter: `id=eq.${electionId}`,
        },
        (payload) => {
          if (payload.new) {
            onChange(payload.new as Partial<Election>);
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }
}

export const electionRepository = new ElectionRepository();
