/**
 * @file QuickDrawCanvas.jsx
 * @description Active gameplay panel for Quick Draw.
 * Renders the target-word prompt, the shared drawing canvas with touch/mouse
 * event handlers, the drawer's colour palette and brush-size controls, the
 * typing indicator, and the guesser's guess input with recent guess chips.
 */

import React from 'react';
import { Eraser, Pen, Trash2 } from 'lucide-react';

/** @type {Array<{name: string, value: string}>} Available brush colours. */
const PALETTE_COLORS = [
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Blue', value: '#0EA5E9' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Slate', value: '#1E293B' },
];

/** @type {Array<{name: string, value: number}>} Available brush sizes in logical pixels. */
const BRUSH_SIZES = [
  { name: 'S', value: 3 },
  { name: 'M', value: 6 },
  { name: 'L', value: 12 },
];

/**
 * Active gameplay canvas panel rendered once the drawer has chosen a word.
 *
 * @param {object} props
 * @param {React.RefObject<HTMLCanvasElement>} props.canvasRef - Ref attached to the canvas element.
 * @param {boolean} props.iAmDrawer - Whether the local user is the drawer this round.
 * @param {string} props.targetWord - The word being drawn.
 * @param {object|null} props.partner - Partner profile (used for display name).
 * @param {string} props.brushColor - Currently active brush hex colour.
 * @param {Function} props.setBrushColor - State setter for `brushColor`.
 * @param {number} props.brushSize - Currently active brush size in logical pixels.
 * @param {Function} props.setBrushSize - State setter for `brushSize`.
 * @param {boolean} props.isEraser - Whether eraser mode is active.
 * @param {Function} props.setIsEraser - State setter for `isEraser`.
 * @param {string} props.guessInput - Current value of the guesser's text input.
 * @param {'correct'|'wrong'|null} props.guessResult - Last guess outcome for styling.
 * @param {boolean} props.partnerIsTyping - Whether the partner is currently typing a guess.
 * @param {Array<{text: string, correct: boolean}>} props.guesses - History of guesses made.
 * @param {Function} props.startDraw - `mousedown`/`touchstart` handler.
 * @param {Function} props.draw - `mousemove`/`touchmove` handler.
 * @param {Function} props.endDraw - `mouseup`/`mouseleave`/`touchend` handler.
 * @param {Function} props.clearCanvas - Clears the canvas and broadcasts the event.
 * @param {Function} props.handleGuessSubmit - Form submit handler for the guess input.
 * @param {Function} props.handleGuessInputChange - Input change handler (manages typing indicator).
 * @param {Function} props.handleGuessInputBlur - Blur handler (clears typing indicator).
 * @returns {React.ReactElement}
 */
export default function QuickDrawCanvas({
  canvasRef,
  iAmDrawer,
  targetWord,
  partner,
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  isEraser,
  setIsEraser,
  guessInput,
  guessResult,
  partnerIsTyping,
  guesses,
  startDraw,
  draw,
  endDraw,
  clearCanvas,
  handleGuessSubmit,
  handleGuessInputChange,
  handleGuessInputBlur,
}) {
  return (
    <>
      {/* Word display for drawer */}
      {iAmDrawer ? (
        <div className="text-center space-y-0.5 animate-slide-up">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
            Draw this word
          </p>
          <p className="text-3xl font-extrabold text-primary">{targetWord}</p>
        </div>
      ) : (
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest text-center animate-slide-up">
          What is {partner?.name || 'partner'} drawing?
        </p>
      )}

      {/* Canvas */}
      <div className="relative w-full max-w-[280px] sm:max-w-[340px] aspect-square mx-auto flex-shrink-0">
        <canvas
          ref={canvasRef}
          width={380}
          height={380}
          className="w-full h-full rounded-3xl bg-surface/50 border-2 border-surface-border touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          aria-label={iAmDrawer ? `Drawing canvas for ${targetWord}` : 'Opponent drawing canvas'}
        />
      </div>

      {/* Drawer Control Panels */}
      {iAmDrawer && (
        <div className="w-full max-w-[380px] space-y-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl animate-slide-up">
          {/* Color Palette */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Color
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-[260px] scrollbar-none">
              {PALETTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    setBrushColor(c.value);
                    setIsEraser(false);
                  }}
                  className={`w-6 h-6 rounded-full border transition-transform active:scale-90 relative ${
                    brushColor === c.value && !isEraser
                      ? 'border-white scale-110 shadow-lg ring-2 ring-primary/45'
                      : 'border-slate-800 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Brush Sizes & Eraser */}
          <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Size
              </span>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                {BRUSH_SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setBrushSize(s.value)}
                    className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
                      brushSize === s.value
                        ? 'bg-primary text-white'
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-1.5">
              {/* Eraser Toggle */}
              <button
                onClick={() => setIsEraser((prev) => !prev)}
                className={`p-1.5 rounded-lg border flex items-center justify-center transition-all ${
                  isEraser
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    : 'bg-slate-950 border-slate-800 text-text-muted hover:text-text-main hover:border-slate-700'
                }`}
                title="Eraser Mode"
              >
                <Eraser className="w-4 h-4" />
              </button>

              {/* Clear Canvas */}
              <button
                onClick={clearCanvas}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-text-muted hover:text-rose-400 hover:border-rose-500/30 transition-all"
                title="Clear Canvas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Typing status for the Drawer */}
      {iAmDrawer && partnerIsTyping && (
        <p className="text-sm italic text-primary animate-pulse text-center mt-1">
          {partner?.name || 'Partner'} is typing...
        </p>
      )}

      {/* Guess input (guesser only) */}
      {!iAmDrawer && (
        <form
          onSubmit={handleGuessSubmit}
          className="flex gap-2 w-full max-w-[380px] animate-slide-up"
        >
          <input
            id="quick-draw-guess"
            type="text"
            value={guessInput}
            onChange={handleGuessInputChange}
            onBlur={handleGuessInputBlur}
            placeholder="Type your guess…"
            className={`flex-1 px-4 py-3 bg-surface/50 border rounded-2xl text-sm text-text-main placeholder-text-muted/50 focus:outline-none transition-colors ${
              guessResult === 'correct'
                ? 'border-green-500 bg-green-500/10'
                : guessResult === 'wrong'
                  ? 'border-rose-500 bg-rose-500/10 animate-shake'
                  : 'border-surface-border focus:border-primary'
            }`}
          />
          <button
            type="submit"
            className="px-4 py-3 bg-primary hover:bg-primary-hover text-white rounded-2xl flex items-center gap-1 transition-all active:scale-95"
          >
            <Pen className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Recent guesses */}
      {guesses.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center max-w-[380px] animate-fade-in">
          {guesses.slice(-6).map((g, i) => (
            <span
              key={i}
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                g.correct
                  ? 'bg-green-500/15 text-green-400 border-green-500/30'
                  : 'bg-surface border-surface-border text-text-muted line-through'
              }`}
            >
              {g.text}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
