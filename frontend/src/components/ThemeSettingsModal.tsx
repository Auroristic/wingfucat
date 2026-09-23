import { useEffect, useCallback } from 'react';
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

export function ThemeSettingsModal({
  isOpen,
  onClose,
  className = '',
}: ThemeSettingsModalProps) {
  const { theme, setPreset, setBubbleStyle, setTypingAnimation } = useTheme();

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
            className="rounded-2xl border p-4 flex flex-col gap-3 transition-all duration-300"
            style={{
              backgroundColor: 'var(--theme-bg-primary)',
              borderColor: 'var(--theme-border-subtle)',
              fontFamily: 'var(--font-body)',
            }}
          >
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
      </div>
    </div>
  );
}

export default ThemeSettingsModal;
