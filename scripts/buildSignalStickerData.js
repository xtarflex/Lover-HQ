/**
 * @file scripts/buildSignalStickerData.js
 * @description Dynamically reads public/stickers directory and generates stickerData.js
 * matching exact file names on disk with coverUrl properties.
 */

import fs from 'fs';
import path from 'path';

const STICKERS_DIR = path.resolve(process.cwd(), 'public/stickers');

const PACK_DEFINITIONS = [
  {
    id: 'love_pack',
    name: 'Love & Romance',
    icon: '💖',
    filter: (file) => file.endsWith('.lottie'),
  },
  {
    id: 'signal_sweet_couple',
    name: 'Sweet Couple 1',
    icon: '👩‍❤️‍👨',
    filter: (file) => file.includes('signal_ee5dd49d_'),
  },
  {
    id: 'signal_romantic_moments',
    name: 'Romantic Moments',
    icon: '🌹',
    filter: (file) => file.includes('signal_c627a32c_'),
  },
  {
    id: 'signal_love_hugs',
    name: 'Love & Hugs',
    icon: '🤗',
    filter: (file) => file.includes('signal_eb02ac62_'),
  },
  {
    id: 'signal_cute_couple',
    name: 'Cute Couple Daily',
    icon: '🥰',
    filter: (file) => file.includes('signal_a94c2600_'),
  },
  {
    id: 'signal_forever_together',
    name: 'Forever Together',
    icon: '💍',
    filter: (file) => file.includes('signal_535ecff7_'),
  },
];

function main() {
  const allFiles = fs.readdirSync(STICKERS_DIR);
  const packs = [];

  for (const def of PACK_DEFINITIONS) {
    const matchingFiles = allFiles.filter(def.filter);

    const stickers = matchingFiles.map((file, idx) => {
      const isLottie = file.endsWith('.lottie');
      const cleanLabel = file
        .replace(/\.(lottie|webp|png)$/i, '')
        .replace(/[-_.]/g, ' ')
        .replace(/animation|emojisticker|sticker/gi, '')
        .trim();

      return {
        id: `${def.id}_${idx + 1}`,
        label: cleanLabel || `${def.name} #${idx + 1}`,
        type: isLottie ? 'animated' : 'static',
        url: `/stickers/${file}`,
      };
    });

    if (stickers.length > 0) {
      packs.push({
        id: def.id,
        name: def.name,
        icon: def.icon,
        coverUrl: stickers[0]?.url || null,
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

  const outputPath = path.resolve(
    process.cwd(),
    'src/features/fridge/components/stickerData.js'
  );
  fs.writeFileSync(outputPath, fileContent, 'utf8');
  console.log(`✅ Dynamically generated stickerData.js with ${packs.length} active packs (${allFiles.length} total stickers on disk)!`);
}

main();
