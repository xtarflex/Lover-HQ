/**
 * @file scripts/buildSignalStickerData.js
 * @description Generates stickerData.js with all 6 dedicated sticker packs, CDN URLs, and coverUrl properties.
 */

import fs from 'fs';
import path from 'path';

const SUPABASE_CDN_BASE =
  'https://oxqpmfdoytdfxmofmeno.supabase.co/storage/v1/object/public/stickers';

const SIGNAL_PACK_SPECS = [
  {
    id: 'love_pack',
    name: 'Love & Romance',
    icon: '💖',
    lottieFiles: [
      'Bird pair love and flying sky.lottie',
      'Couple sharing and caring love.lottie',
      'Happy Valentine Day.lottie',
      'Heart lottie animation.lottie',
      'Love Heart.lottie',
      'Paper Plane Heart.lottie',
      'Propose love day.lottie',
      'Teddy bear couple love.lottie',
      'Two bird love animation.lottie',
    ],
  },
  {
    id: 'signal_sweet_couple',
    name: 'Sweet Couple 1',
    icon: '👩‍❤️‍👨',
    prefix: 'signal_ee5dd49d_',
    count: 40,
    ext: 'png',
  },
  {
    id: 'signal_romantic_moments',
    name: 'Romantic Moments',
    icon: '🌹',
    prefix: 'signal_c627a32c_',
    count: 24,
    ext: 'png',
  },
  {
    id: 'signal_love_hugs',
    name: 'Love & Hugs',
    icon: '🤗',
    prefix: 'signal_eb02ac62_',
    count: 6,
    ext: 'png',
  },
  {
    id: 'signal_cute_couple',
    name: 'Cute Couple Daily',
    icon: '🥰',
    prefix: 'signal_a94c2600_',
    count: 50,
    ext: 'png',
  },
  {
    id: 'signal_forever_together',
    name: 'Forever Together',
    icon: '💍',
    prefix: 'signal_535ecff7_',
    count: 50,
    ext: 'png',
  },
];

function main() {
  const packs = [];

  for (const spec of SIGNAL_PACK_SPECS) {
    const stickers = [];

    if (spec.lottieFiles) {
      spec.lottieFiles.forEach((file, idx) => {
        stickers.push({
          id: `lottie_${idx + 1}`,
          label: file.replace('.lottie', ''),
          type: 'animated',
          url: `/stickers/${file}`,
        });
      });
    }

    if (spec.prefix && spec.count) {
      for (let i = 1; i <= spec.count; i++) {
        const filename = `${spec.prefix}${i}.${spec.ext}`;
        const localUrl = `/stickers/${filename}`;
        stickers.push({
          id: `${spec.id}_${i}`,
          label: `${spec.name} #${i}`,
          type: 'static',
          url: localUrl,
        });
      }
    }

    packs.push({
      id: spec.id,
      name: spec.name,
      icon: spec.icon,
      coverUrl: stickers[0]?.url || null,
      stickers,
    });
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
  console.log(`✅ Generated stickerData.js with ${packs.length} packs!`);
}

main();
