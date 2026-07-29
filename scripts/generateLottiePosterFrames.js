/* global process */
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
 * Renders Frame 0 of a Lottie JSON object to PNG.
 * @param {object} lottieData
 * @param {string} outputPath
 */
async function exportLottiePosterFrame(lottieData, outputPath) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 512, height: 512 } });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
        <style>
          body { margin: 0; padding: 0; background: transparent; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; }
          #container { width: 512px; height: 512px; }
        </style>
      </head>
      <body>
        <div id="container"></div>
        <script>
          const animationData = ${JSON.stringify(lottieData)};
          window.anim = lottie.loadAnimation({
            container: document.getElementById('container'),
            renderer: 'canvas',
            loop: false,
            autoplay: false,
            animationData: animationData
          });
          window.anim.addEventListener('DOMLoaded', () => {
            window.anim.goToAndStop(0, true);
            window.isLottieReady = true;
          });
        </script>
      </body>
    </html>
  `;

  await page.setContent(htmlContent, { waitUntil: 'load' });
  await page.waitForFunction(() => window.isLottieReady === true, { timeout: 10000 });
  await page.screenshot({ path: outputPath, omitBackground: true });
  await browser.close();
}

async function main() {
  console.log('🎬 Finding .lottie vector files to generate dynamic poster frame covers...');
  if (!fs.existsSync(STICKERS_DIR)) return;

  const files = fs.readdirSync(STICKERS_DIR).filter((f) => f.endsWith('.lottie'));
  if (files.length === 0) return;

  const sampleLottieFile = path.join(STICKERS_DIR, files[0]);
  const coverOutputPath = path.join(STICKERS_DIR, 'love_pack_cover.png');

  try {
    const lottieJson = extractLottieJson(sampleLottieFile);
    if (lottieJson) {
      await exportLottiePosterFrame(lottieJson, coverOutputPath);
      console.log('🖼️ Successfully exported dynamic Lottie poster frame cover!');
    }
  } catch (err) {
    console.error('Failed to generate Lottie poster frame:', err.message);
  }
}

main().catch(console.error);
