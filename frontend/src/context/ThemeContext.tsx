import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { pb } from '../lib/pocketbase';

import pinkCloudWp from '../assets/wallpapers/pink-cloud.svg';
import cyberpunkWp from '../assets/wallpapers/cyberpunk.svg';
import lavenderDreamWp from '../assets/wallpapers/lavender-dream.svg';
import futuristicWp from '../assets/wallpapers/futuristic.svg';
import minimalistOledWp from '../assets/wallpapers/minimalist-oled.svg';

export type ThemePresetId =
  | 'minimalist-oled'
  | 'pink-cloud'
  | 'cyberpunk'
  | 'lavender-dream'
  | 'futuristic';

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
    },
  },
  'futuristic': {
    id: 'futuristic',
    name: 'Futuristic',
    description: 'Deep chrome metallic space with glassmorphic blur and sweeping glow bar',
    headingFont: 'Orbitron',
    bodyFont: 'Exo 2',
    bubbleStyle: 'glass',
    typingAnimation: 'glow-bar',
    defaultWallpaper: futuristicWp,
    colors: {
      bgPrimary: '#0a0e27',
      bgSecondary: '#10163a',
      bgSurface: '#161f4a',
      bgGlass: 'rgba(16, 22, 58, 0.82)',
      borderSubtle: '#26336e',
      textPrimary: '#e0e7ff',
      textSecondary: '#818cf8',
      accent: '#4f7cff',
      bubbleUserBg: '#4f7cff',
      bubbleUserText: '#ffffff',
      bubblePartnerBg: '#161f4a',
      bubblePartnerText: '#e0e7ff',
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
  resetToDefault: () => void;
}

const STORAGE_KEY = 'wingfucat_theme';

const getInitialTheme = (): ActiveTheme => {
  const defaultPreset = THEME_PRESETS['minimalist-oled'];

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.id && THEME_PRESETS[parsed.id as ThemePresetId]) {
          const base = THEME_PRESETS[parsed.id as ThemePresetId];
          return {
            id: base.id,
            headingFont: base.headingFont,
            bodyFont: base.bodyFont,
            bubbleStyle: parsed.bubbleStyle || base.bubbleStyle,
            typingAnimation: parsed.typingAnimation || base.typingAnimation,
            wallpaperUrl: parsed.wallpaperUrl || base.defaultWallpaper,
            wallpaperDim: typeof parsed.wallpaperDim === 'number' ? parsed.wallpaperDim : 35,
            wallpaperBlur: typeof parsed.wallpaperBlur === 'number' ? parsed.wallpaperBlur : 0,
            colors: base.colors,
          };
        }
      }
    } catch (_) {}
  }

  return {
    id: defaultPreset.id,
    headingFont: defaultPreset.headingFont,
    bodyFont: defaultPreset.bodyFont,
    bubbleStyle: defaultPreset.bubbleStyle,
    typingAnimation: defaultPreset.typingAnimation,
    wallpaperUrl: defaultPreset.defaultWallpaper,
    wallpaperDim: 35,
    wallpaperBlur: 0,
    colors: defaultPreset.colors,
  };
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ActiveTheme>(getInitialTheme);

  // Apply CSS variables and data-theme to document.documentElement
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.setAttribute('data-theme', theme.id);
    root.setAttribute('data-bubble-style', theme.bubbleStyle);
    root.setAttribute('data-typing-animation', theme.typingAnimation);

    root.style.setProperty('--font-heading', `"${theme.headingFont}", sans-serif`);
    root.style.setProperty('--font-body', `"${theme.bodyFont}", sans-serif`);

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
  }, [theme]);

  // Sync to localStorage and PocketBase account safely
  const persistTheme = useCallback((updated: ActiveTheme) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (_) {
        // Quota safety: if localStorage fails (e.g. quota limit), retry without custom wallpaper
        try {
          const fallback = { ...updated, wallpaperUrl: THEME_PRESETS[updated.id].defaultWallpaper };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
        } catch (__) {}
      }
    }

    const currentUserId = pb.authStore.record?.id;
    if (currentUserId) {
      try {
        // Limit stored wallpaper size in DB to avoid payload limits
        const safeWallpaper = updated.wallpaperUrl && updated.wallpaperUrl.length > 300000
          ? null
          : updated.wallpaperUrl;

        pb.collection('users').update(currentUserId, {
          theme_settings: {
            id: updated.id,
            bubbleStyle: updated.bubbleStyle,
            typingAnimation: updated.typingAnimation,
            wallpaperUrl: safeWallpaper,
            wallpaperDim: updated.wallpaperDim,
            wallpaperBlur: updated.wallpaperBlur,
          },
        }).catch(() => {});
      } catch (_) {}
    }
  }, []);

  const setPreset = useCallback((presetId: ThemePresetId) => {
    const preset = THEME_PRESETS[presetId];
    if (!preset) return;
    const next: ActiveTheme = {
      id: preset.id,
      headingFont: preset.headingFont,
      bodyFont: preset.bodyFont,
      bubbleStyle: preset.bubbleStyle,
      typingAnimation: preset.typingAnimation,
      wallpaperUrl: preset.defaultWallpaper,
      wallpaperDim: 35,
      wallpaperBlur: 0,
      colors: preset.colors,
    };
    setTheme(next);
    persistTheme(next);
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

  const resetToDefault = useCallback(() => {
    setPreset('minimalist-oled');
  }, [setPreset]);

  // Load user's saved theme from PocketBase if available on mount
  useEffect(() => {
    const userSettings = (pb.authStore.record as any)?.theme_settings;
    if (userSettings?.id && THEME_PRESETS[userSettings.id as ThemePresetId]) {
      const base = THEME_PRESETS[userSettings.id as ThemePresetId];
      setTheme({
        id: base.id,
        headingFont: base.headingFont,
        bodyFont: base.bodyFont,
        bubbleStyle: userSettings.bubbleStyle || base.bubbleStyle,
        typingAnimation: userSettings.typingAnimation || base.typingAnimation,
        wallpaperUrl: userSettings.wallpaperUrl || base.defaultWallpaper,
        wallpaperDim: typeof userSettings.wallpaperDim === 'number' ? userSettings.wallpaperDim : 35,
        wallpaperBlur: typeof userSettings.wallpaperBlur === 'number' ? userSettings.wallpaperBlur : 0,
        colors: base.colors,
      });
    }
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
      resetToDefault,
    }),
    [theme, setPreset, setBubbleStyle, setTypingAnimation, setWallpaper, setWallpaperDim, setWallpaperBlur, resetToDefault]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

const defaultThemeValue: ThemeContextType = {
  theme: {
    ...THEME_PRESETS['minimalist-oled'],
    wallpaperUrl: THEME_PRESETS['minimalist-oled'].defaultWallpaper,
    wallpaperDim: 35,
    wallpaperBlur: 0,
  },
  setPreset: () => {},
  setBubbleStyle: () => {},
  setTypingAnimation: () => {},
  setWallpaper: () => {},
  setWallpaperDim: () => {},
  setWallpaperBlur: () => {},
  resetToDefault: () => {},
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  return context || defaultThemeValue;
}

export default ThemeContext;
