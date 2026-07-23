/**
 * @file VoiceMessagePlayer.jsx
 * @description Customized Audio Player component for Chat Voice Messages.
 * Renders a waveform-style playback bar with seek-on-click/drag, playback speed toggle,
 * and time display. Extracted verbatim from Chat.jsx.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { formatAudioTime } from '../../../utils/time';

// Stable mock waveform heights (in percentages, e.g. from 20% to 100%) to represent a natural audio signal
const WAVEFORM_BARS = [
  30, 45, 60, 40, 25, 45, 75, 90, 65, 50, 35, 60, 80, 95, 70, 45, 30, 50, 70, 55, 40, 30, 45, 60,
  35,
];

/**
 * Customized Audio Player component for Chat Voice Messages.
 *
 * @param {{ src: string }} props
 * @returns {React.ReactElement}
 */
export function VoiceMessagePlayer({ src }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => console.error('Audio play failed:', e));
    }
  };

  /**
   * Handles click/drag event on the waveform to seek to a specific audio position.
   *
   * @param {React.MouseEvent<HTMLDivElement>} e - The mouse event.
   * @returns {void}
   */
  const handleWaveformInteraction = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  /**
   * Handles touch events on the waveform to seek to a specific audio position on mobile devices.
   *
   * @param {React.TouchEvent<HTMLDivElement>} e - The touch event.
   * @returns {void}
   */
  const handleTouchInteraction = (e) => {
    if (!duration || !e.touches[0]) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  return (
    <div className="flex items-center space-x-3 bg-transparent border-none p-0 min-w-[200px]">
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center text-primary transition-all shrink-0"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex flex-col min-w-0">
        <div
          onMouseDown={(e) => {
            handleWaveformInteraction(e);
            setIsDragging(true);
          }}
          onMouseMove={(e) => {
            if (isDragging) handleWaveformInteraction(e);
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchStart={(e) => {
            handleTouchInteraction(e);
            setIsDragging(true);
          }}
          onTouchMove={(e) => {
            if (isDragging) handleTouchInteraction(e);
          }}
          onTouchEnd={() => setIsDragging(false)}
          className="flex items-center justify-between h-8 cursor-pointer select-none py-1"
        >
          {WAVEFORM_BARS.map((height, i) => {
            const progress = duration ? currentTime / duration : 0;
            const barProgressThreshold = i / WAVEFORM_BARS.length;
            const isFilled = progress > barProgressThreshold;
            return (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className={`w-[3px] rounded-full transition-colors duration-150 shrink-0 ${
                  isFilled ? 'bg-primary' : 'bg-slate-700'
                }`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[9px] text-text-muted mt-1 font-mono">
          <span>
            {isPlaying || currentTime > 0
              ? formatAudioTime(currentTime)
              : formatAudioTime(duration)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPlaybackRate((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
            }}
            className="px-1.5 py-0.5 rounded bg-slate-800/60 hover:bg-slate-700/60 text-gray-300 font-extrabold text-[8px] transition-colors leading-none"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}
