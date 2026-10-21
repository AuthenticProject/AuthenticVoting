import type { AdminUser } from '../types/election';

export interface LoginCredentials {
  email: string;
  password?: string;
}

const STORAGE_KEY = 'evoting_admin_session';

// Mock Administrator accounts for Phase 2 Development
const MOCK_ADMIN_USER: AdminUser = {
  id: 'usr-admin-01',
  email: 'admin@pemilihan.id',
  name: 'Komisioner Utama Pemilihan',
  role: 'super_admin',
};

export class AuthService {
  /**
   * Mock login for development.
   * In Phase 3, this will be replaced with supabase.auth.signInWithPassword.
   */
  async login(credentials: LoginCredentials): Promise<{ user: AdminUser | null; error: string | null }> {
    // Artificial latency to simulate authentication request
    await new Promise((resolve) => setTimeout(resolve, 400));

    const emailTrimmed = credentials.email.trim().toLowerCase();

    // Development validation: accept valid email format and password min 6 chars
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      return { user: null, error: 'Format email tidak valid. Masukkan alamat email resmi panitia.' };
    }

    if (!credentials.password || credentials.password.length < 6) {
      return { user: null, error: 'Kata sandi minimal 6 karakter.' };
    }

    // Assign mock user session
    const sessionUser: AdminUser = {
      ...MOCK_ADMIN_USER,
      email: emailTrimmed,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    } catch {
      // localStorage may fail in restricted sandboxes
    }

    return { user: sessionUser, error: null };
  }

  /**
   * Retrieves current active session from storage
   */
  getCurrentUser(): AdminUser | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data) as AdminUser;
      }
    } catch {
      // ignore parsing error
    }
    return null;
  }

  /**
   * Logs out admin user
   */
  async logout(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

export const authService = new AuthService();
