/**
 * @file NavigatorCarousel.jsx
 * @description Row 3 Compact horizontal navbar scroller for navigation modules.
 * Refactored from bulky card layout to an icon-centric 72px button layout.
 *
 * Implements:
 * - Compact navbar scroller layout (gap: 12px, py: 8px).
 * - 72px items with 56px icon wrappers and high-contrast labels.
 * - Text-based 'NEW' badge for spotlight features.
 * - Typographical update: 'Navigation' section header.
 * - Smooth touch interaction with Framer Motion tap/hover states.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Film, BookOpen, MessageCircle, Music, Gamepad2, Sparkles } from 'lucide-react';
import { FridgeIcon } from '../../../lib/icons';
import { useDashboardRanking } from '../hooks/useDashboardRanking';
import { useAppContext } from '../../../contexts/AppContext';

/**
 * Maps module identifier to high-visibility icon component.
 *
 * @param {string} iconKey
 * @returns {React.ReactElement}
 */
const renderModuleIcon = (iconKey) => {
  switch (iconKey) {
    case 'fridge':
      return <FridgeIcon className="w-6 h-6 text-amber-400" />;
    case 'chat':
      return <MessageCircle className="w-6 h-6 text-sky-400" />;
    case 'music':
      return <Music className="w-6 h-6 text-rose-400" />;
    case 'theatre':
      return <Film className="w-6 h-6 text-red-400" />;
    case 'journal':
      return <BookOpen className="w-6 h-6 text-amber-200" />;
    case 'games':
      return <Gamepad2 className="w-6 h-6 text-emerald-400" />;
    case 'reveal':
      return <Sparkles className="w-6 h-6 text-pink-400" />;
    default:
      return <Sparkles className="w-6 h-6 text-primary" />;
  }
};

/**
 * NavigatorCarousel component for Dashboard Row 3.
 *
 * @returns {React.ReactElement}
 */
export function NavigatorCarousel() {
  const navigate = useNavigate();
  const { rankedModules } = useDashboardRanking();
  const { unreadChatCount = 0 } = useAppContext();

  return (
    <div className="w-full select-none">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1 mb-1.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Navigation</h3>
        <span className="text-[10px] text-text-muted">Swipe →</span>
      </div>

      {/* Compact Horizontal Navbar Scroller with Invisible Scrollbar */}
      <div
        className="navigation-container flex items-center gap-3 overflow-x-auto py-2 -mx-1 px-1 scroll-smooth no-scrollbar [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {rankedModules.map((item) => {
          const isNewFeature = item.isNew || item.tag === 'New Feature';

          return (
            <motion.div
              key={item.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => navigate(item.path)}
              className="nav-item w-[72px] shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group text-center"
            >
              {/* 56px Icon Wrapper */}
              <div className="icon-wrapper relative w-14 h-14 rounded-2xl bg-surface/85 border border-surface-border shadow-md flex items-center justify-center transition-all group-hover:scale-105 group-hover:border-primary/50 group-active:scale-95 group-hover:shadow-lg">
                {renderModuleIcon(item.icon)}

                {/* 'NEW' Feature Badge */}
                {isNewFeature && (
                  <span
                    className="badge absolute top-0 -right-1 bg-primary text-white text-[7px] font-bold uppercase px-1 py-0.5 rounded shadow-sm leading-none pointer-events-none"
                    style={{ letterSpacing: '0.05em' }}
                  >
                    NEW
                  </span>
                )}

                {/* Unread Chat Badge */}
                {item.id === 'chat' && unreadChatCount > 0 && !isNewFeature && (
                  <span
                    className="badge absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full shadow-md leading-none pointer-events-none"
                    aria-label={`${unreadChatCount} unread messages`}
                  >
                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                  </span>
                )}
              </div>

              {/* High-visibility label */}
              <span className="label text-xs font-semibold text-text-main group-hover:text-primary transition-colors truncate max-w-[70px]">
                {item.name}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default NavigatorCarousel;
