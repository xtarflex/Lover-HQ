import React, { useState, useRef, useEffect } from 'react';
import { useMusic } from '../../../contexts/MusicContext';
import { useSupabase } from '../../../hooks/useSupabase';
import { X, Upload, FileAudio, AlertCircle, Loader2 } from 'lucide-react';
import { YoutubeIcon } from '../../../lib/icons';
import { extractYoutubeId, parseFilenameMetadata, cleanArtistName } from '../lib/musicEngine';

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
  const audioUrlRef = useRef(null);
  const dialogRef = useRef(null);

  // Handle native dialog show/close lifecycle
  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog) {
      if (typeof dialog.showModal === 'function') {
        if (!dialog.open) {
          dialog.showModal();
        }
      } else {
        dialog.setAttribute('open', '');
      }
    }
    return () => {
      if (dialog) {
        if (typeof dialog.close === 'function') {
          if (dialog.open) {
            dialog.close();
          }
        } else {
          dialog.removeAttribute('open');
        }
      }
    };
  }, [isOpen]);

  // Cleanup audio blob URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  /**
   * Handles the selection of a local audio file.
   * Validates file type, size, and extracts metadata/duration.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event.
   */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setError(null);

    // Enforce audio MIME type check
    if (!selectedFile.type || !selectedFile.type.startsWith('audio/')) {
      setError('Please select a valid audio file.');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Enforce 10MB limit (10485760 bytes)
    if (selectedFile.size > 10485760) {
      setError('File is too large. Maximum size allowed is 10MB.');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setFile(selectedFile);

    // Revoke previous blob URL if exists
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    // Read audio duration using native Audio object
    try {
      const audioUrl = URL.createObjectURL(selectedFile);
      audioUrlRef.current = audioUrl;
      const audioObj = new Audio(audioUrl);
      audioObj.addEventListener('loadedmetadata', () => {
        setDuration(Math.round(audioObj.duration));
        if (audioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          audioUrlRef.current = null;
        }
      });
    } catch (err) {
      console.warn('Could not read audio duration dynamically:', err);
    }

    // Auto-parse filename for Title / Artist default
    const metadata = parseFilenameMetadata(selectedFile.name);
    setTitle(metadata.title);
    setArtist(metadata.artist);
  };

  /**
   * Closes the modal and resets all states.
   */
  const handleClose = () => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setYtUrl('');
    setTitle('');
    setArtist('');
    setDuration(null);
    setError(null);
    setIsUploading(false);
    onClose();
  };

  /**
   * Handles the escape key cancellation of the dialog.
   *
   * @param {React.SyntheticEvent} e - The cancel event.
   */
  const handleCancel = (e) => {
    e.preventDefault();
    handleClose();
  };

  /**
   * Handles click events on the dialog, closing it if clicking the backdrop.
   *
   * @param {React.MouseEvent} e - The mouse event.
   */
  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      handleClose();
    }
  };

  /**
   * Handles form submission to add the track.
   *
   * @param {React.FormEvent} e - The form event.
   */
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

        if (!file.type || !file.type.startsWith('audio/')) {
          setError('Please select a valid audio file.');
          setIsUploading(false);
          return;
        }

        // 1. Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        // Use crypto for secure random id generation per AGENTS.md instructions
        const randId = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
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
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      aria-labelledby="dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in border-none bg-transparent w-full h-full max-w-none max-h-none outline-none"
    >
      {/* Modal Box */}
      <div className="bg-surface/90 border border-surface-border backdrop-blur-lg rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-border/60">
          <h3 id="dialog-title" className="text-base font-bold font-rounded text-text-main">
            Add Song to Queue
          </h3>
          <button
            onClick={handleClose}
            disabled={isUploading}
            aria-label="Close"
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
            <YoutubeIcon className="w-4 h-4" />
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
                aria-label="Select audio clip"
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
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                      if (audioUrlRef.current) {
                        URL.revokeObjectURL(audioUrlRef.current);
                        audioUrlRef.current = null;
                      }
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
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={ytUrl || ""}
                onChange={(e) => {
                  const urlValue = e.target.value;
                  setYtUrl(urlValue);
                  const id = extractYoutubeId(urlValue);
                  if (id) {
                    const isMusic = urlValue.includes('music.youtube.com');
                    const placeholder = isMusic ? 'YouTube Music' : 'YouTube Video';
                    if (!title || title === 'YouTube Video' || title === 'YouTube Music') {
                      setTitle('Loading video details...');
                    }
                    fetch(`https://noembed.com/embed?url=${encodeURIComponent(urlValue)}`)
                      .then((res) => res.json())
                      .then((data) => {
                        if (data) {
                          setTitle((prev) =>
                            !prev ||
                            prev === 'Loading video details...' ||
                            prev === 'YouTube Video' ||
                            prev === 'YouTube Music'
                              ? data.title || placeholder
                              : prev
                          );
                          setArtist((prev) =>
                            !prev ? cleanArtistName(data.author_name) || '' : prev
                          );
                        }
                      })
                      .catch((err) => {
                        console.warn('Failed to fetch YouTube metadata:', err);
                        setTitle((prev) =>
                          prev === 'Loading video details...' ? placeholder : prev
                        );
                      });
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
                value={title || ""}
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
                value={artist || ""}
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
    </dialog>
  );
}
