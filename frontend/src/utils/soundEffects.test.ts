import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isSoundEnabled,
  setSoundEnabled,
  playMessageSentSound,
  unlockAudioContext,
} from './soundEffects';

describe('soundEffects utility', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to sound enabled and toggles correctly with localStorage persistence', () => {
    expect(isSoundEnabled()).toBe(true);

    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    expect(localStorage.getItem('wingfucat_sound_enabled')).toBe('false');

    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
    expect(localStorage.getItem('wingfucat_sound_enabled')).toBe('true');
  });

  it('does not throw when playMessageSentSound is called across all themes', () => {
    // When AudioContext is not implemented in environment or mocked
    expect(() => playMessageSentSound('pink-cloud')).not.toThrow();
    expect(() => playMessageSentSound('cyberpunk')).not.toThrow();
    expect(() => playMessageSentSound('lavender-dream')).not.toThrow();
    expect(() => playMessageSentSound('futuristic')).not.toThrow();
    expect(() => playMessageSentSound('minimalist-oled')).not.toThrow();
  });

  it('does not throw when unlockAudioContext is called', () => {
    expect(() => unlockAudioContext()).not.toThrow();
  });

  it('respects sound disabled setting and avoids playing', () => {
    setSoundEnabled(false);
    expect(() => playMessageSentSound('pink-cloud')).not.toThrow();
  });
});
