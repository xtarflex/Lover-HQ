/**
 * @file MediaPreviewSheet.test.jsx
 * @description Unit tests for MediaPreviewSheet component.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MediaPreviewSheet } from './MediaPreviewSheet';

describe('MediaPreviewSheet', () => {
  it('renders null when pendingMediaFiles is null or empty', () => {
    const { container: containerNull } = render(
      <MediaPreviewSheet
        pendingMediaFiles={null}
        setPendingMediaFiles={vi.fn()}
        activePreviewIndex={0}
        setActivePreviewIndex={vi.fn()}
        mediaCaption=""
        setMediaCaption={vi.fn()}
        isCropping={false}
        setIsCropping={vi.fn()}
        cropRect={{ x: 0, y: 0, w: 100, h: 100 }}
        cropAspectRatio="free"
        setCropAspectRatio={vi.fn()}
        showFiltersDrawer={false}
        setShowFiltersDrawer={vi.fn()}
        previewContainerRef={{ current: null }}
        activeObjectUrl=""
        handleToggleMuteActive={vi.fn()}
        handleStartCropping={vi.fn()}
        handleRotateActive={vi.fn()}
        handleFlipActive={vi.fn()}
        handleTouchStart={vi.fn()}
        handleTouchEnd={vi.fn()}
        getScaleAndDims={() => ({ scale: 1, width: '100px', height: '100px' })}
        handleImageLoad={vi.fn()}
        handleCropPointerDown={vi.fn()}
        applyAspectRatio={vi.fn()}
        handleSaveCrop={vi.fn()}
        handleFilterActive={vi.fn()}
        triggerImageSelect={vi.fn()}
        setNaturalDims={vi.fn()}
        handleBatchUpload={vi.fn()}
      />
    );
    expect(containerNull.firstChild).toBeNull();
  });

  it('renders null when pendingMediaFiles is empty', () => {
    const { container } = render(
      <MediaPreviewSheet
        pendingMediaFiles={[]}
        setPendingMediaFiles={vi.fn()}
        activePreviewIndex={0}
        setActivePreviewIndex={vi.fn()}
        mediaCaption=""
        setMediaCaption={vi.fn()}
        isCropping={false}
        setIsCropping={vi.fn()}
        cropRect={{ x: 0, y: 0, w: 100, h: 100 }}
        cropAspectRatio="free"
        setCropAspectRatio={vi.fn()}
        showFiltersDrawer={false}
        setShowFiltersDrawer={vi.fn()}
        previewContainerRef={{ current: null }}
        activeObjectUrl=""
        handleToggleMuteActive={vi.fn()}
        handleStartCropping={vi.fn()}
        handleRotateActive={vi.fn()}
        handleFlipActive={vi.fn()}
        handleTouchStart={vi.fn()}
        handleTouchEnd={vi.fn()}
        getScaleAndDims={() => ({ scale: 1, width: '100px', height: '100px' })}
        handleImageLoad={vi.fn()}
        handleCropPointerDown={vi.fn()}
        applyAspectRatio={vi.fn()}
        handleSaveCrop={vi.fn()}
        handleFilterActive={vi.fn()}
        triggerImageSelect={vi.fn()}
        setNaturalDims={vi.fn()}
        handleBatchUpload={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
