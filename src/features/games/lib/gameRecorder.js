/**
 * @file gameRecorder.js
 * @description Lightweight move-list recorder for game replays.
 * Records moves as an ordered array and saves to the game_replays table.
 */

import { supabase } from '../../../lib/supabase';

/**
 * @typedef {Object} GameMove
 * @property {number} timestamp - Milliseconds since game start.
 * @property {string} playerId - ID of the player who made the move.
 * @property {string} action - Short action label (e.g. 'place', 'guess').
 * @property {object} payload - Game-specific move data.
 */

export class GameRecorder {
  /**
   * @param {string} gameType - Game type ID (e.g. 'tic-tac-toe').
   * @param {string} playerAId - First player's user ID.
   * @param {string} playerBId - Second player's user ID.
   */
  constructor(gameType, playerAId, playerBId) {
    this.gameType = gameType;
    this.playerAId = playerAId;
    this.playerBId = playerBId;
    this.startTime = Date.now();
    this.moves = [];
  }

  /**
   * Records a single player move.
   *
   * @param {string} playerId - Who made the move.
   * @param {string} action - Short action label.
   * @param {object} payload - Move-specific data.
   */
  recordMove(playerId, action, payload) {
    this.moves.push({
      timestamp: Date.now() - this.startTime,
      playerId,
      action,
      payload,
    });
  }

  /**
   * Saves the completed replay to the database.
   *
   * @param {string|null} winnerId - Winner's user ID, or null for draw.
   * @returns {Promise<string>} The saved replay's UUID.
   */
  async save(winnerId) {
    const { data, error } = await supabase
      .from('game_replays')
      .insert({
        game_type: this.gameType,
        player_a_id: this.playerAId,
        player_b_id: this.playerBId,
        winner_id: winnerId || null,
        moves: this.moves,
        duration: Date.now() - this.startTime,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }
}
