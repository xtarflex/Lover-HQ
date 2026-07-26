/**
 * @file stickerData.js
 * @description Curated custom sticker magnet packs for Lover-HQ chat & fridge.
 * Features authentic custom die-cut sticker magnet illustrations (Love Magnets, Cute Expressions)
 * with transparent backgrounds, white borders, and soft drop shadows.
 * Configured with local/CDN fallbacks and Supabase Storage bucket readiness.
 */

// Helper to encode SVG string to Data URI for instant crisp vector rendering
function svgToDataUri(svgString) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

// ── Custom Die-Cut Magnet Sticker Assets ─────────────────────────────────────

const STICKER_HEART_LOCK = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
    <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
  </filter>
  <g filter="url(#shadow)">
    <!-- White Die-Cut Sticker Outline -->
    <path d="M60 12 C35 -5 10 20 10 45 C10 75 60 105 60 105 C60 105 110 75 110 45 C110 20 85 -5 60 12 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="4" stroke-linejoin="round"/>
    <!-- Inner Heart Lock Body -->
    <path d="M60 18 C38 3 16 25 16 47 C16 73 60 98 60 98 C60 98 104 73 104 47 C104 25 82 3 60 18 Z" fill="url(#heartGrad)"/>
    <!-- Lock Shackle -->
    <path d="M46 38 V28 C46 20 52 14 60 14 C68 14 74 20 74 28 V38" fill="none" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/>
    <!-- Lock Keyhole -->
    <circle cx="60" cy="52" r="5" fill="#1e1b4b"/>
    <polygon points="57,54 63,54 62,64 58,64" fill="#1e1b4b"/>
    <!-- Glossy Highlight -->
    <path d="M25 35 C25 25 35 15 48 18 C40 22 30 30 28 40 Z" fill="#ffffff" opacity="0.4"/>
  </g>
  <defs>
    <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e"/>
      <stop offset="100%" stop-color="#be123c"/>
    </linearGradient>
  </defs>
</svg>
`);

const STICKER_LOVE_LETTER = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <filter id="shadow2">
    <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
  </filter>
  <g filter="url(#shadow2)">
    <!-- White Sticker Outline -->
    <rect x="12" y="24" width="96" height="72" rx="14" fill="#ffffff" stroke="#e2e8f0" stroke-width="5"/>
    <!-- Envelope Body -->
    <rect x="16" y="28" width="88" height="64" rx="10" fill="#fda4af"/>
    <!-- Envelope Flap -->
    <polygon points="16,28 60,60 104,28" fill="#f43f5e"/>
    <!-- Wax Seal Heart -->
    <circle cx="60" cy="60" r="12" fill="#be123c"/>
    <path d="M60 55 C57 52 53 54 53 57 C53 61 60 65 60 65 C60 65 67 61 67 57 C67 54 63 52 60 55 Z" fill="#ffffff"/>
  </g>
</svg>
`);

const STICKER_RED_ROSE = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <filter id="shadow3">
    <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
  </filter>
  <g filter="url(#shadow3)">
    <!-- White Sticker Border -->
    <circle cx="60" cy="50" r="38" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>
    <path d="M60 84 Q60 105 45 110 Q60 95 60 84 Z" fill="#ffffff"/>
    <!-- Leaves -->
    <path d="M40 75 C25 70 20 85 45 82 Z" fill="#15803d"/>
    <path d="M80 75 C95 70 100 85 75 82 Z" fill="#15803d"/>
    <!-- Stem -->
    <path d="M60 50 Q60 85 55 105" fill="none" stroke="#166534" stroke-width="6" stroke-linecap="round"/>
    <!-- Rose Petals -->
    <circle cx="60" cy="45" r="28" fill="#e11d48"/>
    <path d="M42 40 C42 25 78 25 78 40 C78 55 42 55 42 40 Z" fill="#be123c"/>
    <path d="M50 42 C50 32 70 32 70 42 C70 50 50 50 50 42 Z" fill="#fb7185"/>
    <path d="M55 43 C55 37 65 37 65 43 Z" fill="#ffffff"/>
  </g>
</svg>
`);

const STICKER_BEAR_HUG = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <filter id="shadow4">
    <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
  </filter>
  <g filter="url(#shadow4)">
    <!-- White Border -->
    <circle cx="45" cy="50" r="32" fill="#ffffff"/>
    <circle cx="75" cy="50" r="32" fill="#ffffff"/>
    <path d="M25 80 Q60 110 95 80 Z" fill="#ffffff"/>
    <!-- Left Brown Bear -->
    <circle cx="32" cy="28" r="8" fill="#78350f"/>
    <circle cx="45" cy="50" r="24" fill="#92400e"/>
    <circle cx="45" cy="54" r="9" fill="#fde68a"/>
    <circle cx="45" cy="52" r="3" fill="#451a03"/>
    <!-- Right Pink Bear -->
    <circle cx="88" cy="28" r="8" fill="#be185d"/>
    <circle cx="75" cy="50" r="24" fill="#db2777"/>
    <circle cx="75" cy="54" r="9" fill="#fbcfe8"/>
    <circle cx="75" cy="52" r="3" fill="#831843"/>
    <!-- Center Hugging Heart -->
    <path d="M60 40 C55 34 46 38 46 45 C46 54 60 62 60 62 C60 62 74 54 74 45 C74 38 65 34 60 40 Z" fill="#f43f5e"/>
  </g>
</svg>
`);

