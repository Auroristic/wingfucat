import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReplyPreviewBar } from './ReplyPreviewBar';
import { ThemeProvider } from '../context/ThemeContext';
import type { Message } from './MessageBubble';

describe('ReplyPreviewBar Component', () => {
  const sampleMessage: Message = {
    id: 'msg-reply-target',
    sender: 'user-partner',
    text: 'Can you bring dinner on your way home?',
    created: '2026-09-25T19:00:00.000Z',
  };

  it('renders sender name, message snippet, and calls onCancel on close button click', () => {
    const onCancel = vi.fn();
    render(
      <ReplyPreviewBar
        message={sampleMessage}
        partnerName="Wingfu"
        currentUserId="user-me"
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Wingfu')).toBeInTheDocument();
    expect(screen.getByText('Can you bring dinner on your way home?')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /cancel reply/i });
    fireEvent.click(closeBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders "You" when replying to own message', () => {
    render(
      <ReplyPreviewBar
        message={{ ...sampleMessage, sender: 'user-me' }}
        partnerName="Wingfu"
        currentUserId="user-me"
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('renders media description when message text is empty', () => {
    render(
      <ReplyPreviewBar
        message={{
          id: 'm-photo',
          sender: 'user-partner',
          media_type: 'image',
          created: '2026-09-25T19:00:00.000Z',
        }}
        partnerName="Wingfu"
        onCancel={() => {}}
      />
    );

    expect(screen.getByText(/photo/i)).toBeInTheDocument();
  });

  it('renders terminal TUI ASCII style format when in terminal-tui preset', () => {
    localStorage.setItem('wingfucat_theme', JSON.stringify({ id: 'terminal-tui' }));

    render(
      <ThemeProvider>
        <ReplyPreviewBar
          message={sampleMessage}
          partnerName="Wingfu"
          onCancel={() => {}}
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId('reply-preview-bar')).toHaveClass('font-mono');
    expect(screen.getByText(/\[REPLYING TO: Wingfu\]/i)).toBeInTheDocument();
  });
});
