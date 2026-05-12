import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import Avatar from './Avatar';
import { LoverHQLogo } from '../assets/Logo';
import { Heart } from '../lib/icons';
import { ICON_SIZES } from '../lib/constants';

export function TopBar() {
  const { user, partner, presence } = useAppContext();

  return (
    <header className="bg-brand-surface/80 backdrop-blur-md border-b border-gray-800 h-20 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center space-x-2 text-primary">
        <LoverHQLogo className="text-primary w-8 h-8" />
        <h1 className="text-xl font-heading font-bold text-white tracking-tight">Lover-HQ</h1>
      </div>

      <div className="flex items-center space-x-3">
        {/* Current User */}
        {user && (
          <div className="flex items-center bg-brand-slate/40 pr-3 pl-1 py-1 rounded-full border border-gray-800">
            <Avatar
              src={user.avatar_url?.startsWith('http') ? user.avatar_url : null}
              fallback={!user.avatar_url?.startsWith('http') ? user.avatar_url : '👤'}
              isOnline={presence.user === 'online'}
              size="sm"
            />
            <span className="text-xs font-bold text-gray-300 ml-2 max-w-[80px] truncate">
              {user.name || 'You'}
            </span>
          </div>
        )}

        {/* Love Connection Icon */}
        <div className="text-secondary animate-pulse flex items-center justify-center">
          <Heart size={ICON_SIZES.sm} className="stroke-current fill-current text-red-500" />
        </div>

        {/* Partner */}
        {partner && (
          <div className="flex items-center bg-brand-slate/40 pl-3 pr-1 py-1 rounded-full border border-gray-800">
            <span className="text-xs font-bold text-gray-300 mr-2 max-w-[80px] truncate">
              {partner.name || 'Partner'}
            </span>
            <Avatar
              src={partner.avatar_url?.startsWith('http') ? partner.avatar_url : null}
              fallback={!partner.avatar_url?.startsWith('http') ? partner.avatar_url : '👤'}
              isOnline={presence.partner === 'online'}
              size="sm"
            />
          </div>
        )}
      </div>
    </header>
  );
}
