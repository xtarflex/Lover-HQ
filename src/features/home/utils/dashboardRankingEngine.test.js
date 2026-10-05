import { describe, it, expect, beforeEach } from 'vitest';
import {
  CORE_MODULES,
  computeRankedModules,
  trackModuleVisit,
  getStoredMetrics,
  getTopRecommendation,
} from './dashboardRankingEngine';

describe('dashboardRankingEngine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('contains all 7 core navigation modules', () => {
    expect(CORE_MODULES).toHaveLength(7);
    const ids = CORE_MODULES.map((m) => m.id);
    expect(ids).toContain('fridge');
    expect(ids).toContain('chat');
    expect(ids).toContain('music');
    expect(ids).toContain('theatre');
    expect(ids).toContain('journal');
    expect(ids).toContain('games');
    expect(ids).toContain('reveal');
  });

  it('tracks user module visits in localStorage', () => {
    trackModuleVisit('user-1', 'music');
    trackModuleVisit('user-1', 'music');
    const metrics = getStoredMetrics('user-1');
    expect(metrics.music.userVisits).toBe(2);
    expect(metrics.music.lastUsed).toBeDefined();
  });

  it('prioritizes partner activity hook with highest weight', () => {
    const presence = { partner: 'online', partnerRoom: 'Music Room' };
    const ranked = computeRankedModules('user-1', presence);
    expect(ranked[0].id).toBe('music');
    expect(ranked[0].tag).toBe('Partner is Here');
  });

  it('boosts fridge module when hasNewFridge is true', () => {
    const presence = { partner: 'offline', partnerRoom: null };
    const ranked = computeRankedModules('user-1', presence, true);
    const fridge = ranked.find((m) => m.id === 'fridge');
    expect(fridge.tag).toBe('New Note');
  });

  it('returns a top recommendation candidate', () => {
    const presence = { partner: 'offline' };
    const ranked = computeRankedModules('user-1', presence);
    const topRec = getTopRecommendation(ranked);
    expect(topRec).toBeDefined();
    expect(topRec.name).toBeDefined();
  });
});
