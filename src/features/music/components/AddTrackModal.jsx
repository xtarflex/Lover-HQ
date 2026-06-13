import React, { useState, useRef } from 'react';
import { useMusic } from '../../../contexts/MusicContext';
import { useSupabase } from '../../../hooks/useSupabase';
import { X, Upload, Tv, FileAudio, AlertCircle, Loader2 } from 'lucide-react';
import { extractYoutubeId, parseFilenameMetadata } from '../lib/musicEngine';

/**
 * AddTrackModal component. Renders the modal with tabs for
 * uploading custom audio files or adding YouTube video links.
 * Parses metadata automatically when files are selected.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open.
 * @param {Function} props.onClose - Callback to close the modal.
 * @returns {React.ReactElement|null} The AddTrackModal component.
 */
export default function AddTrackModal({ isOpen, onClose }) {
  const supabase = useSupabase();
  const { addToQueue } = useMusic();

  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'youtube'
  const [file, setFile] = useState(null);
  const [ytUrl, setYtUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [duration, setDuration] = useState(null);

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Clean filename for defaults
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setError(null);

    // Enforce 10MB limit (10485760 bytes)
    if (selectedFile.size > 10485760) {
      setError('File is too large. Maximum size allowed is 10MB.');
      setFile(null);
      return;
    }

    setFile(selectedFile);

    // Read audio duration using native Audio object
    try {
      const audioUrl = URL.createObjectURL(selectedFile);
      const audioObj = new Audio(audioUrl);
      audioObj.addEventListener('loadedmetadata', () => {
        setDuration(Math.round(audioObj.duration));
        URL.revokeObjectURL(audioUrl);
      });
    } catch (err) {
      console.warn('Could not read audio duration dynamically:', err);
    }

    // Auto-parse filename for Title / Artist default
    const metadata = parseFilenameMetadata(selectedFile.name);
    setTitle(metadata.title);
    setArtist(metadata.artist);
  };

  const handleClose = () => {
    setFile(null);
    setYtUrl('');
    setTitle('');
    setArtist('');
    setDuration(null);
    setError(null);
    setIsUploading(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Song title is required.');
      return;
    }

    setIsUploading(true);

    try {
      if (activeTab === 'upload') {
        if (!file) {
          setError('Please select an audio file first.');
          setIsUploading(false);
          return;
        }

        // 1. Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const randId = Math.random().toString(36).substring(2, 15);
        const filePath = `${Date.now()}_${randId}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from('music-media')
          .upload(filePath, file);

        if (uploadErr) throw uploadErr;

        // 2. Get Public Url
        const { data: publicUrlData } = supabase.storage.from('music-media').getPublicUrl(filePath);

        const fileUrl = publicUrlData.publicUrl;

        // 3. Add to context/db queue
        await addToQueue(title.trim(), artist.trim(), 'upload', fileUrl, duration);
      } else {
        const ytId = extractYoutubeId(ytUrl);
        if (!ytId) {
          setError('Please enter a valid YouTube video URL.');
          setIsUploading(false);
          return;
        }

        // Add to context/db queue (duration_seconds is null, fetched dynamically on play)
        await addToQueue(title.trim(), artist.trim(), 'youtube', ytId, null);
      }

      handleClose();
    } catch (err) {
      console.error('Failed to add track:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      {/* Modal Box */}
      <div className="bg-surface/90 border border-surface-border backdrop-blur-lg rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-border/60">
          <h3 className="text-base font-bold font-rounded text-text-main">Add Song to Queue</h3>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-1 hover:bg-slate-800 rounded-lg text-text-muted hover:text-text-main transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-surface-border/40 bg-slate-900/40">
          <button
            type="button"
            onClick={() => {
              if (isUploading) return;
              setActiveTab('upload');
              setError(null);
            }}
            disabled={isUploading}
            className={`flex-1 py-3 text-xs font-bold font-rounded flex items-center justify-center space-x-1.5 border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Audio File</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (isUploading) return;
              setActiveTab('youtube');
              setError(null);
            }}
            disabled={isUploading}
            className={`flex-1 py-3 text-xs font-bold font-rounded flex items-center justify-center space-x-1.5 border-b-2 transition-all ${
              activeTab === 'youtube'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            <Tv className="w-4 h-4 text-red-500" />
            <span>Add YouTube Link</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start space-x-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'upload' ? (
            <div className="space-y-3">
              <label className="block text-xs font-bold font-rounded uppercase tracking-wider text-text-muted">
                Audio File (Max 10MB)
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {file ? (
                <div className="flex items-center justify-between border border-primary/20 bg-primary/5 p-3.5 rounded-xl">
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <FileAudio className="w-8 h-8 text-primary flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-text-main truncate">{file.name}</span>
                      <span className="text-[10px] text-text-muted">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB •{' '}
                        {duration ? `${duration}s` : 'Reading length...'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setDuration(null);
                    }}
                    className="text-text-muted hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-primary/50 bg-slate-900/20 py-8 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-900/40"
                >
                  <Upload className="w-8 h-8 text-slate-500 mb-2 group-hover:text-primary" />
                  <span className="text-xs font-bold text-text-muted">
                    Select audio clip (.mp3, .m4a, etc.)
                  </span>
                  <span className="text-[10px] text-text-muted/60 mt-1">
                    Files compress/stream dynamically
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-rounded uppercase tracking-wider text-text-muted">
                YouTube URL
              </label>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={ytUrl}
                onChange={(e) => {
                  setYtUrl(e.target.value);
                  const id = extractYoutubeId(e.target.value);
                  if (id) {
                    // Try to set default title if empty
                    if (!title) setTitle('YouTube Video');
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-text-main placeholder-slate-600 focus:outline-none"
              />
            </div>
          )}

          {/* Form input fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-rounded uppercase tracking-wider text-text-muted">
                Song Title
              </label>
              <input
                type="text"
                placeholder="e.g. Yellow"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-text-main placeholder-slate-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-rounded uppercase tracking-wider text-text-muted">
                Artist (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Coldplay"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-text-main placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={
                isUploading ||
                (activeTab === 'upload' && !file) ||
                (activeTab === 'youtube' && !ytUrl)
              }
              className="w-full bg-primary hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50 disabled:hover:bg-primary shadow-lg shadow-primary/10"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding song...</span>
                </>
              ) : (
                <span>Add Track</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
