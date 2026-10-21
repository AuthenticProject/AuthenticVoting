import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Election, ElectionStatus } from '../types/election';
import { electionService as mockElectionService } from './electionService';

export class ElectionRepository {
  /**
   * Fetch election data
   */
  async getElection(): Promise<Election> {
    const isProduction = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.PROD);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('elections')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (error) {
          console.error('Gagal memuat pemilihan dari Supabase:', error.message);
          if (isProduction) {
            throw new Error(`Gagal memuat data pemilihan dari database produksi: ${error.message}`);
          }
          return mockElectionService.getElection();
        }

        if (data) {
          return {
            id: data.id,
            title: data.title,
            subtitle: data.subtitle || '',
            logo_url: data.logo_url || '',
            status: data.status as ElectionStatus,
            started_at: data.started_at,
            closed_at: data.closed_at,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        }
      } catch (err) {
        if (isProduction) {
          throw err;
        }
        return mockElectionService.getElection();
      }
    }

    if (isProduction) {
      throw new Error('Database Supabase wajib dikonfigurasi pada lingkungan produksi.');
    }

    return mockElectionService.getElection();
  }

  /**
   * Update election settings (permitted only while DRAFT)
   */
  async updateSettings(electionId: string, updates: Partial<Pick<Election, 'title' | 'subtitle' | 'logo_url'>>): Promise<{ success: boolean; error?: string }> {
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
          .eq('id', electionId)
          .eq('status', 'draft');

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Gagal memperbarui pengaturan.' };
      }
    }

    mockElectionService.updateElectionSettings(updates);
    return { success: true };
  }

  /**
   * Start election (transitions DRAFT -> ACTIVE via RPC)
   */
  async startElection(electionId: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('start_election', {
          p_election_id: electionId,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: (data as { success: boolean })?.success ?? true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Gagal memulai pemilihan.' };
      }
    }

    mockElectionService.startElection();
    return { success: true };
  }

  /**
   * Close election (transitions ACTIVE -> CLOSED via RPC)
   */
  async closeElection(electionId: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('close_election', {
          p_election_id: electionId,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: (data as { success: boolean })?.success ?? true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Gagal menutup pemilihan.' };
      }
    }

    mockElectionService.closeElection();
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
