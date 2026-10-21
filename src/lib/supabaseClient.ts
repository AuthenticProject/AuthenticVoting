import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe environment variable resolution across Vite and Node.js test runners
const nodeProcess = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process;

const DEFAULT_SUPABASE_URL = 'https://itaglnojqpfwqcdsxlgd.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_onqjJZAlCr5Bcg9QMckXSw_Pr9VxfnD';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  nodeProcess?.env?.VITE_SUPABASE_URL ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  nodeProcess?.env?.VITE_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey.trim() !== '' &&
  !supabaseUrl.includes('your-project-id')
);

let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Gagal menginisialisasi Supabase client:', err);
    supabaseInstance = null;
  }
}

export const supabase = supabaseInstance;
