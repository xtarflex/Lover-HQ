/**
 * @file useAuthSync.js
 * @description Custom hook that owns the full Supabase authentication lifecycle.
 * Hydrates user/partner state from localStorage cache for instant offline loads,
 * fetches the live profile from the DB on session start, subscribes to real-time
 * profile changes (for pairing/unpairing), and syncs all state into AppContext.
 */

import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppDispatch } from '../contexts/AppContext';

/**
 * Manages the full auth synchronisation lifecycle as a side-effect hook.
 * Must be called inside a component that is a descendant of AppContext.
 *
 * Responsibilities:
 * - Immediately hydrates Redux-like AppContext state from `localStorage` cache.
 * - Calls `supabase.auth.getSession()` for the initial session on mount.
 * - Listens for `onAuthStateChange` events for the lifetime of the component.
 * - On each valid session, fetches the user profile + partner from the `users` table.
 * - Sets up a Postgres real-time channel on the user's own row to detect live
 *   pairing/unpairing changes.
 * - Dispatches `SET_USER`, `SET_PARTNER`, `SET_PAIRING_STATUS`, and `RESET_STATE`
 *   actions to AppContext.
 *
 * @returns {void}
 */
export function useAuthSync() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let profileSubscription = null;
    let currentAuthUser = null;

    /**
     * Hydrates AppContext from values previously written to `localStorage`.
     * Called synchronously on mount so the UI is never blank on a cold load.
     *
     * @returns {void}
     */
    const hydrateFromCache = () => {
      try {
        const cachedUser = localStorage.getItem('lover_hq_user');
        const cachedPartner = localStorage.getItem('lover_hq_partner');
        const cachedPairingStatus = localStorage.getItem('lover_hq_pairing_status');

        if (cachedUser) {
          dispatch({ type: 'SET_USER', payload: JSON.parse(cachedUser) });
          dispatch({ type: 'SET_AUTH_LOADING', payload: false });
        }
        if (cachedPartner) {
          dispatch({ type: 'SET_PARTNER', payload: JSON.parse(cachedPartner) });
        }
        if (cachedPairingStatus) {
          dispatch({ type: 'SET_PAIRING_STATUS', payload: cachedPairingStatus });
        }
      } catch (e) {
        console.error('Failed to parse cached auth state:', e);
      }
    };

    /**
     * Fetches user profile data, determines pairing status, and sets up real-time listener.
     *
     * @param {object} authUser - The authenticated user object from Supabase Auth.
     * @returns {Promise<void>}
     */
    const fetchProfile = async (authUser) => {
      currentAuthUser = authUser;

      // Setup real-time subscription for profile updates (to detect unpairing/pairing in real-time).
      // Done synchronously at the start of fetchProfile to prevent concurrent race-condition subscriptions.
      if (authUser?.id && !profileSubscription) {
        const uniqueId = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
        const channel = supabase.channel(`public:users:id=eq.${authUser.id}_${uniqueId}`);
        profileSubscription = channel;
        channel
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'users',
              filter: `id=eq.${authUser.id}`,
            },
            () => {
              if (currentAuthUser) {
                fetchProfile(currentAuthUser);
              }
            }
          )
          .subscribe();
      }

      try {
        // Clear cached partner and pairing status if switching users
        const cachedUserStr = localStorage.getItem('lover_hq_user');
        if (cachedUserStr) {
          const cachedUser = JSON.parse(cachedUserStr);
          if (cachedUser && cachedUser.id !== authUser.id) {
            localStorage.removeItem('lover_hq_partner');
            localStorage.removeItem('lover_hq_pairing_status');
            dispatch({ type: 'SET_PARTNER', payload: null });
            dispatch({ type: 'SET_PAIRING_STATUS', payload: 'unpaired' });
          }
        }

        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
            return;
          }
          // If PGRST116 (new user profile not created/found yet), still set user so they can onboard
          const mergedUser = { ...authUser, onboarding_completed: false };
          dispatch({ type: 'SET_USER', payload: mergedUser });
          return;
        }

        let mergedUser = { ...authUser, ...(profile || {}) };

        // Auto-mark onboarding as completed if a partner is linked in the DB
        if (profile?.partner_id && !profile.onboarding_completed) {
          await supabase.from('users').update({ onboarding_completed: true }).eq('id', authUser.id);
          mergedUser.onboarding_completed = true;
        }

        dispatch({ type: 'SET_USER', payload: mergedUser });
        localStorage.setItem('lover_hq_user', JSON.stringify(mergedUser));

        // Determine pairing status
        if (profile?.partner_id) {
          dispatch({ type: 'SET_PAIRING_STATUS', payload: 'paired' });
          localStorage.setItem('lover_hq_pairing_status', 'paired');

          // Fetch partner data
          const { data: partner } = await supabase
            .from('users')
            .select('*')
            .eq('id', profile.partner_id)
            .single();
          if (partner) {
            dispatch({ type: 'SET_PARTNER', payload: partner });
            localStorage.setItem('lover_hq_partner', JSON.stringify(partner));
          }
        } else {
          dispatch({ type: 'SET_PARTNER', payload: null });
          localStorage.removeItem('lover_hq_partner');

          if (profile?.pairing_code) {
            dispatch({ type: 'SET_PAIRING_STATUS', payload: 'pending' });
            localStorage.setItem('lover_hq_pairing_status', 'pending');
          } else {
            dispatch({ type: 'SET_PAIRING_STATUS', payload: 'unpaired' });
            localStorage.setItem('lover_hq_pairing_status', 'unpaired');
          }
        }
      } catch (err) {
        console.error('Profile sync failed:', err);
      } finally {
        dispatch({ type: 'SET_AUTH_LOADING', payload: false });
      }
    };

    // 1. Immediately hydrate from cache for seamless offline / cold-start UX
    hydrateFromCache();

    // 2. Initial session check
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          fetchProfile(session.user);
        } else {
          // If online and no active session, clear stale cached credentials
          if (navigator.onLine) {
            localStorage.removeItem('lover_hq_user');
            localStorage.removeItem('lover_hq_partner');
            localStorage.removeItem('lover_hq_pairing_status');
            dispatch({ type: 'RESET_STATE' });
          }
          dispatch({ type: 'SET_AUTH_LOADING', payload: false });
        }
      })
      .catch((err) => {
        console.error('Session retrieval failed:', err);
        dispatch({ type: 'SET_AUTH_LOADING', payload: false });
      });

    // 3. Ongoing auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        if (profileSubscription) {
          supabase.removeChannel(profileSubscription);
          profileSubscription = null;
        }
        // If offline, do not clear user state (likely a token-refresh network failure)
        if (!navigator.onLine && localStorage.getItem('lover_hq_user')) {
          console.warn('Offline: ignoring session expiration auth event');
          hydrateFromCache();
          return;
        }
        localStorage.removeItem('lover_hq_user');
        localStorage.removeItem('lover_hq_partner');
        localStorage.removeItem('lover_hq_pairing_status');
        dispatch({ type: 'RESET_STATE' });
      }
    });

    return () => {
      subscription.unsubscribe();
      if (profileSubscription) {
        supabase.removeChannel(profileSubscription);
      }
    };
  }, [dispatch]);
}
