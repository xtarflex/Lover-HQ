/**
 * @file GamesWidget.jsx
 * @description Row 2 Right Column top compact card for mini-games tracker.
 * Displays head-to-head victory records, live match lobby state, and quick launch shortcuts.
 *
 * Implements:
 * - Stylized "VS" ambient background watermark.
 * - Evolved main content: enlarged trophy icon and dynamic hero score numbers where the leading score is enlarged.
 * - Dynamic status footer: "Last played" with Open action / "In lobby" with Join action.
 */

import React, { useState, useEffect } from 'react';
import { Gamepad2, Trophy, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../../contexts/AppContext';
import { supabase } from '../../../lib/supabase';

/**
 * GamesWidget component for Bento Grid.
 *
 * @returns {React.ReactElement}
 */
export function GamesWidget() {
  const { user, partner, presence } = useAppContext();
  const navigate = useNavigate();

  const [scores, setScores] = useState({ userWins: 3, partnerWins: 2 });
  const isPartnerInLobby =
    presence.partner === 'online' && presence.partnerRoom?.toLowerCase().includes('game');

  // Load completed game wins
  useEffect(() => {
    if (!user || !partner) return;
    const fetchScores = async () => {
      try {
        const { data, error } = await supabase
          .from('game_sessions')
          .select('winner_id')
          .or(`player_a_id.eq.${user.id},player_b_id.eq.${user.id}`)
          .not('winner_id', 'is', null);

        if (!error && data) {
          const uWins = data.filter((g) => g.winner_id === user.id).length;
          const pWins = data.filter((g) => g.winner_id === partner.id).length;
          setScores({ userWins: uWins, partnerWins: pWins });
        }
      } catch (err) {
        console.error('Failed to load game scores:', err);
      }
    };

    fetchScores();
  }, [user, partner]);

  return (
    <div
      onClick={() => navigate('/games')}
      className="relative rounded-3xl p-3.5 sm:p-4 bg-surface/75 border border-surface-border shadow-xl backdrop-blur-xl flex flex-col justify-between cursor-pointer select-none group hover:border-emerald-500/40 transition-colors overflow-hidden"
    >
      {/* Top Header with Launch Trigger */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-surface-border/60">
          <div className="flex items-center gap-2 text-emerald-400 min-w-0">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 shrink-0">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-text-main truncate">Games</span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0">
            <span>Play</span>
            <Play className="w-3 h-3 fill-current" />
          </div>
        </div>

        {/* Centerpiece Body: Stylized VS Watermark & Enlarged Record Score */}
        <div className="relative my-3 flex items-center justify-center gap-3.5 sm:gap-5 py-1">
          {/* Stylized "VS" Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.12]">
            <span className="text-5xl sm:text-6xl font-heading font-black italic tracking-tighter text-amber-400">
              VS
            </span>
          </div>

          {/* Left: Enlarged Trophy Icon without background container */}
          <div className="relative z-10 flex items-center shrink-0">
            <Trophy className="w-9 h-9 sm:w-10 sm:h-10 text-amber-400 drop-shadow-md" />
          </div>

          {/* Right: Enlarged Dynamic Score Numbers (Winning score is larger) */}
          <div className="relative z-10 flex items-baseline gap-1 font-heading font-black">
            <span
              className={`transition-all ${
                scores.userWins >= scores.partnerWins
                  ? 'text-2xl sm:text-3xl font-black text-amber-300 drop-shadow-sm'
                  : 'text-lg sm:text-xl font-bold text-text-muted'
              }`}
            >
              {scores.userWins}
            </span>
            <span className="text-sm sm:text-base text-text-muted/60 font-normal px-0.5">:</span>
            <span
              className={`transition-all ${
                scores.partnerWins >= scores.userWins
                  ? 'text-2xl sm:text-3xl font-black text-amber-300 drop-shadow-sm'
                  : 'text-lg sm:text-xl font-bold text-text-muted'
              }`}
            >
              {scores.partnerWins}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Status: Last played / In lobby */}
      <div className="pt-2 border-t border-surface-border/40 flex items-center justify-between text-[11px]">
        {isPartnerInLobby ? (
          <>
            <span className="font-bold text-emerald-400 flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>In lobby</span>
            </span>
            <span className="font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              Join <span aria-hidden="true">&rarr;</span>
            </span>
          </>
        ) : (
          <>
            <span className="text-text-muted truncate">Last played</span>
            <span className="font-semibold text-text-muted group-hover:text-primary transition-colors flex items-center gap-1">
              Open <span aria-hidden="true">&rarr;</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default GamesWidget;
