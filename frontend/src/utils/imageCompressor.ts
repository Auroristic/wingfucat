export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetMimeType?: 'image/webp' | 'image/jpeg';
}

export function calculateTargetDimensions(
  width: number,
  height: number,
  maxWidth: number = 1920,
  maxHeight: number = 1920
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: Math.max(1, width), height: Math.max(1, height) };
  }

  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

/**
 * Loads an image from a File or Blob into an HTMLImageElement or ImageBitmap.
 */
async function loadImage(file: File | Blob): Promise<{ source: CanvasImageSource; width: number; height: number; cleanup: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => {
          if (typeof (bitmap as any).close === 'function') {
            (bitmap as any).close();
          }
        },
      };
    } catch (_) {
      // Fallback to Image element if createImageBitmap fails
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        cleanup: () => {
          URL.revokeObjectURL(objectUrl);
        },
      });
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression: ' + err));
    };

    img.src = objectUrl;
  });
}

/**
 * Compresses an image file by resizing to max 1920px dimensions and encoding as WebP or JPEG.
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  // Pass through non-images and animated GIFs untouched
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    targetMimeType = 'image/webp',
  } = options;

  let loaded: { source: CanvasImageSource; width: number; height: number; cleanup: () => void };
  try {
    loaded = await loadImage(file);
  } catch (err) {
    console.warn('Image loading failed, falling back to original file:', err);
    return file;
  }

  const { source, width, height, cleanup } = loaded;

  try {
    const target = calculateTargetDimensions(width, height, maxWidth, maxHeight);

    let blob: Blob | null = null;

    // Use OffscreenCanvas where supported, fallback to HTMLCanvasElement
    if (typeof OffscreenCanvas !== 'undefined') {
      const offscreen = new OffscreenCanvas(target.width, target.height);
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.drawImage(source, 0, 0, target.width, target.height);
        try {
          blob = await offscreen.convertToBlob({ type: targetMimeType, quality });
        } catch (_) {
          // Fallback to JPEG if WebP is unsupported
          blob = await offscreen.convertToBlob({ type: 'image/jpeg', quality });
        }
      }
    }

    if (!blob && typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = target.width;
      canvas.height = target.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(source, 0, 0, target.width, target.height);
        blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(
            (b) => {
              if (b) {
                resolve(b);
              } else {
                // Fallback to jpeg if webp export returns null
                canvas.toBlob((jpegBlob) => resolve(jpegBlob), 'image/jpeg', quality);
              }
            },
            targetMimeType,
            quality
          );
        });
      }
    }

    if (!blob) {
      return file;
    }

    const ext = blob.type === 'image/jpeg' ? '.jpg' : '.webp';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const finalFilename = `${baseName}${ext}`;

    return new File([blob], finalFilename, {
      type: blob.type,
      lastModified: Date.now(),
    });
  } finally {
    cleanup();
  }
}

export default compressImage;
