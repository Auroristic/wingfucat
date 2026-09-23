import { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from './Icon';
import {
  useTheme,
  THEME_PRESETS,
  type BubbleStyle,
  type TypingAnimation,
} from '../context/ThemeContext';
import { isSoundEnabled, setSoundEnabled, playMessageSentSound } from '../utils/soundEffects';

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
    setGlassFrostLevel,
  } = useTheme();

  const [activeTab, setActiveTab] = useState<'vibe' | 'interface' | 'sensory'>('vibe');
  const [customUrl, setCustomUrl] = useState('');
  const [wallpaperStatus, setWallpaperStatus] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playMessageSentSound(theme.id);
    }
  };

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

  const isTui = theme.id === 'terminal-tui';
  const isDaylight = theme.id === 'daylight';

  const presets = Object.values(THEME_PRESETS);

  const bubbleOptions: { id: BubbleStyle; label: string; desc: string }[] = [
    { id: 'rounded', label: 'Rounded', desc: 'Standard smooth curve' },
    { id: 'soft-cloud', label: 'Soft Cloud', desc: 'Plump bouncy kawaii bubbles' },
    { id: 'sharp', label: 'Sharp Cyber', desc: 'Edgy angular corners' },
    { id: 'glass', label: 'Glassmorphic', desc: 'Translucent frosted glass' },
  ];

  const typingOptions: { id: TypingAnimation; label: string; desc: string }[] = [
    { id: 'dots', label: 'Discord Dots', desc: 'Staggered bouncing dots' },
    { id: 'hearts', label: 'Pulsing Hearts', desc: 'Rhythmic pulsing hearts' },
    { id: 'neon-pulse', label: 'Neon Pulse', desc: 'Cyberpunk neon flickering dots' },
    { id: 'glow-bar', label: 'Sweeping Glow Bar', desc: 'Holographic light bar' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Appearance & Themes"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
    >
      <div
        className={`relative flex w-full max-w-xl flex-col p-4 sm:p-5 shadow-2xl my-auto max-h-[92vh] overflow-y-auto transition-all duration-200 ${
          isTui
            ? 'rounded-none border border-[#00ff41] bg-black text-[#00ff41] font-mono shadow-[0_0_24px_rgba(0,255,65,0.25)]'
            : isDaylight
            ? 'rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-xl'
            : 'rounded-3xl border border-white/20 bg-zinc-950/85 backdrop-blur-xl text-white shadow-2xl'
        } ${className}`}
        style={{
          backgroundColor: isTui ? '#000000' : isDaylight ? '#ffffff' : 'var(--theme-bg-secondary)',
          borderColor: isTui ? '#00ff41' : isDaylight ? '#e4e4e7' : 'var(--theme-border-subtle)',
          color: isTui ? '#00ff41' : isDaylight ? '#18181b' : 'var(--theme-text-primary)',
        }}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between pb-3 mb-3 border-b ${
            isTui ? 'border-[#00ff41]' : isDaylight ? 'border-zinc-200' : 'border-zinc-800/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-9 w-9 items-center justify-center ${
                isTui
                  ? 'rounded-none border border-[#00ff41] bg-black text-[#00ff41]'
                  : isDaylight
                  ? 'rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-800'
                  : 'rounded-xl border border-zinc-800 bg-zinc-900 text-white'
              }`}
              style={
                !isTui && !isDaylight
                  ? { backgroundColor: 'var(--theme-bg-surface)', borderColor: 'var(--theme-border-subtle)', color: 'var(--theme-accent)' }
                  : undefined
              }
            >
              <Icon name="tune" className="text-xl" />
            </span>
            <div>
              <h2 className={`text-base font-semibold font-heading tracking-tight leading-tight ${isTui ? 'font-mono' : ''}`}>
                {isTui ? '[ THEME CONTROL CENTER ]' : 'Appearance & Themes'}
              </h2>
              <p className={`text-xs ${isTui ? 'text-[#00ff41]/70 font-mono' : isDaylight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {isTui ? 'TERMINAL_UI // CONFIG_MODE' : 'Interactive theme & glassmorphism control center'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close appearance settings"
            className={`flex h-8 w-8 items-center justify-center cursor-pointer transition-colors ${
              isTui
                ? 'rounded-none border border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41] hover:text-black font-mono'
                : isDaylight
                ? 'rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                : 'rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>

        {/* Live Mini-Chat In-Modal Preview */}
        <div className="mb-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-medium uppercase tracking-wider font-heading ${
              isTui ? 'text-[#00ff41] font-mono' : isDaylight ? 'text-zinc-500' : 'text-zinc-400'
            }`}>
              {isTui ? '[ LIVE CHAT PREVIEW ]' : 'Live Mini-Chat Preview'}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {theme.headingFont}
            </span>
          </div>

          <div
            data-testid="theme-preview-box"
            data-preview-theme={theme.id}
            data-preview-bubble={theme.bubbleStyle}
            data-preview-typing={theme.typingAnimation}
            className={`relative p-3 flex flex-col gap-2.5 transition-all duration-300 overflow-hidden bg-cover bg-center max-h-56 min-h-[150px] ${
              isTui
                ? 'rounded-none border border-[#00ff41]'
                : isDaylight
                ? 'rounded-2xl border border-zinc-200'
                : 'rounded-2xl border'
            }`}
            style={{
              backgroundColor: isTui ? '#000000' : 'var(--theme-bg-primary)',
              borderColor: isTui ? '#00ff41' : 'var(--theme-border-subtle)',
              fontFamily: 'var(--font-body)',
              backgroundImage: theme.wallpaperUrl ? `url(${theme.wallpaperUrl})` : undefined,
            }}
          >
            {/* Live dimming overlay */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-200"
              style={{
                backgroundColor: 'var(--theme-bg-primary)',
                opacity: theme.wallpaperDim / 100,
                backdropFilter: theme.wallpaperBlur > 0 ? `blur(${theme.wallpaperBlur}px)` : undefined,
              }}
            />

            <div className="relative z-10 flex flex-col gap-2 overflow-y-auto">
              {/* Partner message preview */}
              <div className="self-start max-w-[82%]">
                <div
                  className={`px-3 py-1.5 text-xs transition-all duration-200 ${
                    theme.id === 'terminal-tui'
                      ? 'tui-bubble-partner'
                      : theme.bubbleStyle === 'glass'
                      ? 'glass-bubble-partner'
                      : theme.bubbleStyle === 'soft-cloud'
                      ? 'rounded-2xl rounded-bl-xs animate-pink-bounce'
                      : theme.bubbleStyle === 'sharp'
                      ? 'rounded-none border-l-2'
                      : 'rounded-xl rounded-bl-xs'
                  }`}
                  style={{
                    backgroundColor: theme.id === 'terminal-tui' ? '#000000' : 'var(--theme-bubble-partner-bg)',
                    color: theme.id === 'terminal-tui' ? '#00ff41' : 'var(--theme-bubble-partner-text)',
                    borderColor: 'var(--theme-border-subtle)',
                  }}
                >
                  Hey! Check out this frosted glass live. ✨
                </div>
                <span className={`text-[9px] mt-0.5 block ${isTui ? 'text-[#00ff41]/60 font-mono' : 'text-zinc-500'}`}>10:42 PM</span>
              </div>

              {/* User message preview */}
              <div className="self-end max-w-[82%]">
                <div
                  className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    theme.id === 'terminal-tui'
                      ? 'tui-bubble-user'
                      : theme.bubbleStyle === 'glass'
                      ? 'glass-bubble-user'
                      : theme.bubbleStyle === 'soft-cloud'
                      ? 'rounded-2xl rounded-br-xs'
                      : theme.bubbleStyle === 'sharp'
                      ? 'rounded-none border-r-2'
                      : 'rounded-xl rounded-br-xs'
                  }`}
                  style={{
                    backgroundColor: theme.id === 'terminal-tui' ? '#000000' : 'var(--theme-bubble-user-bg)',
                    color: theme.id === 'terminal-tui' ? '#00ff41' : 'var(--theme-bubble-user-text)',
                    borderColor: 'var(--theme-accent)',
                  }}
                >
                  Looks stunning over the wallpaper!
                </div>
                <span className={`text-[9px] mt-0.5 block text-right ${isTui ? 'text-[#00ff41]/60 font-mono' : 'text-zinc-500'}`}>10:43 PM</span>
              </div>

              {/* Live typing indicator preview */}
              <div
                data-testid="preview-typing-indicator"
                className="self-start flex items-center gap-1.5 text-xs select-none mt-0.5"
                style={{
                  color: isTui ? '#00ff41' : 'var(--theme-text-primary)',
                  fontFamily: isTui ? 'var(--font-mono, monospace)' : undefined,
                }}
              >
                {theme.typingAnimation === 'dots' && (
                  <span className="flex items-center gap-0.5" data-testid="preview-typing-dots">
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
                  </span>
                )}
                {theme.typingAnimation === 'hearts' && (
                  <span className="flex items-center gap-0.5 text-xs text-rose-400" data-testid="preview-typing-hearts">
                    <span className="animate-heart-beat">♥</span>
                    <span className="animate-heart-beat [animation-delay:0.2s]">♥</span>
                    <span className="animate-heart-beat [animation-delay:0.4s]">♥</span>
                  </span>
                )}
                {theme.typingAnimation === 'neon-pulse' && (
                  <span className="flex items-center gap-1 font-mono text-cyan-400 text-[11px] tracking-wider animate-pulse" data-testid="preview-typing-neon-pulse">
                    <span className="h-1.5 w-1.5 rounded-xs bg-[#00f0ff] animate-ping" />
                    <span>[SYS.TYPING] █</span>
                  </span>
                )}
                {theme.typingAnimation === 'glow-bar' && (
                  <div className="relative h-1 w-14 overflow-hidden rounded-full bg-zinc-800" data-testid="preview-typing-glow-bar">
                    <div
                      className="absolute inset-y-0 w-5 rounded-full animate-sweep-glow"
                      style={{
                        background: 'linear-gradient(90deg, #4f7cff, #a855f7)',
                        boxShadow: '0 0 8px #a855f7',
                      }}
                    />
                  </div>
                )}
                <span className={`text-[10px] font-medium opacity-75 ${isTui ? 'font-mono' : ''}`}>
                  {isTui ? 'sweetheart typing...' : 'Sweetheart is typing...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Tab Control Navigation Bar */}
        <div
          className={`flex items-center gap-1.5 p-1 mb-4 transition-colors ${
            isTui
              ? 'rounded-none border border-[#00ff41] bg-black'
              : isDaylight
              ? 'rounded-xl border border-zinc-200 bg-zinc-100'
              : 'rounded-2xl border border-zinc-800/80 bg-zinc-900/70'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('vibe')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold transition-all cursor-pointer ${
              isTui
                ? activeTab === 'vibe'
                  ? 'rounded-none bg-[#00ff41] text-black font-mono font-bold'
                  : 'rounded-none text-[#00ff41] hover:bg-[#00ff41]/20 font-mono'
                : isDaylight
                ? activeTab === 'vibe'
                  ? 'rounded-lg bg-white text-zinc-900 shadow-xs'
                  : 'rounded-lg text-zinc-600 hover:text-zinc-900'
                : activeTab === 'vibe'
                ? 'rounded-xl bg-zinc-800 text-white shadow-xs'
                : 'rounded-xl text-zinc-400 hover:text-white'
            }`}
          >
            <Icon name="palette" className="text-sm" />
            <span>Vibe</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('interface')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold transition-all cursor-pointer ${
              isTui
                ? activeTab === 'interface'
                  ? 'rounded-none bg-[#00ff41] text-black font-mono font-bold'
                  : 'rounded-none text-[#00ff41] hover:bg-[#00ff41]/20 font-mono'
                : isDaylight
                ? activeTab === 'interface'
                  ? 'rounded-lg bg-white text-zinc-900 shadow-xs'
                  : 'rounded-lg text-zinc-600 hover:text-zinc-900'
                : activeTab === 'interface'
                ? 'rounded-xl bg-zinc-800 text-white shadow-xs'
                : 'rounded-xl text-zinc-400 hover:text-white'
            }`}
          >
            <Icon name="grid_view" className="text-sm" />
            <span>Interface</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sensory')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold transition-all cursor-pointer ${
              isTui
                ? activeTab === 'sensory'
                  ? 'rounded-none bg-[#00ff41] text-black font-mono font-bold'
                  : 'rounded-none text-[#00ff41] hover:bg-[#00ff41]/20 font-mono'
                : isDaylight
                ? activeTab === 'sensory'
                  ? 'rounded-lg bg-white text-zinc-900 shadow-xs'
                  : 'rounded-lg text-zinc-600 hover:text-zinc-900'
                : activeTab === 'sensory'
                ? 'rounded-xl bg-zinc-800 text-white shadow-xs'
                : 'rounded-xl text-zinc-400 hover:text-white'
            }`}
          >
            <Icon name="graphic_eq" className="text-sm" />
            <span>Sensory</span>
          </button>
        </div>

        {/* TAB 1: VIBE (Presets & Wallpapers) */}
        {activeTab === 'vibe' && (
          <div className="flex flex-col gap-4">
            {/* Visual Swatch Cards */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 font-heading">
                Theme Presets ({presets.length})
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
                      <div className="flex items-center justify-between mb-1">
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

                      <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-zinc-800/50">
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {preset.headingFont}
                        </span>
                        <div className="flex items-center gap-1.5">
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

            {/* Curated Wallpaper Thumbnails & Atmosphere Controls */}
            <div className="flex flex-col gap-3 border-t border-zinc-800/60 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 font-heading">
                  Wallpaper &amp; Atmosphere
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
                  Reset Default
                </button>
              </div>

              {wallpaperStatus && (
                <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded-xl px-3 py-1.5">
                  {wallpaperStatus}
                </div>
              )}

              {/* Wallpaper Presets Thumbnails */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {presets.map((p) => {
                  const isCurWp = theme.wallpaperUrl === p.defaultWallpaper;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setWallpaper(p.defaultWallpaper)}
                      title={`Use ${p.name} wallpaper`}
                      className={`relative h-12 rounded-xl overflow-hidden border transition-all cursor-pointer bg-cover bg-center ${
                        isCurWp ? 'border-white ring-2 ring-white/40' : 'border-zinc-800 hover:border-zinc-600'
                      }`}
                      style={{ backgroundImage: `url(${p.defaultWallpaper})` }}
                    >
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white uppercase tracking-tighter truncate px-0.5">
                          WP {p.id.split('-')[0]}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Upload image or paste URL */}
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
                    max="90"
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
                    max="20"
                    step="1"
                    value={theme.wallpaperBlur}
                    onChange={(e) => setWallpaperBlur(Number(e.target.value))}
                    className="w-full accent-white cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTERFACE (Glass Frost & Bubble Shape) */}
        {activeTab === 'interface' && (
          <div className="flex flex-col gap-4">
            {/* Customizable Glass Frost Slider */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 font-heading">
                Glass Frost Level
              </span>

              {!theme.isGlassSupported ? (
                <div className="flex flex-col gap-2 rounded-2xl border border-amber-900/40 bg-amber-950/20 p-3.5">
                  <div className="flex items-center justify-between text-xs text-amber-300">
                    <span className="font-semibold">Glass Frost Level</span>
                    <span className="font-mono">0% (Locked)</span>
                  </div>
                  <input
                    type="range"
                    disabled
                    min="0"
                    max="100"
                    value="0"
                    className="w-full opacity-40 cursor-not-allowed h-2 bg-zinc-800 rounded-lg appearance-none"
                  />
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
                    <Icon name="lock" className="text-sm" />
                    <span>Glass frost locked at 0% for raw TUI &amp; Daylight performance.</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-200">Frost Level</span>
                    <span className="font-mono font-bold" style={{ color: 'var(--theme-accent)' }}>
                      {theme.glassFrostLevel}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={theme.glassFrostLevel}
                    onChange={(e) => setGlassFrostLevel(Number(e.target.value))}
                    className="w-full cursor-pointer h-2 bg-zinc-800 rounded-lg appearance-none"
                    style={{ accentColor: 'var(--theme-accent)' }}
                  />
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>0% Solid Perf</span>
                    <span>50% Balanced</span>
                    <span>100% visionOS Glass</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bubble Shape Override */}
            <div className="flex flex-col gap-2">
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

            {/* Typography info */}
            <div className="flex flex-col gap-1.5 p-3 rounded-2xl border border-zinc-800 bg-zinc-900/30">
              <span className="text-xs font-semibold text-zinc-300">Typography Preset</span>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Heading: <strong className="text-white">{theme.headingFont}</strong></span>
                <span>Body: <strong className="text-white">{theme.bodyFont}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SENSORY (Audio, Typing Animations & Accessibility) */}
        {activeTab === 'sensory' && (
          <div className="flex flex-col gap-4">
            {/* Audio & Sound Effects */}
            <div className="flex flex-col gap-2.5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Sound Effects
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Procedural audio synthesized specifically for each theme
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => playMessageSentSound(theme.id)}
                    disabled={!soundOn}
                    className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 py-1.5 px-2.5 text-xs text-zinc-300 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Icon name="volume_up" className="text-sm" />
                    <span>Test Sound</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleSound}
                    role="switch"
                    aria-checked={soundOn}
                    aria-label="Toggle sound effects"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      soundOn ? 'bg-emerald-500' : 'bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        soundOn ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Typing Animations */}
            <div className="flex flex-col gap-2">
              <span className={`text-xs font-medium uppercase tracking-wider font-heading ${
                isTui ? 'text-[#00ff41] font-mono' : isDaylight ? 'text-zinc-500' : 'text-zinc-400'
              }`}>
                {isTui ? '[ TYPING ANIMATION OVERRIDE ]' : 'Typing Animation Override'}
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
                      className={`typing-preview-card p-3 text-left border text-xs transition-all cursor-pointer flex flex-col gap-2 ${
                        isTui
                          ? `rounded-none font-mono ${
                              isSelected
                                ? 'border-[#00ff41] bg-[#00ff41]/20 text-[#00ff41] shadow-[0_0_8px_rgba(0,255,65,0.3)]'
                                : 'border-[#00ff41]/40 bg-black text-[#00ff41]/80 hover:border-[#00ff41]'
                            }`
                          : isDaylight
                          ? `rounded-xl ${
                              isSelected
                                ? 'border-zinc-900 bg-zinc-100 text-zinc-900 ring-1 ring-zinc-900'
                                : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 shadow-2xs'
                            }`
                          : `rounded-xl ${
                              isSelected
                                ? 'border-white bg-white/10 ring-1 ring-white/20 text-white'
                                : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-zinc-300'
                            }`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold block">{opt.label}</span>
                        {/* Live CSS keyframe preview snippet: paused by default, active on hover or when selected */}
                        <div className="h-4 flex items-center">
                          {opt.id === 'dots' && (
                            <span className="flex items-center gap-0.5">
                              <span className="typing-anim h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.32s]" />
                              <span className="typing-anim h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.16s]" />
                              <span className="typing-anim h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" />
                            </span>
                          )}
                          {opt.id === 'hearts' && (
                            <span className="flex items-center gap-0.5 text-xs text-rose-400">
                              <span className="typing-anim animate-heart-beat">♥</span>
                              <span className="typing-anim animate-heart-beat [animation-delay:0.2s]">♥</span>
                            </span>
                          )}
                          {opt.id === 'neon-pulse' && (
                            <span className="typing-anim font-mono text-[10px] text-cyan-400 animate-pulse tracking-tight">
                              [SYS] █
                            </span>
                          )}
                          {opt.id === 'glow-bar' && (
                            <div className="relative h-1 w-10 overflow-hidden rounded-full bg-zinc-800">
                              <div
                                className="typing-anim absolute inset-y-0 w-3 rounded-full animate-sweep-glow"
                                style={{ background: 'linear-gradient(90deg, #4f7cff, #a855f7)' }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] opacity-70 block truncate">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ThemeSettingsModal;
