/**
 * @file GameLobby.jsx
 * @description Game selection lobby. Displays all games from the registry
 * in a grid with tag filters and partner online/offline status.
 */

import React, { useMemo, useState } from 'react';
import { Play, Clock, Award, Wifi, WifiOff, Gamepad2 } from 'lucide-react';

/**
 * Game lobby with filter pills and game cards.
 *
 * @param {object} props
 * @param {import('./games/index').GameDefinition[]} props.games - All available games.
 * @param {Function} props.onSelectGame - Called with game ID when a card is tapped.
 * @param {boolean} props.partnerOnline - Whether the partner is currently online.
 * @param {object} props.partner - Partner user object.
 */
export default function GameLobby({ games, onSelectGame, partnerOnline, partner }) {
  const [filterTag, setFilterTag] = useState('all');

  const allTags = useMemo(() => ['all', ...new Set(games.flatMap((g) => g.tags))], [games]);

  const filteredGames = useMemo(
    () => (filterTag === 'all' ? games : games.filter((g) => g.tags.includes(filterTag))),
    [games, filterTag]
  );

  const difficultyColor = {
    easy: 'text-green-400',
    medium: 'text-amber-400',
    hard: 'text-rose-400',
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6 gap-5 pb-24 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-primary" />
          <h2 className="font-heading text-2xl font-extrabold text-text-main">Game Room</h2>
        </div>
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold ${
            partnerOnline ? 'text-green-400' : 'text-text-muted'
          }`}
        >
          {partnerOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {partnerOnline
            ? `${partner?.name || 'Partner'} is online — pick a game!`
            : `${partner?.name || 'Partner'} is offline.`}
        </div>
      </div>

      {/* Tag Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => (
          <button
            key={tag}
            id={`filter-${tag}`}
            onClick={() => setFilterTag(tag)}
            className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest rounded-full border transition-all ${
              filterTag === tag
                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                : 'bg-surface/60 border-surface-border text-text-muted hover:text-text-main hover:border-text-muted'
            }`}
          >
            {tag === 'all' ? 'All Games' : tag}
          </button>
        ))}
      </div>

      {/* Game Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGames.map((game) => (
          <button
            key={game.id}
            id={`game-card-${game.id}`}
            onClick={() => onSelectGame(game.id)}
            className="group relative bg-surface/60 backdrop-blur-xl border border-surface-border rounded-3xl p-5 text-left flex flex-col gap-4 hover:border-primary hover:bg-surface/80 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 active:scale-95"
          >
            {/* Play button top-right */}
            <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-200">
              <Play className="w-4 h-4 fill-primary text-primary group-hover:fill-white group-hover:text-white transition-colors" />
            </div>

            {/* Icon + Name */}
            <div className="space-y-2 pr-10">
              <game.Icon className="w-10 h-10 text-text-muted group-hover:text-primary transition-colors" />
              <h3 className="text-base font-extrabold text-text-main group-hover:text-primary transition-colors leading-snug">
                {game.name}
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">{game.description}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {game.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-surface border border-surface-border/60 text-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Meta row */}
            <div className="flex items-center justify-between text-xs text-text-muted/70 border-t border-surface-border/50 pt-3">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>~{Math.round(game.avgDuration / 60)} min</span>
              </div>
              <div className={`flex items-center gap-1 ${difficultyColor[game.difficulty]}`}>
                <Award className="w-3.5 h-3.5" />
                <span className="capitalize font-bold">{game.difficulty}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
