/**
 * @file VoiceRecorderBar.jsx
 * @description Voice note recording and preview bar component.
 * Extracted verbatim from Chat.jsx.
 */

import React from 'react';
import { Trash2, Play, Pause, Square, Send } from 'lucide-react';
import { formatAudioTime } from '../../../utils/time';

/**
 * VoiceRecorderBar component.
 *
 * @param {{
 *   audioPreviewUrl: string|null,
 *   audioPreviewPlaying: boolean,
 *   audioPreviewCurrentTime: number,
 *   audioPreviewDuration: number,
 *   recordDuration: number,
 *   isRecordingPaused: boolean,
 *   recordLevels: number[],
 *   discardRecording: Function,
 *   handleTogglePreviewPlay: Function,
 *   setAudioPreviewCurrentTime: Function,
 *   audioPreviewRef: React.RefObject,
 *   resumeRecording: Function,
 *   pauseRecording: Function,
 *   stopRecordingAndPreview: Function,
 *   sendRecordingImmediately: Function,
 *   sendRecording: Function
 * }} props
 * @returns {React.ReactElement}
 */
export function VoiceRecorderBar({
  audioPreviewUrl,
  audioPreviewPlaying,
  audioPreviewCurrentTime,
  audioPreviewDuration,
  recordDuration,
  isRecordingPaused,
  recordLevels,
  discardRecording,
  handleTogglePreviewPlay,
  setAudioPreviewCurrentTime,
  audioPreviewRef,
  resumeRecording,
  pauseRecording,
  stopRecordingAndPreview,
  sendRecordingImmediately,
  sendRecording,
}) {
  return (
    <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-full px-4 py-2 w-full animate-slide-up space-x-3">
      {/* Trash Bin / Discard Button */}
      <button
        type="button"
        onClick={discardRecording}
        className="text-text-muted hover:text-red-500 p-2 rounded-full transition-colors flex-shrink-0"
        aria-label="Discard recording"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Middle Section: Waveform or Preview Player */}
      <div className="flex-1 flex items-center justify-center min-w-0">
        {audioPreviewUrl ? (
          /* PREVIEW MODE PLAYER */
          <div className="flex items-center space-x-3 w-full">
            <button
              type="button"
              onClick={handleTogglePreviewPlay}
              className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center transition-all hover:scale-105"
              aria-label={audioPreviewPlaying ? 'Pause preview' : 'Play preview'}
            >
              {audioPreviewPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
            {/* Preview Time Progress Slider */}
            <div className="flex-1 flex items-center space-x-2">
              <span className="text-[10px] text-text-muted font-mono">
                {formatAudioTime(audioPreviewCurrentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={audioPreviewDuration || 1}
                step="0.05"
                value={audioPreviewCurrentTime}
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  setAudioPreviewCurrentTime(newTime);
                  if (audioPreviewRef.current) {
                    audioPreviewRef.current.currentTime = newTime;
                  }
                }}
                className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-[10px] text-text-muted font-mono">
                {formatAudioTime(audioPreviewDuration)}
              </span>
            </div>
          </div>
        ) : (
          /* ACTIVE RECORDING MODE */
          <div className="flex items-center space-x-3 w-full">
            {/* Timer & Pulsing Dot */}
            <div className="flex items-center space-x-1.5 flex-shrink-0">
              <div
                className={`w-2.5 h-2.5 rounded-full bg-red-500 ${isRecordingPaused ? '' : 'animate-pulse'}`}
              />
              <span className="text-xs font-bold text-gray-200 font-mono">
                {formatAudioTime(recordDuration)}
              </span>
            </div>

            {/* Active Recording Animated Dynamic Waveform */}
            <div className="flex-1 h-8 flex items-center justify-center space-x-[3px] overflow-hidden select-none">
              {recordLevels.length === 0 ? (
                <div className="text-[10px] text-text-muted tracking-wider uppercase font-bold animate-pulse">
                  Say something...
                </div>
              ) : (
                (() => {
                  const mirrored = [...recordLevels].reverse().concat(recordLevels.slice(1));
                  return mirrored.map((lvl, index) => (
                    <div
                      key={`rec-wave-${index}`}
                      style={{ height: `${lvl}px` }}
                      className="w-[5px] bg-primary rounded-full transition-all duration-75 shrink-0"
                    />
                  ));
                })()
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Buttons: Pause/Resume, Stop/Preview, Send */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {audioPreviewUrl ? (
          /* Preview Send Button */
          <button
            type="button"
            onClick={sendRecording}
            className="w-10 h-10 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center text-white shadow-lg transition-all hover:scale-105"
            aria-label="Send voice note"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        ) : (
          /* Active Recording Controls */
          <>
            {/* Pause / Resume button */}
            <button
              type="button"
              onClick={isRecordingPaused ? resumeRecording : pauseRecording}
              className="w-8 h-8 rounded-full border border-slate-700/60 text-text-muted hover:text-text-main flex items-center justify-center transition-colors"
              aria-label={isRecordingPaused ? 'Resume recording' : 'Pause recording'}
            >
              {isRecordingPaused ? (
                <Play className="w-4 h-4 fill-current" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
            </button>

            {/* Stop and Listen (Preview) Button */}
            <button
              type="button"
              onClick={stopRecordingAndPreview}
              className="w-8 h-8 rounded-full bg-slate-800 text-text-main hover:bg-slate-700 flex items-center justify-center transition-colors"
              aria-label="Stop and preview voice note"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>

            {/* Immediate Send Button */}
            <button
              type="button"
              onClick={sendRecordingImmediately}
              className="w-10 h-10 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center text-white shadow-lg transition-all hover:scale-105"
              aria-label="Send immediately"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
