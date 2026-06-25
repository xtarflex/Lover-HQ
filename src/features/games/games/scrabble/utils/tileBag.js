/**
 * @file tileBag.js
 * @description Letter distribution, scoring, and drawing logic for Classic Scrabble.
 */

/** @type {Object<string, number>} Points mapping for each English letter. */
export const LETTER_VALUES = {
  A: 1,
  B: 3,
  C: 3,
  D: 2,
  E: 1,
  F: 4,
  G: 2,
  H: 4,
  I: 1,
  J: 8,
  K: 5,
  L: 1,
  M: 3,
  N: 1,
  O: 1,
  P: 3,
  Q: 10,
  R: 1,
  S: 1,
  T: 1,
  U: 1,
  V: 4,
  W: 4,
  X: 8,
  Y: 4,
  Z: 10,
};

/** @type {Object<string, number>} Standard Scrabble letter distribution (98 tiles). */
const LETTER_DISTRIBUTION = {
  A: 9,
  B: 2,
  C: 2,
  D: 4,
  E: 12,
  F: 2,
  G: 3,
  H: 2,
  I: 9,
  J: 1,
  K: 1,
  L: 4,
  M: 2,
  N: 6,
  O: 8,
  P: 2,
  Q: 1,
  R: 6,
  S: 4,
  T: 6,
  U: 4,
  V: 2,
  W: 2,
  X: 1,
  Y: 2,
  Z: 1,
};

/**
 * Shuffles an array in place.
 *
 * @template T
 * @param {T[]} array - The array to shuffle.
 * @returns {T[]} The shuffled array.
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Creates a new, fully populated and shuffled tile bag.
 *
 * @returns {string[]} Shuffled list of letter tiles.
 */
export function createInitialBag() {
  const bag = [];
  Object.entries(LETTER_DISTRIBUTION).forEach(([letter, count]) => {
    for (let i = 0; i < count; i++) {
      bag.push(letter);
    }
  });
  return shuffle(bag);
}

/**
 * Draws up to `count` tiles from the bag.
 *
 * @param {string[]} bag - The current tile bag.
 * @param {number} count - The number of tiles to draw.
 * @returns {{ drawn: string[], remainingBag: string[] }} The drawn tiles and the updated bag.
 */
export function drawTiles(bag, count) {
  const drawn = bag.slice(0, count);
  const remainingBag = bag.slice(count);
  return { drawn, remainingBag };
}

/**
 * Retrieves the point value of a single letter.
 *
 * @param {string} letter - The letter (case-insensitive).
 * @returns {number} The point value.
 */
export function getLetterScore(letter) {
  if (!letter) return 0;
  return LETTER_VALUES[letter.toUpperCase()] || 0;
}
