/**
 * @file scripts/uploadStickers.js
 * @description Automated Node.js script to scan, group, upload, and generate sticker packs
 * in Supabase Storage and stickerData.js manifest automatically.
 */
/* global process */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Environment variables fallback or local config
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://oxqpmfdoytdfxmofmeno.supabase.co';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const STICKERS_DIR = path.resolve(PUBLIC_DIR, 'stickers');
const OUTPUT_DATA_FILE = path.resolve(
  process.cwd(),
  'src/features/fridge/components/stickerData.js'
);

async function runUpload() {
  console.log('🚀 Starting Automated Sticker Pack Processing...');

  if (!fs.existsSync(STICKERS_DIR)) {
    fs.mkdirSync(STICKERS_DIR, { recursive: true });
  }

  // Find sticker files strictly inside public/stickers/
  const allFiles = [];

  if (fs.existsSync(STICKERS_DIR)) {
    const subFiles = fs.readdirSync(STICKERS_DIR);
    subFiles.forEach((file) => {
      const lower = file.toLowerCase();
      // Ignore system branding icons
      if (
        lower.startsWith('pwa') ||
        lower.startsWith('apple-touch') ||
        lower.startsWith('maskable') ||
        lower.startsWith('logo') ||
        lower.startsWith('og-image')
      ) {
        return;
      }
      if (file.endsWith('.lottie') || file.endsWith('.webp') || file.endsWith('.png')) {
        allFiles.push({
          filename: file,
          fullPath: path.join(STICKERS_DIR, file),
          relPath: `stickers/${file}`,
        });
      }
    });
  }

  console.log(`📦 Found ${allFiles.length} sticker assets in public directory.`);

  // Auto-Group files into themed sticker packs based on keywords
  const packMap = {
    love_pack: {
      id: 'love_pack',
      name: 'Love & Romance',
      icon: '💖',
      stickers: [],
    },
    cute_cats: {
      id: 'cute_cats',
      name: 'Cute Cats',
      icon: '🐱',
      stickers: [],
    },
    celebrations: {
      id: 'celebrations',
      name: 'Celebrations',
      icon: '🎉',
      stickers: [],
    },
  };

  // Create Supabase client for storage upload
  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.s6C4Q5wz_placeholder'
  );

  for (let i = 0; i < allFiles.length; i++) {
    const { filename, fullPath, relPath } = allFiles[i];
    const lower = filename.toLowerCase();
    const cleanLabel = filename
      .replace(/\.(lottie|webp|png)$/i, '')
      .replace(/[-_.]/g, ' ')
      .replace(/animation|emojisticker|sticker/gi, '')
      .trim();

    const isAnimated =
      filename.endsWith('.lottie') || lower.includes('animated') || lower.includes('anim');

    // Attempt Supabase Storage Upload
    let cdnUrl = `/${relPath.replace(/\\/g, '/')}`;
    try {
      if (SUPABASE_KEY) {
        const fileData = fs.readFileSync(fullPath);
        const { error } = await supabase.storage.from('stickers').upload(filename, fileData, {
          upsert: true,
          contentType: filename.endsWith('.lottie') ? 'application/json' : 'image/webp',
        });
        if (!error) {
          cdnUrl = `${SUPABASE_URL}/storage/v1/object/public/stickers/${encodeURIComponent(filename)}`;
        }
      }
    } catch {
      // Fall back to local URL
    }

    const item = {
      id: `sticker_${i + 1}_${Date.now()}`,
      label: cleanLabel || `Sticker ${i + 1}`,
      type: isAnimated ? 'animated' : 'static',
      url: cdnUrl,
    };

    if (lower.includes('cat')) {
      packMap.cute_cats.stickers.push(item);
    } else if (lower.includes('christmas') || lower.includes('gift') || lower.includes('like')) {
      packMap.celebrations.stickers.push(item);
    } else {
      packMap.love_pack.stickers.push(item);
    }
  }

  const activePacks = Object.values(packMap).filter((p) => p.stickers.length > 0);

  // Generate updated stickerData.js file content
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
 * @property {Array<StickerItem>} stickers
 */

/** @type {Array<StickerPack>} */
export const STICKER_PACKS = ${JSON.stringify(activePacks, null, 2)};

/**
 * Resolves fully qualified sticker URL with Supabase Storage fallback support.
 */
export function getStickerUrl(path, fallbackUrl) {
  if (path && typeof window !== 'undefined' && window.__SUPABASE_URL__) {
    return \`\${window.__SUPABASE_URL__}/storage/v1/object/public/stickers/\${path}\`;
  }
  return fallbackUrl;
}
`;

  fs.writeFileSync(OUTPUT_DATA_FILE, fileContent, 'utf8');
  console.log(
    `✅ Successfully generated ${activePacks.length} sticker packs (${allFiles.length} stickers total) in stickerData.js!`
  );
}

runUpload().catch((err) => {
  console.error('❌ Error processing stickers:', err);
});
