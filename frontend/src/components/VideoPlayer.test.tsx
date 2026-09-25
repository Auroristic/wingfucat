import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoPlayer } from './VideoPlayer';
import { ThemeProvider } from '../context/ThemeContext';

describe('VideoPlayer Component', () => {
  it('renders video element with custom controls and toggles play/pause', () => {
    const playMock = vi.fn().mockResolvedValue(undefined);
    const pauseMock = vi.fn();
    window.HTMLMediaElement.prototype.play = playMock;
    window.HTMLMediaElement.prototype.pause = pauseMock;

    render(<VideoPlayer src="https://example.com/video.mp4" />);

    const videoEl = screen.getByTestId('video-element') as HTMLVideoElement;
    expect(videoEl).toBeInTheDocument();
    expect(videoEl).toHaveAttribute('src', 'https://example.com/video.mp4');

    const playPauseBtn = screen.getByRole('button', { name: /play video|pause video/i });
    expect(playPauseBtn).toBeInTheDocument();

    // Toggle play
    fireEvent.click(playPauseBtn);
    expect(playMock).toHaveBeenCalled();
  });

  it('toggles mute/unmute and handles fullscreen request', () => {
    const onFullscreen = vi.fn();
    render(
      <VideoPlayer
        src="https://example.com/video.mp4"
        onOpenFullscreen={onFullscreen}
      />
    );

    const muteBtn = screen.getByRole('button', { name: /mute|unmute/i });
    fireEvent.click(muteBtn);
    const videoEl = screen.getByTestId('video-element') as HTMLVideoElement;
    expect(videoEl.muted).toBe(true);

    const fsBtn = screen.getByRole('button', { name: /fullscreen/i });
    fireEvent.click(fsBtn);
    expect(onFullscreen).toHaveBeenCalled();
  });

  it('renders terminal TUI ASCII style controls in terminal-tui theme', () => {
    localStorage.setItem('wingfucat_theme', JSON.stringify({ id: 'terminal-tui' }));

    render(
      <ThemeProvider>
        <VideoPlayer src="https://example.com/terminal_video.mp4" />
      </ThemeProvider>
    );

    expect(screen.getByTestId('video-player')).toHaveClass('font-mono');
    expect(screen.getByTestId('video-player')).toHaveClass('border-[#00ff41]');
  });
});
