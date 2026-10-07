/**
 * Image Upload & Compression Helper
 * Reads an image file from the user's device and compresses it via Canvas
 * into a lightweight, high-quality Data URL (JPEG/WebP) to avoid heavy payloads.
 */

export interface CompressImageOptions {
  maxDim?: number;
  quality?: number;
  maxSizeBytes?: number;
}

export const compressImageFile = (
  file: File,
  options: CompressImageOptions = {}
): Promise<string> => {
  const { maxDim = 800, quality = 0.85, maxSizeBytes = 10 * 1024 * 1024 } = options;

  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (JPG, PNG, WebP)'));
      return;
    }

    if (file.size > maxSizeBytes) {
      reject(new Error(`File size exceeds ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB limit.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Draw with smooth smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG Data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error('Failed to decode image file'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read image file from device'));
    reader.readAsDataURL(file);
  });
};
