import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Route-based Title & Meta Data configuration map.
 */
const ROUTE_SEO_MAP = {
  '/': {
    title: 'Lover-HQ — Private Digital Sanctuary for Long-Distance Couples',
    description:
      'A private digital house for long-distance couples. Share voice notes, synced music, collaborative fridge notes, daily Q&A reveals, and interactive games.',
    robots: 'index, follow',
  },
  '/auth': {
    title: 'Sign In & Connect — Lover-HQ',
    description: 'Log into your private couple room or connect with your partner on Lover-HQ.',
    robots: 'index, follow',
  },
  '/games': {
    title: 'Couples Games & Mini-Games — Lover-HQ',
    description: 'Play interactive two-player mini-games with your partner in real-time.',
    robots: 'index, follow',
  },
  '/music': {
    title: 'Shared Music Engine — Lover-HQ',
    description: 'Listen to music together synchronously with your partner across the miles.',
    robots: 'index, follow',
  },
  '/reveal': {
    title: 'Daily Reveal Questions — Lover-HQ',
    description: 'Answer daily relationship questions and unlock your partner’s answers.',
    robots: 'index, follow',
  },
  '/chat': {
    title: 'Private Couples Chat — Lover-HQ',
    description: 'Private real-time chat with voice notes, pinned messages, and reactions.',
    robots: 'noindex, follow',
  },
  '/fridge': {
    title: 'Shared Virtual Fridge — Lover-HQ',
    description: 'Collaborative fridge door for notes, polaroids, and magnet messages.',
    robots: 'noindex, follow',
  },
  '/settings': {
    title: 'Account & Pair Settings — Lover-HQ',
    description: 'Manage your profile, partner pairing, and app settings.',
    robots: 'noindex, follow',
  },
};

const DEFAULT_SEO = {
  title: 'Lover-HQ — Private Digital Sanctuary for Long-Distance Couples',
  description: 'A private digital space for long-distance couples to stay connected.',
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

    // Update Open Graph & Twitter Titles dynamically
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', config.title);

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', config.title);
  }, [location.pathname]);

  return null;
}
