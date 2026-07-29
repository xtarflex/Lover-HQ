/* global process */
/**
 * @file scripts/buildSignalStickerData.js
 * @description Dynamically reads public/stickers directory and generates stickerData.js
 * matching exact file names on disk with tags, emoji labels, and coverUrl properties.
 */

import fs from 'fs';
import path from 'path';

const STICKERS_DIR = path.resolve(process.cwd(), 'public/stickers');

const PACK_DEFINITIONS = [
  {
    id: 'love_pack',
    name: 'Love & Romance',
    icon: '💖',
    coverFile: 'love_pack_cover.png',
    filter: (file) => file.endsWith('.lottie'),
  },
  {
    id: 'signal_sweet_couple',
    name: 'Sweet Couple 1',
    icon: '👩‍❤️‍👨',
    coverFile: 'signal_ee5dd49d_cover.png',
    filter: (file) => file.includes('signal_ee5dd49d_') && !file.includes('_cover.'),
  },
  {
    id: 'signal_romantic_moments',
    name: 'Romantic Moments',
    icon: '🌹',
    coverFile: 'signal_c627a32c_cover.png',
    filter: (file) => file.includes('signal_c627a32c_') && !file.includes('_cover.'),
  },
  {
    id: 'signal_love_hugs',
    name: 'Love & Hugs',
    icon: '🤗',
    coverFile: 'signal_eb02ac62_cover.png',
    filter: (file) => file.includes('signal_eb02ac62_') && !file.includes('_cover.'),
  },
  {
    id: 'signal_cute_couple',
    name: 'Cute Couple Daily',
    icon: '🥰',
    coverFile: 'signal_a94c2600_cover.png',
    filter: (file) => file.includes('signal_a94c2600_') && !file.includes('_cover.'),
  },
  {
    id: 'signal_forever_together',
    name: 'Forever Together',
    icon: '💍',
    coverFile: 'signal_535ecff7_cover.png',
    filter: (file) => file.includes('signal_535ecff7_') && !file.includes('_cover.'),
  },
];

// Emoji mapping by modulo index for rich search and emotion filtering
const EMOJI_MAP = ['😍', '👋', '😂', '😭', '😮', '🎉', '🥰', '😘', '🤗', '💖'];

function generateTags(label, packId, idx) {
  const lower = (label + ' ' + packId).toLowerCase();
  const tags = new Set();

  const assignedEmoji = EMOJI_MAP[idx % EMOJI_MAP.length];
  tags.add(assignedEmoji);

  if (
    lower.includes('love') ||
    lower.includes('heart') ||
    lower.includes('couple') ||
    lower.includes('hug') ||
    lower.includes('kiss') ||
    lower.includes('romantic') ||
    lower.includes('forever') ||
    lower.includes('sweet')
  ) {
    tags.add('love');
    tags.add('❤️');
  }
  if (lower.includes('hi') || lower.includes('wave') || lower.includes('hello') || idx % 6 === 1) {
    tags.add('hi');
    tags.add('👋');
  }
  if (
    lower.includes('haha') ||
    lower.includes('lol') ||
    lower.includes('laugh') ||
    lower.includes('funny') ||
    idx % 6 === 2
  ) {
    tags.add('haha');
    tags.add('😂');
  }
  if (lower.includes('sad') || lower.includes('cry') || lower.includes('tear') || idx % 6 === 3) {
    tags.add('sad');
    tags.add('😭');
  }
  if (
    lower.includes('wow') ||
    lower.includes('surprise') ||
    lower.includes('gift') ||
    idx % 6 === 4
  ) {
    tags.add('wow');
    tags.add('😮');
  }
  if (
    lower.includes('yay') ||
    lower.includes('celebrate') ||
    lower.includes('party') ||
    idx % 6 === 5
  ) {
    tags.add('yay');
    tags.add('🎉');
  }

  return Array.from(tags);
}

function main() {
  const allFiles = fs.readdirSync(STICKERS_DIR);
  const packs = [];

  for (const def of PACK_DEFINITIONS) {
    const matchingFiles = allFiles.filter(def.filter);

    const stickers = matchingFiles.map((file, idx) => {
      const isLottie = file.endsWith('.lottie');

      let label = `${def.name} ${EMOJI_MAP[idx % EMOJI_MAP.length]}`;
      if (isLottie) {
        const cleanLottieName = file
          .replace(/\.lottie$/i, '')
          .replace(/[-_.]/g, ' ')
          .replace(/animation|emojisticker|sticker/gi, '')
          .trim();
        if (cleanLottieName) label = `${cleanLottieName} ${EMOJI_MAP[idx % EMOJI_MAP.length]}`;
      }

      const tags = generateTags(label, def.id, idx);

      return {
        id: `${def.id}_${idx + 1}`,
        label,
        tags,
        type: isLottie ? 'animated' : 'static',
        url: `/stickers/${file}`,
      };
    });

    if (stickers.length > 0) {
      const hasOfficialCover =
        def.coverFile && fs.existsSync(path.join(STICKERS_DIR, def.coverFile));
      packs.push({
        id: def.id,
        name: def.name,
        icon: def.icon,
        coverUrl: hasOfficialCover ? `/stickers/${def.coverFile}` : stickers[0]?.url || null,
        stickers,
      });
    }
  }

  const fileContent = `/**
 * @file stickerData.js
 * @description Auto-generated custom sticker magnet packs manifest for Lover-HQ.
 * Last updated: ${new Date().toISOString()}
 */

/**
 * @typedef {object} StickerItem
 * @property {string} id
 * @property {string} label
 * @property {Array<string>} [tags]
 * @property {'animated'|'static'} type
 * @property {string} url
 */

/**
 * @typedef {object} StickerPack
 * @property {string} id
 * @property {string} name
 * @property {string} icon
 * @property {string|null} [coverUrl]
 * @property {Array<StickerItem>} stickers
 */

/** @type {Array<StickerPack>} */
export const STICKER_PACKS = ${JSON.stringify(packs, null, 2)};

export default STICKER_PACKS;
`;

  const outputPath = path.resolve(process.cwd(), 'src/features/fridge/components/stickerData.js');
  fs.writeFileSync(outputPath, fileContent, 'utf8');
  console.log(
    `✅ Dynamically generated stickerData.js with ${packs.length} active packs, emoji labels, and cover URLs!`
  );
}

main();
