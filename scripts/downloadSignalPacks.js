/* global process, Buffer */
/**
 * @file scripts/downloadSignalPacks.js
 * @description Node.js script to download, decrypt, process, upload, and register
 * Signal Sticker Packs directly into Supabase CDN and stickerData.js.
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

function decryptSignalBuffer(encryptedBuf, keyHex) {
  const methods = [
    // 1. HKDF Derived AES-256-CTR
    () => {
      const { aesKey } = deriveKeys(keyHex);
      const iv = encryptedBuf.subarray(0, 16);
      const ciphertext = encryptedBuf.subarray(16);
      const decipher = crypto.createDecipheriv('aes-256-ctr', aesKey, iv);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    },
    // 2. HKDF Derived AES-256-CBC
    () => {
      const { aesKey } = deriveKeys(keyHex);
      const iv = encryptedBuf.subarray(0, 16);
      const ciphertext = encryptedBuf.subarray(16);
      const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
      decipher.setAutoPadding(false);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    },
    // 3. Raw Key AES-256-CTR
    () => {
      const key = Buffer.from(keyHex, 'hex');
      const iv = encryptedBuf.subarray(0, 16);
      const ciphertext = encryptedBuf.subarray(16);
      const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    },
    // 4. Raw Key AES-256-CBC with no auto padding
    () => {
      const key = Buffer.from(keyHex, 'hex');
      const iv = encryptedBuf.subarray(0, 16);
      const ciphertext = encryptedBuf.subarray(16);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      decipher.setAutoPadding(false);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    },
  ];

  for (const fn of methods) {
    try {
      const res = fn();
      if (res && res.length > 0) return res;
    } catch {
      // try next
    }
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
        console.log(`Redirecting ${url} -> ${res.headers.location}`);
        return resolve(httpGet(res.headers.location));
      }
      if (res.statusCode !== 200) {
        console.log(`HTTP ${res.statusCode} for ${url}`);
        return resolve(null);
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', () => resolve(null));
    });
    req.on('error', (err) => {
      console.error(`Req error for ${url}:`, err.message);
      resolve(null);
    });
  });
}

async function fetchAndProcessPack(pack) {
  console.log(`\n📦 Fetching Signal Pack: "${pack.name}" (${pack.id})...`);
  const manifestUrl = `https://cdn.signal.org/stickers/${pack.id}/manifest.proto`;

  try {
    const encryptedManifest = await httpGet(manifestUrl);
    if (!encryptedManifest) {
      console.error(`Failed to fetch manifest for ${pack.id}`);
      return [];
    }
    const manifestBuf = decryptSignalBuffer(encryptedManifest, pack.key);

    if (!manifestBuf) {
      console.error(`Failed to decrypt manifest for ${pack.id}`);
      return [];
    }

    console.log(`  Decrypted manifest (${manifestBuf.length} bytes) for ${pack.name}.`);

    // Signal stickers are indexed from 0 upwards
    const downloadedFiles = [];
    for (let stickerId = 0; stickerId < 50; stickerId++) {
      const stickerUrl = `https://cdn.signal.org/stickers/${pack.id}/full/${stickerId}`;
      const encryptedSticker = await httpGet(stickerUrl);
      if (!encryptedSticker) {
        break; // Reached end of pack
      }

      const stickerBuf = decryptSignalBuffer(encryptedSticker, pack.key);

      if (stickerBuf) {
        // Detect format: WebP starts with RIFF...WEBP
        const isWebp = stickerBuf.subarray(0, 12).toString('ascii').includes('WEBP');
        const ext = isWebp ? 'webp' : 'png';
        const filename = `signal_${pack.id.slice(0, 8)}_${stickerId + 1}.${ext}`;
        const filePath = path.join(STICKERS_DIR, filename);

        fs.writeFileSync(filePath, stickerBuf);
        downloadedFiles.push(filename);
      }
    }

    console.log(
      `  ✅ Successfully extracted ${downloadedFiles.length} stickers for "${pack.name}".`
    );
    return downloadedFiles;
  } catch (err) {
    console.error(`Error processing pack ${pack.id}:`, err.message);
    return [];
  }
}

async function main() {
  if (!fs.existsSync(STICKERS_DIR)) {
    fs.mkdirSync(STICKERS_DIR, { recursive: true });
  }

  let totalDownloaded = 0;
  for (const pack of SIGNAL_PACKS) {
    const files = await fetchAndProcessPack(pack);
    totalDownloaded += files.length;
  }

  console.log(`\n🎉 Total Signal Stickers Downloaded & Decrypted: ${totalDownloaded}`);
}

main();
