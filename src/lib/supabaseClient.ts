import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe environment variable resolution across Vite and Node.js test runners
const nodeProcess = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process;
const env =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : (nodeProcess?.env ?? {});

const supabaseUrl = (env as Record<string, string | undefined>).VITE_SUPABASE_URL;
const supabaseAnonKey = (env as Record<string, string | undefined>).VITE_SUPABASE_ANON_KEY;

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
