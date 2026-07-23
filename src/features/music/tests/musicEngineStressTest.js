import { formatTime, parseFilenameMetadata } from './src/features/music/lib/musicEngine.js';

const results = {
  formatTime: [],
  parseFilenameMetadata: [],
};

// 1. Stress tests for formatTime
const formatTimeCases = [
  { input: 0, expected: '0:00' },
  { input: 59, expected: '0:59' },
  { input: 60, expected: '1:00' },
  { input: 125, expected: '2:05' },
  { input: 3599, expected: '59:59' },
  { input: 3600, expected: '60:00' }, // 1 hour
  { input: 86400, expected: '1440:00' }, // 24 hours
  { input: 65.5, expected: '1:05' }, // Fractional number
  { input: 65.999, expected: '1:05' }, // Fractional number close to next sec (floor check)
  { input: -10, expected: '0:00' }, // Negative number
  { input: null, expected: '0:00' }, // null
  { input: undefined, expected: '0:00' }, // undefined
  { input: NaN, expected: '0:00' }, // NaN
  { input: Infinity, expected: '0:00' }, // Infinity (stress/edge case)
  { input: -Infinity, expected: '0:00' }, // -Infinity
  { input: '125', expected: '2:05' }, // String number
  { input: 'abc', expected: '0:00' }, // Non-numeric string
  { input: {}, expected: '0:00' }, // Object
  { input: [], expected: '0:00' }, // Array
  { input: [125], expected: '2:05' }, // Array with number
  { input: true, expected: '0:01' }, // Boolean true
  { input: false, expected: '0:00' }, // Boolean false
  { input: 1e12, expected: '16666666666:40' }, // Extremely large duration
];

for (const tc of formatTimeCases) {
  try {
    const actual = formatTime(tc.input);
    const passed = actual === tc.expected;
    results.formatTime.push({
      input: String(tc.input),
      expected: tc.expected,
      actual,
      passed,
    });
  } catch (err) {
    results.formatTime.push({
      input: String(tc.input),
      expected: tc.expected,
      actual: `Error: ${err.message}`,
      passed: false,
    });
  }
}

// 2. Stress tests for parseFilenameMetadata
const longString = 'a'.repeat(10000);
const specialChars = '~!@#$%^&*()_+{}|:"<>?`-=[]\\;\',./';
const unicodeString = 'élégant_русский_язык_🎵_🔥_straße';

const parseCases = [
  { input: null, expected: { title: '', artist: '' } },
  { input: '', expected: { title: '', artist: '' } },
  { input: undefined, expected: { title: '', artist: '' } },
  { input: 'Artist - Title.mp3', expected: { artist: 'Artist', title: 'Title' } },
  { input: '   Artist   -   Title   .mp3', expected: { artist: 'Artist', title: 'Title' } }, // Space trimming
  { input: 'Artist - Title - Live.mp3', expected: { artist: 'Artist', title: 'Title - Live' } }, // Multiple hyphens
  { input: 'Artist-Title.mp3', expected: { artist: '', title: 'Artist Title' } }, // Dash replacement
  { input: 'some_cool_song.mp3', expected: { artist: '', title: 'Some Cool Song' } }, // Underscore replacement & capitalization
  {
    input: longString + '.mp3',
    expected: { artist: '', title: longString.replace(/\b\w/g, (c) => c.toUpperCase()) },
  }, // Extremely long title
  { input: `Artist - ${longString}.mp3`, expected: { artist: 'Artist', title: longString } }, // Long title with artist
  {
    input: `Artist - Title ${specialChars}.mp3`,
    expected: { artist: 'Artist', title: `Title ${specialChars}` },
  }, // Special characters
  {
    input: `${unicodeString}.mp3`,
    expected: { artist: '', title: 'Élégant Русский Язык 🎵 🔥 Straße' },
  }, // Unicode / Emojis / International casing
];

for (const tc of parseCases) {
  try {
    const actual = parseFilenameMetadata(tc.input);
    const passed = JSON.stringify(actual) === JSON.stringify(tc.expected);
    results.parseFilenameMetadata.push({
      input: tc.input && tc.input.length > 60 ? tc.input.slice(0, 60) + '...' : String(tc.input),
      expected: tc.expected,
      actual,
      passed,
    });
  } catch (err) {
    results.parseFilenameMetadata.push({
      input: tc.input && tc.input.length > 60 ? tc.input.slice(0, 60) + '...' : String(tc.input),
      expected: tc.expected,
      actual: `Error: ${err.message}`,
      passed: false,
    });
  }
}

console.log(JSON.stringify(results, null, 2));
