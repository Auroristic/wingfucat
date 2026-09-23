import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { pb } from '../lib/pocketbase';

import pinkCloudWp from '../assets/wallpapers/pink-cloud.svg';
import cyberpunkWp from '../assets/wallpapers/cyberpunk.svg';
import lavenderDreamWp from '../assets/wallpapers/lavender-dream.svg';
import futuristicWp from '../assets/wallpapers/futuristic.svg';
import minimalistOledWp from '../assets/wallpapers/minimalist-oled.svg';
import terminalTuiWp from '../assets/wallpapers/terminal-tui.svg';
import daylightWp from '../assets/wallpapers/daylight.svg';

export type ThemePresetId =
  | 'minimalist-oled'
  | 'pink-cloud'
  | 'cyberpunk'
  | 'lavender-dream'
  | 'futuristic'
  | 'terminal-tui'
  | 'daylight';

export type BubbleStyle = 'rounded' | 'sharp' | 'soft-cloud' | 'glass';
export type TypingAnimation = 'dots' | 'hearts' | 'neon-pulse' | 'glow-bar';

export interface ThemeConfig {
  id: ThemePresetId;
  name: string;
  description: string;
  headingFont: string;
  bodyFont: string;
  bubbleStyle: BubbleStyle;
  typingAnimation: TypingAnimation;
  defaultWallpaper: string;
  isGlassSupported: boolean;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    bgSurface: string;
    bgGlass: string;
    borderSubtle: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    bubbleUserBg: string;
    bubbleUserText: string;
    bubblePartnerBg: string;
    bubblePartnerText: string;
    selectionBg?: string;
    selectionText?: string;
  };
}

