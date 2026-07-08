/**
 * @file compression.test.js
 * @description Comprehensive unit tests for client-side image compression.
 * Mocks FileReader, Image, and Canvas elements to test error conditions and aspect ratio mathematics.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { compressImage } from './compression.js';

describe('compressImage', () => {
  let originalFileReader;
  let originalImage;
  let originalCreateElement;

  beforeEach(() => {
    originalFileReader = globalThis.FileReader;
    originalImage = globalThis.Image;
    originalCreateElement = document.createElement;
  });

  afterEach(() => {
    globalThis.FileReader = originalFileReader;
    globalThis.Image = originalImage;
    document.createElement = originalCreateElement;
    vi.restoreAllMocks();
  });

  // Helper to create a fake file object
  const createFakeFile = (name, type) => {
    return new File(['fake_binary_content'], name, { type });
  };

  it('rejects immediately with an error if the file is not an image type', async () => {
    const file = createFakeFile('document.pdf', 'application/pdf');
    await expect(compressImage(file)).rejects.toThrow('Provided file is not an image');
  });

  it('rejects with FileReader error if reading the file fails', async () => {
    const file = createFakeFile('photo.jpg', 'image/jpeg');

    // Mock FileReader to trigger onerror
    globalThis.FileReader = class {
      readAsDataURL() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Error('FileReader mock failure'));
          }
        }, 0);
      }
    };

    await expect(compressImage(file)).rejects.toThrow('Failed to read image file');
  });

  it('rejects with Image load error if loading image element fails', async () => {
    const file = createFakeFile('photo.jpg', 'image/jpeg');

    // Mock FileReader to succeed
    globalThis.FileReader = class {
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,mock' } });
          }
        }, 0);
      }
    };

    // Mock Image to fail loading
    globalThis.Image = class {
      set src(val) {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Error('Image element mock load failure'));
          }
        }, 0);
      }
    };

    await expect(compressImage(file)).rejects.toThrow('Failed to load image element');
  });

  it('rejects when canvas context 2D is unavailable', async () => {
    const file = createFakeFile('photo.jpg', 'image/jpeg');

    globalThis.FileReader = class {
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,mock' } });
          }
        }, 0);
      }
    };

    globalThis.Image = class {
      constructor() {
        this.width = 1000;
        this.height = 1000;
      }
      set src(val) {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    };

    // Mock document.createElement to return a canvas that fails to get 2D context
    document.createElement = vi.fn().mockImplementation((tag) => {
      if (tag === 'canvas') {
        return {
          getContext: vi.fn().mockReturnValue(null),
        };
      }
      return originalCreateElement.call(document, tag);
    });

    await expect(compressImage(file)).rejects.toThrow('Could not get 2D context from canvas');
  });

  it('rejects when toBlob returns null (canvas compression failure)', async () => {
    const file = createFakeFile('photo.jpg', 'image/jpeg');

    globalThis.FileReader = class {
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,mock' } });
          }
        }, 0);
      }
    };

    globalThis.Image = class {
      constructor() {
        this.width = 1000;
        this.height = 1000;
      }
      set src(val) {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    };

    const mockCtx = { drawImage: vi.fn() };
    document.createElement = vi.fn().mockImplementation((tag) => {
      if (tag === 'canvas') {
        return {
          getContext: vi.fn().mockReturnValue(mockCtx),
          toBlob: vi.fn().mockImplementation((callback) => {
            // Simulate compression failure by passing null
            setTimeout(() => callback(null), 0);
          }),
        };
      }
      return originalCreateElement.call(document, tag);
    });

    await expect(compressImage(file)).rejects.toThrow('Canvas compression failed');
  });

  it('downscales wider image when exceeding max dimension', async () => {
    const file = createFakeFile('photo.jpg', 'image/jpeg');

    globalThis.FileReader = class {
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,mock' } });
          }
        }, 0);
      }
    };

    globalThis.Image = class {
      constructor() {
        this.width = 2000;
        this.height = 1000;
      }
      set src(val) {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    };

    const mockCtx = { drawImage: vi.fn() };
    const mockBlob = new Blob(['compressed_data'], { type: 'image/webp' });
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi.fn().mockImplementation((callback) => {
        setTimeout(() => callback(mockBlob), 0);
      }),
    };

    document.createElement = vi.fn().mockImplementation((tag) => {
      if (tag === 'canvas') {
        return mockCanvas;
      }
      return originalCreateElement.call(document, tag);
    });

    // maxDimension = 1600 (default). Original: 2000x1000.
    // Expect aspect ratio downscale to: 1600 x 800.
    const result = await compressImage(file, 1600);
    expect(result).toBe(mockBlob);
    expect(mockCanvas.width).toBe(1600);
    expect(mockCanvas.height).toBe(800);
    expect(mockCtx.drawImage).toHaveBeenCalledWith(expect.any(Object), 0, 0, 1600, 800);
  });

  it('downscales taller image when exceeding max dimension', async () => {
    const file = createFakeFile('photo.jpg', 'image/jpeg');

    globalThis.FileReader = class {
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,mock' } });
          }
        }, 0);
      }
    };

    globalThis.Image = class {
      constructor() {
        this.width = 1000;
        this.height = 2000;
      }
      set src(val) {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    };

    const mockCtx = { drawImage: vi.fn() };
    const mockBlob = new Blob(['compressed_data'], { type: 'image/webp' });
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi.fn().mockImplementation((callback) => {
        setTimeout(() => callback(mockBlob), 0);
      }),
    };

    document.createElement = vi.fn().mockImplementation((tag) => {
      if (tag === 'canvas') {
        return mockCanvas;
      }
      return originalCreateElement.call(document, tag);
    });

    // maxDimension = 800. Original: 1000x2000.
    // Expect aspect ratio downscale to: 400 x 800.
    const result = await compressImage(file, 800);
    expect(result).toBe(mockBlob);
    expect(mockCanvas.width).toBe(400);
    expect(mockCanvas.height).toBe(800);
    expect(mockCtx.drawImage).toHaveBeenCalledWith(expect.any(Object), 0, 0, 400, 800);
  });

  it('keeps dimensions if image is smaller than maxDimension', async () => {
    const file = createFakeFile('photo.jpg', 'image/jpeg');

    globalThis.FileReader = class {
      readAsDataURL() {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,mock' } });
          }
        }, 0);
      }
    };

    globalThis.Image = class {
      constructor() {
        this.width = 500;
        this.height = 300;
      }
      set src(val) {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    };

    const mockCtx = { drawImage: vi.fn() };
    const mockBlob = new Blob(['compressed_data'], { type: 'image/webp' });
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi.fn().mockImplementation((callback) => {
        setTimeout(() => callback(mockBlob), 0);
      }),
    };

    document.createElement = vi.fn().mockImplementation((tag) => {
      if (tag === 'canvas') {
        return mockCanvas;
      }
      return originalCreateElement.call(document, tag);
    });

    // maxDimension = 1000. Original: 500x300.
    // Expect no downscaling: 500 x 300.
    const result = await compressImage(file, 1000);
    expect(result).toBe(mockBlob);
    expect(mockCanvas.width).toBe(500);
    expect(mockCanvas.height).toBe(300);
  });
});
