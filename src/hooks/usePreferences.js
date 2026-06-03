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
      setPrefs(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchPrefs = async () => {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          // If preference doesn't exist yet, it will be automatically handled by the database trigger
          // on user profile creation. In case of delay, fallback to empty object.
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

    // Subscribe to real-time changes on the preference record for this user
    const channel = supabase
      .channel(`user_preferences_sync:${userId}`)
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
