import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Save, AlertCircle } from 'lucide-react';
import {
  uploadFridgeMedia,
  getFridgeMediaPublicUrl,
  createFridgeItem,
} from '../../../services/fridge';
import { compressImage } from '../../../utils/compression';
import { ModalOverlay } from '../../../components/ModalOverlay';

/**
 * @file PhotoModal.jsx
 * @description Modal component for choosing, compressing, and pinning photos as magnets on the collaborative Fridge board.
 */

/**
 * Photo Magnet Creator Modal
 *
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Controls visibility of the modal
 * @param {Function} props.onClose - Callback function to close the modal
 * @param {string} props.userId - ID of the current user
 * @param {Function} props.onSave - Callback when the photo is successfully pinned/saved
 * @returns {React.ReactElement} The PhotoModal component
 */
export function PhotoModal({ isOpen, onClose, userId, onSave }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (!isOpen) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsUploading(false);
      setUploadProgress(0);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(15);
    setError(null);

    try {
      // 1. Perform Client-Side Image Compression
      setUploadProgress(40);
      const compressedBlob = await compressImage(selectedFile);
      setUploadProgress(60);

      // 2. Upload to Supabase Storage Bucket 'fridge-media'
      const fileExt = 'webp';
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      await uploadFridgeMedia(fileName, compressedBlob, {
        contentType: 'image/webp',
        cacheControl: '3600',
      });
      setUploadProgress(85);

      // 3. Get Public URL
      const publicUrl = getFridgeMediaPublicUrl(fileName);

      // 4. Insert DB Record
      const dbData = await createFridgeItem({
        user_id: userId,
        type: 'photo',
        content: publicUrl,
        x_position: 30 + Math.random() * 40,
        y_position: 30 + Math.random() * 40,
      });

      setUploadProgress(100);

      if (onSave) onSave(dbData);
      onClose();
    } catch (err) {
      console.error('Photo upload error:', err);
      setError(err.message || 'Failed to upload photo magnet.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-bold text-text-main">Add Photo Magnet</h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Polaroid Style Preview */}
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className="w-full bg-[#f3f4f6] text-gray-800 p-4 pb-8 rounded-lg shadow-md border border-gray-300 flex flex-col items-center justify-center aspect-[4/5] cursor-pointer hover:bg-gray-200/90 transition-all group overflow-hidden"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={isUploading}
          />

          {previewUrl ? (
            <div className="w-full h-full relative flex items-center justify-center bg-gray-900 rounded overflow-hidden">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 gap-2">
              <ImageIcon className="w-12 h-12 text-gray-400 group-hover:scale-105 transition-transform" />
              <p className="text-xs font-bold uppercase tracking-wider mt-2">Select a photo</p>
              <p className="text-[10px] text-gray-400">Compressed automatically for fast sync</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {isUploading && (
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-4">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 my-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-brand-surface font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm mt-4"
        >
          <Save className="w-4 h-4" />
          {isUploading ? 'Compressing & Syncing...' : 'Pin Photo'}
        </button>
      </div>
    </ModalOverlay>
  );
}
