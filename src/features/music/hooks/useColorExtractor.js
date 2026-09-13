import { useState, useEffect } from 'react';

/**
 * @file useColorExtractor.js
 * @description Hook that extracts a dominant accent color from an artwork image
 * using the browser's Canvas API. Samples a 4×4 pixel grid across the image,
 * averages the mid-tone values (ignoring near-black and near-white pixels),
 * and returns the result as an `rgb(r, g, b)` string. Falls back to `null`
 * when extraction fails (CORS error, invalid URL, canvas not supported, etc.).
 *
 * @module useColorExtractor
 */

/** Luminance threshold below which a pixel is considered "too dark" to sample. */
const LUMINANCE_MIN = 30;

/** Luminance threshold above which a pixel is considered "too bright" to sample. */
const LUMINANCE_MAX = 220;

/** Size of the hidden canvas used for pixel sampling. */
const SAMPLE_CANVAS_SIZE = 16;

/** Number of grid divisions along each axis for the sampling grid (4×4 = 16 samples). */
const SAMPLE_GRID_DIVISIONS = 4;

/**
 * Computes the relative luminance of an RGB color using the WCAG formula.
 *
 * @param {number} r - Red channel value (0–255).
 * @param {number} g - Green channel value (0–255).
 * @param {number} b - Blue channel value (0–255).
 * @returns {number} Luminance value (0–1).
 */
export function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const norm = val / 255;
    return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Adjusts an RGB color to guarantee adequate vibrance and contrast.
 * Lightens colors with luminance < 0.3 and darkens colors with luminance > 0.85.
 *
 * @param {number} r - Red channel (0–255).
 * @param {number} g - Green channel (0–255).
 * @param {number} b - Blue channel (0–255).
 * @returns {string} Adjusted RGB color string.
 */
export function adjustColorVibrance(r, g, b) {
  const luminance = getLuminance(r, g, b);

  let adjR = r;
  let adjG = g;
  let adjB = b;

  if (luminance < 0.3) {
    const boost = (0.3 - luminance) * 0.6;
    adjR = Math.min(255, Math.round(adjR + (255 - adjR) * boost));
    adjG = Math.min(255, Math.round(adjG + (255 - adjG) * boost));
    adjB = Math.min(255, Math.round(adjB + (255 - adjB) * boost));
  } else if (luminance > 0.85) {
    const reduce = (luminance - 0.85) * 0.6;
    adjR = Math.max(0, Math.round(adjR * (1 - reduce)));
    adjG = Math.max(0, Math.round(adjG * (1 - reduce)));
    adjB = Math.max(0, Math.round(adjB * (1 - reduce)));
  }

  return `rgb(${adjR}, ${adjG}, ${adjB})`;
}

/**
 * Extracts a dominant accent color from an image URL using the Canvas API.
 * Falls back to `null` when extraction is not possible (CORS, missing URL,
 * unsupported environment, or insufficient mid-tone pixels in the sample).
 *
 * The hook samples a 4×4 grid of pixel positions across a downscaled 16×16
 * rendering of the image, discards near-black and near-white pixels, and
 * averages the remaining channels to derive an accent color.
 *
 * Cross-origin images are loaded with `crossOrigin='anonymous'` to enable
 * canvas taint-free pixel reads — the server must supply appropriate CORS headers.
 *
 * @param {string|null|undefined} imageUrl - URL of the artwork image to analyze.
 * @returns {{ accentColor: string|null }} Object containing the extracted
 *   accent color as an `rgb(r, g, b)` string, or `null` if extraction failed.
 *
 * @example
 * const { accentColor } = useColorExtractor(track.artwork_url);
 * // accentColor → 'rgb(186, 44, 92)' or null
 */
export function useColorExtractor(imageUrl) {
  const [accentColor, setAccentColor] = useState(null);

  /* eslint-disable react-hooks/set-state-in-effect -- Intentional: reset accent color to null when imageUrl is cleared */
  useEffect(() => {
    if (!imageUrl) {
      setAccentColor(null);
      return;
    }

    let isCancelled = false;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (isCancelled) return;

      try {
        const canvas = document.createElement('canvas');
        canvas.width = SAMPLE_CANVAS_SIZE;
        canvas.height = SAMPLE_CANVAS_SIZE;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setAccentColor(null);
          return;
        }

        ctx.drawImage(img, 0, 0, SAMPLE_CANVAS_SIZE, SAMPLE_CANVAS_SIZE);

        const stepX = Math.floor(SAMPLE_CANVAS_SIZE / SAMPLE_GRID_DIVISIONS);
        const stepY = Math.floor(SAMPLE_CANVAS_SIZE / SAMPLE_GRID_DIVISIONS);

        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let sampleCount = 0;

        for (let row = 0; row < SAMPLE_GRID_DIVISIONS; row++) {
          for (let col = 0; col < SAMPLE_GRID_DIVISIONS; col++) {
            const x = col * stepX + Math.floor(stepX / 2);
            const y = row * stepY + Math.floor(stepY / 2);
            const pixelData = ctx.getImageData(x, y, 1, 1).data;

            const [r, g, b] = pixelData;
            const luminance = computeLuminance(r, g, b);

            // Discard near-black and near-white pixels — they don't yield useful accent colors.
            if (luminance >= LUMINANCE_MIN && luminance <= LUMINANCE_MAX) {
              totalR += r;
              totalG += g;
              totalB += b;
              sampleCount++;
            }
          }
        }

        if (sampleCount === 0) {
          // All samples were extreme — fall back gracefully.
          setAccentColor(null);
          return;
        }

        const avgR = Math.round(totalR / sampleCount);
        const avgG = Math.round(totalG / sampleCount);
        const vibrantColor = adjustColorVibrance(avgR, avgG, avgB);
        setAccentColor(vibrantColor);
      } catch {
        // Canvas taint or getImageData security error — CORS headers missing.
        setAccentColor(null);
      }
    };

    img.onerror = () => {
      if (!isCancelled) {
        setAccentColor(null);
      }
    };

    img.src = imageUrl;

    return () => {
      isCancelled = true;
      // Abort the load by clearing src so the browser can discard the request.
      img.src = '';
    };
  }, [imageUrl]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { accentColor };
}
