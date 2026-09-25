import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaLightbox } from './MediaLightbox';
import { ThemeProvider } from '../context/ThemeContext';

describe('MediaLightbox Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <MediaLightbox
        isOpen={false}
        onClose={() => {}}
        mediaUrl="https://example.com/photo.jpg"
        mediaType="image"
      />
    );
    expect(screen.queryByTestId('media-lightbox')).toBeNull();
  });

  it('renders image, caption, download button, and closes on close button or Escape key', () => {
    const onClose = vi.fn();
    render(
      <MediaLightbox
        isOpen={true}
        onClose={onClose}
        mediaUrl="https://example.com/photo.jpg"
        mediaType="image"
        caption="Beach sunset photo"
        fileName="sunset.jpg"
      />
    );

    expect(screen.getByTestId('media-lightbox')).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
    expect(screen.getByText('Beach sunset photo')).toBeInTheDocument();

    const downloadLink = screen.getByRole('link', { name: /download/i });
    expect(downloadLink).toHaveAttribute('href', 'https://example.com/photo.jpg');

    const closeBtn = screen.getByRole('button', { name: /close lightbox/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Escape key press
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('renders video element when mediaType is video', () => {
    render(
      <MediaLightbox
        isOpen={true}
        onClose={() => {}}
        mediaUrl="https://example.com/video.mp4"
        mediaType="video"
      />
    );

    const video = screen.getByTestId('lightbox-video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
  });

  it('handles zoom in and zoom out for images', () => {
    render(
      <MediaLightbox
        isOpen={true}
        onClose={() => {}}
        mediaUrl="https://example.com/photo.jpg"
        mediaType="image"
      />
    );

    const img = screen.getByRole('img');
    expect(img.style.transform).toBe('scale(1)');

    const zoomInBtn = screen.getByRole('button', { name: /zoom in/i });
    fireEvent.click(zoomInBtn);
    expect(img.style.transform).toBe('scale(1.5)');

    const zoomOutBtn = screen.getByRole('button', { name: /zoom out/i });
    fireEvent.click(zoomOutBtn);
    expect(img.style.transform).toBe('scale(1)');
  });

  it('renders terminal TUI styling in terminal-tui theme', () => {
    localStorage.setItem('wingfucat_theme', JSON.stringify({ id: 'terminal-tui' }));

    render(
      <ThemeProvider>
        <MediaLightbox
          isOpen={true}
          onClose={() => {}}
          mediaUrl="https://example.com/tui.jpg"
          mediaType="image"
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId('media-lightbox')).toHaveClass('font-mono');
  });
});
