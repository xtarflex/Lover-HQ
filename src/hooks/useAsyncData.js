import { useState, useCallback } from 'react';

/**
 * Hook to manage asynchronous data fetching with loading and error states.
 *
 * @param {Function} asyncFunction - A function that returns a Promise.
 */
export function useAsyncData(asyncFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await asyncFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction]
  );

  return { data, loading, error, execute };
}
