import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AudioPlayer, formatAudioDuration } from './AudioPlayer';

describe('AudioPlayer Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  it('renders paused by default with play_arrow icon and formatted duration', () => {
    render(<AudioPlayer src="/test.mp3" duration={45} />);

    // Play icon should be visible
    const playIcon = screen.getByText('play_arrow');
    expect(playIcon).toBeInTheDocument();
    expect(playIcon).toHaveClass('material-symbols-rounded');
    expect(screen.queryByText('pause')).toBeNull();

    // Duration should be formatted as 0:45
    expect(screen.getByText('0:45')).toBeInTheDocument();
  });

  it('toggles to pause icon on play and back to play_arrow on pause', async () => {
    render(<AudioPlayer src="/test.mp3" duration={75} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    expect(screen.getByText('play_arrow')).toBeInTheDocument();

    // Click play
    await act(async () => {
      fireEvent.click(playButton);
    });

    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    expect(screen.getByText('pause')).toBeInTheDocument();
    expect(screen.queryByText('play_arrow')).toBeNull();

    // Click pause
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    await act(async () => {
      fireEvent.click(pauseButton);
    });

    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1);
    expect(screen.getByText('play_arrow')).toBeInTheDocument();
    expect(screen.queryByText('pause')).toBeNull();
  });

  it('updates display when timeupdate and ended events fire', async () => {
    const { container } = render(<AudioPlayer src="/test.mp3" duration={60} />);
    const audioElement = container.querySelector('audio');
    expect(audioElement).not.toBeNull();

    const playButton = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playButton);
    });
    expect(screen.getByText('pause')).toBeInTheDocument();

    // Simulate timeupdate to 12s
    if (audioElement) {
      Object.defineProperty(audioElement, 'currentTime', { value: 12, writable: true });
      await act(async () => {
        fireEvent.timeUpdate(audioElement);
      });
      expect(screen.getByText('0:12')).toBeInTheDocument();

      // Simulate ended event
      await act(async () => {
        fireEvent.ended(audioElement);
      });
      expect(screen.getByText('play_arrow')).toBeInTheDocument();
    }
  });

  it('formats audio duration correctly with formatAudioDuration helper', () => {
    expect(formatAudioDuration(0)).toBe('0:00');
    expect(formatAudioDuration(5)).toBe('0:05');
    expect(formatAudioDuration(65)).toBe('1:05');
    expect(formatAudioDuration(600)).toBe('10:00');
  });
});
