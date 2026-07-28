/**
 * @file stickerData.js
 * @description Auto-generated custom sticker magnet packs manifest for Lover-HQ.
 * Last updated: 2026-07-27T14:23:25.886Z
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
    id: 'love_pack',
    name: 'Love & Romance',
    icon: '💖',
    stickers: [
      {
        id: 'sticker_1_1785162205885',
        label: 'Bird pair love and flying sky',
        type: 'animated',
        url: '/stickers/Bird pair love and flying sky.lottie',
      },
      {
        id: 'sticker_6_1785162205885',
        label: 'Couple sharing and caring love',
        type: 'animated',
        url: '/stickers/Couple sharing and caring love.lottie',
      },
      {
        id: 'sticker_8_1785162205886',
        label: 'Happy Valentine Day',
        type: 'animated',
        url: '/stickers/Happy Valentine Day.lottie',
      },
      {
        id: 'sticker_9_1785162205886',
        label: 'Heart lottie',
        type: 'animated',
        url: '/stickers/Heart lottie animation.lottie',
      },
      {
        id: 'sticker_11_1785162205886',
        label: 'Love Heart',
        type: 'animated',
        url: '/stickers/Love Heart.lottie',
      },
      {
        id: 'sticker_12_1785162205886',
        label: 'Paper Plane Heart',
        type: 'animated',
        url: '/stickers/Paper Plane Heart.lottie',
      },
      {
        id: 'sticker_13_1785162205886',
        label: 'valentine special',
        type: 'animated',
        url: '/stickers/valentine special.lottie',
      },
      {
        id: 'sticker_14_1785162205886',
        label: "Valentine's Day Romantic Moments",
        type: 'animated',
        url: "/stickers/Valentine's Day Romantic Moments.lottie",
      },
    ],
  },
  {
    id: 'cute_cats',
    name: 'Cute Cats',
    icon: '🐱',
    stickers: [
      {
        id: 'sticker_2_1785162205885',
        label: 'Cat Crying',
        type: 'animated',
        url: '/stickers/Cat Crying emojiSticker animation.lottie',
      },
      {
        id: 'sticker_3_1785162205885',
        label: 'Cat feeling love emotionsexpression',
        type: 'animated',
        url: '/stickers/Cat feeling love emotionsexpression. Emojisticker animation.lottie',
      },
      {
        id: 'sticker_4_1785162205885',
        label: 'Cat laughing loudly  HahahahLOL',
        type: 'animated',
        url: '/stickers/Cat laughing loudly. HahahahLOL emojisticker animation.lottie',
      },
    ],
  },
  {
    id: 'celebrations',
    name: 'Celebrations',
    icon: '🎉',
    stickers: [
      {
        id: 'sticker_5_1785162205885',
        label: 'Christmas wreath  Round frame made of branches and berries',
        type: 'animated',
        url: '/stickers/Christmas wreath. Round frame made of branches and berries.lottie',
      },
      {
        id: 'sticker_7_1785162205886',
        label: 'Gift Box with heart pop up',
        type: 'animated',
        url: '/stickers/Gift Box with heart pop up.lottie',
      },
      {
        id: 'sticker_10_1785162205886',
        label: 'like',
        type: 'animated',
        url: '/stickers/like.lottie',
      },
    ],
  },
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
