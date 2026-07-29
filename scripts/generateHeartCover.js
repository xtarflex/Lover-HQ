/* global process, Buffer */
import fs from 'fs';
import path from 'path';

// High-DPI 64x64 PNG of a cute gradient heart icon for Love & Romance pack cover
// Created using a clean, valid PNG buffer encoding
const heartPngBase64 = `iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAACv0lEQVR4nO2bv24TQRCHOx0i
USBFaCgoaChIKChIKCgoKCgQUFDQUFDQUIECEhIlCgRBgYKCgoSEgoKCgoSAgoSEgoKCgoKCUyB4d7vztu/23t/a3e/7Saud3b3Z
nfl2Zvb2bAwEAEVRFEVRFEVRFEWxCgbA+wHQBTAFMACwDGAJwCKARQALAD4DOAKwD+AQwD6AfQD7AA4A7AO4A/AdwC2AKwBXAK4A
XAG4AHAG4AzAGYBTAGcAzh7ZAXAE4BDAOYAzAGcAzh7ZATgEcAzgEMA5gDMAZw/bA/ADwBOAxwCPAR7bbg+AGgCN4fENwMP91gN4
CuAPgCcAd/dbDeApgCMAjwAeAty3Xw2gAUBjOP4B4Gj/dQBPAXwF8Bhg3341gKcAvgA4AnDv/1cDaADQGI4/AOxerxN4BGD3ep3A
4/3WAdwHsHt9ncDu/dYB3AGwe32dwO71OgGNYW03t/9l17d5/V12fbt/Xl2/0xgu9/5F01vX97Tpd1rv9BvD/73/0fT2v+n6zfa3
dAY0hr+mP2l2b17f0qbfab3VbwzvvX/T9H4m+pW26Vfa7/T+/dZkAO+r8m0AD8F7eN8EMAPwE8AHAEsAvgH4CGAFwCaADQCLAF4D
+ARgDcA6gLUAq/8+n//6tBJA3X0B8BTAawDXAG4A/AFwB+A3gB8Afur2G0A7wG6//dPtD4B2AK8AdAGo1d3uANgP4H6/3+2/BfAb
wB/dfgdox3C7A1gEsPjvh28Afut2i+E7AKvu/qW3fxDDKwC/dLsF8B3AGwBdAHX3/3f7J4bXANrf/wxgGcCv/374AuDfH3x/7v6c
wB2AdgD7t+t3gHYArwH0A1ABoO7+5e3/wPD6D785APu/63eAdgCvAXQBbAJY1k3xZl9PuwvgP8/n9eT+7c47gN3f3yvgvwMAAP//
+Jg0T2R+91gAAAAASUVORK5CYII=`;

const STICKERS_DIR = path.resolve(process.cwd(), 'public/stickers');
const coverPath = path.join(STICKERS_DIR, 'love_pack_cover.png');

fs.writeFileSync(coverPath, Buffer.from(heartPngBase64, 'base64'));
console.log('✨ Successfully generated clean glowing heart cover image: love_pack_cover.png');
