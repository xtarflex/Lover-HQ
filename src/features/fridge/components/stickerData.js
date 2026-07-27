/**
 * @file stickerData.js
 * @description Auto-generated custom sticker magnet packs manifest for Lover-HQ.
 * Last updated: 2026-07-27T13:59:46.011Z
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
export const STICKER_PACKS = [
  {
    "id": "love_pack",
    "name": "Love & Romance",
    "icon": "💖",
    "stickers": [
      {
        "id": "sticker_1_1785160786011",
        "label": "apple touch icon 180x180",
        "type": "static",
        "url": "/apple-touch-icon-180x180.png"
      },
      {
        "id": "sticker_2_1785160786011",
        "label": "Bird pair love and flying sky",
        "type": "animated",
        "url": "/Bird pair love and flying sky.lottie"
      },
      {
        "id": "sticker_3_1785160786011",
        "label": "board chat bg",
        "type": "static",
        "url": "/board-chat-bg.png"
      },
      {
        "id": "sticker_8_1785160786011",
        "label": "Couple sharing and caring love",
        "type": "animated",
        "url": "/Couple sharing and caring love.lottie"
      },
      {
        "id": "sticker_10_1785160786011",
        "label": "Happy Valentine Day",
        "type": "animated",
        "url": "/Happy Valentine Day.lottie"
      },
      {
        "id": "sticker_11_1785160786011",
        "label": "Heart lottie",
        "type": "animated",
        "url": "/Heart lottie animation.lottie"
      },
      {
        "id": "sticker_13_1785160786011",
        "label": "Love Heart",
        "type": "animated",
        "url": "/Love Heart.lottie"
      },
      {
        "id": "sticker_14_1785160786011",
        "label": "maskable icon 512x512",
        "type": "static",
        "url": "/maskable-icon-512x512.png"
      },
      {
        "id": "sticker_15_1785160786011",
        "label": "Paper Plane Heart",
        "type": "animated",
        "url": "/Paper Plane Heart.lottie"
      },
      {
        "id": "sticker_16_1785160786011",
        "label": "pwa 192x192",
        "type": "static",
        "url": "/pwa-192x192.png"
      },
      {
        "id": "sticker_17_1785160786011",
        "label": "pwa 512x512",
        "type": "static",
        "url": "/pwa-512x512.png"
      },
      {
        "id": "sticker_18_1785160786011",
        "label": "pwa 64x64",
        "type": "static",
        "url": "/pwa-64x64.png"
      },
      {
        "id": "sticker_19_1785160786011",
        "label": "valentine special",
        "type": "animated",
        "url": "/valentine special.lottie"
      },
      {
        "id": "sticker_20_1785160786011",
        "label": "Valentine's Day Romantic Moments",
        "type": "animated",
        "url": "/Valentine's Day Romantic Moments.lottie"
      }
    ]
  },
  {
    "id": "cute_cats",
    "name": "Cute Cats",
    "icon": "🐱",
    "stickers": [
      {
        "id": "sticker_4_1785160786011",
        "label": "Cat Crying",
        "type": "animated",
        "url": "/Cat Crying emojiSticker animation.lottie"
      },
      {
        "id": "sticker_5_1785160786011",
        "label": "Cat feeling love emotionsexpression",
        "type": "animated",
        "url": "/Cat feeling love emotionsexpression. Emojisticker animation.lottie"
      },
      {
        "id": "sticker_6_1785160786011",
        "label": "Cat laughing loudly  HahahahLOL",
        "type": "animated",
        "url": "/Cat laughing loudly. HahahahLOL emojisticker animation.lottie"
      }
    ]
  },
  {
    "id": "celebrations",
    "name": "Celebrations",
    "icon": "🎉",
    "stickers": [
      {
        "id": "sticker_7_1785160786011",
        "label": "Christmas wreath  Round frame made of branches and berries",
        "type": "animated",
        "url": "/Christmas wreath. Round frame made of branches and berries.lottie"
      },
      {
        "id": "sticker_9_1785160786011",
        "label": "Gift Box with heart pop up",
        "type": "animated",
        "url": "/Gift Box with heart pop up.lottie"
      },
      {
        "id": "sticker_12_1785160786011",
        "label": "like",
        "type": "animated",
        "url": "/like.lottie"
      }
    ]
  }
];

/**
 * Resolves fully qualified sticker URL with Supabase Storage fallback support.
 */
export function getStickerUrl(path, fallbackUrl) {
  if (path && typeof window !== 'undefined' && window.__SUPABASE_URL__) {
    return `${window.__SUPABASE_URL__}/storage/v1/object/public/stickers/${path}`;
  }
  return fallbackUrl;
}