const STICKER_STAR_BADGE = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <filter id="shadow5">
    <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
  </filter>
  <g filter="url(#shadow5)">
    <!-- White Sticker Border -->
    <path d="M60 8 L74 42 L110 44 L82 68 L91 104 L60 84 L29 104 L38 68 L10 44 L46 42 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="6" stroke-linejoin="round"/>
    <!-- Gold Star -->
    <path d="M60 14 L72 44 L104 46 L79 68 L87 100 L60 82 L33 100 L41 68 L16 46 L48 44 Z" fill="url(#goldGrad)"/>
    <!-- Center Script Badge -->
    <circle cx="60" cy="58" r="16" fill="#1e1b4b"/>
    <text x="60" y="62" font-family="sans-serif" font-weight="900" font-size="10" fill="#fbbf24" text-anchor="middle">YOU &amp; ME</text>
  </g>
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
</svg>
`);

const STICKER_DIAMOND_RING = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <filter id="shadow6">
    <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
  </filter>
  <g filter="url(#shadow6)">
    <!-- White Die-Cut Border -->
    <circle cx="60" cy="70" r="32" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>
    <polygon points="60,12 82,36 38,36" fill="#ffffff"/>
    <!-- Gold Ring -->
    <circle cx="60" cy="70" r="26" fill="none" stroke="#fbbf24" stroke-width="10"/>
    <!-- Diamond Gem -->
    <polygon points="60,18 78,36 42,36" fill="#38bdf8"/>
    <polygon points="60,18 69,36 51,36" fill="#7dd3fc"/>
    <polygon points="60,48 78,36 42,36" fill="#0284c7"/>
    <!-- Sparkle Flashes -->
    <path d="M30 20 L35 25 M85 20 L90 25 M60 5 L60 12" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
  </g>
</svg>
`);

// ── Sticker Packs Collection ──────────────────────────────────────────────────

/** @type {Array<StickerPack>} */
export const STICKER_PACKS = [
  {
    id: 'love_magnets',
    name: 'Love Magnets',
    icon: '💖',
    stickers: [
      {
        id: 'magnet_heart_lock',
        label: 'Heart Lock',
        type: 'static',
        url: STICKER_HEART_LOCK,
      },
      {
        id: 'magnet_love_letter',
        label: 'Love Letter',
        type: 'static',
        url: STICKER_LOVE_LETTER,
      },
      {
        id: 'magnet_red_rose',
        label: 'Passion Rose',
        type: 'static',
        url: STICKER_RED_ROSE,
      },
      {
        id: 'magnet_bear_hug',
        label: 'Bear Hug',
        type: 'static',
        url: STICKER_BEAR_HUG,
      },
      {
        id: 'magnet_star_badge',
        label: 'You & Me',
        type: 'static',
        url: STICKER_STAR_BADGE,
      },
      {
        id: 'magnet_diamond_ring',
        label: 'Promise Ring',
        type: 'static',
        url: STICKER_DIAMOND_RING,
      },
    ],
  },
  {
    id: 'animated_reactions',
    name: 'Animated Reactions',
    icon: '✨',
    stickers: [
      {
        id: 'anim_heart_pulse',
        label: 'Heart Pulse',
        type: 'animated',
        url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.webp',
      },
      {
        id: 'anim_blow_kiss',
        label: 'Blow Kiss',
        type: 'animated',
        url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f618/512.webp',
      },
      {
        id: 'anim_party_popper',
        label: 'Party Popper',
        type: 'animated',
        url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.webp',
      },
      {
        id: 'anim_fire_burst',
        label: 'On Fire',
        type: 'animated',
        url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp',
      },
    ],
  },
];

/**
 * Returns public URL for Supabase Storage hosted sticker assets if configured,
 * or falls back to standard URL.
 *
 * @param {string} path - Storage path inside 'stickers' bucket.
 * @param {string} fallbackUrl - Default fallback URL.
 * @returns {string} Fully qualified URL.
 */
export function getStickerUrl(path, fallbackUrl) {
  if (path && typeof window !== 'undefined' && window.__SUPABASE_URL__) {
    return `${window.__SUPABASE_URL__}/storage/v1/object/public/stickers/${path}`;
  }
  return fallbackUrl;
}
