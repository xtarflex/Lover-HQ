/**
 * @file ChatHeader.jsx
 * @description Header bar component for Chat screen.
 * Extracted verbatim from Chat.jsx.
 */

import React from 'react';
import { ArrowLeft, Video, Phone } from 'lucide-react';
import { formatLastSeen } from '../../../utils/time';

/**
 * Chat Header bar component.
 *
 * @param {{
 *   partner: object|null,
 *   partnerIsTyping: boolean,
 *   presence: object,
 *   partnerLastSeen: string|number|null,
 *   navigate: Function,
 *   dispatch: Function
 * }} props
 * @returns {React.ReactElement}
 */
export function ChatHeader({
  partner,
  partnerIsTyping,
  presence,
  partnerLastSeen,
  navigate,
  dispatch,
}) {
  return (
    <div className="bg-slate-900/90 backdrop-blur border-b border-slate-800/80 px-4 py-3 flex items-center justify-between z-10 shrink-0 select-none">
      <div className="flex items-center space-x-3 min-w-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="p-1.5 rounded-full text-text-muted hover:text-text-main hover:bg-slate-800/60 transition-colors flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </button>

        <div
          onClick={() => navigate('/profile')}
          className="flex items-center space-x-2.5 min-w-0 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0 overflow-hidden flex items-center justify-center text-sm font-bold">
            {partner?.avatar_url ? (
              <img
                src={partner.avatar_url}
                alt="Partner Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              'P'
            )}
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <span className="font-bold text-sm text-text-main truncate leading-tight font-rounded">
              {partner?.name || 'Partner'}
            </span>
            <span className="text-[10px] text-text-muted font-medium truncate mt-0.5 leading-none">
              {partnerIsTyping ? (
                <span className="text-amber-500 font-bold">typing...</span>
              ) : presence?.partner === 'online' ? (
                <>
                  <span className="text-emerald-500 font-semibold">online</span>
                  {presence.partnerRoom &&
                    presence.partnerRoom !== 'Lover-HQ' &&
                    presence.partnerRoom !== 'Chat Room' && (
                      <span className="text-gray-400">
                        {' '}
                        • {presence.partnerRoom.replace(' Room', '').replace('Page', '')}
                      </span>
                    )}
                </>
              ) : (
                formatLastSeen(partnerLastSeen)
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Video and Audio call stub buttons */}
      <div className="flex items-center space-x-1 shrink-0">
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: 'SET_GLOBAL_NOTIFICATION',
              payload: { message: 'Video calling is coming soon! 📹', type: 'info' },
            })
          }
          aria-label="Video call"
          className="p-2 rounded-full text-text-muted hover:text-text-main hover:bg-slate-800/40 transition-colors flex items-center justify-center"
        >
          <Video className="w-5 h-5 text-gray-300" />
        </button>
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: 'SET_GLOBAL_NOTIFICATION',
              payload: { message: 'Audio calling is coming soon! 📞', type: 'info' },
            })
          }
          aria-label="Audio call"
          className="p-2 rounded-full text-text-muted hover:text-text-main hover:bg-slate-800/40 transition-colors flex items-center justify-center"
        >
          <Phone className="w-4.5 h-4.5 text-gray-300" />
        </button>
      </div>
    </div>
  );
}
