/**
 * @file useDashboardRanking.js
 * @description Hook that subscribes to presence and metrics to provide dynamically ranked modules.
 */

import { useMemo } from 'react';
import { useAppContext } from '../../../contexts/AppContext';
import { computeRankedModules, getTopRecommendation } from '../utils/dashboardRankingEngine';

/**
 * Custom hook returning ranked navigation modules and recommended feature.
 *
 * @param {boolean} [hasNewFridge=false]
 * @returns {{ rankedModules: Array, topRecommendation: object }}
 */
export function useDashboardRanking(hasNewFridge = false) {
  const { user, presence } = useAppContext();
  const userId = user?.id;

  const rankedModules = useMemo(() => {
    return computeRankedModules(userId, presence, hasNewFridge);
  }, [userId, presence, hasNewFridge]);

  const topRecommendation = useMemo(() => {
    return getTopRecommendation(rankedModules);
  }, [rankedModules]);

  return {
    rankedModules,
    topRecommendation,
  };
}
