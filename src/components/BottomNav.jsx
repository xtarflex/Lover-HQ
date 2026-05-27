import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FridgeIcon, Music, Gamepad2, ClipboardList, LoverHQLogo } from '../lib/icons';
import { ICON_SIZES } from '../lib/constants';
import { useAppContext } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { getFridgeItemsNewerThan } from '../services/fridge';

/**
 * Bottom navigation bar component with a curved cutout background and a floating glowing home button.
 * Renders main navigation links for the application and displays a real-time unread badge on the Fridge tab.
 *
 * @returns {React.ReactElement} The BottomNav component.
 */
export function BottomNav() {
  const { user, partner } = useAppContext();
  const location = useLocation();
  const [hasNewFridge, setHasNewFridge] = useState(false);

  const userId = user?.id;
  const partnerId = partner?.id;

  // Track route changes, manage last_visited_fridge and fetch unread fridge items
  useEffect(() => {
    if (!userId) return;

    if (location.pathname === '/fridge') {
      setTimeout(() => setHasNewFridge(false), 0);
      localStorage.setItem('last_visited_fridge', new Date().toISOString());
    } else {
      const checkNewItems = async () => {
        const lastVisited = localStorage.getItem('last_visited_fridge');
        if (!lastVisited) {
          // If never visited, set it to now to avoid badging old items
          localStorage.setItem('last_visited_fridge', new Date().toISOString());
          return;
        }

        try {
          const data = await getFridgeItemsNewerThan(userId, partnerId, lastVisited);
          if (data && data.length > 0) {
            setHasNewFridge(true);
          }
        } catch (err) {
          console.error('Error checking for new fridge items:', err);
        }
      };

      checkNewItems();
    }
  }, [location.pathname, userId, partnerId]);

  // Subscribe to real-time changes in fridge_items table to trigger badge
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('fridge_nav_badge')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fridge_items',
        },
        (payload) => {
          // Only show badge if the user is not currently in the Fridge tab
          if (location.pathname !== '/fridge') {
            const itemUserId = payload.new?.user_id || payload.old?.user_id;
            if (itemUserId === userId || itemUserId === partnerId) {
              setHasNewFridge(true);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [location.pathname, userId, partnerId]);

  const navItems = [
    { name: 'Fridge', path: '/fridge', icon: FridgeIcon },
    { name: 'Music', path: '/music', icon: Music },
    { name: 'Home', path: '/home', isHome: true },
    { name: 'Games', path: '/games', icon: Gamepad2 },
    { name: 'Board', path: '/board', icon: ClipboardList },
  ];

  return (
    <nav className="bg-surface/90 backdrop-blur-lg border-t border-surface-border fixed bottom-0 left-0 right-0 w-full h-20 z-50 px-4 flex items-center">
      {/* Nav Items Content */}
      <ul className="flex items-center justify-around h-full w-full max-w-lg mx-auto relative">
        {navItems.map((item) => {
          if (item.isHome) {
            return (
              <li
                key={item.path}
                className="flex-1 relative flex justify-center h-full items-center"
              >
                <NavLink
                  to={item.path}
                  aria-label="Home"
                  className={({ isActive }) =>
                    `absolute -top-5 w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center border-4 border-background transition-all duration-300 hover:scale-110 ${
                      isActive ? 'scale-110 border-primary' : 'border-surface-border/80'
                    }`
                  }
                >
                  <LoverHQLogo className="text-white w-7 h-7" />
                </NavLink>
              </li>
            );
          }

          const IconComponent = item.icon;
          return (
            <li key={item.path} className="flex-1 flex justify-center h-full items-center">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-full h-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    isActive ? 'text-primary scale-105' : 'text-text-muted hover:text-text-main'
                  }`
                }
              >
                <div className="mb-0.5 flex items-center justify-center h-7 relative">
                  <IconComponent size={ICON_SIZES.md} className="stroke-current" />
                  {item.name === 'Fridge' && hasNewFridge && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse-ring border border-background shadow-lg" />
                  )}
                </div>
                <span className="opacity-90 tracking-widest text-[9px]">{item.name}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