export const THEME_PRESETS: Record<ThemePresetId, ThemeConfig> = {
  'minimalist-oled': {
    id: 'minimalist-oled',
    name: 'Minimalist OLED',
    description: 'Deep true black with high-contrast monochrome and emerald accents',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    bubbleStyle: 'rounded',
    typingAnimation: 'dots',
    defaultWallpaper: minimalistOledWp,
    isGlassSupported: true,
    colors: {
      bgPrimary: '#000000',
      bgSecondary: '#09090b',
      bgSurface: '#18181b',
      bgGlass: 'rgba(9, 9, 11, 0.78)',
      borderSubtle: '#27272a',
      textPrimary: '#ffffff',
      textSecondary: '#a1a1aa',
      accent: '#10b981',
      bubbleUserBg: '#27272a',
      bubbleUserText: '#ffffff',
      bubblePartnerBg: '#18181b',
      bubblePartnerText: '#f4f4f5',
      selectionBg: '#10b981',
      selectionText: '#000000',
    },
  },
  'pink-cloud': {
    id: 'pink-cloud',
    name: 'Pink Cloud',
    description: 'Pastel pink, fluffy clouds, cute bows, and pulsing hearts',
    headingFont: 'Baloo 2',
    bodyFont: 'Nunito',
    bubbleStyle: 'soft-cloud',
    typingAnimation: 'hearts',
    defaultWallpaper: pinkCloudWp,
    isGlassSupported: true,
    colors: {
      bgPrimary: '#1a1017',
      bgSecondary: '#241621',
      bgSurface: '#341f2e',
      bgGlass: 'rgba(36, 22, 33, 0.78)',
      borderSubtle: '#4f2e46',
      textPrimary: '#fff0f5',
      textSecondary: '#f8a5c2',
      accent: '#ffd6e8',
      bubbleUserBg: '#d94680',
      bubbleUserText: '#ffffff',
      bubblePartnerBg: '#341f2e',
      bubblePartnerText: '#fff0f5',
      selectionBg: '#ffd6e8',
      selectionText: '#1a1017',
    },
  },
  'cyberpunk': {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Dark grid with high-octane neon cyan and magenta edge styling',
    headingFont: 'Space Grotesk',
    bodyFont: 'Space Grotesk',
    bubbleStyle: 'sharp',
    typingAnimation: 'neon-pulse',
    defaultWallpaper: cyberpunkWp,
    isGlassSupported: true,
    colors: {
      bgPrimary: '#050508',
      bgSecondary: '#0c0d14',
      bgSurface: '#151622',
      bgGlass: 'rgba(12, 13, 20, 0.82)',
      borderSubtle: '#282b42',
      textPrimary: '#00f0ff',
      textSecondary: '#ff003c',
      accent: '#00f0ff',
      bubbleUserBg: '#ff003c',
      bubbleUserText: '#ffffff',
      bubblePartnerBg: '#151622',
      bubblePartnerText: '#00f0ff',
      selectionBg: '#00f0ff',
      selectionText: '#050508',
    },
  },
  'lavender-dream': {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    description: 'Deep midnight purple with soft lilac glow and calm modern typography',
    headingFont: 'Poppins',
    bodyFont: 'Poppins',
    bubbleStyle: 'rounded',
    typingAnimation: 'dots',
    defaultWallpaper: lavenderDreamWp,
    isGlassSupported: true,
    colors: {
      bgPrimary: '#0e0a1c',
      bgSecondary: '#16102c',
      bgSurface: '#211842',
      bgGlass: 'rgba(22, 16, 44, 0.8)',
      borderSubtle: '#372866',
      textPrimary: '#f5f3ff',
      textSecondary: '#c4b5fd',
      accent: '#a78bfa',
      bubbleUserBg: '#7c3aed',
      bubbleUserText: '#ffffff',
      bubblePartnerBg: '#211842',
      bubblePartnerText: '#f5f3ff',
      selectionBg: '#a78bfa',
      selectionText: '#0e0a1c',
    },
  },
  'futuristic': {
    id: 'futuristic',
    name: 'Futuristic',
    description: 'Deep chrome space with frosted glassmorphism and sweeping glow bar',
    headingFont: 'Orbitron',
    bodyFont: 'Exo 2',
    bubbleStyle: 'glass',
    typingAnimation: 'glow-bar',
    defaultWallpaper: futuristicWp,
    isGlassSupported: true,
    colors: {
      bgPrimary: '#050714',
      bgSecondary: '#0c102c',
      bgSurface: '#12183e',
      bgGlass: 'rgba(16, 22, 58, 0.45)',
      borderSubtle: 'rgba(255, 255, 255, 0.16)',
      textPrimary: '#e0e7ff',
      textSecondary: '#818cf8',
      accent: '#4f7cff',
      bubbleUserBg: 'rgba(79, 124, 255, 0.35)',
      bubbleUserText: '#ffffff',
      bubblePartnerBg: 'rgba(255, 255, 255, 0.08)',
      bubblePartnerText: '#e0e7ff',
      selectionBg: '#4f7cff',
      selectionText: '#ffffff',
    },
  },
  'terminal-tui': {
    id: 'terminal-tui',
    name: 'Terminal TUI',
    description: 'Retro hacker terminal with CRT scanlines, ASCII frames, and phosphor green',
    headingFont: 'JetBrains Mono',
    bodyFont: 'JetBrains Mono',
    bubbleStyle: 'sharp',
    typingAnimation: 'dots',
    defaultWallpaper: terminalTuiWp,
    isGlassSupported: false,
    colors: {
      bgPrimary: '#000000',
      bgSecondary: '#040804',
      bgSurface: '#081208',
      bgGlass: '#000000',
      borderSubtle: '#003b11',
      textPrimary: '#00ff41',
      textSecondary: '#00aa2b',
      accent: '#00ff41',
      bubbleUserBg: '#000000',
      bubbleUserText: '#00ff41',
      bubblePartnerBg: '#000000',
      bubblePartnerText: '#00ff41',
      selectionBg: '#00ff41',
      selectionText: '#000000',
    },
  },
  'daylight': {
    id: 'daylight',
    name: 'Daylight',
    description: 'Clean paper off-white light mode with crisp contrast and slate blue accents',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    bubbleStyle: 'rounded',
    typingAnimation: 'dots',
    defaultWallpaper: daylightWp,
    isGlassSupported: false,
    colors: {
      bgPrimary: '#f8f9fa',
      bgSecondary: '#ffffff',
      bgSurface: '#f1f5f9',
      bgGlass: 'rgba(255, 255, 255, 0.95)',
      borderSubtle: '#e2e8f0',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      accent: '#2563eb',
      bubbleUserBg: '#2563eb',
      bubbleUserText: '#ffffff',
      bubblePartnerBg: '#ffffff',
      bubblePartnerText: '#0f172a',
      selectionBg: '#bfdbfe',
      selectionText: '#1e3a8a',
    },
  },
};

