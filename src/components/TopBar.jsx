import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import Avatar from './Avatar';
import { LoverHQLogo } from '../assets/Logo';
import { Heart } from '../lib/icons';
import { ICON_SIZES } from '../lib/constants';

/**
 * Helper to truncate names longer than 5 letters.
 *
 * @param {string} name - Name to format
 * @returns {string} Formatted name
 */
const formatName = (name) => {
  return name && name.length > 5 ? `${name.substring(0, 5)}...` : name;
};

/**
 * Helper to format room location into a single short word.
 *
 * @param {string} room - Current presence room
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
  return 'Home';
};

export function TopBar() {
  const { user, partner, presence } = useAppContext();

  return (
    <header className="bg-brand-surface/80 backdrop-blur-md border-b border-gray-800 h-20 flex items-center justify-between px-6 sticky top-0 z-[60]">
      {/* Top Left: Logo Only */}
      <div className="flex items-center text-primary">
        <LoverHQLogo className="text-primary w-10 h-10" />
      </div>

      {/* Center Status Text - Hidden on Mobile/Tablet */}
      {partner && (
        <div className="hidden lg:flex items-center bg-brand-surface/60 border border-gray-800 px-4 py-1.5 rounded-full">
          <span className="text-xs text-gray-300">
            {presence.partner === 'online' ? (
              <>
                <span className="text-amber-500 font-bold">{partner.name}</span> is in the{' '}
                <span className="text-white font-semibold">
                  {presence.partnerRoom || 'Lover-HQ'}
                </span>
              </>
            ) : (
              <>
                <span className="text-gray-400 font-bold">{partner.name}</span> is offline
              </>
            )}
          </span>
        </div>
      )}

      {/* Top Right: User & Partner Profiles */}
      <div className="flex items-center space-x-3">
        {/* Current User */}
        {user && (
          <Link
            to="/settings"
            className="flex items-center bg-brand-slate/40 pr-3 pl-1 py-1 rounded-full border border-gray-800 hover:bg-brand-slate/60 hover:border-gray-700 transition-colors"
          >
            <Avatar
              src={user.avatar_url?.startsWith('http') ? user.avatar_url : null}
              fallback={!user.avatar_url?.startsWith('http') ? user.avatar_url : '👤'}
              isOnline={presence.user === 'online'}
              size="sm"
            />
            <span className="text-xs font-bold text-gray-300 ml-2">
              {formatName(user.name || 'You')}
            </span>
          </Link>
        )}

        {/* Love Connection Icon */}
        <div
          className={`text-secondary flex items-center justify-center ${presence?.partner === 'online' ? 'animate-pulse-slow' : ''}`}
        >
          <Heart size={ICON_SIZES.sm} className="stroke-current fill-current text-red-500" />
        </div>

        {/* Partner */}
        {partner ? (
          <div className="flex flex-col items-center relative">
            <Link
              to="/profile"
              className="flex items-center bg-brand-slate/40 pl-3 pr-1 py-1 rounded-full border border-gray-800 hover:bg-brand-slate/60 hover:border-gray-700 transition-colors"
            >
              <span className="text-xs font-bold text-gray-300 mr-2">
                {formatName(partner.name || 'Partner')}
              </span>
              <Avatar
                src={partner.avatar_url?.startsWith('http') ? partner.avatar_url : null}
                fallback={!partner.avatar_url?.startsWith('http') ? partner.avatar_url : '👤'}
                isOnline={presence.partner === 'online'}
                size="sm"
              />
            </Link>
            {/* Speech bubble under the profile card */}
            {presence.partner === 'online' && (
              <div className="absolute top-full mt-1.5 flex flex-col items-center z-[70]">
                {/* Speech bubble pointer pointing up */}
                <div className="w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-amber-500" />
                <div className="bg-amber-500 text-brand-surface text-[9px] font-extrabold px-2 py-0.5 rounded shadow-lg uppercase tracking-wider whitespace-nowrap">
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
  );
}
