/**
 * Design tokens and constants for the application.
 */

/**
 * @typedef {Object} ColorTokens
 * @property {string} hex - The Hex code of the color.
 * @property {string} rgb - The space-separated RGB values (for Tailwind CSS variable compatibility).
 */

/**
 * @typedef {Object} ThemePalette
 * @property {ColorTokens} primary - Primary brand color.
 * @property {ColorTokens} secondary - Secondary/accent brand color.
 * @property {ColorTokens} background - Page background color.
 * @property {ColorTokens} surface - Cards, modals, and container background color.
 * @property {ColorTokens} textMain - Primary high-contrast text color.
 * @property {ColorTokens} textMuted - Secondary muted text color.
 * @property {ColorTokens} border - Border and divider color.
 */

/**
 * Brand color palettes defined in BRANDING.md
 * @type {Object.<string, ThemePalette>}
 */
export const THEMES = {
  eternalNoir: {
    primary: { hex: '#4A0E0E', rgb: '74 14 14' }, // Deep Bordeaux
    secondary: { hex: '#D4AF37', rgb: '212 175 55' }, // Champagne Gold
    background: { hex: '#121212', rgb: '18 18 18' }, // Obsidian Silk
    surface: { hex: '#2C2C2C', rgb: '44 44 44' }, // Smoke Grey
    textMain: { hex: '#F5F5DC', rgb: '245 245 220' }, // Soft Parchment
    textMuted: { hex: '#A0A08B', rgb: '160 160 139' },
    border: { hex: '#3D3D3D', rgb: '61 61 61' },
  },
  blushingPetal: {
    primary: { hex: '#E29595', rgb: '226 149 149' }, // Dusty Rose
    secondary: { hex: '#B5C99A', rgb: '181 201 154' }, // Sage Whisper
    background: { hex: '#F7F9FB', rgb: '247 249 251' }, // Morning Mist
    surface: { hex: '#FFFFFF', rgb: '255 255 255' }, // Pure Alabaster
    textMain: { hex: '#3D348B', rgb: '61 52 139' }, // Charcoal Plum
    textMuted: { hex: '#6B7280', rgb: '107 114 128' },
    border: { hex: '#E2E8F0', rgb: '226 232 240' },
  },
};

/**
 * Standard utility colors shared across themes.
 */
export const COLORS = {
  success: 'green-500',
  error: 'red-500',
  warning: 'yellow-500',
};

export const SPACING = {
  xs: '1', // 4px
  sm: '2', // 8px
  md: '4', // 16px
  lg: '6', // 24px
  xl: '8', // 32px
};

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
};

export const ROOMS = {
  FRIDGE: 'fridge',
  MUSIC: 'music',
  GAMES: 'games',
  REVEAL: 'reveal',
  BOARD: 'board',
  PROFILE: 'profile',
};

export const PAIRING_STATUS = {
  UNPAIRED: 'unpaired',
  PENDING: 'pending',
  PAIRED: 'paired',
};

export const ICON_SIZES = {
  sm: 16,
  md: 24,
  lg: 32,
};
