import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';
import { pb } from '../lib/pocketbase';

let authChangeCallbacks: Array<(token: string, record: any) => void> = [];

vi.mock('../lib/pocketbase', () => ({
  pb: {
    authStore: {
      record: { id: 'u-1', theme_settings: null },
      onChange: vi.fn((cb) => {
        authChangeCallbacks.push(cb);
        return () => {
          authChangeCallbacks = authChangeCallbacks.filter((c) => c !== cb);
        };
      }),
      clear: vi.fn(() => {
        (pb.authStore as any).record = null;
        authChangeCallbacks.forEach((cb) => cb('', null));
      }),
      save: vi.fn((token, record) => {
        (pb.authStore as any).record = record;
        authChangeCallbacks.forEach((cb) => cb(token, record));
      }),
    },
    collection: vi.fn(() => ({
      update: vi.fn().mockResolvedValue({ id: 'u-1' }),
      getOne: vi.fn().mockResolvedValue({ id: 'u-1', theme_settings: null }),
      subscribe: vi.fn().mockResolvedValue(vi.fn()),
    })),
  },
}));

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authChangeCallbacks = [];
    (pb.authStore as any).record = { id: 'u-1', theme_settings: null };
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('defaults to minimalist-oled preset', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme.id).toBe('minimalist-oled');
    expect(result.current.theme.headingFont).toBe('Inter');
    expect(result.current.theme.bodyFont).toBe('Inter');
    expect(result.current.theme.bubbleStyle).toBe('rounded');
    expect(result.current.theme.typingAnimation).toBe('dots');
  });

  it('switches to pink-cloud preset with Baloo 2, Nunito, soft-cloud bubbles and hearts animation', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => {
      result.current.setPreset('pink-cloud');
    });

    expect(result.current.theme.id).toBe('pink-cloud');
    expect(result.current.theme.headingFont).toBe('Baloo 2');
    expect(result.current.theme.bodyFont).toBe('Nunito');
    expect(result.current.theme.bubbleStyle).toBe('soft-cloud');
    expect(result.current.theme.typingAnimation).toBe('hearts');
    expect(document.documentElement.getAttribute('data-theme')).toBe('pink-cloud');
  });

  it('switches to futuristic preset with Orbitron, Exo 2, glass bubbles and glow-bar animation', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => {
      result.current.setPreset('futuristic');
    });

    expect(result.current.theme.id).toBe('futuristic');
    expect(result.current.theme.headingFont).toBe('Orbitron');
    expect(result.current.theme.bodyFont).toBe('Exo 2');
    expect(result.current.theme.bubbleStyle).toBe('glass');
    expect(result.current.theme.typingAnimation).toBe('glow-bar');
    expect(document.documentElement.getAttribute('data-theme')).toBe('futuristic');
  });

  it('switches to cyberpunk and lavender-dream presets correctly', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => {
      result.current.setPreset('cyberpunk');
    });
    expect(result.current.theme.headingFont).toBe('Space Grotesk');
    expect(result.current.theme.typingAnimation).toBe('neon-pulse');

    act(() => {
      result.current.setPreset('lavender-dream');
    });
    expect(result.current.theme.headingFont).toBe('Poppins');
  });

  it('allows independent override of bubble style and typing animation', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => {
      result.current.setPreset('pink-cloud');
      result.current.setTypingAnimation('dots');
      result.current.setBubbleStyle('sharp');
    });

    expect(result.current.theme.id).toBe('pink-cloud');
    expect(result.current.theme.bubbleStyle).toBe('sharp');
    expect(result.current.theme.typingAnimation).toBe('dots');
  });

  it('saves preferences to account-scoped localStorage and PocketBase user record', () => {
    const updateSpy = vi.fn().mockResolvedValue({ id: 'u-1' });
    (pb.collection as any).mockReturnValue({
      update: updateSpy,
      getOne: vi.fn().mockResolvedValue({ id: 'u-1', theme_settings: null }),
      subscribe: vi.fn().mockResolvedValue(vi.fn()),
    });

    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => {
      result.current.setPreset('pink-cloud');
    });

    const scopedStored = JSON.parse(localStorage.getItem('wingfucat_theme_u-1') || '{}');
    expect(scopedStored.id).toBe('pink-cloud');
    const genericStored = JSON.parse(localStorage.getItem('wingfucat_theme') || '{}');
    expect(genericStored.id).toBe('pink-cloud');
    expect(updateSpy).toHaveBeenCalledWith('u-1', expect.objectContaining({
      theme_settings: expect.objectContaining({ id: 'pink-cloud' }),
    }));
  });

  it('switches to terminal-tui and daylight presets and manages frost level', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => {
      result.current.setPreset('terminal-tui');
    });
    expect(result.current.theme.id).toBe('terminal-tui');
    expect(result.current.theme.headingFont).toBe('JetBrains Mono');
    expect(result.current.theme.isGlassSupported).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('terminal-tui');

    act(() => {
      result.current.setPreset('daylight');
    });
    expect(result.current.theme.id).toBe('daylight');
    expect(result.current.theme.colors.bgPrimary).toBe('#f8f9fa');
    expect(result.current.theme.isGlassSupported).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('daylight');

    act(() => {
      result.current.setPreset('futuristic');
      result.current.setGlassFrostLevel(50);
    });
    expect(result.current.theme.glassFrostLevel).toBe(50);
  });

  it('hydrates theme from authStore user record upon login', async () => {
    (pb.authStore as any).record = null;
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme.id).toBe('minimalist-oled');

    await act(async () => {
      pb.authStore.save('token-123', {
        id: 'u-1',
        theme_settings: {
          id: 'pink-cloud',
          bubbleStyle: 'soft-cloud',
          typingAnimation: 'hearts',
        },
      } as any);
    });

    expect(result.current.theme.id).toBe('pink-cloud');
    expect(result.current.theme.bubbleStyle).toBe('soft-cloud');
    expect(result.current.theme.typingAnimation).toBe('hearts');
  });

  it('resets to default theme and clears active storage on logout', async () => {
    (pb.authStore as any).record = {
      id: 'u-1',
      theme_settings: { id: 'cyberpunk' },
    };

    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme.id).toBe('cyberpunk');

    await act(async () => {
      pb.authStore.clear();
    });

    expect(result.current.theme.id).toBe('minimalist-oled');
    expect(localStorage.getItem('wingfucat_theme')).toBeNull();
  });

  it('isolates theme settings between two different accounts on the same device', async () => {
    // 1. User A (retro) logs in and sets pink-cloud
    (pb.authStore as any).record = { id: 'retro', theme_settings: null };
    const { result, unmount } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => {
      result.current.setPreset('pink-cloud');
    });
    expect(result.current.theme.id).toBe('pink-cloud');
    expect(JSON.parse(localStorage.getItem('wingfucat_theme_retro') || '{}').id).toBe('pink-cloud');

    // 2. User A logs out
    await act(async () => {
      pb.authStore.clear();
    });
    expect(result.current.theme.id).toBe('minimalist-oled');
    unmount();

    // 3. User B (wingfu) logs in with NO custom theme_settings
    (pb.authStore as any).record = { id: 'wingfu', theme_settings: null };
    const { result: wingfuResult } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    // Wingfu MUST NOT inherit retro's pink-cloud
    expect(wingfuResult.current.theme.id).toBe('minimalist-oled');

    // Wingfu selects cyberpunk
    act(() => {
      wingfuResult.current.setPreset('cyberpunk');
    });
    expect(wingfuResult.current.theme.id).toBe('cyberpunk');
    expect(JSON.parse(localStorage.getItem('wingfucat_theme_wingfu') || '{}').id).toBe('cyberpunk');
    // Retro's theme in storage remains intact
    expect(JSON.parse(localStorage.getItem('wingfucat_theme_retro') || '{}').id).toBe('pink-cloud');
  });

  it('syncs theme updates across devices via PocketBase realtime subscription', async () => {
    (pb.authStore as any).record = { id: 'u-1', theme_settings: null };
    let realtimeCb: ((e: any) => void) | null = null;
    (pb.collection as any).mockReturnValue({
      update: vi.fn().mockResolvedValue({ id: 'u-1' }),
      getOne: vi.fn().mockResolvedValue({ id: 'u-1', theme_settings: null }),
      subscribe: vi.fn().mockImplementation((_id: string, cb: any) => {
        realtimeCb = cb;
        return vi.fn();
      }),
    });

    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme.id).toBe('minimalist-oled');

    // Simulate cross-device update from desktop
    await act(async () => {
      if (realtimeCb) {
        realtimeCb({
          action: 'update',
          record: {
            id: 'u-1',
            theme_settings: {
              id: 'futuristic',
              bubbleStyle: 'glass',
              typingAnimation: 'glow-bar',
              glassFrostLevel: 80,
            },
          },
        });
      }
    });

    expect(result.current.theme.id).toBe('futuristic');
    expect(result.current.theme.bubbleStyle).toBe('glass');
    expect(result.current.theme.typingAnimation).toBe('glow-bar');
    expect(result.current.theme.glassFrostLevel).toBe(80);
  });
});
