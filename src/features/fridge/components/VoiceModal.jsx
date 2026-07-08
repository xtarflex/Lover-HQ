import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, Square, Play, Pause, Save, AlertCircle } from 'lucide-react';
import {
  uploadFridgeMedia,
  getFridgeMediaPublicUrl,
  createFridgeItem,
} from '../../../services/fridge';
import { ModalOverlay } from '../../../components/ModalOverlay';

/**
 * @file VoiceModal.jsx
 * @description Modal component for recording, previewing, and pinning voice memos on the collaborative Fridge board.
 */

/**
 * Audio Memo Recorder Modal
 *
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Controls visibility of the modal
 * @param {Function} props.onClose - Callback function to close the modal
 * @param {string} props.userId - ID of the current user
 * @param {Function} props.onSave - Callback when the voice memo is successfully pinned/saved
 * @returns {React.ReactElement} The VoiceModal component
 */
export function VoiceModal({ isOpen, onClose, userId, onSave }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/aac',
      'audio/wav',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = {
        mimeType: getSupportedMimeType(),
        audioBitsPerSecond: 32000,
      };

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/wav';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });

        // Enforce 5MB limit
        if (blob.size > 5 * 1024 * 1024) {
          setError('Voice clip exceeds the 5MB size limit.');
          setAudioBlob(null);
          setAudioUrl(null);
          return;
        }

        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));

        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250); // chunk data every 250ms
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= 600) {
            // Limit to 10 minutes
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Microphone access denied or audio recording failed.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      // Release microphone stream if recording was active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.error(e);
        }
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRecording(false);
      clearInterval(timerRef.current);

      // Stop audio playback if playing
      if (audioRef.current) {
        audioRef.current.pause();
      }

      setIsPlaying(false);

      // Revoke blob URL to avoid memory leaks
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      setAudioUrl(null);

      setAudioBlob(null);

      setDuration(0);

      setIsSaving(false);

      setError(null);
    }
  }, [isOpen, audioUrl]);

  const handlePlayToggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!audioBlob) return;
    setIsSaving(true);
    setError(null);
    try {
      const mime = mediaRecorderRef.current?.mimeType || 'audio/wav';
      const fileExt = mime.includes('mp4') ? 'mp4' : mime.includes('webm') ? 'webm' : 'wav';
      const randId = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
      const fileName = `${userId}/${Date.now()}_${randId}.${fileExt}`;

      // Upload to Supabase Storage
      await uploadFridgeMedia(fileName, audioBlob, { contentType: mime });

      // Get public URL
      const publicUrl = getFridgeMediaPublicUrl(fileName);

      // Save to database
      const dbData = await createFridgeItem({
        user_id: userId,
        type: 'voice',
        content: JSON.stringify({ url: publicUrl, duration }),
        x_position: 30 + Math.random() * 40,
        y_position: 30 + Math.random() * 40,
      });

      if (onSave) onSave(dbData);
      onClose();
    } catch (err) {
      console.error('Audio upload failed:', err);
      setError('Failed to upload audio message.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-bold text-text-main">Leave a Voice Memo</h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Interface */}
        <div className="w-full flex flex-col items-center justify-center p-8 border border-surface-border bg-background/50 rounded-xl my-4 min-h-[160px] relative overflow-hidden">
          {/* Animated sound waves while recording */}
          {isRecording && (
            <div className="flex items-center gap-1 mb-6">
              {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((scale, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${scale * 6}px`,
                    animationDelay: `${i * 100}ms`,
                    animationDuration: '600ms',
                  }}
                />
              ))}
            </div>
          )}

          {/* Time Display */}
          <div className="text-3xl font-mono font-bold text-text-main tracking-wider mb-2">
            {formatDuration(duration)}
          </div>

          <div className="text-xs text-text-muted">
            {isRecording
              ? 'Recording microphone audio...'
              : audioUrl
                ? 'Voice clip recorded'
                : 'Tap microphone to start'}
          </div>

          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}
        </div>

        {/* Audio Controls */}
        <div className="flex gap-4 justify-center my-4">
          {!audioUrl && !isRecording && (
            <button
              onClick={startRecording}
              className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
              title="Start Recording"
            >
              <Mic className="w-6 h-6" />
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="w-14 h-14 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white border border-gray-500 shadow-lg animate-pulse"
              title="Stop Recording"
            >
              <Square className="w-5 h-5 text-red-500 fill-red-500" />
            </button>
          )}

          {audioUrl && !isRecording && (
            <>
              <button
                onClick={handlePlayToggle}
                className="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-text-main border border-surface-border transition-transform hover:scale-105"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
              </button>
              <button
                onClick={() => {
                  setAudioUrl(null);
                  setAudioBlob(null);
                  setDuration(0);
                }}
                className="w-12 h-12 bg-red-950/20 hover:bg-red-950/40 text-red-500 rounded-full flex items-center justify-center border border-red-500/20 transition-transform hover:scale-105"
                title="Discard"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 my-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!audioBlob || isSaving}
          className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-brand-surface font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm mt-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Uploading clip...' : 'Stick Voice Memo'}
        </button>
      </div>
    </ModalOverlay>
  );
}
