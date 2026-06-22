/* eslint-disable */
/**
 * @file GameInviteModal.jsx
 * @description Premium modal dialog shown when a user receives a real-time
 * multiplayer game invitation from their partner.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, useAppDispatch } from '../contexts/AppContext';
import { useSupabase } from '../hooks/useSupabase';
import { Gamepad2, X, Play } from 'lucide-react';

/**
 * GameInviteModal component.
 *
 * @returns {React.ReactElement|null}
 */
export default function GameInviteModal() {
  const { activeInvitation, user } = useAppContext();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const supabase = useSupabase();

  // Auto-decline after 30 seconds to avoid stale popups
  useEffect(() => {
    if (!activeInvitation) return;

    const timer = setTimeout(() => {
      handleDecline();
    }, 30000);

    return () => clearTimeout(timer);
  }, [activeInvitation]);

  if (!activeInvitation) return null;

  const { gameId, gameName, hostName } = activeInvitation;

  /**
   * Broadcasts a decline to the partner and clears local invitation.
   */
  const handleDecline = () => {
    if (user) {
      const sortedIds = [user.id, user.partner_id].sort();
      const channelName = `presence:pair:${sortedIds.join('_')}`;
      const channel = supabase.channel(channelName);

      channel.send({
        type: 'broadcast',
        event: 'game_invite_decline',
        payload: { partnerName: user.name || 'Your partner' },
      });
    }
    dispatch({ type: 'SET_INVITATION', payload: null });
  };

  /**
   * Accepts the invite, stores auto-join game id, routes to games, and clears invitation.
   */
  const handleJoin = () => {
    dispatch({ type: 'SET_AUTO_JOIN', payload: gameId });
    dispatch({ type: 'SET_INVITATION', payload: null });
    navigate('/games');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-brand-surface border border-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-fade-in text-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-primary/20 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-secondary/15 rounded-full blur-xl pointer-events-none" />

        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
          <Gamepad2 className="w-8 h-8 animate-bounce" />
        </div>

        <h3 className="text-xl font-extrabold text-white tracking-tight">Game Invite!</h3>
        <p className="text-sm text-text-muted mt-2 px-2">
          <span className="text-primary font-bold">{hostName}</span> invites you to play{' '}
          <span className="text-secondary font-bold">{gameName}</span>!
        </p>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleDecline}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-text-muted hover:text-white rounded-xl text-sm font-bold border border-white/5 transition-all flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" />
            Decline
          </button>
          <button
            onClick={handleJoin}
            className="flex-1 py-3 bg-primary hover:bg-primary-hover text-brand-surface rounded-xl text-sm font-extrabold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02]"
          >
            <Play className="w-4 h-4 fill-current" />
            Join Play
          </button>
        </div>
      </div>
    </div>
  );
}
