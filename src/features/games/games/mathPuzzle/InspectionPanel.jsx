/**
 * @file InspectionPanel.jsx
 * @description Side-by-side post-race comparison view for CrossMath Race.
 */

import React from 'react';
import MathPuzzleBoard from './MathPuzzleBoard';

/**
 * @param {object} props
 * @param {any[][]} props.myGrid - Local player's final grid.
 * @param {any[][]} props.partnerGrid - Partner's final grid.
 * @param {number} props.size - Grid size.
 * @param {object} props.user - Local user info.
 * @param {object} props.partner - Partner user info.
 * @param {string|null} props.winnerId - ID of the winner.
 * @param {string} props.winnerName - Name of the winner.
 * @param {Function} props.onClose - Exit inspection.
 * @returns {React.ReactElement}
 */
export default function InspectionPanel({
  myGrid,
  partnerGrid,
  size,
  user,
  partner,
  winnerId,
  winnerName,
  onClose,
}) {
  const isMyWin = winnerId === user?.id;
  const isDraw = winnerId === 'draw';

  return (
    <div
      className="inspection-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Race Inspection Panel"
    >
      <div className="inspection-header">
        <div>
          <h2 className="font-heading text-xl font-bold text-text-main">
            {isDraw ? "It's a Draw!" : `${isMyWin ? 'You' : winnerName || 'Partner'} Won the Race!`}
          </h2>
          <p className="text-xs text-text-muted">Compare your grids side-by-side below.</p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-all"
        >
          Exit View
        </button>
      </div>

      <div className="inspection-grids-side-by-side">
        {/* Local Player Grid */}
        <div className="inspection-board-card">
          <p
            className={`inspection-board-title ${isMyWin ? 'winner font-extrabold text-amber-500' : ''}`}
          >
            {user?.name || 'You'} {isMyWin ? '★ (Winner)' : ''}
          </p>
          <MathPuzzleBoard grid={myGrid} size={size} onCellClick={() => {}} readOnly={true} />
        </div>

        {/* Partner Grid */}
        <div className="inspection-board-card">
          <p
            className={`inspection-board-title ${winnerId === partner?.id ? 'winner font-extrabold text-amber-500' : ''}`}
          >
            {partner?.name || 'Partner'} {winnerId === partner?.id ? '★ (Winner)' : ''}
          </p>
          <MathPuzzleBoard grid={partnerGrid} size={size} onCellClick={() => {}} readOnly={true} />
        </div>
      </div>
    </div>
  );
}
