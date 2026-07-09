/**
 * @file index.js
 * @description Central game registry. Add new game modules here to make them
 * available in the lobby without changing any other files.
 */

import { lazy } from 'react';
import {
  TicTacToeIcon,
  WordChainIcon,
  QuickDrawIcon,
  ScrabbleIcon,
  MathPuzzleIcon,
  ThreeMensMorrisIcon,
} from '../components/GameIcons';

/**
 * @typedef {Object} GameDefinition
 * @property {string} id - Unique snake-case identifier.
 * @property {string} name - Display name.
 * @property {string} description - Short description shown in lobby.
 * @property {React.ComponentType} Icon - SVG icon component (accepts className prop).
 * @property {string} difficulty - 'easy' | 'medium' | 'hard' | 'variable'
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
    Icon: TicTacToeIcon,
    difficulty: 'easy',
    avgDuration: 120,
    tags: ['quick', 'classic'],
    Component: lazy(() => import('./ticTacToe/TicTacToe')),
  },
  {
    id: 'word-chain',
    name: 'Word Chain',
    description: 'Each word must start with the last letter of the previous word.',
    Icon: WordChainIcon,
    difficulty: 'easy',
    avgDuration: 420,
    tags: ['word-based', 'thinking'],
    Component: lazy(() => import('./wordChain/WordChain')),
  },
  {
    id: 'quick-draw',
    name: 'Quick Draw',
    description: 'One of you draws, the other guesses. Race against the clock!',
    Icon: QuickDrawIcon,
    difficulty: 'easy',
    avgDuration: 180,
    tags: ['creative', 'quick'],
    Component: lazy(() => import('./quickDraw/QuickDraw')),
  },
  {
    id: 'scrabble',
    name: 'Classic Scrabble',
    description: 'Build words on a compact grid. 30-second rapid turns.',
    Icon: ScrabbleIcon,
    difficulty: 'medium',
    avgDuration: 300,
    tags: ['classic', 'word-based', 'turn-based'],
    Component: lazy(() => import('./scrabble/Scrabble')),
  },
  {
    id: 'math-puzzle',
    name: 'CrossMath Race',
    description: 'Solve the equation grid. Race your partner in real time!',
    Icon: MathPuzzleIcon,
    difficulty: 'variable',
    avgDuration: 180,
    tags: ['speed-race', 'math-based', 'thinking'],
    Component: lazy(() => import('./mathPuzzle/MathPuzzle')),
  },
  {
    id: 'three-mens-morris',
    name: "Three Men's Morris",
    description: 'Connect 3 pieces in a row. Place them, then move them dynamically.',
    Icon: ThreeMensMorrisIcon,
    difficulty: 'medium',
    avgDuration: 240,
    tags: ['classic', 'turn-based', 'thinking'],
    Component: lazy(() => import('./threeMensMorris/ThreeMensMorris')),
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
