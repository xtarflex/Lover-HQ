import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import Avatar from './Avatar';
import { LoverHQLogo } from '../assets/Logo';
import { Heart, Bell, ArrowLeft } from 'lucide-react';
import { NotificationDrawer } from './NotificationDrawer';
import { ConnectionFavoritesModal } from './ConnectionFavoritesModal';

/**
 * Truncate long names for compact pill displays.
 *
 * @param {string} name - Raw username
 * @returns {string} Formatted name
 */
const formatName = (name) => {
  return name && name.length > 5 ? `${name.substring(0, 5)}...` : name;
};

/**
 * Maps current presence room into a concise single word.
 *
 * @param {string} room - Current presence room label
 * @returns {string} Short room name
 */
const getShortRoomName = (room) => {
  if (!room) return 'Home';
  const r = room.toLowerCase();
  if (r.includes('fridge')) return 'Fridge';
  if (r.includes('music')) return 'Music';
  if (r.includes('game')) return 'Games';
  if (r.includes('reveal')) return 'Reveal';
  if (r.includes('board')) return 'Board';
  if (r.includes('setting')) return 'Settings';
  if (r.includes('profile')) return 'Profile';
  if (r.includes('chat')) return 'Chat';
  if (r.includes('theatre')) return 'Theatre';
  if (r.includes('journal')) return 'Journal';
  return 'Home';
};

/**
 * Responsive Top Navigation Bar component.
 *
 * Implements:
 * - Option A for larger devices: Standalone notification bell + couple presence cluster.
 * - Option B for mobile: Direct couple cluster (You ❤️ Partner with room speech bubble)
 *   with notification indicator on the /settings container div.
 * - Strict adherence to no-pulse rule.
 *
 * @returns {React.ReactElement}
 */
