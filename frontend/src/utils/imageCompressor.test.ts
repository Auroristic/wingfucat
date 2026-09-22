import { describe, it, expect } from 'vitest';
import { calculateTargetDimensions, compressImage } from './imageCompressor';

describe('imageCompressor', () => {
  describe('calculateTargetDimensions', () => {
    it('returns original dimensions if smaller than maxWidth and maxHeight', () => {
      const result = calculateTargetDimensions(800, 600, 1920, 1920);
      expect(result).toEqual({ width: 800, height: 600 });
    });

    it('scales down landscape image keeping aspect ratio when width exceeds 1920', () => {
      const result = calculateTargetDimensions(3840, 2160, 1920, 1920);
      expect(result).toEqual({ width: 1920, height: 1080 });
    });

    it('scales down portrait image keeping aspect ratio when height exceeds 1920', () => {
      const result = calculateTargetDimensions(1080, 3840, 1920, 1920);
      expect(result).toEqual({ width: 540, height: 1920 });
    });

    it('handles square images above 1920', () => {
      const result = calculateTargetDimensions(3000, 3000, 1920, 1920);
      expect(result).toEqual({ width: 1920, height: 1920 });
    });
  });

  describe('compressImage', () => {
    it('passes through gif images untouched to prevent destroying animation', async () => {
      const gifFile = new File(['fake-gif-content'], 'cat.gif', { type: 'image/gif' });
      const result = await compressImage(gifFile);
      expect(result).toBe(gifFile);
    });

    it('passes through non-image files untouched', async () => {
      const textFile = new File(['text'], 'notes.txt', { type: 'text/plain' });
      const result = await compressImage(textFile);
      expect(result).toBe(textFile);
    });
  });
});
