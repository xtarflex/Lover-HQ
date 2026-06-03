/**
 * @file phone.js
 * @description Utility functions for phone number formatting, parsing,
 * and country flag emoji generation.
 */

/**
 * Static list of country dialling codes with flag emojis and names.
 * @type {Array<{code: string, flag: string, name: string}>}
 */
export const COUNTRIES = [
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisia' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+52', flag: '🇲🇽', name: 'Mexico' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
];

/**
 * Formats a local phone number string with spaces.
 * E.g., "8031234567" -> "803 123 4567"
 *
 * @param {string} input - The raw input digits.
 * @returns {string} The formatted local number.
 */
export function formatLocalNumber(input) {
  const digits = input.replace(/\D/g, '');
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  } else {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  }
}

/**
 * Converts a two-letter ISO 3166-1 alpha-2 country code to its flag emoji.
 *
 * @param {string} countryCode - Two-letter country code (e.g. 'US', 'NG').
 * @returns {string} The corresponding flag emoji, or '🌍' if no code supplied.
 */
export function getFlagEmoji(countryCode) {
  if (!countryCode) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Parses a full E.164-style phone number into its country object and local number.
 *
 * @param {string} fullNumber - The full phone number including country code prefix.
 * @param {Array<{code: string, flag: string, name: string}>} [countries=COUNTRIES] - The list of country objects to match against.
 * @returns {{ country: {code: string, flag: string, name: string}, local: string }} The matched country object and the local portion of the number.
 */
export function parsePhoneNumber(fullNumber, countries = COUNTRIES) {
  if (!fullNumber) {
    return { country: countries[0], local: '' };
  }
  const cleanNumber = fullNumber.replace(/\s+/g, '');
  const sortedCountries = [...countries].sort((a, b) => b.code.length - a.code.length);
  const matchedCountry = sortedCountries.find((c) => cleanNumber.startsWith(c.code));
  if (matchedCountry) {
    const local = fullNumber.slice(matchedCountry.code.length).trim();
    return { country: matchedCountry, local };
  }
  return { country: countries[0], local: fullNumber };
}
