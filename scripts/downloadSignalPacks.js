/* global process, Buffer */
/**
 * @file scripts/downloadSignalPacks.js
 * @description Node.js script to download, decrypt, validate Signal Sticker Packs & covers,
 * and purge any invalid or corrupted image files from public/stickers.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';

const SIGNAL_PACKS = [
  {
    id: 'ee5dd49ddf307bb42dedf28fe52c96a1',
    key: 'c017fc1de25590d598adad9c2cdd0f65d1d36b57d1fed9255a74b06fbc44d906',
    name: 'Sweet Couple 1',
  },
  {
    id: 'c627a32c7c121fb203137426a5a0d4a0',
    key: '9d09087ae227e8b0391c0069e5b2597a0086522c86280c18e5505658a2a9520f',
    name: 'Romantic Moments',
  },
  {
    id: 'eb02ac62bb462e53cdb1290ade796cd7',
    key: '90a737eadaa09fe7ad6341b0ab673764c8abe5fb6c325d57f2357837d7757bd8',
    name: 'Love & Hugs',
  },
  {
    id: 'a94c26005bec0195f2ef5b23b68445cf',
    key: '1833cb1d0aaeb36af9e92c845ede7041dd8d9dc7bd68258eede74fe25dcf7d62',
    name: 'Cute Couple Daily',
  },
  {
    id: '535ecff7458a5ef028a9251b770ec983',
    key: '12105a25b4c31e96191d77d9f4a2bfdd42276f58cd03551cfff5ca81205af7ee',
    name: 'Forever Together',
  },
];

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const STICKERS_DIR = path.resolve(PUBLIC_DIR, 'stickers');

function deriveKeys(packKeyHex) {
  const packKey = Buffer.from(packKeyHex, 'hex');
  const salt = Buffer.alloc(32, 0);
  const info = Buffer.from('Sticker Pack', 'utf8');
  const hkdf = crypto.hkdfSync('sha256', packKey, salt, info, 64);
  const derived = Buffer.from(hkdf);
  return {
    aesKey: derived.subarray(0, 32),
    hmacKey: derived.subarray(32, 64),
  };
}

function isValidImageHeader(buf) {
  if (!buf || buf.length < 12) return false;
  // PNG magic number: 0x89 0x50 0x4E 0x47 (\x89PNG)
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  // WebP magic header: RIFF....WEBP
  const isWebp = buf.subarray(0, 12).toString('ascii').includes('WEBP');
  return isPng || isWebp;
}

function decryptSignalBuffer(encryptedBuf, keyHex) {
  if (!encryptedBuf || encryptedBuf.length <= 48) return null;

  const iv = encryptedBuf.subarray(0, 16);
  const ciphertext = encryptedBuf.subarray(16, encryptedBuf.length - 32);

  const methods = [
    () => {
      const { aesKey } = deriveKeys(keyHex);
      const decipher = crypto.createDecipheriv('aes-256-ctr', aesKey, iv);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    },
    () => {
      const { aesKey } = deriveKeys(keyHex);
      const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
      decipher.setAutoPadding(false);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    },
    () => {
      const key = Buffer.from(keyHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    },
  ];

  for (const fn of methods) {
    try {
      const res = fn();
      if (isValidImageHeader(res)) return res;
    } catch {
      // try next
    }
  }

  try {
    const { aesKey } = deriveKeys(keyHex);
    const decipher = crypto.createDecipheriv('aes-256-ctr', aesKey, iv);
    const fullCipher = encryptedBuf.subarray(16);
    const res = Buffer.concat([decipher.update(fullCipher), decipher.final()]);
    if (isValidImageHeader(res)) return res;
  } catch {
    // ignore
  }

  return null;
}

function httpGet(url) {
  return new Promise((resolve) => {
    const options = {
      headers: { 'User-Agent': 'Signal-Desktop/7.12.0', Accept: '*/*' },
      rejectUnauthorized: false,
    };
    const req = https.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(httpGet(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return resolve(null);
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', () => resolve(null));
    });
    req.on('error', () => {
      resolve(null);
    });
  });
}

function purgeCorruptedFiles() {
  console.log('🧹 Purging corrupted/invalid files in public/stickers...');
  let purgedCount = 0;
  if (!fs.existsSync(STICKERS_DIR)) return;

  const files = fs.readdirSync(STICKERS_DIR);
  for (const file of files) {
    const filePath = path.join(STICKERS_DIR, file);
    if (file.endsWith('.lottie')) continue; // Skip lottie vector JSON archives

    try {
      const buf = fs.readFileSync(filePath);
      if (!isValidImageHeader(buf)) {
        fs.unlinkSync(filePath);
        console.log(`  ❌ Purged corrupted file: ${file}`);
        purgedCount++;
      }
    } catch (err) {
      console.error(`Error reading ${file}:`, err.message);
    }
  }
  console.log(`🧹 Cleaned up ${purgedCount} invalid/corrupted files.`);
}

async function fetchAndProcessPack(pack) {
  console.log(`\n📦 Fetching Signal Pack & Official Cover: "${pack.name}" (${pack.id})...`);
  
  // 1. Fetch official pack cover image
  const coverUrl = `https://cdn.signal.org/stickers/${pack.id}/full/cover`;
  const encryptedCover = await httpGet(coverUrl);
  if (encryptedCover) {
    const coverBuf = decryptSignalBuffer(encryptedCover, pack.key);
    if (coverBuf) {
      const isWebp = coverBuf.subarray(0, 12).toString('ascii').includes('WEBP');
      const ext = isWebp ? 'webp' : 'png';
      const coverFileName = `signal_${pack.id.slice(0, 8)}_cover.${ext}`;
      fs.writeFileSync(path.join(STICKERS_DIR, coverFileName), coverBuf);
      console.log(`  🖼️ Successfully saved official cover image: ${coverFileName}`);
    }
  }

  // 2. Fetch pack stickers
  const downloadedFiles = [];
  for (let stickerId = 0; stickerId < 60; stickerId++) {
    const stickerUrl = `https://cdn.signal.org/stickers/${pack.id}/full/${stickerId}`;
    const encryptedSticker = await httpGet(stickerUrl);
    if (!encryptedSticker) {
      break; // Reached end of pack
    }

    const stickerBuf = decryptSignalBuffer(encryptedSticker, pack.key);

    if (stickerBuf) {
      const isWebp = stickerBuf.subarray(0, 12).toString('ascii').includes('WEBP');
      const ext = isWebp ? 'webp' : 'png';
      const filename = `signal_${pack.id.slice(0, 8)}_${stickerId + 1}.${ext}`;
      const filePath = path.join(STICKERS_DIR, filename);

      fs.writeFileSync(filePath, stickerBuf);
      downloadedFiles.push(filename);
    }
  }

  console.log(`  ✅ Successfully extracted ${downloadedFiles.length} valid stickers for "${pack.name}".`);
  return downloadedFiles;
}

async function main() {
  if (!fs.existsSync(STICKERS_DIR)) {
    fs.mkdirSync(STICKERS_DIR, { recursive: true });
  }

  // First purge old corrupted files
  purgeCorruptedFiles();

  let totalDownloaded = 0;
  for (const pack of SIGNAL_PACKS) {
    const files = await fetchAndProcessPack(pack);
    totalDownloaded += files.length;
  }

  // Second purge check to guarantee 100% clean directory
  purgeCorruptedFiles();

  console.log(`\n🎉 Total Signal Stickers Downloaded & Validated: ${totalDownloaded}`);
}

main();
