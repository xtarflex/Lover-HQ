/**
 * @file src/features/music/lib/musicUtils.js
 * @description Helper utilities for resolving track cover artwork, generating
 * deterministic complement-color gradients from text strings, and resolving YouTube thumbnails.
 */

/**
 * Returns the best available artwork URL for a track.
 *
 * @param {Object} track - The music track database row object.
 * @returns {string|null} The resolved artwork URL, or null if a gradient fallback is needed.
 */
export function getTrackArtwork(track) {
  if (!track) return null;
  if (track.artwork_url) return track.artwork_url;
  if (track.source === 'youtube') {
    const ytId = track.youtube_id || track.url;
    if (ytId) {
      return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }
  }
  return null;
}

/**
 * Resolves the best-available YouTube thumbnail URL for a given video ID.
 * Prefers maxresdefault, falls back to hqdefault.
 *
 * @param {string} videoId - YouTube video ID.
 * @returns {Promise<string>} Resolved thumbnail URL.
 */
export async function resolveYouTubeThumbnail(videoId) {
  const maxres = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const hq = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const res = await fetch(maxres, { method: 'HEAD' });
    // YouTube returns a 200 with a 120x90 placeholder image for missing maxres.
    // Check content-length to detect placeholder (it is always 1176 bytes).
    const length = parseInt(res.headers.get('content-length') || '0', 10);
    return length > 2000 ? maxres : hq;
  } catch {
    return hq;
  }
}

/**
 * Generates a deterministic CSS gradient style based on a string hash.
 * The same string (e.g. track title) always produces the same colors.
 * Used primarily for small list thumbnails (GradientAvatar) and as a fallback.
 *
 * @param {string} str - Input string (track title).
 * @returns {Object} React style object containing background and color.
 */
export function gradientFromString(str) {
  if (!str) str = 'Unknown';
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash; // Force 32-bit
  }

  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 137) % 360; // Golden angle offset for complement

  const primaryColor = `oklch(65% 0.18 ${h1})`;
  const secondaryColor = `oklch(50% 0.14 ${h2})`;

  return {
    primaryColor,
    secondaryColor,
    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
    color: '#ffffff',
  };
}

/**
 * Calculates relative luminance of an RGB color using WCAG formula.
 * Used to determine if a color is too dark/light for vibrant accent use.
 *
 * @param {number} r - Red channel (0-255).
 * @param {number} g - Green channel (0-255).
 * @param {number} b - Blue channel (0-255).
 * @returns {number} Luminance value (0-1).
 */
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const norm = val / 255;
    return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Adjusts an RGB color to have better vibrance if it's too dark or too light.
 * Uses luminance weighting to boost saturation and lightness as needed.
 *
 * @param {number} r - Red channel (0-255).
 * @param {number} g - Green channel (0-255).
 * @param {number} b - Blue channel (0-255).
 * @returns {string} Adjusted RGB color string.
 */
function adjustColorVibrance(r, g, b) {
  const luminance = getLuminance(r, g, b);

  // If too dark (luminance < 0.3), lighten it
  if (luminance < 0.3) {
    const boost = (0.3 - luminance) * 0.6; // Boost factor
    r = Math.min(255, Math.round(r + (255 - r) * boost));
    g = Math.min(255, Math.round(g + (255 - g) * boost));
    b = Math.min(255, Math.round(b + (255 - b) * boost));
  }
  // If too light (luminance > 0.85), darken it
  else if (luminance > 0.85) {
    const reduce = (luminance - 0.85) * 0.6; // Reduce factor
    r = Math.max(0, Math.round(r * (1 - reduce)));
    g = Math.max(0, Math.round(g * (1 - reduce)));
    b = Math.max(0, Math.round(b * (1 - reduce)));
  }

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Extracts the dominant color from a backdrop image URL.
 * Uses Canvas ImageData to sample the center region and average RGB values.
 * Applies luminance weighting to ensure the color is vibrant enough for accent use.
 * Falls back gracefully if the image cannot be loaded or analyzed.
 *
 * @param {string} imageUrl - The path or URL to the backdrop image.
 * @returns {Promise<string|null>} RGB color string (e.g. 'rgb(200, 150, 100)') or null on failure.
 */
export async function extractColorFromImage(imageUrl) {
  if (!imageUrl) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        // Draw image scaled to canvas
        ctx.drawImage(img, 0, 0, 100, 100);
        const imageData = ctx.getImageData(0, 0, 100, 100);
        const data = imageData.data;

        let r = 0,
          g = 0,
          b = 0;
        let count = 0;

        // Sample center 60% of the image (ignoring edges which often have artifacts)
        for (let i = 0; i < data.length; i += 4) {
          const pixelIndex = i / 4;
          const row = Math.floor(pixelIndex / 100);
          const col = pixelIndex % 100;

          // Only sample center region
          if (row >= 20 && row < 80 && col >= 20 && col < 80) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }

        if (count > 0) {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);

          // Apply luminance weighting to ensure vibrant accent color
          const adjustedColor = adjustColorVibrance(r, g, b);
          resolve(adjustedColor);
        } else {
          resolve(null);
        }
      } catch (err) {
        console.warn('Color extraction failed:', err);
        resolve(null);
      }
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = imageUrl;
  });
}

/**
 * Resolves a public Supabase Storage URL through the local/production reverse proxy
 * to bypass browser CORS security checks and enable the real-time visualizer.
 *
 * @param {string} url - The original public audio URL.
 * @returns {string} The proxied URL.
 */
export function getProxiedUrl(url) {
  if (!url) return '';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    const prefix = `${supabaseUrl}/storage/v1/object/public/`;
    if (url.startsWith(prefix)) {
      return url.replace(prefix, '/storage-proxy/');
    }
  }
  return url;
}
