import { useMemo } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Custom hook providing access to the global Supabase client instance.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function useSupabase() {
  return useMemo(() => supabase, []);
}
