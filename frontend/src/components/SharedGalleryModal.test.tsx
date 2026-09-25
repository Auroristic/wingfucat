import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SharedGalleryModal } from './SharedGalleryModal';
import { ThemeProvider } from '../context/ThemeContext';
import type { Message } from './MessageBubble';

describe('SharedGalleryModal Component', () => {
  const sampleMessages: Message[] = [
    {
      id: 'm1',
      sender: 'user-1',
      media_type: 'image',
      attachment: 'photo1.jpg',
      created: '2026-09-24T12:00:00.000Z',
    },
    {
      id: 'm2',
      sender: 'user-2',
      media_type: 'video',
      attachment: 'video1.mp4',
      file_name: 'clip.mp4',
      created: '2026-09-24T13:00:00.000Z',
    },
    {
      id: 'm3',
      sender: 'user-1',
      media_type: 'file',
      attachment: 'contract.pdf',
      file_name: 'contract.pdf',
      file_size: 1048576,
      created: '2026-09-24T14:00:00.000Z',
    },
  ];

  it('renders tabs with correct item counts and allows switching tabs', () => {
    const onSelect = vi.fn();
    render(
      <SharedGalleryModal
        isOpen={true}
        onClose={() => {}}
        messages={sampleMessages}
        onSelectMedia={onSelect}
      />
    );

    expect(screen.getByRole('button', { name: /photos \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /videos \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /files \(1\)/i })).toBeInTheDocument();

    // Default tab is Photos
    const photoImg = screen.getByRole('img');
    expect(photoImg).toBeInTheDocument();
    fireEvent.click(photoImg);
    expect(onSelect).toHaveBeenCalledWith(sampleMessages[0]);

    // Switch to Videos tab
    fireEvent.click(screen.getByRole('button', { name: /videos \(1\)/i }));
    expect(screen.getByText('clip.mp4')).toBeInTheDocument();

    // Switch to Files tab
    fireEvent.click(screen.getByRole('button', { name: /files \(1\)/i }));
    expect(screen.getByText('contract.pdf')).toBeInTheDocument();
  });

  it('renders empty state when no media in category', () => {
    render(
      <SharedGalleryModal
        isOpen={true}
        onClose={() => {}}
        messages={[]}
        onSelectMedia={() => {}}
      />
    );

    expect(screen.getByText(/no shared photos/i)).toBeInTheDocument();
  });

  it('renders TUI styling under terminal-tui preset', () => {
    localStorage.setItem('wingfucat_theme', JSON.stringify({ id: 'terminal-tui' }));

    render(
      <ThemeProvider>
        <SharedGalleryModal
          isOpen={true}
          onClose={() => {}}
          messages={sampleMessages}
          onSelectMedia={() => {}}
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId('shared-gallery-modal')).toHaveClass('font-mono');
    expect(screen.getByText(/\[MEDIA VAULT\]/i)).toBeInTheDocument();
  });
});
