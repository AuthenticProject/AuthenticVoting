import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { AdminUser } from '../types/election';
import { safeStorage } from '../lib/storageHelper';

export interface LoginCredentials {
  email: string;
  password?: string;
}

const STORAGE_KEY = 'evoting_admin_session';

export class AuthService {
  /**
   * Logs in using Supabase Auth (or development fallback if credentials not configured).
   * Verifies that the authenticated user is listed in public.admin_users!
   */
  async login(credentials: LoginCredentials): Promise<{ user: AdminUser | null; error: string | null }> {
    const emailTrimmed = credentials.email.trim().toLowerCase();

    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      return { user: null, error: 'Format email tidak valid. Masukkan alamat email resmi panitia.' };
    }

    if (!credentials.password || credentials.password.length < 6) {
      return { user: null, error: 'Kata sandi minimal 6 karakter.' };
    }

    // 1. Supabase Authentication
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: emailTrimmed,
          password: credentials.password,
        });

        if (authError || !authData.user) {
          return { user: null, error: authError?.message || 'Email atau kata sandi tidak sesuai.' };
        }

        // 2. Authorize against public.admin_users table (Do not grant admin to arbitrary users)
        const { data: adminRecord, error: adminCheckError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('auth_user_id', authData.user.id)
          .single();

        if (adminCheckError || !adminRecord) {
          // Sign out immediately if not authorized as an administrator
          await supabase.auth.signOut();
          return {
            user: null,
            error: 'Akun Anda tidak terdaftar dalam daftar administrator pemilihan resmi.',
          };
        }

        const adminUser: AdminUser = {
          id: adminRecord.id,
          email: authData.user.email || emailTrimmed,
          name: authData.user.user_metadata?.name || 'Komisioner Pemilihan',
          role: adminRecord.role || 'admin',
        };

        safeStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
        return { user: adminUser, error: null };
      } catch (err) {
        return {
          user: null,
          error: err instanceof Error ? err.message : 'Terjadi kendala jaringan saat menghubungi server autentikasi.',
        };
      }
    }

    // 2. Development Mock Mode (When Supabase credentials are not set in .env)
    await new Promise((resolve) => setTimeout(resolve, 300));
    const sessionUser: AdminUser = {
      id: 'usr-admin-mock',
      email: emailTrimmed,
      name: 'Komisioner Utama Pemilihan (Mode Simulasi)',
      role: 'super_admin',
    };

    safeStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    return { user: sessionUser, error: null };
  }

  /**
   * Retrieves active administrator session
   */
  getCurrentUser(): AdminUser | null {
    try {
      const data = safeStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data) as AdminUser;
      }
    } catch {
      // ignore
    }
    return null;
  }

  /**
   * Logs out the current administrator
   */
  async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }

    safeStorage.removeItem(STORAGE_KEY);
  }
}

export const authService = new AuthService();
