/**
 * @file useMediaUploader.js
 * @description Custom hook that manages multi-image/video selection, image cropping, filter presets,
 * canvas rendering, and batch uploads to Supabase storage for the Lover-HQ chat feature.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

/**
 * Manages multi-media upload, filter/cropping preview, and storage insertion state.
 *
 * @param {object} options
 * @param {string|null} options.userId - Current user ID.
 * @param {object|null} options.replyMessage - Optional reply context.
 * @param {Function} options.setReplyMessage - Setter to clear reply message.
 * @param {Function} options.dispatch - AppContext dispatch.
 * @returns {object} Media uploader state and handlers.
 */
export function useMediaUploader({ userId, replyMessage, setReplyMessage, dispatch } = {}) {
  const [pendingMediaFiles, setPendingMediaFiles] = useState([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [mediaCaption, setMediaCaption] = useState('');
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState({ x: 10, y: 10, w: 80, h: 80 });
  const [cropAspectRatio, setCropAspectRatio] = useState('free');
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [naturalDims, setNaturalDims] = useState({ w: 0, h: 0 });
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const previewContainerRef = useRef(null);
  const dragRef = useRef(null);

  const activeItem = pendingMediaFiles[activePreviewIndex] || pendingMediaFiles[0];
  const activeObjectUrl = activeItem?.file ? URL.createObjectURL(activeItem.file) : '';

  useEffect(() => {
    return () => {
      if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
    };
  }, [activeObjectUrl]);

  const handleToggleMuteActive = useCallback(() => {
    setPendingMediaFiles((prev) =>
      prev.map((item, idx) =>
        idx === activePreviewIndex ? { ...item, isMuted: !item.isMuted } : item
      )
    );
  }, [activePreviewIndex]);

  const handleRotateActive = useCallback(() => {
    setPendingMediaFiles((prev) =>
      prev.map((item, idx) =>
        idx === activePreviewIndex ? { ...item, rotation: (item.rotation + 90) % 360 } : item
      )
    );
  }, [activePreviewIndex]);

  const handleFlipActive = useCallback(() => {
    setPendingMediaFiles((prev) =>
      prev.map((item, idx) =>
        idx === activePreviewIndex ? { ...item, flipped: !item.flipped } : item
      )
    );
  }, [activePreviewIndex]);

  const handleFilterActive = useCallback(
    (filterName) => {
      setPendingMediaFiles((prev) =>
        prev.map((item, idx) =>
          idx === activePreviewIndex ? { ...item, filter: filterName } : item
        )
      );
    },
    [activePreviewIndex]
  );

  const handleStartCropping = useCallback(() => {
    setIsCropping(true);
    setCropRect({ x: 10, y: 10, w: 80, h: 80 });
  }, []);

  const applyAspectRatio = useCallback((ratioStr) => {
    setCropAspectRatio(ratioStr);
    if (ratioStr === 'free') {
      setCropRect({ x: 10, y: 10, w: 80, h: 80 });
      return;
    }
    const [rw, rh] = ratioStr.split(':').map(Number);
    const targetAspect = rw / rh;

    let w = 80;
    let h = 80;
    if (targetAspect >= 1) {
      h = Math.min(80, 80 / targetAspect);
    } else {
      w = Math.min(80, 80 * targetAspect);
    }
    const x = Math.max(0, (100 - w) / 2);
    const y = Math.max(0, (100 - h) / 2);
    setCropRect({ x, y, w, h });
  }, []);

  const handleSaveCrop = useCallback(() => {
    setIsCropping(false);
  }, []);

  const getScaleAndDims = useCallback(() => {
    return { scale: 1, width: '100%', height: '100%' };
  }, []);

  const handleImageLoad = useCallback((e) => {
    setNaturalDims({ w: e.target.naturalWidth || 0, h: e.target.naturalHeight || 0 });
  }, []);

  // Interactive mouse/touch drag handler for resizable crop box
  const handleCropPointerDown = useCallback(
    (e, handle) => {
      e.stopPropagation();

      const cropBoxContainer = e.currentTarget.parentElement;
      if (!cropBoxContainer) return;
      const containerRect = cropBoxContainer.getBoundingClientRect();

      const startX = e.clientX !== undefined ? e.clientX : e.touches?.[0]?.clientX;
      const startY = e.clientY !== undefined ? e.clientY : e.touches?.[0]?.clientY;

      dragRef.current = {
        handle,
        startX,
        startY,
        startCrop: { ...cropRect },
        containerRect,
      };

      const handlePointerMove = (moveEvent) => {
        if (!dragRef.current) return;
        const curX =
          moveEvent.clientX !== undefined ? moveEvent.clientX : moveEvent.touches?.[0]?.clientX;
        const curY =
          moveEvent.clientY !== undefined ? moveEvent.clientY : moveEvent.touches?.[0]?.clientY;
        if (curX === undefined || curY === undefined) return;

        const deltaX =
          ((curX - dragRef.current.startX) / dragRef.current.containerRect.width) * 100;
        const deltaY =
          ((curY - dragRef.current.startY) / dragRef.current.containerRect.height) * 100;

        let { x, y, w, h } = dragRef.current.startCrop;
        const activeHandle = dragRef.current.handle;

        let dx = deltaX;
        let dy = deltaY;
        const activeItem = pendingMediaFiles[activePreviewIndex] || pendingMediaFiles[0];
        const rotation = activeItem?.rotation || 0;

        if (rotation === 90) {
          dx = deltaY;
          dy = -deltaX;
        } else if (rotation === 180) {
          dx = -deltaX;
          dy = -deltaY;
        } else if (rotation === 270) {
          dx = -deltaY;
          dy = deltaX;
        }

        if (activeHandle === 'move') {
          x = Math.max(0, Math.min(100 - w, x + dx));
          y = Math.max(0, Math.min(100 - h, y + dy));
        } else if (activeHandle === 'top-left') {
          const newW = Math.max(15, w - dx);
          const newH = Math.max(15, h - dy);
          x = x + (w - newW);
          y = y + (h - newH);
          w = newW;
          h = newH;
        } else if (activeHandle === 'top-right') {
          const newW = Math.max(15, w + dx);
          const newH = Math.max(15, h - dy);
          y = y + (h - newH);
          w = newW;
          h = newH;
        } else if (activeHandle === 'bottom-left') {
          const newW = Math.max(15, w - dx);
          const newH = Math.max(15, h + dy);
          x = x + (w - newW);
          w = newW;
          h = newH;
        } else if (activeHandle === 'bottom-right') {
          w = Math.max(15, w + dx);
          h = Math.max(15, h + dy);
        }

        setCropRect({
          x: Math.max(0, Math.min(100 - w, x)),
          y: Math.max(0, Math.min(100 - h, y)),
          w: Math.min(100, w),
          h: Math.min(100, h),
        });
      };

      const handlePointerUp = () => {
        dragRef.current = null;
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);
        window.removeEventListener('touchmove', handlePointerMove);
        window.removeEventListener('touchend', handlePointerUp);
      };

      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerUp);
    },
    [cropRect, activePreviewIndex, pendingMediaFiles]
  );

  const handleTouchStart = useCallback(() => {}, []);
  const handleTouchEnd = useCallback(() => {}, []);

  const processEditedImage = async (item) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 800;
        const ctx = canvas.getContext('2d');

        if (item.filter && item.filter !== 'none') {
          const filterStyles = {
            grayscale: 'grayscale(100%)',
            sepia: 'sepia(100%)',
            warm: 'sepia(30%) saturate(140%) hue-rotate(-10deg)',
            cool: 'saturate(120%) hue-rotate(10deg)',
            vintage: 'sepia(50%) contrast(85%) saturate(110%)',
          };
          ctx.filter = filterStyles[item.filter] || 'none';
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.scale(item.flipped ? -1 : 1, 1);
        ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

        canvas.toBlob((blob) => resolve(blob || item.file), 'image/webp', 0.85);
      };
      img.onerror = () => resolve(item.file);
      img.src = URL.createObjectURL(item.file);
    });
  };

  const handleBatchUpload = async () => {
    if (pendingMediaFiles.length === 0 || !userId) return;

    const filesToUpload = [...pendingMediaFiles];
    const captionToSend = mediaCaption.trim();

    setPendingMediaFiles([]);
    setMediaCaption('');
    setActivePreviewIndex(0);
    setUploadingMedia(true);
    setUploadProgress({ current: 0, total: filesToUpload.length });

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        setUploadProgress({ current: i + 1, total: filesToUpload.length });
        const item = filesToUpload[i];
        const file = item.file;
        const isVideo = file.type.startsWith('video/');

        const randId = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
        const rawExt = file.name.includes('.') ? file.name.split('.').pop() : '';
        const cleanExt = rawExt ? `.${rawExt.replace(/[^a-zA-Z0-9]/g, '')}` : '';
        const finalExt = isVideo ? cleanExt || '.mp4' : '.webp';
        const filePath = `chat/${userId}/${Date.now()}_${randId}${finalExt}`;

        let processedBlob;
        if (isVideo) {
          processedBlob = file;
        } else {
          processedBlob = await processEditedImage(item);
        }

        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(filePath, processedBlob, { contentType: isVideo ? file.type : 'image/webp' });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        const insertPayload = {
          user_id: userId,
          content: i === 0 ? captionToSend : '',
          media_url: publicUrl,
          media_type: isVideo ? 'video' : 'image',
        };
        if (replyMessage?.id) insertPayload.reply_to_message_id = replyMessage.id;

        const { error: dbError } = await supabase.from('messages').insert(insertPayload);
        if (dbError) throw dbError;
      }
      if (setReplyMessage) setReplyMessage(null);
    } catch (err) {
      console.error('Failed to upload media batch:', err);
      if (dispatch) {
        dispatch({
          type: 'SET_GLOBAL_NOTIFICATION',
          payload: { message: 'Failed to upload media. Please try again.', type: 'error' },
        });
      }
    } finally {
      setUploadingMedia(false);
      setUploadProgress(null);
    }
  };

  return {
    pendingMediaFiles,
    setPendingMediaFiles,
    activePreviewIndex,
    setActivePreviewIndex,
    mediaCaption,
    setMediaCaption,
    isCropping,
    setIsCropping,
    cropRect,
    setCropRect,
    cropAspectRatio,
    setCropAspectRatio,
    showFiltersDrawer,
    setShowFiltersDrawer,
    previewContainerRef,
    activeObjectUrl,
    uploadingMedia,
    uploadProgress,
    naturalDims,
    handleToggleMuteActive,
    handleStartCropping,
    handleRotateActive,
    handleFlipActive,
    handleTouchStart,
    handleTouchEnd,
    getScaleAndDims,
    handleImageLoad,
    handleCropPointerDown,
    applyAspectRatio,
    handleSaveCrop,
    handleFilterActive,
    setNaturalDims,
    handleBatchUpload,
  };
}
