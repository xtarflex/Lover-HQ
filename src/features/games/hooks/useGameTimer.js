/**
 * @file useGameTimer.js
 * @description Shared countdown timer hook for game modules.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Countdown timer hook.
 *
 * @param {number} initialSeconds - Starting value in seconds.
 * @param {Function} onExpire - Callback fired when timer reaches 0.
 * @param {boolean} [autoStart=false] - Start counting immediately on mount.
 * @returns {{ seconds: number, isRunning: boolean, start: Function, pause: Function, reset: Function }}
 */
export function useGameTimer(initialSeconds, onExpire, autoStart = false) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const onExpireRef = useRef(onExpire);
  const intervalRef = useRef(null);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  /** Start or resume the timer. */
  const start = useCallback(() => setIsRunning(true), []);

  /** Pause the timer. */
  const pause = useCallback(() => setIsRunning(false), []);

  /**
   * Reset to initial value, optionally auto-starting again.
   *
   * @param {boolean} [andStart=false]
   */
  const reset = useCallback(
    (andStart = false) => {
      clearInterval(intervalRef.current);
      setSeconds(initialSeconds);
      setIsRunning(andStart);
    },
    [initialSeconds]
  );

  return { seconds, isRunning, start, pause, reset };
}
