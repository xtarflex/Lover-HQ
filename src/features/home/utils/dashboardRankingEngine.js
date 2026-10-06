/**
 * @file dashboardRankingEngine.js
 * @description Dynamic behavioral and curated ranking engine for Lover-HQ Dashboard widgets & modules.
 * Implements:
 * - Recency & Frequency scoring
 * - Partner Activity Hooks (prioritizes partner actions)
 * - Discovery & Re-engagement logic (surfaces underutilized or partner-favored tools)
 */

export const CORE_MODULES = [
  {
    id: 'fridge',
    name: 'Fridge',
    description: 'Shared canvas & sticky notes',
    path: '/fridge',
    icon: 'fridge',
    accentColor: 'from-amber-500/20 to-orange-500/20',
  },
  {
    id: 'chat',
    name: 'Chat',
    description: 'Private couple pipeline',
    path: '/chat',
    icon: 'chat',
    accentColor: 'from-sky-500/20 to-blue-500/20',
  },
  {
    id: 'music',
    name: 'Music',
    description: 'Synced listening room',
    path: '/music',
    icon: 'music',
    accentColor: 'from-rose-500/20 to-pink-500/20',
  },
  {
    id: 'theatre',
    name: 'Theatre',
    description: 'Cinematic watch party',
    path: '/theatre',
    icon: 'theatre',
    isNew: true,
    accentColor: 'from-red-500/20 to-rose-900/20',
  },
  {
    id: 'journal',
    name: 'Journal',
    description: 'Timeless shared milestones',
    path: '/journal',
    icon: 'journal',
    isNew: true,
    accentColor: 'from-amber-200/20 to-yellow-600/20',
  },
  {
    id: 'games',
    name: 'Games',
    description: '2-Player mini-games battle',
    path: '/games',
    icon: 'games',
    accentColor: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    id: 'reveal',
    name: 'Reveal',
    description: 'Deep questions & intimate quizzes',
    path: '/reveal',
    icon: 'reveal',
    accentColor: 'from-pink-500/20 to-rose-500/20',
  },
];

const STORAGE_KEY_PREFIX = 'lover_hq_module_metrics_';

/**
 * Retrieves stored usage metrics for a specific user.
 *
 * @param {string} userId - Current user ID
 * @returns {Record<string, { userVisits: number, lastUsed: string }>}
 */
export function getStoredMetrics(userId) {
  if (typeof window === 'undefined' || !userId) return {};
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Records a user visit for a specific navigation module.
 *
 * @param {string} userId - Current user ID
 * @param {string} moduleId - Identifier of module
 */
export function trackModuleVisit(userId, moduleId) {
  if (typeof window === 'undefined' || !userId || !moduleId) return;
  try {
    const metrics = getStoredMetrics(userId);
    const current = metrics[moduleId] || { userVisits: 0, lastUsed: null };
    metrics[moduleId] = {
      userVisits: current.userVisits + 1,
      lastUsed: new Date().toISOString(),
    };
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(metrics));
  } catch (err) {
    console.error('Failed to update module metrics:', err);
  }
}

/**
 * Calculates adaptive module rankings and curated tags.
 *
 * @param {string} userId - Current user ID
 * @param {object} presence - Global presence state
 * @param {boolean} hasNewFridge - Unread fridge note indicator
 * @returns {Array<typeof CORE_MODULES[number] & { score: number, tag?: string }>}
 */
export function computeRankedModules(userId, presence = {}, hasNewFridge = false) {
  const metrics = getStoredMetrics(userId);
  const partnerRoom = (presence?.partnerRoom || '').toLowerCase();
  const isPartnerOnline = presence?.partner === 'online';

  return CORE_MODULES.map((mod) => {
    let score = 50;
    let tag = null;

    const data = metrics[mod.id] || { userVisits: 0, lastUsed: null };

    // 1. Partner Activity Hook (Highest Weight)
    if (isPartnerOnline && partnerRoom.includes(mod.id)) {
      score += 100;
      tag = 'Partner is Here';
    } else if (mod.id === 'fridge' && hasNewFridge) {
      score += 80;
      tag = 'New Note';
    }

    // 2. Behavioral Recency & Frequency
    if (data.userVisits > 5) {
      score += Math.min(data.userVisits * 2, 30);
      if (!tag) tag = 'Most Used';
    }

    // 3. Platform Highlights / New Features
    if (mod.isNew) {
      score += 25;
      if (!tag) tag = 'New Feature';
    }

    // 4. Re-engagement Hook (Not used in a while)
    if (data.lastUsed) {
      const daysSince = (Date.now() - new Date(data.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 4 && !tag) {
        score += 15;
        tag = 'Rediscover';
      }
    } else if (!mod.isNew && !tag) {
      tag = 'Try Out';
    }

    return {
      ...mod,
      score,
      tag,
    };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Selects the top contextual suggestion for the Row 2 bottom-right card.
 *
 * @param {Array<any>} rankedModules - Ranked module array
 * @returns {object} Suggested recommendation
 */
export function getTopRecommendation(rankedModules) {
  // Find top module that is not currently being used or has an engaging hook
  const candidate =
    rankedModules.find((m) => m.tag === 'Partner is Here' || m.tag === 'New Note') ||
    rankedModules.find((m) => m.tag === 'Rediscover' || m.tag === 'New Feature') ||
    rankedModules[0];

  return candidate || CORE_MODULES[0];
}
