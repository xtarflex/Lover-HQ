/**
 * Compresses an image file client-side using HTML5 Canvas.
 * Resizes the image to fit within a max dimension (default 1200px)
 * and exports as JPEG with high-quality compression.
 *
 * @param {File} file - The original image File object.
 * @param {number} [maxDimension=1600] - The maximum width or height.
 * @param {number} [quality=0.9] - WebP compression quality (0.0 to 1.0).
 * @returns {Promise<Blob>} A promise that resolves to the compressed image Blob.
 */
export function compressImage(file, maxDimension = 1600, quality = 0.9) {
  return new Promise((resolve, reject) => {
    // Only compress actual images
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Provided file is not an image'));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Downscale maintaining aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get 2D context from canvas'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas compression failed'));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image element'));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
