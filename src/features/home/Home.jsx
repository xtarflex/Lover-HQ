/**
 * @file Home.jsx
 * @description Central Dashboard Bento-Grid hub for Lover-HQ.
 * Orchestrates:
 * - Row 1: Full-width Hero Card (Media Notification Player / Ambient Milestone)
 * - Row 2: 2-Column Asymmetric Bento Grid on all viewports (Left: Tall Chat Card col-span-7; Right: Games Tracker + Ambient Presence col-span-5)
 * - Row 3: Navigator Shelf (Horizontal swipeable carousel of all 6 modules)
 * - Tactile canvas with micro-dot matrix underlay and subtle SVG film grain.
 */

import React from 'react';
import { HeroCard } from './components/HeroCard';
import { ChatWidget } from './components/ChatWidget';
import { GamesWidget } from './components/GamesWidget';
import { FeatureHighlightWidget } from './components/FeatureHighlightWidget';
import { NavigatorCarousel } from './components/NavigatorCarousel';

/**
 * Dashboard Home Screen component.
 *
 * @returns {React.ReactElement}
 */
export default function Home() {
  return (
    <div className="relative min-h-full pb-28 pt-1 px-1 sm:px-2 max-w-lg mx-auto flex flex-col gap-3.5 sm:gap-4 select-none">
      {/* Tactile Diamond Dot Matrix with Double Radial Corner Auras */}
      <svg
        className="fixed inset-0 pointer-events-none w-full h-full z-0 select-none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Diagonal / Diamond Staggered Dot Pattern (Neutral Base across screen) */}
          <pattern id="bg-diamond-dots-neutral" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="1.75" cy="1.75" r="0.75" fill="rgba(255, 255, 255, 0.07)" />
            <circle cx="5.25" cy="5.25" r="0.75" fill="rgba(255, 255, 255, 0.07)" />
          </pattern>

          {/* Diagonal / Diamond Staggered Dot Mask for the Colored Radials */}
          <pattern id="bg-diamond-dots-mask" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="1.75" cy="1.75" r="0.8" fill="white" />
            <circle cx="5.25" cy="5.25" r="0.8" fill="white" />
          </pattern>

          <mask id="radial-dots-mask">
            <rect width="100%" height="100%" fill="url(#bg-diamond-dots-mask)" />
          </mask>

          {/* Top-Right Smaller Radial Aura (Warm Amber glowing behind partner presence) */}
          <radialGradient id="radial-top-right" cx="95%" cy="5%" r="45%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>

          {/* Bottom-Left Larger Radial Aura (Deep Cyan anchoring navigation and quick sparks) */}
          <radialGradient id="radial-bottom-left" cx="5%" cy="95%" r="70%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Base subtle neutral diamond dots across entire screen */}
        <rect width="100%" height="100%" fill="url(#bg-diamond-dots-neutral)" />

        {/* 2. Double radial auras masked to diamond micro-dots */}
        <g mask="url(#radial-dots-mask)">
          <rect width="100%" height="100%" fill="url(#radial-top-right)" />
          <rect width="100%" height="100%" fill="url(#radial-bottom-left)" />
        </g>
      </svg>

      {/* Subtle Inlined SVG Film Grain Noise Overlay */}
      <svg className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1] w-full h-full">
        <filter id="dashboard-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#dashboard-noise)" />
      </svg>

      {/* Bento Grid Content Container */}
      <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
        {/* ROW 1: Wide Hero Module */}
        <section aria-label="Hero status and media player">
          <HeroCard />
        </section>

        {/* ROW 2: Asymmetric 2-Column Bento Grid (Visible on all screen sizes) */}
        <section
          aria-label="Core widgets"
          className="grid grid-cols-12 gap-2 sm:gap-3.5 items-stretch"
        >
          {/* Left Column: Tall Chat Card (7 of 12 columns) */}
          <div className="col-span-7 h-full flex flex-col">
            <ChatWidget />
          </div>

          {/* Right Column: Stacked Compact Cards (5 of 12 columns) */}
          <div className="col-span-5 flex flex-col gap-2 sm:gap-3.5 justify-between">
            <GamesWidget />
            <FeatureHighlightWidget />
          </div>
        </section>

        {/* ROW 3: Core Navigator Shelf */}
        <section aria-label="Module navigator" className="mt-0.5 sm:mt-1">
          <NavigatorCarousel />
        </section>
      </div>
    </div>
  );
}
