/**
 * @file ImageLightbox.test.jsx
 * @description Unit tests for the ImageLightbox component.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImageLightbox } from './ImageLightbox';

describe('ImageLightbox', () => {
  it('renders an img tag for a photo URL', () => {
    render(
      <ImageLightbox src="https://example.com/photo.jpg" onClose={vi.fn()} onDownload={vi.fn()} />
    );
    expect(screen.getByAltText('Shared details')).toBeInTheDocument();
    expect(screen.getByText('Shared Photo')).toBeInTheDocument();
  });

  it('renders a video tag for a video URL', () => {
    const { container } = render(
      <ImageLightbox src="https://example.com/clip.mp4" onClose={vi.fn()} onDownload={vi.fn()} />
    );
    expect(container.querySelector('video')).toBeInTheDocument();
    expect(screen.getByText('Shared Video')).toBeInTheDocument();
  });

  it('shows Download Image for a photo', () => {
    render(
      <ImageLightbox src="https://example.com/photo.jpg" onClose={vi.fn()} onDownload={vi.fn()} />
    );
    expect(screen.getByText('Download Image')).toBeInTheDocument();
  });

  it('shows Download Video for a video', () => {
    render(
      <ImageLightbox src="https://example.com/clip.webm" onClose={vi.fn()} onDownload={vi.fn()} />
    );
    expect(screen.getByText('Download Video')).toBeInTheDocument();
  });

  it('calls onClose when the X button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ImageLightbox src="https://example.com/photo.jpg" onClose={onClose} onDownload={vi.fn()} />
    );
    fireEvent.click(screen.getByLabelText('Close lightbox'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onDownload with src when download button is clicked', () => {
    const onDownload = vi.fn();
    const src = 'https://example.com/photo.jpg';
    render(<ImageLightbox src={src} onClose={vi.fn()} onDownload={onDownload} />);
    fireEvent.click(screen.getByText('Download Image'));
    expect(onDownload).toHaveBeenCalledWith(src);
  });
});
