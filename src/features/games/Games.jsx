/**
 * @file Games.jsx
 * @description Games hub router. Shows the lobby when no game is active,
 * or lazy-loads the selected game component from the GAME_REGISTRY.
 */

import React, { useState, Suspense, useEffect } from 'react';
import { useAppContext, useAppDispatch } from '../../contexts/AppContext';
import { useSupabase } from '../../hooks/useSupabase';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import GameLobby from './GameLobby';
import { GAME_REGISTRY, getGameById } from './games/index';


/**
 * Top-level games hub component.
 *
 * @returns {React.ReactElement}
 */
export default function Games() {
  const { user, partner, presence, autoJoinGameId } = useAppContext();
  const dispatch = useAppDispatch();
  const supabase = useSupabase();
  const [selectedGameId, setSelectedGameId] = useState(null);

  // Handle auto-join route redirection
  useEffect(() => {
    if (autoJoinGameId) {
      setSelectedGameId(autoJoinGameId);
      dispatch({ type: 'SET_AUTO_JOIN', payload: null });
    }
  }, [autoJoinGameId, dispatch]);

  // Broadcast invite when entering a game
  useEffect(() => {
    if (selectedGameId && user && partner) {
      const sortedIds = [user.id, partner.id].sort();
      const channelName = `presence:pair:${sortedIds.join('_')}`;
      const channel = supabase.channel(channelName);
      
      channel.send({
        type: 'broadcast',
        event: 'game_invite',
        payload: {
          gameId: selectedGameId,
          gameName: getGameById(selectedGameId)?.name,
          hostName: user.name || 'Your partner',
        },
      });
    }
  }, [selectedGameId, user, partner, supabase]);

  const selectedGame = selectedGameId ? getGameById(selectedGameId) : null;
  const GameComponent = selectedGame?.Component;
  const partnerOnline = presence?.partner === 'online';

  const handleBack = () => setSelectedGameId(null);

  if (!selectedGameId) {
    return (
      <GameLobby
        games={GAME_REGISTRY}
        onSelectGame={setSelectedGameId}
        partnerOnline={partnerOnline}
        partner={partner}
      />
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <LoadingSpinner size="md" />
            <p className="text-xs text-text-muted font-semibold">Loading game…</p>
          </div>
        }
      >
        <GameComponent
          gameId={selectedGame.id}
          gameName={selectedGame.name}
          userId={user?.id}
          partnerId={partner?.id}
          user={user}
          partner={partner}
          partnerOnline={partnerOnline}
          onBack={handleBack}
        />
      </Suspense>
    </div>
  );
}
