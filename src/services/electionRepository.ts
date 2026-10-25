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

          // Sinkronkan status Supabase ke state lokal agar perangkat kedua langsung mendeteksi status aktif
          const currentStatus = data.status || local.status;
          if (local.status !== currentStatus) {
            mockElectionService.setElectionStatus(currentStatus);
          }

          const resolvedTitle = data.title || local.title;
          const resolvedSubtitle = data.subtitle !== undefined && data.subtitle !== null ? data.subtitle : local.subtitle;
          const resolvedLogo = data.logo_url || local.logo_url || '/logo.png';

          return {
            id: data.id,
            title: resolvedTitle,
            subtitle: resolvedSubtitle,
            logo_url: resolvedLogo,
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
   * Update election settings
   */
  async updateSettings(electionId: string, updates: Partial<Pick<Election, 'title' | 'subtitle' | 'logo_url'>>): Promise<{ success: boolean; error?: string }> {
    mockElectionService.updateElectionSettings(updates, true);

    if (isSupabaseConfigured && supabase) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(electionId);
        const targetId = isUuid ? electionId : '00000000-0000-0000-0000-000000000001';

        const { error } = await supabase
          .from('elections')
          .update({
            title: updates.title,
            subtitle: updates.subtitle,
            logo_url: updates.logo_url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetId);

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
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(electionId);
        const targetId = isUuid ? electionId : '00000000-0000-0000-0000-000000000001';

        await supabase
          .from('elections')
          .update({
            status: 'active',
            started_at: new Date().toISOString(),
            closed_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetId);

        await supabase.rpc('start_election', {
          p_election_id: targetId,
        });
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
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(electionId);
        const targetId = isUuid ? electionId : '00000000-0000-0000-0000-000000000001';

        await supabase
          .from('elections')
          .update({
            status: 'closed',
            closed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetId);

        await supabase.rpc('close_election', {
          p_election_id: targetId,
        });
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
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(electionId);
      const targetId = isUuid ? electionId : '00000000-0000-0000-0000-000000000001';

      try {
        await supabase.rpc('reset_to_draft', { p_election_id: targetId });
      } catch {
        // ignore
      }

      try {
        // Hapus seluruh data suara di tabel votes Supabase agar kembali ke 0
        await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // Reset status pemilihan ke DRAFT dan hapus started_at/closed_at
        await supabase
          .from('elections')
          .update({
            status: 'draft',
            started_at: null,
            closed_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetId);
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
