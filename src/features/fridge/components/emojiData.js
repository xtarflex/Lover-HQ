/**
 * @file src/features/fridge/components/emojiData.js
 * @description Defines the collection of 50 supported animated Noto Emojis, and helpers for resolving their CDN assets.
 */

/**
 * @typedef {object} AnimatedEmoji
 * @property {string} id - Unique identifier name of the emoji.
 * @property {string} label - Friendly label.
 * @property {string} code - Google Noto CDN hex code format.
 * @property {string} char - Unicode character fallback representation.
 */

/** @type {Array<AnimatedEmoji>} */
export const ANIMATED_EMOJIS = [
  { id: 'heart', label: 'Heart', code: '2764_fe0f', char: '❤️' },
  { id: 'sparkles', label: 'Sparkles', code: '2728', char: '✨' },
  { id: 'kiss', label: 'Kiss', code: '1f618', char: '😘' },
  { id: 'laughing', label: 'Laughing', code: '1f602', char: '😂' },
  { id: 'party', label: 'Party', code: '1f973', char: '🥳' },
  { id: 'crying', label: 'Crying', code: '1f62d', char: '😭' },
  { id: 'angry', label: 'Angry', code: '1f621', char: '😡' },
  { id: 'sweat_smile', label: 'Sweat Smile', code: '1f605', char: '😅' },
  { id: 'heart_eyes', label: 'Heart Eyes', code: '1f60d', char: '😍' },
  { id: 'winking', label: 'Winking', code: '1f609', char: '😉' },
  { id: 'thinking', label: 'Thinking', code: '1f914', char: '🤔' },
  { id: 'smirk', label: 'Smirk', code: '1f60f', char: '😏' },
  { id: 'screaming', label: 'Screaming', code: '1f631', char: '😱' },
  { id: 'mind_blown', label: 'Mind Blown', code: '1f92f', char: '🤯' },
  { id: 'thumbs_up', label: 'Thumbs Up', code: '1f44d', char: '👍' },
  { id: 'clapping', label: 'Clapping', code: '1f44f', char: '👏' },
  { id: 'fire', label: 'Fire', code: '1f525', char: '🔥' },
  { id: 'eyes', label: 'Eyes', code: '1f440', char: '👀' },
  { id: 'ghost', label: 'Ghost', code: '1f47b', char: '👻' },
  { id: 'hundred', label: 'Hundred', code: '1f4af', char: '💯' },
  { id: 'cat_heart', label: 'Cat Heart', code: '1f63b', char: '😻' },
  { id: 'shushing', label: 'Shushing', code: '1f92b', char: '🤫' },
  { id: 'zany', label: 'Zany', code: '1f92a', char: '🤪' },
  { id: 'party_popper', label: 'Party Popper', code: '1f389', char: '🎉' },
  { id: 'star', label: 'Star', code: '2b50', char: '⭐' },
  { id: 'rocket', label: 'Rocket', code: '1f680', char: '🚀' },
  { id: 'crown', label: 'Crown', code: '1f451', char: '👑' },
  { id: 'rose', label: 'Rose', code: '1f339', char: '🌹' },
  { id: 'ring', label: 'Ring', code: '1f48d', char: '💍' },
  { id: 'sparkling_heart', label: 'Sparkling Heart', code: '1f496', char: '💖' },
  { id: 'revolving_hearts', label: 'Revolving Hearts', code: '1f49e', char: '💞' },
  { id: 'two_hearts', label: 'Two Hearts', code: '1f495', char: '💕' },
  { id: 'drooling', label: 'Drooling', code: '1f924', char: '🤤' },
  { id: 'yawning', label: 'Yawning', code: '1f971', char: '🥱' },
  { id: 'sleeping', label: 'Sleeping', code: '1f634', char: '😴' },
  { id: 'halo', label: 'Halo', code: '1f607', char: '😇' },
  { id: 'hugging', label: 'Hugging', code: '1f917', char: '🤗' },
  { id: 'saluting', label: 'Saluting', code: '1f6e1', char: '🫡' },
  { id: 'pleading', label: 'Pleading', code: '1f97a', char: '🥺' },
  { id: 'cold_face', label: 'Cold Face', code: '1f976', char: '🥶' },
  { id: 'hot_face', label: 'Hot Face', code: '1f975', char: '🥵' },
  { id: 'money_face', label: 'Money Face', code: '1f911', char: '🤑' },
  { id: 'cowboy', label: 'Cowboy', code: '1f920', char: '🤠' },
  { id: 'skull', label: 'Skull', code: '1f480', char: '💀' },
  { id: 'alien', label: 'Alien', code: '1f47d', char: '👽' },
  { id: 'robot', label: 'Robot', code: '1f916', char: '🤖' },
  { id: 'wave', label: 'Wave', code: '1f44b', char: '👋' },
  { id: 'pray', label: 'Pray', code: '1f64f', char: '🙏' },
  { id: 'flex', label: 'Flex', code: '1f4aa', char: '💪' },
  { id: 'balloon', label: 'Balloon', code: '1f388', char: '🎈' },
];

/**
 * Returns the Google Noto Animated WebP CDN URL for a given emoji hex code.
 *
 * @param {string} code - The hex code identifier.
 * @returns {string} Fully qualified URL.
 */
export function getEmojiCdnUrl(code) {
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.webp`;
}

export const ANIMATED_EMOJIS_BY_ID = new Map(ANIMATED_EMOJIS.map((e) => [e.id, e]));
export const ANIMATED_EMOJIS_BY_CHAR = new Map(ANIMATED_EMOJIS.map((e) => [e.char, e]));
