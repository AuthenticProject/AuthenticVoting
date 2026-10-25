import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { AnnouncementSession } from '../types/election';
import { safeStorage } from '../lib/storageHelper';

const ANNOUNCEMENT_SESSIONS_STORAGE_KEY = 'evoting_announcement_sessions';

export const DEFAULT_ANNOUNCEMENT_SESSIONS: AnnouncementSession[] = [
  {
    id: 'session-01',
    election_id: 'el-mubes-2026',
    name: 'Pengumuman Jenderal 5102',
    description: 'Sesi pengumuman kandidat peraih suara tertinggi',
    display_order: 1,
    selection_method: 'highest_votes',
    candidate_limit: 3,
    exclusive_grouping: true,
    show_vote_counts: true,
    show_percentages: true,
    presentation_theme: 'gold',
    announcement_status: 'draft',
    tie_policy: 'expand',
    manual_candidate_ids: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'session-02',
    election_id: 'el-mubes-2026',
    name: 'Pengumuman Acara Kedua',
    description: 'Sesi pengumuman kandidat kelompok peringkat berikutnya',
    display_order: 2,
    selection_method: 'next_ranking_group',
    candidate_limit: 3,
    exclusive_grouping: true,
    show_vote_counts: true,
    show_percentages: true,
    presentation_theme: 'gold',
    announcement_status: 'draft',
    tie_policy: 'expand',
    manual_candidate_ids: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export class AnnouncementRepository {
  private getLocalSessions(): AnnouncementSession[] {
    try {
      const data = safeStorage.getItem(ANNOUNCEMENT_SESSIONS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    this.saveLocalSessions(DEFAULT_ANNOUNCEMENT_SESSIONS);
    return DEFAULT_ANNOUNCEMENT_SESSIONS;
  }

  private saveLocalSessions(sessions: AnnouncementSession[]): void {
    try {
      safeStorage.setItem(ANNOUNCEMENT_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // fallback
    }
  }

  async getSessions(electionId: string): Promise<AnnouncementSession[]> {
    // 1. Try Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('announcement_sessions')
          .select('*')
          .eq('election_id', electionId)
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          const sessions = data.map((item) => ({
            id: item.id,
            election_id: item.election_id,
            name: item.name,
            description: item.description || '',
            display_order: item.display_order,
            selection_method: item.selection_method,
            candidate_limit: item.candidate_limit,
            exclusive_grouping: item.exclusive_grouping ?? true,
            show_vote_counts: item.show_vote_counts ?? true,
            show_percentages: item.show_percentages ?? true,
            presentation_theme: item.presentation_theme || 'gold',
            announcement_status: item.announcement_status || 'draft',
            tie_policy: item.tie_policy || 'expand',
            manual_candidate_ids: item.manual_candidate_ids || [],
            created_at: item.created_at,
            updated_at: item.updated_at,
          })) as AnnouncementSession[];

          this.saveLocalSessions(sessions);
          return sessions;
        }
      } catch (err) {
        console.warn('Kendala memuat sesi pengumuman dari Supabase:', err);
      }
    }

    // 2. Local fallback
    return this.getLocalSessions();
  }

  async getSessionById(sessionId: string): Promise<AnnouncementSession | null> {
    const sessions = await this.getSessions('el-mubes-2026');
    const matched = sessions.find((s) => s.id === sessionId);
    if (matched) return matched;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('announcement_sessions')
          .select('*')
          .eq('id', sessionId)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            election_id: data.election_id,
            name: data.name,
            description: data.description || '',
            display_order: data.display_order,
            selection_method: data.selection_method,
            candidate_limit: data.candidate_limit,
            exclusive_grouping: data.exclusive_grouping ?? true,
            show_vote_counts: data.show_vote_counts ?? true,
            show_percentages: data.show_percentages ?? true,
            presentation_theme: data.presentation_theme || 'gold',
            announcement_status: data.announcement_status || 'draft',
            tie_policy: data.tie_policy || 'expand',
            manual_candidate_ids: data.manual_candidate_ids || [],
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        }
      } catch {
        // fallback
      }
    }

    return null;
  }

  async createSession(
    electionId: string,
    data: Omit<AnnouncementSession, 'id' | 'election_id' | 'created_at' | 'updated_at'>
  ): Promise<AnnouncementSession> {
    const current = this.getLocalSessions();
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sess-${Date.now()}`;
    const nextOrder = current.length > 0 ? Math.max(...current.map((s) => s.display_order)) + 1 : 1;

    const newSession: AnnouncementSession = {
      id: newId,
      election_id: electionId,
      name: data.name,
      description: data.description || '',
      display_order: data.display_order || nextOrder,
      selection_method: data.selection_method,
      candidate_limit: Number(data.candidate_limit) || 3,
      exclusive_grouping: data.exclusive_grouping ?? true,
      show_vote_counts: data.show_vote_counts ?? true,
      show_percentages: data.show_percentages ?? true,
      presentation_theme: data.presentation_theme || 'gold',
      announcement_status: data.announcement_status || 'draft',
      tie_policy: data.tie_policy || 'expand',
      manual_candidate_ids: data.manual_candidate_ids || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [...current, newSession];
    this.saveLocalSessions(updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('announcement_sessions').insert({
          id: newSession.id,
          election_id: newSession.election_id,
          name: newSession.name,
          description: newSession.description,
          display_order: newSession.display_order,
          selection_method: newSession.selection_method,
          candidate_limit: newSession.candidate_limit,
          exclusive_grouping: newSession.exclusive_grouping,
          show_vote_counts: newSession.show_vote_counts,
          show_percentages: newSession.show_percentages,
          presentation_theme: newSession.presentation_theme,
          announcement_status: newSession.announcement_status,
          tie_policy: newSession.tie_policy,
          manual_candidate_ids: newSession.manual_candidate_ids,
        });
      } catch (err) {
        console.warn('Kendala sinkronisasi buat sesi ke Supabase:', err);
      }
    }

    return newSession;
  }

  async updateSession(
    sessionId: string,
    updates: Partial<AnnouncementSession>
  ): Promise<{ success: boolean; session?: AnnouncementSession; error?: string }> {
    const current = this.getLocalSessions();
    const idx = current.findIndex((s) => s.id === sessionId);
    if (idx === -1) {
      return { success: false, error: 'Sesi acara tidak ditemukan' };
    }

    const updatedSession: AnnouncementSession = {
      ...current[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    current[idx] = updatedSession;
    this.saveLocalSessions(current);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('announcement_sessions')
          .update({
            name: updatedSession.name,
            description: updatedSession.description,
            display_order: updatedSession.display_order,
            selection_method: updatedSession.selection_method,
            candidate_limit: updatedSession.candidate_limit,
            exclusive_grouping: updatedSession.exclusive_grouping,
            show_vote_counts: updatedSession.show_vote_counts,
            show_percentages: updatedSession.show_percentages,
            presentation_theme: updatedSession.presentation_theme,
            announcement_status: updatedSession.announcement_status,
            tie_policy: updatedSession.tie_policy,
            manual_candidate_ids: updatedSession.manual_candidate_ids,
            updated_at: updatedSession.updated_at,
          })
          .eq('id', sessionId);
      } catch (err) {
        console.warn('Kendala sinkronisasi perbarui sesi ke Supabase:', err);
      }
    }

    return { success: true, session: updatedSession };
  }

  async deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    const current = this.getLocalSessions();
    const filtered = current.filter((s) => s.id !== sessionId);
    this.saveLocalSessions(filtered);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('announcement_sessions').delete().eq('id', sessionId);
      } catch (err) {
        console.warn('Kendala sinkronisasi hapus sesi ke Supabase:', err);
      }
    }

    return { success: true };
  }

  async reorderSessions(orderedIds: string[]): Promise<void> {
    const current = this.getLocalSessions();
    const reordered: AnnouncementSession[] = [];
    orderedIds.forEach((id, index) => {
      const found = current.find((s) => s.id === id);
      if (found) {
        reordered.push({ ...found, display_order: index + 1, updated_at: new Date().toISOString() });
      }
    });

    this.saveLocalSessions(reordered);

    if (isSupabaseConfigured && supabase) {
      try {
        for (const item of reordered) {
          await supabase
            .from('announcement_sessions')
            .update({ display_order: item.display_order, updated_at: item.updated_at })
            .eq('id', item.id);
        }
      } catch (err) {
        console.warn('Kendala sinkronisasi urutan sesi ke Supabase:', err);
      }
    }
  }

  subscribeToSessionsChanges(_electionId: string, onChange: () => void): () => void {
    if (!isSupabaseConfigured || !supabase) {
      return () => {};
    }

    const channel = supabase
      .channel('announcement-sessions-global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcement_sessions',
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

export const announcementRepository = new AnnouncementRepository();
