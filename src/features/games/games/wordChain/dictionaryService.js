/**
 * @file dictionaryService.js
 * @description Async service functions for validating English words against online
 * dictionary APIs with a local offline-dictionary fallback.
 *
 * Validation strategy (in priority order):
 *  1. Instant local offline check against `words.json` (0 ms latency).
 *  2. Free Dictionary API — returns definition and part of speech for valid words.
 *  3. Datamuse API — used as a spelling-checker fallback when the primary API fails.
 */

import localWords from './words.json';

/** @type {Set<string>} Pre-computed set for O(1) local word lookups. */
const localWordsSet = new Set(localWords);

/**
 * Validates a word against the online dictionary APIs, falling back to the local
 * offline dictionary when the APIs are unreachable.
 *
 * @param {string} word - The raw word string submitted by the player.
 * @returns {Promise<{
 *   valid: boolean,
 *   isLocal?: boolean,
 *   definition?: string,
 *   partOfSpeech?: string,
 *   reason?: string
 * }>} Resolution object indicating validity and, on success, the definition metadata.
 */
export async function validateOnlineWord(word) {
  const cleanWord = word.trim().toLowerCase();

  // 1. Instant local check
  if (localWordsSet.has(cleanWord)) {
    console.log(`Word "${cleanWord}" validated instantly via offline dictionary.`);
    return { valid: true, isLocal: true };
  }

  // 2. Free Dictionary API (primary — returns definition)
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`
    );
    if (res.status === 200) {
      const data = await res.json();
      const entry = data[0];
      const partOfSpeech = entry?.meanings[0]?.partOfSpeech || 'noun';
      const definition = entry?.meanings[0]?.definitions[0]?.definition || 'No definition found.';
      console.log(`Word "${cleanWord}" validated online via Free Dictionary API.`);
      return { valid: true, isLocal: false, definition, partOfSpeech };
    } else if (res.status === 404) {
      console.log(`Word "${cleanWord}" rejected via Free Dictionary API (404).`);
      return { valid: false, reason: 'Not a valid English word.' };
    }
  } catch (error) {
    console.warn('Free Dictionary API request failed, trying Datamuse API...', error);
  }

  // 3. Datamuse API (secondary — spelling verification only)
  try {
    const res = await fetch(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(cleanWord)}&max=1`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0 && data[0].word.toLowerCase() === cleanWord) {
        console.log(`Word "${cleanWord}" validated online via Datamuse API.`);
        return {
          valid: true,
          isLocal: false,
          definition: 'Definition unavailable (spelling verified).',
          partOfSpeech: 'unknown',
        };
      }
    }
  } catch (error) {
    console.warn('Datamuse API request failed.', error);
  }

  return { valid: false, reason: 'Not a valid English word.' };
}

/**
 * Fetches the definition and part of speech of a known-valid word from the
 * Free Dictionary API. Used for background definition enrichment after a word
 * has already been accepted from the local offline dictionary.
 *
 * @param {string} word - A validated word whose definition should be enriched.
 * @returns {Promise<{ definition: string, partOfSpeech: string } | null>}
 *   The definition data, or `null` if the API call fails.
 */
export async function fetchDefinitionFromApi(word) {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );
    if (res.status === 200) {
      const data = await res.json();
      const entry = data[0];
      const partOfSpeech = entry?.meanings[0]?.partOfSpeech || 'noun';
      const definition = entry?.meanings[0]?.definitions[0]?.definition || 'No definition found.';
      return { definition, partOfSpeech };
    }
  } catch (error) {
    console.warn('Background definition fetch failed:', error);
  }
  return null;
}
