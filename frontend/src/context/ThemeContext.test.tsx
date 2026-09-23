import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';
import { pb } from '../lib/pocketbase';

vi.mock('../lib/pocketbase', () => ({
  pb: {
    authStore: {
      record: { id: 'u-1', theme_settings: null },
    },
    collection: vi.fn(() => ({
      update: vi.fn().mockResolvedValue({ id: 'u-1' }),
    })),
  },
}));

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('saves preferences to localStorage and PocketBase user record', () => {
    const updateSpy = vi.fn().mockResolvedValue({ id: 'u-1' });
    (pb.collection as any).mockReturnValue({ update: updateSpy });

    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => {
      result.current.setPreset('pink-cloud');
    });

    const stored = JSON.parse(localStorage.getItem('wingfucat_theme') || '{}');
    expect(stored.id).toBe('pink-cloud');
    expect(updateSpy).toHaveBeenCalledWith('u-1', expect.objectContaining({
      theme_settings: expect.objectContaining({ id: 'pink-cloud' }),
    }));
  });
});
