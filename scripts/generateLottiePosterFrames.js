/* global process, Buffer */
/**
 * @file scripts/generateLottiePosterFrames.js
 * @description Dynamically renders Frame 0 of any .lottie file to a static PNG poster frame cover
 * using Playwright headless browser automation in Node.js.
 */

import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { extractLottieJson } from './lottieExtractor.js';

const STICKERS_DIR = path.resolve(process.cwd(), 'public/stickers');

/**
 * Dynamically exports Frame 0 of a Lottie JSON object to a PNG file.
 *
 * @param {object} lottieJson
 * @param {string} outputPath
 */
export async function exportLottiePosterFrame(lottieJson, outputPath) {
  if (!lottieJson) return false;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
  <style>
    body, html { margin: 0; padding: 0; background: transparent; overflow: hidden; }
    #container { width: 128px; height: 128px; }
  </style>
</head>
<body>
  <div id="container"></div>
  <script>
    const animationData = ${JSON.stringify(lottieJson)};
    const anim = lottie.loadAnimation({
      container: document.getElementById('container'),
      renderer: 'canvas',
      loop: false,
      autoplay: false,
      animationData: animationData
    });
    anim.goToAndStop(0, true);
    window.isRendered = true;
  </script>
</body>
</html>
  `;

  await page.setContent(html);
  await page.waitForFunction(() => window.isRendered === true);
  await page.waitForTimeout(300);

  const container = page.locator('#container');
  const imageBuffer = await container.screenshot({ omitBackground: true, type: 'png' });

  await browser.close();

  fs.writeFileSync(outputPath, imageBuffer);
  console.log(`🖼️ Successfully exported dynamic Lottie poster frame: ${path.basename(outputPath)}`);
  return true;
}

async function main() {
  const files = fs.readdirSync(STICKERS_DIR).filter((f) => f.endsWith('.lottie'));
  if (files.length === 0) return;

  console.log(`🎬 Found ${files.length} .lottie vector files. Generating dynamic poster frame cover...`);

  // Generate cover from first Lottie sticker in love_pack
  const firstLottieFile = path.join(STICKERS_DIR, files[0]);
  const lottieBuf = fs.readFileSync(firstLottieFile);
  const lottieJson = extractLottieJson(lottieBuf);

  if (lottieJson) {
    const coverPath = path.join(STICKERS_DIR, 'love_pack_cover.png');
    await exportLottiePosterFrame(lottieJson, coverPath);
  }
}

if (process.argv[1] && process.argv[1].endsWith('generateLottiePosterFrames.js')) {
  main();
}
