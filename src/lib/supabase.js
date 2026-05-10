import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ensure we only create a single instance of the Supabase client
let supabaseInstance = null;

/**
 * Gets the singleton instance of the Supabase client.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export const getSupabase = () => {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn(
        'Supabase URL or Anon Key is missing. Supabase client may not function correctly.'
      );
    }

    supabaseInstance = createClient(supabaseUrl || '', supabaseAnonKey || '', {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return supabaseInstance;
};

export const supabase = getSupabase();
