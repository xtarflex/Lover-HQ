import { useEffect, useRef } from 'react';
import { useSupabase } from './useSupabase';

/**
 * Hook to manage a Realtime subscription with automatic cleanup.
 *
 * @param {string} channelName
 * @param {Object} options
 * @param {string} options.event
 * @param {string} options.schema
 * @param {string} options.table
 * @param {string} [options.filter]
 * @param {Function} callback
 */
export function useRealtimeSubscription(channelName, options, callback) {
  const supabase = useSupabase();
  const channelRef = useRef(null);

  useEffect(() => {
    if (!channelName || !options) return;

    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: options.event,
          schema: options.schema || 'public',
          table: options.table,
          filter: options.filter,
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.debug(`Subscribed to channel: ${channelName}`);
        }
        if (status === 'CLOSED') {
          console.debug(`Unsubscribed from channel: ${channelName}`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to channel: ${channelName}`);
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    channelName,
    options.event,
    options.schema,
    options.table,
    options.filter,
    supabase,
    callback,
  ]);
}
