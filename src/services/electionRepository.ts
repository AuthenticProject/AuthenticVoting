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

          // Sinkronkan status Supabase ke state lokal agar perangkat kedua langsung mendeteksi status aktif
          const currentStatus = data.status || local.status;
          if (local.status !== currentStatus) {
            mockElectionService.setElectionStatus(currentStatus);
          }

          return {
            id: data.id,
            title: isLegacySupabaseTitle ? local.title : (local.title || data.title),
            subtitle: isLegacySupabaseTitle ? local.subtitle : (local.subtitle ?? (data.subtitle || '')),
            logo_url: local.logo_url || (data.logo_url || '/logo.png'),
            status: currentStatus,
            started_at: data.started_at || local.started_at,
            closed_at: data.closed_at || local.closed_at,
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
   * Start election (transitions DRAFT -> ACTIVE via RPC & direct update for multi-device sync)
   */
  async startElection(electionId: string): Promise<{ success: boolean; error?: string }> {
    mockElectionService.startElection();

    if (isSupabaseConfigured && supabase) {
      try {
        // Update langsung ke tabel elections agar semua perangkat realtime membaca 'active'
        await supabase
          .from('elections')
          .update({
            status: 'active',
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', electionId);

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
   * Close election (transitions ACTIVE -> CLOSED via RPC & direct update)
   */
  async closeElection(electionId: string): Promise<{ success: boolean; error?: string }> {
    mockElectionService.closeElection();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('elections')
          .update({
            status: 'closed',
            closed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', electionId);

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
   * Reset election to DRAFT
   */
  async resetToDraft(electionId: string): Promise<{ success: boolean; error?: string }> {
    // 1. Reset storage & tally lokal ke 0
    mockElectionService.resetToDraft();

    if (isSupabaseConfigured && supabase) {
      try {
        // 2. Coba panggil RPC reset_to_draft Supabase (menghapus votes & update election ke draft)
        await supabase.rpc('reset_to_draft', { p_election_id: electionId });
      } catch (err) {
        console.warn('Kendala RPC reset_to_draft Supabase:', err);
      }

      try {
        // 3. Hapus seluruh data suara di tabel votes di Supabase agar kembali ke 0
        await supabase.from('votes').delete().eq('election_id', electionId);

        // 4. Reset status pemilihan ke DRAFT dan hapus started_at/closed_at
        await supabase
          .from('elections')
          .update({
            status: 'draft',
            started_at: null,
            closed_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', electionId);
      } catch (err) {
        console.warn('Kendala resetToDraft Supabase:', err);
      }
    }

    return { success: true };
  }

  /**
   * Subscribes to real-time status changes
   */
  subscribeToElectionChanges(_electionId: string, onChange: (election: Partial<Election>) => void): () => void {
    if (!isSupabaseConfigured || !supabase) {
      return () => {};
    }

    const channel = supabase
      .channel('election-changes-global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'elections',
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
