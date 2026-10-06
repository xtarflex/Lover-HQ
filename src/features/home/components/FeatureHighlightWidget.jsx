/**
 * @file FeatureHighlightWidget.jsx
 * @description Row 2 Right Column bottom compact discovery card for Lover-HQ Bento Grid.
 * Replaces live vibe widget with dynamic feature discovery (excludes music, chat, and games).
 *
 * Implements:
 * - Randomly selects one featured module on page refresh/mount.
 * - Dynamic mood-driven background reflecting partner profile (defaults to 'happy' with smiley face theme).
 * - Border chassis effect: two glowing lights at extreme edges revolving in a 3-sequence loop
 *   (slow clockwise -> semi-fast counter-clockwise -> faster clockwise) with smooth cubic easing.
 * - High-contrast accessible copy and partner-centric interactive cues.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Smile,
  Film,
  BookOpen,
  Heart,
  ArrowRight,
  MessageSquareHeart,
} from 'lucide-react';
import { useAppContext } from '../../../contexts/AppContext';

/**
 * Feature catalogue available for discovery rotation.
 * Strictly excludes core modules already on dashboard (Music, Chat, Games).
 */
const DISCOVERY_FEATURES = [
  {
    id: 'fridge',
    title: 'Fridge',
    tagline: 'Notes, doodles & cute magnets',
    path: '/fridge',
    actionText: 'Open',
    icon: MessageSquareHeart,
    accentColor: 'text-amber-300',
    bgBadge: 'bg-amber-400/15 border-amber-400/30',
  },
  {
    id: 'theatre',
    title: 'Theatre',
    tagline: 'Stream videos together in sync',
    path: '/theatre',
    actionText: 'Watch',
    icon: Film,
    accentColor: 'text-violet-300',
    bgBadge: 'bg-violet-400/15 border-violet-400/30',
  },
  {
    id: 'journal',
    title: 'Journal',
    tagline: 'Shared memories & daily thoughts',
    path: '/journal',
    actionText: 'Write',
    icon: BookOpen,
    accentColor: 'text-rose-300',
    bgBadge: 'bg-rose-400/15 border-rose-400/30',
  },
  {
    id: 'reveal',
    title: 'Reveal',
    tagline: 'Intimate quizzes & memory lane',
    path: '/reveal',
    actionText: 'Discover',
    icon: Heart,
    accentColor: 'text-pink-300',
    bgBadge: 'bg-pink-400/15 border-pink-400/30',
  },
];

/**
 * FeatureHighlightWidget component for Bento Grid.
 *
 * @returns {React.ReactElement}
 */
export function FeatureHighlightWidget() {
  const { partner } = useAppContext();
  const navigate = useNavigate();
  const cardRef = useRef(null);

  // Measure card dimensions for pixel-perfect SVG chassis border
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!cardRef.current) return;
    const updateDimensions = () => {
      if (cardRef.current) {
        setDimensions({
          width: cardRef.current.offsetWidth || 0,
          height: cardRef.current.offsetHeight || 0,
        });
      }
    };

    updateDimensions();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateDimensions);
      observer.observe(cardRef.current);
      return () => observer.disconnect();
    }
  }, []);

  // Pick 1 random feature from candidate pool on initial load/refresh
  const [featuredItem] = useState(() => {
    const randomIndex = Math.floor(Math.random() * DISCOVERY_FEATURES.length);
    return DISCOVERY_FEATURES[randomIndex];
  });

  // Partner mood from partner profile (defaults to 'happy' per specification)
  const partnerMood = partner?.mood || 'happy';
  const isHappyMood = partnerMood.toLowerCase() === 'happy';

  const IconComponent = featuredItem.icon;

  return (
    <div
      ref={cardRef}
      data-mood={partnerMood}
      onClick={() => navigate(featuredItem.path)}
      className="relative rounded-3xl p-3.5 sm:p-4 bg-surface/75 border border-surface-border shadow-xl backdrop-blur-xl flex flex-col justify-between cursor-pointer select-none group hover:border-amber-500/40 transition-colors overflow-hidden"
    >
      {/* Dynamic Mood Background: Smiley Face Atmosphere for 'happy' mood */}
      {isHappyMood && (
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
          {/* Subtle warm amber/sunshine ambient glow gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 via-surface/80 to-amber-500/5 opacity-80" />

          {/* Large Stylized Smiley Face Watermark in bottom-right */}
          <Smile
            className="absolute -right-6 -bottom-6 w-28 h-28 text-amber-400/[0.12] -rotate-12 transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-0"
            aria-hidden="true"
          />

          {/* Micro Smiley Accent in top-left seam */}
          <Smile
            className="absolute -left-2 -top-2 w-10 h-10 text-amber-400/[0.07] rotate-45"
            aria-hidden="true"
          />
        </div>
      )}

      {/* Special Effect: Border Chassis of Two Revolving Lights in 3 Sequences */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none rounded-3xl overflow-hidden z-20"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="chassisLightGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="1" />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Physical chassis track underlay */}
        <rect
          x="1.5"
          y="1.5"
          width={dimensions.width > 3 ? dimensions.width - 3 : 'calc(100% - 3px)'}
          height={dimensions.height > 3 ? dimensions.height - 3 : 'calc(100% - 3px)'}
          rx="22"
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1.5"
        />

        {/* Two revolving lights at extreme edges in 3 sequences (slow CW -> semi-fast CCW -> faster CW) */}
        <rect
          className="animate-chassis-revolve"
          x="1.5"
          y="1.5"
          width={dimensions.width > 3 ? dimensions.width - 3 : 'calc(100% - 3px)'}
          height={dimensions.height > 3 ? dimensions.height - 3 : 'calc(100% - 3px)'}
          rx="22"
          fill="none"
          stroke="url(#chassisLightGlow)"
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength="100"
          style={{
            strokeDasharray: '8 42 8 42',
            filter:
              'drop-shadow(0 0 5px rgba(251, 191, 36, 0.95)) drop-shadow(0 0 10px rgba(245, 158, 11, 0.6))',
          }}
        />
      </svg>

      {/* Card Foreground Content */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Top Header: 'Try Out' Label */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-border/60">
          <div className="flex items-center gap-1.5 text-amber-300">
            <div className="p-1 rounded-lg bg-amber-500/10 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-sm sm:text-base font-extrabold text-text-main tracking-wide">
              Try Out
            </span>
          </div>
        </div>

        {/* Centerpiece: Simple, Punchy Discovery Content */}
        <div className="my-2.5 flex items-center gap-3">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center border shadow-sm shrink-0 transition-transform group-hover:scale-105 ${featuredItem.bgBadge}`}
          >
            <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 ${featuredItem.accentColor}`} />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm sm:text-base font-heading font-black text-text-main truncate group-hover:text-amber-300 transition-colors">
              {featuredItem.title}
            </h4>
            <p className="text-[11px] text-text-muted truncate mt-0.5 font-medium">
              {featuredItem.tagline}
            </p>
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-2 border-t border-surface-border/40 flex items-center justify-between text-[11px]">
          <span className="text-text-muted font-medium">Spotlight</span>
          <span className="font-bold text-amber-300 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
            {featuredItem.actionText} <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

export default FeatureHighlightWidget;
