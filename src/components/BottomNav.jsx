import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { FridgeIcon, Music, Gamepad2, LoverHQLogo } from '../lib/icons';
import { ICON_SIZES } from '../lib/constants';
import { useAppContext, useAppDispatch } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { getFridgeItemsNewerThan } from '../services/fridge';

/**
 * Bottom Navigation Bar component following Lover-HQ Product Specification.
 *
 * Flanking routes:
 * 1. Fridge (/fridge)
 * 2. Chat (/chat)
 * [Elevated Center Dynamic Action Button]
 * 3. Music (/music)
 * 4. Games (/games)
 *
 * Grounded full-width bottom bar container with elevated center button.
 * Adheres strictly to the no-pulse rule (solid indicators only).
 *
 * @returns {React.ReactElement}
 */
export function BottomNav() {
  const { user, partner, presence, unreadChatCount = 0 } = useAppContext();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const [hasNewFridge, setHasNewFridge] = useState(false);

  const userId = user?.id;
  const partnerId = partner?.id;
  const isHome = location.pathname === '/home';

  const prevPathnameRef = useRef(location.pathname);

  // Track route changes & manage unread fridge items
  useEffect(() => {
    if (!userId) return;

    if (location.pathname === '/fridge') {
      setTimeout(() => setHasNewFridge(false), 0);
    } else {
      if (prevPathnameRef.current === '/fridge') {
        localStorage.setItem('last_visited_fridge', new Date().toISOString());
        setHasNewFridge(false);
      } else {
        const checkNewItems = async () => {
          const lastVisited = localStorage.getItem('last_visited_fridge');
          if (!lastVisited) {
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
    }
    prevPathnameRef.current = location.pathname;
  }, [location.pathname, userId, partnerId]);

  // Subscribe to real-time changes in fridge_items
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
          if (location.pathname !== '/fridge') {
            const itemUserId = payload.new?.user_id || payload.old?.user_id;
            if (partnerId && itemUserId === partnerId && payload.eventType !== 'DELETE') {
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

  // Determine dynamic action state for center button
  const isPartnerInGame =
    presence.partner === 'online' && presence.partnerRoom?.toLowerCase().includes('game');
  const isPartnerInMusic =
    presence.partner === 'online' && presence.partnerRoom?.toLowerCase().includes('music');

  const handleCenterAction = () => {
    if (!isHome) {
      navigate('/home');
      return;
    }

    if (isPartnerInGame) {
      navigate('/games');
    } else if (isPartnerInMusic) {
      navigate('/music');
    } else if (hasNewFridge) {
      navigate('/fridge');
    } else {
      // Trigger a warm connection spark notification on Home
      dispatch({
        type: 'SET_GLOBAL_NOTIFICATION',
        payload: {
          message: partner ? `Sending loving warmth to ${partner.name}... ✨` : 'Welcome home! 💕',
          type: 'info',
        },
      });
    }
  };

  const navItems = [
    { name: 'Fridge', path: '/fridge', icon: FridgeIcon, hasBadge: hasNewFridge },
    {
      name: 'Chat',
      path: '/chat',
      icon: MessageCircle,
      hasBadge: unreadChatCount > 0,
      badgeCount: unreadChatCount,
    },
    { name: 'Home', path: '/home', isHome: true },
    { name: 'Music', path: '/music', icon: Music, hasBadge: false },
    { name: 'Games', path: '/games', icon: Gamepad2, hasBadge: isPartnerInGame },
  ];

  return (
    <nav className="bg-surface/90 backdrop-blur-lg border-t border-surface-border fixed bottom-0 left-0 right-0 w-full h-20 z-50 px-4 flex items-center select-none">
      {/* Nav Items Content Container */}
      <ul className="flex items-center justify-around h-full w-full max-w-lg mx-auto relative">
        {navItems.map((item) => {
          if (item.isHome) {
            return (
              <li
                key={item.path}
                className="flex-1 relative flex justify-center h-full items-center"
              >
                <button
                  onClick={handleCenterAction}
                  aria-label={
                    !isHome
                      ? 'Back to Dashboard'
                      : isPartnerInGame
                        ? 'Join Partner in Game'
                        : isPartnerInMusic
                          ? 'Listen Together'
                          : 'Lover HQ Hub'
                  }
                  className={`absolute -top-5 w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center border-4 border-background transition-all duration-300 hover:scale-110 shadow-lg cursor-pointer ${
                    isHome
                      ? 'scale-105 border-primary shadow-primary/20'
                      : 'border-surface-border/80'
                  }`}
                >
                  <LoverHQLogo className="text-white w-7 h-7" />
                </button>
              </li>
            );
          }

          const IconComponent = item.icon;
          return (
            <li key={item.path} className="flex-1 flex justify-center h-full items-center">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-full h-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                    isActive ? 'text-primary scale-105' : 'text-text-muted hover:text-text-main'
                  }`
                }
              >
                <div className="mb-0.5 flex items-center justify-center h-7 relative">
                  <IconComponent size={ICON_SIZES.md} className="stroke-current" />
                  {item.hasBadge &&
                    (item.badgeCount ? (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-sm leading-none">
                        {item.badgeCount > 99 ? '99+' : item.badgeCount}
                      </span>
                    ) : (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-surface shadow-sm" />
                    ))}
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
