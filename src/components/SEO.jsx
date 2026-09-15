import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Route-based Title & Meta Data configuration map.
 */
const ROUTE_SEO_MAP = {
  '/': {
    title: 'Lover-HQ — Digital Sanctuary for Couples',
    description:
      'Connect intimately across the miles. Enjoy voice notes, synced music, fridge notes, and daily reveal games for couples.',
    robots: 'index, follow',
  },
  '/auth': {
    title: 'Connect Your Sanctuary — Lover-HQ',
    description:
      'Sign in to access your private couple sanctuary or link your account with your partner on Lover-HQ.',
    robots: 'index, follow',
  },
  '/games': {
    title: 'Online Couples Games & Mini-Games — Lover-HQ',
    description:
      'Play online two-player games for long-distance couples. Challenge your partner to Scrabble, Math Puzzles, and strategy.',
    robots: 'index, follow',
  },
  '/music': {
    title: 'Synchronized Music Player for Couples — Lover-HQ',
    description:
      'Listen to music together synchronously with your partner. Features shared queue, sync controls, and crossfade audio.',
    robots: 'index, follow',
  },
  '/reveal': {
    title: 'Daily Relationship Questions & Reveals — Lover-HQ',
    description:
      'Deepen your connection with daily relationship questions. Answer independently and reveal your partner’s answers daily.',
    robots: 'index, follow',
  },
  '/chat': {
    title: 'Private Couples Chat — Lover-HQ',
    description: 'Private real-time chat with voice notes, pinned messages, and custom reactions.',
    robots: 'noindex, follow',
  },
  '/fridge': {
    title: 'Shared Virtual Fridge — Lover-HQ',
    description: 'Collaborative fridge door for notes, polaroids, and magnet messages.',
    robots: 'noindex, follow',
  },
  '/settings': {
    title: 'Account & Pair Settings — Lover-HQ',
    description: 'Manage your profile, partner pairing, and app preferences.',
    robots: 'noindex, follow',
  },
};

const DEFAULT_SEO = {
  title: 'Lover-HQ — Digital Sanctuary for Couples',
  description:
    'Connect intimately across the miles. Enjoy voice notes, synced music, fridge notes, and daily reveal games for couples.',
  robots: 'index, follow',
};

/**
 * Lightweight dynamic SEO head manager component.
 * Updates document.title, meta description, and robots directives per route change.
 *
 * @returns {null}
 */
export function SEO() {
  const location = useLocation();

  useEffect(() => {
    const config = ROUTE_SEO_MAP[location.pathname] || DEFAULT_SEO;

    // Update document title
    document.title = config.title;

    // Update meta description
    let descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.setAttribute('content', config.description);
    } else {
      descMeta = document.createElement('meta');
      descMeta.name = 'description';
      descMeta.content = config.description;
      document.head.appendChild(descMeta);
    }

    // Update robots directive
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (robotsMeta) {
      robotsMeta.setAttribute('content', config.robots);
    } else {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      robotsMeta.content = config.robots;
      document.head.appendChild(robotsMeta);
    }

    // Update Open Graph & Twitter Titles and Descriptions dynamically
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', config.title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', config.description);

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', config.title);

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', config.description);

    // Dynamic Canonical URL per route
    const currentUrl = `https://lover-hq.netlify.app${location.pathname === '/' ? '' : location.pathname}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', currentUrl);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      canonicalLink.href = currentUrl;
      document.head.appendChild(canonicalLink);
    }

    // Dynamic og:url and twitter:url per route
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', currentUrl);

    const twitterUrl = document.querySelector('meta[name="twitter:url"]');
    if (twitterUrl) twitterUrl.setAttribute('content', currentUrl);
  }, [location.pathname]);

  return null;
}
