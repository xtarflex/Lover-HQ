import * as THREE from 'three';

/**
 * @file src/features/music/lib/audioUtils.js
 * @description Pure utility functions for audio spectrum doctoring, color parsing,
 * and dynamic sector palette derivation used across music visualizer components.
 */

/**
 * Attenuates and doctors raw Uint8Array audio spectrum data.
 * Applies mid-tone dynamic range compression.
 *
 * @param {Uint8Array} rawData - Raw spectrum data array (0 to 255).
 * @param {Float32Array} targetBuffer - Target float array buffer (0.0 to 1.0).
 * @returns {Float32Array} The doctored float frequency buffer.
 */
export function doctorAudioData(rawData, targetBuffer) {
  const len = rawData.length;

  for (let i = 0; i < len; i++) {
    let normalized = rawData[i] / 255.0;

    // 1. Dynamic Range Compression / Mid-Tone Boosting
    if (normalized < 0.3) {
      normalized = Math.sqrt(normalized) * 0.75;
    }

    targetBuffer[i] = normalized;
  }

  return targetBuffer;
}

/**
 * Parses an RGB or HEX color string into a normalized THREE.Color object.
 *
 * @param {string|null|undefined} colorStr - Input color string.
 * @returns {THREE.Color} Parsed Three.js color instance.
 */
export function parseColorToThree(colorStr) {
  if (!colorStr) return new THREE.Color(0x0047bb); // Cobalt blue default

  if (colorStr.startsWith('rgb')) {
    const matches = colorStr.match(/\d+/g);
    if (matches && matches.length >= 3) {
      return new THREE.Color(
        parseInt(matches[0], 10) / 255,
        parseInt(matches[1], 10) / 255,
        parseInt(matches[2], 10) / 255
      );
    }
  }

  if (colorStr.startsWith('#')) {
    return new THREE.Color(colorStr);
  }

  return new THREE.Color(0x0047bb);
}

/**
 * Generates an analogous/triadic dynamic color sector palette derived from the primary accent color using HSL offsets.
 *
 * @param {THREE.Color} primaryColor - Base primary theme accent color.
 * @returns {{ primary: THREE.Color, centerPurple: THREE.Color, bottomRed: THREE.Color, cornerAmber: THREE.Color }} Sector color map.
 */
export function deriveSectorPalette(primaryColor) {
  const primary = primaryColor.clone();

  // Sector 2 (Center Belt): Shift hue +36° (Analogous Violet/Purple)
  const centerPurple = primary.clone().offsetHSL(0.1, 0.1, -0.05);

  // Sector 3 (Bottom-Left Base): Shift hue -45° (Analogous Crimson/Rose)
  const bottomRed = primary.clone().offsetHSL(-0.12, 0.15, -0.1);

  // Sector 4 (Bottom-Right Corner Glow): Shift hue +75° (Warm Amber/Orange highlight)
  const cornerAmber = primary.clone().offsetHSL(0.21, 0.2, 0.05);

  return { primary, centerPurple, bottomRed, cornerAmber };
}