export interface ActiveTheme {
  id: ThemePresetId;
  headingFont: string;
  bodyFont: string;
  bubbleStyle: BubbleStyle;
  typingAnimation: TypingAnimation;
  wallpaperUrl: string;
  wallpaperDim: number;
  wallpaperBlur: number;
  glassFrostLevel: number;
  isGlassSupported: boolean;
  colors: ThemeConfig['colors'];
}

export interface ThemeContextType {
  theme: ActiveTheme;
  setPreset: (presetId: ThemePresetId) => void;
  setBubbleStyle: (style: BubbleStyle) => void;
  setTypingAnimation: (anim: TypingAnimation) => void;
  setWallpaper: (url: string | null) => void;
  setWallpaperDim: (dim: number) => void;
  setWallpaperBlur: (blur: number) => void;
  setGlassFrostLevel: (level: number) => void;
  resetToDefault: () => void;
}

const STORAGE_KEY = 'wingfucat_theme';
const FROST_STORAGE_KEY = 'wingfucat_glass_frost';

export const getDefaultTheme = (): ActiveTheme => {
  const defaultPreset = THEME_PRESETS['minimalist-oled'];
  return {
    id: defaultPreset.id,
    headingFont: defaultPreset.headingFont,
    bodyFont: defaultPreset.bodyFont,
    bubbleStyle: defaultPreset.bubbleStyle,
    typingAnimation: defaultPreset.typingAnimation,
    wallpaperUrl: defaultPreset.defaultWallpaper,
    wallpaperDim: 35,
    wallpaperBlur: 0,
    glassFrostLevel: 75,
    isGlassSupported: defaultPreset.isGlassSupported,
    colors: defaultPreset.colors,
  };
};

export const parseThemeFromData = (data: any, fallbackFrost = 75): ActiveTheme | null => {
  if (!data || typeof data !== 'object') return null;
  const presetId = data.id as ThemePresetId;
  const base = THEME_PRESETS[presetId];
  if (!base) return null;

  const validBubble = ['rounded', 'sharp', 'soft-cloud', 'glass'].includes(data.bubbleStyle)
    ? (data.bubbleStyle as BubbleStyle)
    : base.bubbleStyle;

  const validTyping = ['dots', 'hearts', 'neon-pulse', 'glow-bar'].includes(data.typingAnimation)
    ? (data.typingAnimation as TypingAnimation)
    : base.typingAnimation;

  const frost = typeof data.glassFrostLevel === 'number'
    ? Math.max(0, Math.min(100, data.glassFrostLevel))
    : (base.isGlassSupported ? fallbackFrost : 0);

  return {
    id: base.id,
    headingFont: base.headingFont,
    bodyFont: base.bodyFont,
    bubbleStyle: validBubble,
    typingAnimation: validTyping,
    wallpaperUrl: typeof data.wallpaperUrl === 'string' && data.wallpaperUrl ? data.wallpaperUrl : base.defaultWallpaper,
    wallpaperDim: typeof data.wallpaperDim === 'number' ? Math.max(0, Math.min(90, data.wallpaperDim)) : 35,
    wallpaperBlur: typeof data.wallpaperBlur === 'number' ? Math.max(0, Math.min(20, data.wallpaperBlur)) : 0,
    glassFrostLevel: frost,
    isGlassSupported: base.isGlassSupported,
    colors: base.colors,
  };
};

