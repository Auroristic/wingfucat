import { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { useTheme } from '../context/ThemeContext';

export interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  fileName?: string;
}

export function MediaLightbox({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  caption,
  fileName,
}: MediaLightboxProps) {
  const { theme } = useTheme();
  const isTui = theme.id === 'terminal-tui';
  const [scale, setScale] = useState<number>(1);

  // Reset scale on open/close
  useEffect(() => {
    if (isOpen) {
      setScale(1);
    }
  }, [isOpen, mediaUrl]);

  // Keyboard escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const zoomIn = () => setScale((s) => Math.min(3, +(s + 0.5).toFixed(1)));
  const zoomOut = () => setScale((s) => Math.max(1, +(s - 0.5).toFixed(1)));

  return (
    <div
      data-testid="media-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Media preview"
      className={`fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl select-none animate-fadeIn ${
        isTui ? 'font-mono text-[#00ff41]' : 'text-white'
      }`}
    >
      {/* Top action header */}
      <div
        className={`flex items-center justify-between px-4 py-3 shrink-0 ${
          isTui
            ? 'border-b border-[#00ff41] bg-black'
            : 'border-b border-white/10 bg-black/40 backdrop-blur-md'
        }`}
      >
        <div className="flex items-center gap-2 truncate max-w-sm sm:max-w-md">
          <Icon
            name={mediaType === 'video' ? 'video_file' : 'image'}
            className="text-lg opacity-80"
          />
          <span className="text-sm font-semibold truncate">
            {isTui ? `[ LIGHTBOX: ${mediaType.toUpperCase()} ]` : fileName || caption || 'Media View'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {mediaType === 'image' && (
            <div className="flex items-center gap-1 bg-white/10 rounded-full px-1 py-0.5">
              <button
                type="button"
                onClick={zoomOut}
                disabled={scale <= 1}
                aria-label="Zoom out"
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20 disabled:opacity-30 cursor-pointer transition-colors"
              >
                <Icon name="zoom_out" className="text-base" />
              </button>
              <span className="text-xs px-1 tabular-nums font-mono">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={zoomIn}
                disabled={scale >= 3}
                aria-label="Zoom in"
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20 disabled:opacity-30 cursor-pointer transition-colors"
              >
                <Icon name="zoom_in" className="text-base" />
              </button>
            </div>
          )}

          <a
            href={mediaUrl}
            download={fileName || 'download'}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download media"
            className={`flex h-8 w-8 items-center justify-center transition-colors cursor-pointer ${
              isTui
                ? 'border border-[#00ff41] hover:bg-[#00ff41] hover:text-black'
                : 'rounded-full bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Icon name="download" className="text-lg" />
          </a>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close lightbox"
            className={`flex h-8 w-8 items-center justify-center transition-colors cursor-pointer ${
              isTui
                ? 'border border-[#00ff41] hover:bg-[#00ff41] hover:text-black'
                : 'rounded-full bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>
      </div>

      {/* Main viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-auto p-4 sm:p-8">
        {mediaType === 'image' ? (
          <img
            src={mediaUrl}
            alt={caption || 'Full-screen preview'}
            className="max-h-[82vh] max-w-[92vw] object-contain transition-transform duration-150 ease-out select-none shadow-2xl rounded-lg"
            style={{ transform: `scale(${scale})` }}
          />
        ) : (
          <video
            data-testid="lightbox-video"
            src={mediaUrl}
            controls
            autoPlay
            playsInline
            className="max-h-[82vh] max-w-[92vw] object-contain rounded-xl shadow-2xl bg-black"
          />
        )}
      </div>

      {/* Caption footer */}
      {caption && (
        <div
          className={`px-4 py-2.5 text-center text-sm shrink-0 ${
            isTui
              ? 'border-t border-[#00ff41] bg-black text-[#00ff41]'
              : 'border-t border-white/10 bg-black/50 backdrop-blur-md text-zinc-200'
          }`}
        >
          <p className="max-w-2xl mx-auto truncate">{caption}</p>
        </div>
      )}
    </div>
  );
}

export default MediaLightbox;
