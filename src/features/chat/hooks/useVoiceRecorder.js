/**
 * @file useVoiceRecorder.js
 * @description Custom hook that manages the full voice note recording lifecycle for the
 * Lover-HQ chat feature. Responsibilities:
 * - MediaRecorder initialisation and permission checking.
 * - AudioContext level / waveform array tracking for live visualisation.
 * - Recording timers (start / pause / resume / discard / stop-and-preview).
 * - Preview player state (play, current time, duration).
 * - Uploading the recorded blob to Supabase Storage and inserting the message row.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

/**
 * Manages the complete voice note recording and preview state.
 *
 * @param {object} options - Options object.
 * @param {string|null} options.userId - The current user's ID.
 * @param {string|null} options.partnerId - The partner's ID.
 * @param {object|null} options.replyMessage - The message being replied to (if any).
 * @param {Function} options.dispatch - AppContext dispatch for global notifications.
 * @param {string|null} options.coupleKey - Sorted, joined user+partner ID key.
 * @param {Function} options.setReplyMessage - Setter to clear reply context after send.
 * @returns {object} All recorder state values and action handlers.
 */
export function useVoiceRecorder({
  userId,
  replyMessage,
  dispatch,
  coupleKey,
  setReplyMessage,
} = {}) {
  // ── Recording state ────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordLevels, setRecordLevels] = useState([]);

  // ── Preview player state ───────────────────────────────────────────────────
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [audioPreviewPlaying, setAudioPreviewPlaying] = useState(false);
  const [audioPreviewDuration, setAudioPreviewDuration] = useState(0);
  const [audioPreviewCurrentTime, setAudioPreviewCurrentTime] = useState(0);

  // ── Upload state ───────────────────────────────────────────────────────────
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  // ── Internal refs ──────────────────────────────────────────────────────────
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPreviewRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  // Active voice recording timer effect
  useEffect(() => {
    if (!isRecording || isRecordingPaused) return;
    const timer = setInterval(() => {
      setRecordDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording, isRecordingPaused]);

  // Cleanup active audio recorder/players and loops on unmount
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, []);

  /**
   * Starts a new voice note recording with real-time waveform visualisation.
   * Requests microphone permission and sets up MediaRecorder + AudioContext.
   *
   * @returns {Promise<void>}
   */
  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      setRecordLevels([]);
      setIsRecordingPaused(false);
      setAudioPreviewUrl(null);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const drawWaveform = () => {
        if (!analyserRef.current || mediaRecorder.state === 'inactive') return;

        analyserRef.current.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / bufferLength);
        const level = Math.min(Math.max(rms * 150, 4), 48);

        setRecordLevels((prev) => {
          const next = [level, ...prev];
          return next.slice(0, 11);
        });

        animationFrameIdRef.current = requestAnimationFrame(drawWaveform);
      };

      animationFrameIdRef.current = requestAnimationFrame(drawWaveform);
    } catch (err) {
      console.error('Microphone access error:', err);
      let errorMessage = 'Could not access microphone for voice recording. 🎙️';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage =
          'Microphone is blocked. Please click the 🔒 icon in your browser address bar to reset permissions. 🔓';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No microphone found. Please connect a recording device. 🎤';
      }
      if (dispatch) {
        dispatch({
          type: 'SET_GLOBAL_NOTIFICATION',
          payload: { message: errorMessage, type: 'error' },
        });
      }
    }
  };

  /**
   * Pauses the current recording.
   *
   * @returns {void}
   */
  const pauseRecording = useCallback(() => {
    if (
      !isRecording ||
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state !== 'recording'
    ) {
      return;
    }
    mediaRecorderRef.current.pause();
    setIsRecordingPaused(true);
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend();
    }
  }, [isRecording]);

  /**
   * Resumes a paused recording and restarts the waveform draw loop.
   *
   * @returns {void}
   */
  const resumeRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current || mediaRecorderRef.current.state !== 'paused') {
      return;
    }
    mediaRecorderRef.current.resume();
    setIsRecordingPaused(false);

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const drawWaveform = () => {
      if (!analyserRef.current || mediaRecorderRef.current.state === 'inactive') return;
      analyserRef.current.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / bufferLength);
      const level = Math.min(Math.max(rms * 150, 4), 48);
      setRecordLevels((prev) => [level, ...prev].slice(0, 11));
      animationFrameIdRef.current = requestAnimationFrame(drawWaveform);
    };
    animationFrameIdRef.current = requestAnimationFrame(drawWaveform);
  }, [isRecording]);

  /**
   * Discards the current recording and resets all recorder state.
   *
   * @returns {void}
   */
  const discardRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    }
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsRecordingPaused(false);
    setRecordLevels([]);
    setAudioPreviewUrl(null);
  }, []);

  /**
   * Stops the recording and transitions to the preview stage.
   *
   * @returns {void}
   */
  const stopRecordingAndPreview = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(audioBlob);
      setAudioPreviewUrl(url);
      setAudioPreviewPlaying(false);
      setAudioPreviewCurrentTime(0);

      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      setIsRecording(false);
      setIsRecordingPaused(false);
    };

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    mediaRecorderRef.current.stop();
  }, [isRecording]);

  /**
   * Toggles play/pause state for the recorded audio preview.
   *
   * @returns {void}
   */
  const handleTogglePreviewPlay = useCallback(() => {
    if (!audioPreviewUrl) return;

    if (!audioPreviewRef.current) {
      const audio = new Audio(audioPreviewUrl);
      audioPreviewRef.current = audio;

      audio.addEventListener('loadedmetadata', () => {
        setAudioPreviewDuration(audio.duration || 0);
      });
      audio.addEventListener('timeupdate', () => {
        setAudioPreviewCurrentTime(audio.currentTime || 0);
      });
      audio.addEventListener('ended', () => {
        setAudioPreviewPlaying(false);
        setAudioPreviewCurrentTime(0);
      });
    }

    if (audioPreviewPlaying) {
      audioPreviewRef.current.pause();
      setAudioPreviewPlaying(false);
    } else {
      audioPreviewRef.current.play().catch((err) => console.error(err));
      setAudioPreviewPlaying(true);
    }
  }, [audioPreviewUrl, audioPreviewPlaying]);

  /**
   * Uploads the previewed recording blob and inserts a voice message row.
   *
   * @returns {Promise<void>}
   */
  const sendRecording = useCallback(async () => {
    if (!audioPreviewUrl || audioChunksRef.current.length === 0) return;

    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

    setAudioPreviewUrl(null);
    setAudioPreviewPlaying(false);
    setAudioPreviewCurrentTime(0);
    setUploadingMedia(true);

    const randId = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    const filePath = `chat/${userId}/${Date.now()}_${randId}_voicenote.webm`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, audioBlob, { contentType: 'audio/webm' });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      const durationVal = audioPreviewDuration || 0;

      const insertPayload = {
        user_id: userId,
        content: JSON.stringify({ url: publicUrl, duration: durationVal }),
        media_url: publicUrl,
        media_type: 'voice',
      };
      if (coupleKey) insertPayload.couple_key = coupleKey;
      if (replyMessage?.id) insertPayload.reply_to_message_id = replyMessage.id;

      const { error: dbError } = await supabase.from('messages').insert(insertPayload);

      if (dbError) throw dbError;
      if (setReplyMessage) setReplyMessage(null);
    } catch (err) {
      console.error('Failed to upload voice note:', err);
      if (dispatch) {
        dispatch({
          type: 'SET_GLOBAL_NOTIFICATION',
          payload: { message: 'Failed to upload voice note. Please try again.', type: 'error' },
        });
      }
    } finally {
      setUploadingMedia(false);
      audioChunksRef.current = [];
    }
  }, [
    audioPreviewUrl,
    audioPreviewDuration,
    replyMessage,
    userId,
    coupleKey,
    dispatch,
    setReplyMessage,
  ]);

  /**
   * Stops the recording immediately and uploads without entering the preview stage.
   *
   * @returns {void}
   */
  const sendRecordingImmediately = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }

      setIsRecording(false);
      setIsRecordingPaused(false);
      setRecordLevels([]);
      setUploadingMedia(true);

      const randId = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
      const filePath = `chat/${userId}/${Date.now()}_${randId}_voicenote.webm`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(filePath, audioBlob, { contentType: 'audio/webm' });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        const insertPayload = {
          user_id: userId,
          content: JSON.stringify({ url: publicUrl, duration: 0 }),
          media_url: publicUrl,
          media_type: 'voice',
        };
        if (coupleKey) insertPayload.couple_key = coupleKey;
        if (replyMessage?.id) insertPayload.reply_to_message_id = replyMessage.id;

        const { error: dbError } = await supabase.from('messages').insert(insertPayload);

        if (dbError) throw dbError;
        if (setReplyMessage) setReplyMessage(null);
      } catch (err) {
        console.error('Failed to upload voice note immediately:', err);
        if (dispatch) {
          dispatch({
            type: 'SET_GLOBAL_NOTIFICATION',
            payload: { message: 'Failed to upload voice note. Please try again.', type: 'error' },
          });
        }
      } finally {
        setUploadingMedia(false);
        audioChunksRef.current = [];
      }
    };

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    mediaRecorderRef.current.stop();
  }, [isRecording, userId, coupleKey, replyMessage, dispatch, setReplyMessage]);

  return {
    // State
    isRecording,
    isRecordingPaused,
    recordDuration,
    setRecordDuration,
    recordLevels,
    audioPreviewUrl,
    audioPreviewPlaying,
    audioPreviewDuration,
    audioPreviewCurrentTime,
    uploadingMedia,
    setUploadingMedia,
    uploadProgress,
    setUploadProgress,
    // Refs (needed by parent for unmount cleanup guard)
    animationFrameIdRef,
    audioContextRef,
    audioPreviewRef,
    // Handlers
    startRecording,
    pauseRecording,
    resumeRecording,
    discardRecording,
    stopRecordingAndPreview,
    handleTogglePreviewPlay,
    sendRecording,
    sendRecordingImmediately,
  };
}
