/**
 * @file index.js
 * @description Central game registry. Add new game modules here to make them
 * available in the lobby without changing any other files.
 */

import { lazy } from 'react';

/**
 * @typedef {Object} GameDefinition
 * @property {string} id - Unique snake-case identifier.
 * @property {string} name - Display name.
 * @property {string} description - Short description shown in lobby.
 * @property {string} icon - Emoji icon.
 * @property {string} difficulty - 'easy' | 'medium' | 'hard'
 * @property {number} avgDuration - Estimated duration in seconds.
 * @property {string[]} tags - Filter tags (e.g. ['quick', 'word-based']).
 * @property {React.LazyExoticComponent} Component - Lazy-loaded game component.
 */

/** @type {GameDefinition[]} */
export const GAME_REGISTRY = [
  {
    id: 'tic-tac-toe',
    name: 'Tic-Tac-Toe',
    description: 'Classic 3×3 grid battle. Get 3 in a row to win.',
    icon: '⭕',
    difficulty: 'easy',
    avgDuration: 120,
    tags: ['quick', 'classic'],
    Component: lazy(() => import('./ticTacToe/TicTacToe')),
  },
  {
    id: 'word-chain',
    name: 'Word Chain',
    description: 'Each word must start with the last letter of the previous word.',
    icon: '🔗',
    difficulty: 'easy',
    avgDuration: 420,
    tags: ['word-based', 'thinking'],
    Component: lazy(() => import('./wordChain/WordChain')),
  },
  {
    id: 'quick-draw',
    name: 'Quick Draw',
    description: 'One of you draws, the other guesses. Race against the clock!',
    icon: '🎨',
    difficulty: 'easy',
    avgDuration: 180,
    tags: ['creative', 'quick'],
    Component: lazy(() => import('./quickDraw/QuickDraw')),
  },
];

/**
 * Looks up a game definition by its ID.
 *
 * @param {string} id - The game ID to look up.
 * @returns {GameDefinition|undefined}
 */
export const getGameById = (id) => GAME_REGISTRY.find((g) => g.id === id);

/**
 * Returns all games that include a specific tag.
 *
 * @param {string} tag - The tag to filter by.
 * @returns {GameDefinition[]}
 */
export const getGamesByTag = (tag) => GAME_REGISTRY.filter((g) => g.tags.includes(tag));
