import { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from './Icon';
import {
  useTheme,
  THEME_PRESETS,
  type BubbleStyle,
  type TypingAnimation,
} from '../context/ThemeContext';

export interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

function downscaleImage(file: File, maxWidth = 1280, maxHeight = 720, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function ThemeSettingsModal({
  isOpen,
  onClose,
  className = '',
}: ThemeSettingsModalProps) {
  const {
    theme,
    setPreset,
    setBubbleStyle,
    setTypingAnimation,
    setWallpaper,
    setWallpaperDim,
    setWallpaperBlur,
  } = useTheme();

  const [customUrl, setCustomUrl] = useState('');
  const [wallpaperStatus, setWallpaperStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const presets = Object.values(THEME_PRESETS);

  const bubbleOptions: { id: BubbleStyle; label: string; desc: string }[] = [
    { id: 'rounded', label: 'Rounded', desc: 'Standard modern smooth curve' },
    { id: 'soft-cloud', label: 'Soft Cloud', desc: 'Plump 20px+ bouncy bubbles' },
    { id: 'sharp', label: 'Sharp Cyber', desc: 'Edgy angular geometric corners' },
    { id: 'glass', label: 'Glassmorphic', desc: 'Translucent gradient border sheen' },
  ];

  const typingOptions: { id: TypingAnimation; label: string; desc: string }[] = [
    { id: 'dots', label: 'Discord Dots', desc: 'Three smooth staggered bouncing dots' },
    { id: 'hearts', label: 'Pulsing Hearts', desc: 'Cute rhythmic pulsing hearts' },
    { id: 'neon-pulse', label: 'Neon Pulse', desc: 'Cyberpunk neon flickering dots' },
    { id: 'glow-bar', label: 'Sweeping Glow Bar', desc: 'Futuristic animated holographic light bar' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Appearance & Themes"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        className={`relative flex w-full max-w-xl flex-col rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl text-white my-auto max-h-[90vh] overflow-y-auto ${className}`}
        style={{
          backgroundColor: 'var(--theme-bg-secondary)',
          borderColor: 'var(--theme-border-subtle)',
          color: 'var(--theme-text-primary)',
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800"
              style={{
                backgroundColor: 'var(--theme-bg-surface)',
                borderColor: 'var(--theme-border-subtle)',
                color: 'var(--theme-accent)',
              }}
            >
              <Icon name="palette" className="text-xl" />
            </span>
            <div>
              <h2 className="text-base font-semibold font-heading tracking-tight leading-tight">
                Appearance & Themes
              </h2>
              <p className="text-xs text-zinc-400">
                Custom fonts, colors, and micro-animations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close appearance settings"
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>

        {/* Live Interactive Preview Box */}
        <div className="mb-5 flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 font-heading">
            Live Preview
          </span>
          <div
            data-testid="theme-preview-box"
            data-preview-theme={theme.id}
            data-preview-bubble={theme.bubbleStyle}
            data-preview-typing={theme.typingAnimation}
            className="relative rounded-2xl border p-4 flex flex-col gap-3 transition-all duration-300 overflow-hidden bg-cover bg-center"
            style={{
              backgroundColor: 'var(--theme-bg-primary)',
              borderColor: 'var(--theme-border-subtle)',
              fontFamily: 'var(--font-body)',
              backgroundImage: theme.wallpaperUrl ? `url(${theme.wallpaperUrl})` : undefined,
            }}
          >
            {/* Live dimming overlay in preview */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-200"
              style={{
                backgroundColor: 'var(--theme-bg-primary)',
                opacity: theme.wallpaperDim / 100,
                backdropFilter: theme.wallpaperBlur > 0 ? `blur(${theme.wallpaperBlur}px)` : undefined,
              }}
            />

            <div className="relative z-10 flex flex-col gap-3">
              {/* Preview Mini Header */}
              <div className="flex items-center justify-between border-b pb-2 border-zinc-800/60">
                <span className="text-xs font-semibold font-heading text-zinc-200">
                  Partner
                </span>
                <span className="text-[11px] text-zinc-400">
                  {theme.headingFont} / {theme.bodyFont}
                </span>
              </div>

              {/* Sample Incoming Partner Message */}
              <div className="self-start max-w-[80%]">
                <div
                  className={`px-3.5 py-2 text-xs shadow-sm transition-all duration-200 ${
                    theme.bubbleStyle === 'soft-cloud'
                      ? 'rounded-3xl rounded-bl-sm animate-pink-bounce'
                      : theme.bubbleStyle === 'sharp'
                      ? 'rounded-none border-l-2'
                      : theme.bubbleStyle === 'glass'
                      ? 'rounded-xl backdrop-blur-md border'
                      : 'rounded-2xl rounded-bl-sm'
                  }`}
                  style={{
                    backgroundColor: 'var(--theme-bubble-partner-bg)',
                    color: 'var(--theme-bubble-partner-text)',
                    borderColor: 'var(--theme-border-subtle)',
                  }}
                >
                  Hey there! How does this look? ✨
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">10:42 PM</span>
              </div>

              {/* Sample Outgoing User Message */}
              <div className="self-end max-w-[80%]">
                <div
                  className={`px-3.5 py-2 text-xs font-medium shadow-sm transition-all duration-200 ${
                    theme.bubbleStyle === 'soft-cloud'
                      ? 'rounded-3xl rounded-br-sm'
                      : theme.bubbleStyle === 'sharp'
                      ? 'rounded-none border-r-2'
                      : theme.bubbleStyle === 'glass'
                      ? 'rounded-xl backdrop-blur-md border'
                      : 'rounded-2xl rounded-br-sm'
                  }`}
                  style={{
                    backgroundColor: 'var(--theme-bubble-user-bg)',
                    color: 'var(--theme-bubble-user-text)',
                    borderColor: 'var(--theme-accent)',
                  }}
                >
                  Looks super clean! Love the typography.
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block text-right">10:43 PM</span>
              </div>

              {/* Sample Typing Indicator */}
              <div className="flex items-center gap-1.5 pt-1 text-xs text-zinc-400">
                {theme.typingAnimation === 'dots' && (
                  <div className="flex items-center gap-0.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full animate-bounce [animation-delay:-0.32s]"
                      style={{ backgroundColor: 'var(--theme-accent)' }}
                    />
                    <span
                      className="h-1.5 w-1.5 rounded-full animate-bounce [animation-delay:-0.16s]"
                      style={{ backgroundColor: 'var(--theme-accent)' }}
                    />
                    <span
                      className="h-1.5 w-1.5 rounded-full animate-bounce"
                      style={{ backgroundColor: 'var(--theme-accent)' }}
                    />
                  </div>
                )}
                {theme.typingAnimation === 'hearts' && (
                  <div className="flex items-center gap-1 text-xs text-rose-300">
                    <span className="animate-heart-beat text-xs">♥</span>
                    <span className="animate-heart-beat [animation-delay:0.2s] text-xs">♥</span>
                    <span className="animate-heart-beat [animation-delay:0.4s] text-xs">♥</span>
                  </div>
                )}
                {theme.typingAnimation === 'neon-pulse' && (
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-sm bg-[#00f0ff] animate-ping" />
                    <span className="h-1.5 w-1.5 rounded-sm bg-[#ff003c] animate-pulse" />
                  </div>
                )}
                {theme.typingAnimation === 'glow-bar' && (
                  <div className="relative h-1 w-20 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="absolute inset-y-0 w-8 rounded-full animate-sweep-glow"
                      style={{
                        background: 'linear-gradient(90deg, #4f7cff, #a855f7)',
                        boxShadow: '0 0 8px #a855f7',
                      }}
                    />
                  </div>
                )}
                <span className="text-[11px] truncate">
                  <strong className="font-semibold text-zinc-200">Partner</strong> is typing...
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Presets (5 Distinct Themes) */}
        <div className="mb-5 flex flex-col gap-2.5">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 font-heading">
            Theme Presets
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presets.map((preset) => {
              const isActive = theme.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setPreset(preset.id)}
                  aria-pressed={isActive}
                  className={`flex flex-col text-left p-3 rounded-2xl border transition-all cursor-pointer relative ${
                    isActive
                      ? 'border-white bg-zinc-900 shadow-md ring-1 ring-white/30'
                      : 'border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700'
                  }`}
                  style={{
                    backgroundColor: isActive ? 'var(--theme-bg-surface)' : undefined,
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold font-heading text-white">
                      {preset.name}
                    </span>
                    {isActive && (
                      <span
                        className="flex h-4 w-4 items-center justify-center rounded-full text-black"
                        style={{ backgroundColor: 'var(--theme-accent)' }}
                      >
                        <Icon name="check" className="text-[10px] font-bold" />
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 line-clamp-2 mb-2 leading-relaxed">
                    {preset.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-1 border-t border-zinc-800/50">
                    <span className="text-[10px] text-zinc-400">
                      {preset.headingFont} + {preset.bodyFont}
                    </span>
                    <div className="flex items-center gap-1">
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-black/40"
                        style={{ backgroundColor: preset.colors.accent }}
                      />
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-black/40"
                        style={{ backgroundColor: preset.colors.bubbleUserBg }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Custom Bubble Styles */}
        <div className="mb-5 flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 font-heading">
            Bubble Shape Override
          </span>
          <div className="grid grid-cols-2 gap-2">
            {bubbleOptions.map((opt) => {
              const isSelected = theme.bubbleStyle === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBubbleStyle(opt.id)}
                  aria-pressed={isSelected}
                  className={`p-2.5 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'border-white bg-zinc-900 ring-1 ring-white/20'
                      : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
                  }`}
                >
                  <span className="font-semibold block text-zinc-200">{opt.label}</span>
                  <span className="text-[11px] text-zinc-400 block truncate">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Custom Typing Animations */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 font-heading">
            Typing Animation Override
          </span>
          <div className="grid grid-cols-2 gap-2">
            {typingOptions.map((opt) => {
              const isSelected = theme.typingAnimation === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTypingAnimation(opt.id)}
                  aria-pressed={isSelected}
                  className={`p-2.5 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'border-white bg-zinc-900 ring-1 ring-white/20'
                      : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
                  }`}
                >
                  <span className="font-semibold block text-zinc-200">{opt.label}</span>
                  <span className="text-[11px] text-zinc-400 block truncate">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Wallpaper & Atmosphere */}
        <div className="flex flex-col gap-3 border-t border-zinc-800/60 pt-4 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 font-heading">
              Wallpaper & Atmosphere
            </span>
            <button
              type="button"
              onClick={() => {
                setWallpaper(null);
                setWallpaperStatus('Reset to default preset wallpaper');
                setTimeout(() => setWallpaperStatus(null), 2000);
              }}
              className="text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Reset to Preset Default
            </button>
          </div>

          {wallpaperStatus && (
            <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded-xl px-3 py-1.5">
              {wallpaperStatus}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setWallpaperStatus('Processing image...');
                  const downscaled = await downscaleImage(file);
                  setWallpaper(downscaled);
                  setWallpaperStatus('Wallpaper updated!');
                  setTimeout(() => setWallpaperStatus(null), 2500);
                } catch (_) {
                  setWallpaperStatus('Error processing image');
                }
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 py-2 px-3 text-xs font-medium text-white transition-colors cursor-pointer"
            >
              <Icon name="upload" className="text-base" />
              Upload Image
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (customUrl.trim()) {
                  setWallpaper(customUrl.trim());
                  setCustomUrl('');
                  setWallpaperStatus('Custom wallpaper URL applied!');
                  setTimeout(() => setWallpaperStatus(null), 2500);
                }
              }}
              className="flex-1 flex items-center gap-1.5"
            >
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Or paste wallpaper URL..."
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-zinc-600"
              />
              <button
                type="submit"
                disabled={!customUrl.trim()}
                className="rounded-xl px-3 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white disabled:opacity-40 transition-colors cursor-pointer"
              >
                Apply
              </button>
            </form>
          </div>

          {/* Dimming and Blur Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Wallpaper Dimming</span>
                <span>{theme.wallpaperDim}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={theme.wallpaperDim}
                onChange={(e) => setWallpaperDim(Number(e.target.value))}
                className="w-full accent-white cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Wallpaper Blur</span>
                <span>{theme.wallpaperBlur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="16"
                step="1"
                value={theme.wallpaperBlur}
                onChange={(e) => setWallpaperBlur(Number(e.target.value))}
                className="w-full accent-white cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThemeSettingsModal;