export function TopBar() {
  const { user, partner, presence } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [alerts, setAlerts] = useState(() => [
    {
      id: 'alert-1',
      title: 'Partner Presence',
      message: partner
        ? `${partner.name} is ${presence.partner === 'online' ? 'online' : 'offline'}`
        : 'Welcome to Lover HQ',
      type: 'presence',
      timestamp: 'Just now',
      link: '/home',
      isUnread: true,
    },
  ]);

  const [hasViewedAlerts, setHasViewedAlerts] = useState(false);
  const hasUnreadAlerts = !hasViewedAlerts && alerts.some((a) => a.isUnread);

  const handleOpenNotifications = () => {
    setIsNotificationsOpen(true);
    setHasViewedAlerts(true);
    setAlerts((prev) => prev.map((item) => ({ ...item, isUnread: false })));
  };

  const handleClearAlerts = () => {
    setAlerts([]);
    setHasViewedAlerts(true);
  };

  return (
    <>
      <header className="bg-brand-surface/85 backdrop-blur-md border-b border-gray-800/80 h-20 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-[60] select-none">
        {/* Top Left: Logo or Back Button */}
        <div className="flex items-center text-primary gap-3">
          {location.pathname === '/chat' ? (
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="p-2 rounded-full text-text-muted hover:text-text-main hover:bg-slate-800/40 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
          ) : (
            <Link to="/home" className="flex items-center gap-2 group" aria-label="Lover HQ Home">
              <LoverHQLogo className="text-primary w-9 h-9 sm:w-10 sm:h-10 transition-transform group-hover:scale-105" />
            </Link>
          )}
        </div>

        {/* Center: Ambient Status Pill (Hidden on Mobile/Tablet) */}
        {partner && (
          <div className="hidden lg:flex items-center bg-brand-surface/60 border border-gray-800 px-4 py-1.5 rounded-full">
            <span className="text-xs text-gray-300 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  presence.partner === 'online' ? 'bg-emerald-400' : 'bg-gray-500'
                }`}
              />
              {presence.partner === 'online' ? (
                <>
                  <span className="text-amber-400 font-bold">{partner.name}</span> is in the{' '}
                  <span className="text-white font-semibold">
                    {presence.partnerRoom || 'Lover-HQ'}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-gray-400 font-medium">{partner.name}</span> is offline
                </>
              )}
            </span>
          </div>
        )}

        {/* Top Right: User & Partner Presence + Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Standalone Bell for Desktop (Option A) - No Pulse */}
          <button
            onClick={handleOpenNotifications}
            aria-label="Open notifications"
            className="hidden md:flex relative p-2 rounded-full bg-brand-slate/40 hover:bg-brand-slate/70 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white transition-all duration-200 cursor-pointer"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <AnimatePresence>
              {hasUnreadAlerts && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-background"
                />
              )}
            </AnimatePresence>
          </button>

          {/* Current User Pill with Notification Indicator on the Main Link Container (Option B) */}
          {user && (
            <div className="relative">
              <Link
                to="/settings"
                className="flex items-center bg-brand-slate/40 pr-2.5 pl-1 py-1 rounded-full border border-gray-800 hover:bg-brand-slate/60 hover:border-gray-700 transition-colors relative"
                aria-label="Settings and profile"
              >
                <Avatar
                  src={user.avatar_url?.startsWith('http') ? user.avatar_url : null}
                  fallback={!user.avatar_url?.startsWith('http') ? user.avatar_url : '👤'}
                  isOnline={presence.user === 'online'}
                  size="sm"
                />
                <span className="text-xs font-bold text-gray-300 ml-1.5 sm:ml-2">
                  {formatName(user.name || 'You')}
                </span>
              </Link>
              {/* Functional Bell Icon Badge with Smooth Animated Exit for Mobile */}
              <AnimatePresence>
                {hasUnreadAlerts && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenNotifications();
                    }}
                    aria-label="View unread alerts"
                    className="md:hidden absolute -top-[6px] -right-[6px] w-[18px] h-[18px] rounded-full bg-amber-500 border border-background flex items-center justify-center text-slate-950 shadow-md hover:scale-110 active:scale-95 cursor-pointer z-10"
                  >
                    <Bell className="w-2.5 h-2.5 fill-current text-slate-950" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Connective Love Heart Toggle - No Pulse */}
          <button
            onClick={() => setIsFavoritesOpen(true)}
            aria-label="Relationship favorites & milestone"
            className="p-1.5 rounded-full hover:bg-rose-500/10 transition-colors"
          >
            <Heart
              size={18}
              className={`stroke-current transition-all duration-300 ${
                presence?.partner === 'online' ? 'fill-current text-rose-500' : 'text-rose-400'
              }`}
            />
          </button>

          {/* Partner Pill with Speech Bubble */}
          {partner ? (
            <div className="flex flex-col items-center relative">
              <Link
                to="/profile"
                className="flex items-center bg-brand-slate/40 pl-2.5 pr-1 py-1 rounded-full border border-gray-800 hover:bg-brand-slate/60 hover:border-gray-700 transition-colors"
                aria-label={`${partner.name}'s profile`}
              >
                <span className="text-xs font-bold text-gray-300 mr-1.5 sm:mr-2">
                  {formatName(partner.name || 'Partner')}
                </span>
                <Avatar
                  src={partner.avatar_url?.startsWith('http') ? partner.avatar_url : null}
                  fallback={!partner.avatar_url?.startsWith('http') ? partner.avatar_url : '👤'}
                  isOnline={presence.partner === 'online'}
                  size="sm"
                />
              </Link>

              {/* Real-time Room Speech Bubble */}
              {presence.partner === 'online' && (
                <div className="absolute top-full mt-1 flex flex-col items-center z-[70] pointer-events-none">
                  <div className="w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-amber-500" />
                  <div className="bg-amber-500 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-lg uppercase tracking-wider whitespace-nowrap">
                    {getShortRoomName(presence.partnerRoom)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/profile"
              className="flex items-center bg-primary/10 pl-3 pr-2 py-1.5 rounded-full border border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-colors gap-1.5"
            >
              <span className="text-xs font-bold text-primary">Pair Partner</span>
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold font-sans">
                +
              </div>
            </Link>
          )}
        </div>
      </header>

      {/* Slide-out Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={alerts}
        onClear={handleClearAlerts}
      />

      {/* Intimate Connection & Favorites Modal */}
      <ConnectionFavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
      />
    </>
  );
}
