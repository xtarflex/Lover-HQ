import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook to manage, update, and real-time sync user preferences on multiple devices.
 *
 * @param {string} [userId] - The authenticated user's ID.
 * @returns {{
 *   prefs: object|null,
 *   loading: boolean,
 *   updatePreference: (key: string, value: any) => Promise<void>
 * }} An object containing preference state, loading flag, and update handler.
 */
export function usePreferences(userId) {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch preferences on mount/user change
  useEffect(() => {
    if (!userId) {
      const timer = setTimeout(() => {
        setPrefs(null);
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        setLoading(true);
        const fetchPrefs = async () => {
          try {
            const { data, error } = await supabase
              .from('user_preferences')
              .select('*')
              .eq('user_id', userId)
              .single();

            if (error) {
              if (error.code === 'PGRST116') {
                setPrefs({});
              } else {
                console.error('Error fetching preferences:', error);
              }
            } else {
              setPrefs(data);
            }
          } catch (err) {
            console.error('Error in fetchPrefs:', err);
          } finally {
            setLoading(false);
          }
        };
        fetchPrefs();
      }
    }, 0);

    // Subscribe to real-time changes on the preference record for this user
    const uniqueId = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    const channel = supabase
      .channel(`user_preferences_sync:${userId}_${uniqueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_preferences',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            setPrefs(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  /**
   * Updates a specific preference key with a new value.
   *
   * @param {string} key - The preference key to update (e.g. 'theme').
   * @param {any} value - The new value for the preference.
   * @returns {Promise<void>}
   */
  const updatePreference = useCallback(
    async (key, value) => {
      if (!userId) return;

      // Optimistic state update
      setPrefs((prev) => (prev ? { ...prev, [key]: value } : { [key]: value }));

      try {
        const { error } = await supabase
          .from('user_preferences')
          .update({
            [key]: value,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) {
          throw error;
        }
      } catch (err) {
        console.error(`Failed to update preference ${key}:`, err);
        // Refresh preferences from database on failure to roll back optimistic update
        const { data } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (data) {
          setPrefs(data);
        }
      }
    },
    [userId]
  );

  return { prefs, loading, updatePreference };
}