const getInitialTheme = (): ActiveTheme => {
  const currentUserId = pb.authStore?.record?.id;
  let savedFrost = 75;

  if (typeof window !== 'undefined') {
    try {
      const frostKey = currentUserId ? `wingfucat_glass_frost_${currentUserId}` : FROST_STORAGE_KEY;
      const frostStr = localStorage.getItem(frostKey) || localStorage.getItem(FROST_STORAGE_KEY);
      if (frostStr !== null) {
        const num = Number(frostStr);
        if (!isNaN(num)) savedFrost = Math.max(0, Math.min(100, num));
      }
    } catch (_) {}

    // 1. If user is currently authenticated in pb.authStore, check theme_settings on record
    if (currentUserId && (pb.authStore?.record as any)?.theme_settings) {
      const parsed = parseThemeFromData((pb.authStore.record as any).theme_settings, savedFrost);
      if (parsed) return parsed;
    }

    // 2. If authenticated, check account-scoped localStorage
    if (currentUserId) {
      try {
        const scopedSaved = localStorage.getItem(`wingfucat_theme_${currentUserId}`);
        if (scopedSaved) {
          const parsed = parseThemeFromData(JSON.parse(scopedSaved), savedFrost);
          if (parsed) return parsed;
        }
      } catch (_) {}
    }

    // 3. Fallback to un-scoped localStorage (e.g. for unauthenticated preview or test compatibility)
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseThemeFromData(JSON.parse(saved), savedFrost);
        if (parsed) return parsed;
      }
    } catch (_) {}
  }

  return getDefaultTheme();
};

export const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ActiveTheme>(getInitialTheme);

  // Apply theme tokens and dynamic JS-computed glass strings directly to :root
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.style.setProperty('--font-heading', `'${theme.headingFont}', sans-serif`);
    root.style.setProperty('--font-body', `'${theme.bodyFont}', sans-serif`);

    const c = theme.colors;
    root.style.setProperty('--theme-bg-primary', c.bgPrimary);
    root.style.setProperty('--theme-bg-secondary', c.bgSecondary);
    root.style.setProperty('--theme-bg-surface', c.bgSurface);
    root.style.setProperty('--theme-bg-glass', c.bgGlass);
    root.style.setProperty('--theme-border-subtle', c.borderSubtle);
    root.style.setProperty('--theme-text-primary', c.textPrimary);
    root.style.setProperty('--theme-text-secondary', c.textSecondary);
    root.style.setProperty('--theme-accent', c.accent);
    root.style.setProperty('--theme-bubble-user-bg', c.bubbleUserBg);
    root.style.setProperty('--theme-bubble-user-text', c.bubbleUserText);
    root.style.setProperty('--theme-bubble-partner-bg', c.bubblePartnerBg);
    root.style.setProperty('--theme-bubble-partner-text', c.bubblePartnerText);
    root.style.setProperty('--theme-wallpaper-dim', String(theme.wallpaperDim / 100));
    root.style.setProperty('--theme-wallpaper-blur', `${theme.wallpaperBlur}px`);

    // Guardrail 1 & Mobile GPU Optimization:
    // If frost is 0 or theme doesn't support glass (TUI/Daylight), output 'none' to save mobile GPU layers!
    const isGlassAllowed = theme.isGlassSupported !== false;
    const frost = isGlassAllowed ? (typeof theme.glassFrostLevel === 'number' ? theme.glassFrostLevel : 75) : 0;

    if (frost === 0 || !isGlassAllowed) {
      root.style.setProperty('--theme-glass-backdrop', 'none');
      root.style.setProperty('--theme-glass-blur', '0px');
      root.style.setProperty('--theme-glass-saturation', '100%');
      root.style.setProperty('--theme-glass-alpha', '0.12');
      root.style.setProperty('--theme-glass-border-alpha', '0.16');
      root.style.setProperty('--theme-bubble-glass-user-alpha', '0.35');
      root.style.setProperty('--theme-bubble-glass-partner-alpha', '0.08');
    } else {
      const blurPx = (frost * 0.24).toFixed(1);
      const satPct = (100 + frost * 0.9).toFixed(0);
      const alpha = (0.04 + (frost / 100) * 0.18).toFixed(3);
      const borderAlpha = (0.06 + (frost / 100) * 0.22).toFixed(3);
      const bubbleUserAlpha = (0.15 + (frost / 100) * 0.25).toFixed(3);
      const bubblePartnerAlpha = (0.04 + (frost / 100) * 0.12).toFixed(3);

      root.style.setProperty('--theme-glass-backdrop', `blur(${blurPx}px) saturate(${satPct}%)`);
      root.style.setProperty('--theme-glass-blur', `${blurPx}px`);
      root.style.setProperty('--theme-glass-saturation', `${satPct}%`);
      root.style.setProperty('--theme-glass-alpha', String(alpha));
      root.style.setProperty('--theme-glass-border-alpha', String(borderAlpha));
      root.style.setProperty('--theme-bubble-glass-user-alpha', String(bubbleUserAlpha));
      root.style.setProperty('--theme-bubble-glass-partner-alpha', String(bubblePartnerAlpha));
    }
    root.style.setProperty('--theme-frost-level', String(frost));
    root.style.setProperty('color-scheme', theme.id === 'daylight' ? 'light' : 'dark');

    // Guardrail 4: Dynamic Theme Selection Colors
    root.style.setProperty('--theme-selection-bg', c.selectionBg || c.accent);
    root.style.setProperty('--theme-selection-text', c.selectionText || c.bgPrimary);

    root.setAttribute('data-theme', theme.id);
  }, [theme]);

  // Sync to localStorage and PocketBase account safely
  const persistTheme = useCallback((updated: ActiveTheme) => {
    const currentUserId = pb.authStore?.record?.id;

    if (typeof window !== 'undefined') {
      try {
        if (currentUserId) {
          localStorage.setItem(`wingfucat_theme_${currentUserId}`, JSON.stringify(updated));
          localStorage.setItem(`wingfucat_glass_frost_${currentUserId}`, String(updated.glassFrostLevel));
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(FROST_STORAGE_KEY, String(updated.glassFrostLevel));
      } catch (_) {
        try {
          const fallback = { ...updated, wallpaperUrl: THEME_PRESETS[updated.id].defaultWallpaper };
          if (currentUserId) {
            localStorage.setItem(`wingfucat_theme_${currentUserId}`, JSON.stringify(fallback));
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
        } catch (__) {}
      }
    }

    if (currentUserId && typeof pb.collection === 'function') {
      try {
        const safeWallpaper = updated.wallpaperUrl && updated.wallpaperUrl.length > 300000
          ? null
          : updated.wallpaperUrl;

        const settingsPayload = {
          id: updated.id,
          bubbleStyle: updated.bubbleStyle,
          typingAnimation: updated.typingAnimation,
          wallpaperUrl: safeWallpaper,
          wallpaperDim: updated.wallpaperDim,
          wallpaperBlur: updated.wallpaperBlur,
          glassFrostLevel: updated.glassFrostLevel,
        };

        if (pb.authStore?.record) {
          (pb.authStore.record as any).theme_settings = settingsPayload;
        }

        const usersCol = pb.collection('users');
        if (usersCol && typeof usersCol.update === 'function') {
          usersCol.update(currentUserId, {
            theme_settings: settingsPayload,
          }).catch(() => {});
        }
      } catch (_) {}
    }
  }, []);

  const setPreset = useCallback((presetId: ThemePresetId) => {
    const preset = THEME_PRESETS[presetId];
    if (!preset) return;
    setTheme((prev) => {
      const next: ActiveTheme = {
        id: preset.id,
        headingFont: preset.headingFont,
        bodyFont: preset.bodyFont,
        bubbleStyle: preset.bubbleStyle,
        typingAnimation: preset.typingAnimation,
        wallpaperUrl: preset.defaultWallpaper,
        wallpaperDim: 35,
        wallpaperBlur: 0,
        glassFrostLevel: preset.isGlassSupported ? prev.glassFrostLevel : 0,
        isGlassSupported: preset.isGlassSupported,
        colors: preset.colors,
      };
      persistTheme(next);
      return next;
    });
  }, [persistTheme]);

  const setBubbleStyle = useCallback((style: BubbleStyle) => {
    setTheme((prev) => {
      const next = { ...prev, bubbleStyle: style };
      persistTheme(next);
      return next;
    });
  }, [persistTheme]);

  const setTypingAnimation = useCallback((anim: TypingAnimation) => {
    setTheme((prev) => {
      const next = { ...prev, typingAnimation: anim };
      persistTheme(next);
      return next;
    });
  }, [persistTheme]);

  const setWallpaper = useCallback((url: string | null) => {
    setTheme((prev) => {
      const base = THEME_PRESETS[prev.id];
      const next = { ...prev, wallpaperUrl: url || base.defaultWallpaper };
      persistTheme(next);
      return next;
    });
  }, [persistTheme]);

  const setWallpaperDim = useCallback((dim: number) => {
    setTheme((prev) => {
      const next = { ...prev, wallpaperDim: Math.max(0, Math.min(90, dim)) };
      persistTheme(next);
      return next;
    });
  }, [persistTheme]);

  const setWallpaperBlur = useCallback((blur: number) => {
    setTheme((prev) => {
      const next = { ...prev, wallpaperBlur: Math.max(0, Math.min(20, blur)) };
      persistTheme(next);
      return next;
    });
  }, [persistTheme]);

  const setGlassFrostLevel = useCallback((level: number) => {
    setTheme((prev) => {
      const clamped = Math.max(0, Math.min(100, level));
      const next = { ...prev, glassFrostLevel: clamped };
      persistTheme(next);
      return next;
    });
  }, [persistTheme]);

  const resetToDefault = useCallback(() => {
    setPreset('minimalist-oled');
  }, [setPreset]);

  // Listen to authStore changes (login, logout, account switch) and sync account theme
  useEffect(() => {
    let unsubscribePb: (() => void) | undefined;
    let isMounted = true;

    const applyTheme = (next: ActiveTheme, userId?: string) => {
      setTheme((prev) => {
        if (
          prev.id === next.id &&
          prev.bubbleStyle === next.bubbleStyle &&
          prev.typingAnimation === next.typingAnimation &&
          prev.wallpaperUrl === next.wallpaperUrl &&
          prev.wallpaperDim === next.wallpaperDim &&
          prev.wallpaperBlur === next.wallpaperBlur &&
          prev.glassFrostLevel === next.glassFrostLevel
        ) {
          return prev;
        }
        return next;
      });

      if (typeof window !== 'undefined') {
        try {
          if (userId) {
            localStorage.setItem(`wingfucat_theme_${userId}`, JSON.stringify(next));
            localStorage.setItem(`wingfucat_glass_frost_${userId}`, String(next.glassFrostLevel));
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          localStorage.setItem(FROST_STORAGE_KEY, String(next.glassFrostLevel));
        } catch (_) {}
      }
    };

    const syncUserTheme = (userRecord: any) => {
      if (unsubscribePb) {
        try {
          unsubscribePb();
        } catch (_) {}
        unsubscribePb = undefined;
      }

      if (!userRecord?.id) {
        // User logged out: Reset to default theme and clear un-scoped active storage
        applyTheme(getDefaultTheme());
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(FROST_STORAGE_KEY);
          } catch (_) {}
        }
        return;
      }

      const userId = userRecord.id;
      let applied = false;

      // 1. Direct record check from authStore (synchronous)
      if (userRecord.theme_settings) {
        const parsed = parseThemeFromData(userRecord.theme_settings);
        if (parsed) {
          applyTheme(parsed, userId);
          applied = true;
        }
      }

      // 2. Account-scoped local cache, or generic storage fallback (synchronous)
      if (!applied && typeof window !== 'undefined') {
        try {
          const accountCached = localStorage.getItem(`wingfucat_theme_${userId}`);
          if (accountCached) {
            const parsed = parseThemeFromData(JSON.parse(accountCached));
            if (parsed) {
              applyTheme(parsed, userId);
              applied = true;
            }
          } else {
            const genericCached = localStorage.getItem(STORAGE_KEY);
            if (genericCached) {
              const parsed = parseThemeFromData(JSON.parse(genericCached));
              if (parsed) {
                applyTheme(parsed);
                applied = true;
              }
            }
          }
        } catch (_) {}
      }

      // 3. Fallback to clean default if neither exists yet (synchronous)
      if (!applied) {
        applyTheme(getDefaultTheme());
      }

      // 4. Subscribe to realtime updates for this user record (cross-device sync)
      if (typeof pb.collection === 'function') {
        try {
          const usersCol = pb.collection('users');
          if (usersCol && typeof usersCol.subscribe === 'function') {
            const maybePromise = usersCol.subscribe(userId, (e: any) => {
              if (e.action === 'update' && e.record?.theme_settings) {
                const parsed = parseThemeFromData(e.record.theme_settings);
                if (parsed) {
                  applyTheme(parsed, userId);
                }
              }
            });
            Promise.resolve(maybePromise).then((unsub: any) => {
              if (isMounted) {
                unsubscribePb = unsub;
              } else if (typeof unsub === 'function') {
                unsub();
              }
            }).catch(() => {});
          }
        } catch (_) {}
      }

      // 5. Cloud fetch from PocketBase in background to guarantee latest settings
      if (typeof pb.collection === 'function') {
        try {
          const usersCol = pb.collection('users');
          if (usersCol && typeof usersCol.getOne === 'function') {
            usersCol.getOne(userId).then((freshUser: any) => {
              if (!isMounted) return;
              if (freshUser?.theme_settings) {
                const parsed = parseThemeFromData(freshUser.theme_settings);
                if (parsed) {
                  applyTheme(parsed, userId);
                }
              }
            }).catch(() => {});
          }
        } catch (_) {}
      }
    };

    // Initial sync for currently authenticated user
    if (pb.authStore?.record?.id) {
      syncUserTheme(pb.authStore.record);
    }

    // Subscribe to authStore changes (login, logout, account switch)
    let unsubscribeAuth: (() => void) | undefined;
    if (typeof pb.authStore?.onChange === 'function') {
      unsubscribeAuth = pb.authStore.onChange((_token: string, record: any) => {
        syncUserTheme(record);
      });
    }

    return () => {
      isMounted = false;
      if (unsubscribeAuth) {
        try {
          unsubscribeAuth();
        } catch (_) {}
      }
      if (unsubscribePb) {
        try {
          unsubscribePb();
        } catch (_) {}
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setPreset,
      setBubbleStyle,
      setTypingAnimation,
      setWallpaper,
      setWallpaperDim,
      setWallpaperBlur,
      setGlassFrostLevel,
      resetToDefault,
    }),
    [theme, setPreset, setBubbleStyle, setTypingAnimation, setWallpaper, setWallpaperDim, setWallpaperBlur, setGlassFrostLevel, resetToDefault]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

const defaultThemeValue: ThemeContextType = {
  theme: {
    ...THEME_PRESETS['minimalist-oled'],
    wallpaperUrl: THEME_PRESETS['minimalist-oled'].defaultWallpaper,
    wallpaperDim: 35,
    wallpaperBlur: 0,
    glassFrostLevel: 75,
    isGlassSupported: true,
  },
  setPreset: () => {},
  setBubbleStyle: () => {},
  setTypingAnimation: () => {},
  setWallpaper: () => {},
  setWallpaperDim: () => {},
  setWallpaperBlur: () => {},
  setGlassFrostLevel: () => {},
  resetToDefault: () => {},
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  return context || defaultThemeValue;
}

export default ThemeContext;
