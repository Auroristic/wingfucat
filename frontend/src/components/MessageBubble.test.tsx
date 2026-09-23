import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble, formatMessageTime } from './MessageBubble';
import { ThemeProvider } from '../context/ThemeContext';
import type { Message } from './MessageBubble';

describe('MessageBubble Component', () => {
  const baseMessage: Message = {
    id: 'msg-1',
    sender: 'user-1',
    text: 'Hey there! How is it going?',
    created: '2026-09-22T15:45:00.000Z',
    read_at: null,
  };

  it("renders user's own message on the right with light surface theme", () => {
    render(<MessageBubble message={baseMessage} isSelf={true} />);

    const wrapper = screen.getByTestId('message-bubble-wrapper');
    expect(wrapper).toHaveClass('justify-end');
    expect(wrapper).not.toHaveClass('justify-start');

    const bubble = screen.getByTestId('message-bubble');
    expect(bubble).toHaveClass('bg-zinc-100');
    expect(bubble).toHaveClass('text-zinc-950');
    expect(screen.getByText('Hey there! How is it going?')).toBeInTheDocument();
  });

  it("renders partner's message on the left with subtle dark card theme", () => {
    render(<MessageBubble message={baseMessage} isSelf={false} />);

    const wrapper = screen.getByTestId('message-bubble-wrapper');
    expect(wrapper).toHaveClass('justify-start');
    expect(wrapper).not.toHaveClass('justify-end');

    const bubble = screen.getByTestId('message-bubble');
    expect(bubble).toHaveClass('bg-zinc-900');
    expect(bubble).toHaveClass('text-zinc-100');
    expect(bubble).toHaveClass('border-zinc-800');
    expect(screen.getByText('Hey there! How is it going?')).toBeInTheDocument();
  });

  it("shows single checkmark (done) for user's own unread message when read_at is null or undefined", () => {
    const unreadMessage: Message = {
      ...baseMessage,
      read_at: null,
    };

    render(<MessageBubble message={unreadMessage} isSelf={true} />);

    const checkIcon = screen.getByText('done');
    expect(checkIcon).toBeInTheDocument();
    expect(checkIcon).toHaveClass('material-symbols-rounded');
    expect(screen.queryByText('done_all')).toBeNull();
  });

  it("shows double checkmark (done_all) for user's own message when read_at is present", () => {
    const readMessage: Message = {
      ...baseMessage,
      read_at: '2026-09-22T16:00:00.000Z',
    };

    render(<MessageBubble message={readMessage} isSelf={true} />);

    const doubleCheckIcon = screen.getByText('done_all');
    expect(doubleCheckIcon).toBeInTheDocument();
    expect(doubleCheckIcon).toHaveClass('material-symbols-rounded');
    expect(screen.queryByText('done')).toBeNull();
  });

  it("does not show read receipt checkmarks on partner's incoming message", () => {
    const partnerMsgWithReadAt: Message = {
      ...baseMessage,
      sender: 'user-partner',
      read_at: '2026-09-22T16:00:00.000Z',
    };

    render(<MessageBubble message={partnerMsgWithReadAt} isSelf={false} />);

    expect(screen.queryByText('done')).toBeNull();
    expect(screen.queryByText('done_all')).toBeNull();
  });

  it('displays formatted timestamp', () => {
    render(<MessageBubble message={baseMessage} isSelf={true} />);

    const expectedTime = formatMessageTime(baseMessage.created);
    expect(expectedTime).toBeTruthy();
    expect(screen.getByText(expectedTime)).toBeInTheDocument();
  });

  it('derives isSelf automatically from currentUserId prop when provided', () => {
    const { rerender } = render(
      <MessageBubble message={baseMessage} currentUserId="user-1" />
    );
    expect(screen.getByTestId('message-bubble-wrapper')).toHaveClass('justify-end');

    rerender(
      <MessageBubble message={baseMessage} currentUserId="user-2" />
    );
    expect(screen.getByTestId('message-bubble-wrapper')).toHaveClass('justify-start');
  });

  it('renders image attachment with correct PocketBase file URL', () => {
    const imageMessage: Message = {
      ...baseMessage,
      id: 'img-123',
      media_type: 'image',
      attachment: 'sunset.webp',
      text: 'Sunset at the beach',
    };

    render(<MessageBubble message={imageMessage} isSelf={true} />);

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toContain('/api/files/messages/img-123/sunset.webp');
    expect(screen.getByText('Sunset at the beach')).toBeInTheDocument();
  });

  it('renders audio attachment via AudioPlayer with correct file URL and duration', () => {
    const audioMessage: Message = {
      ...baseMessage,
      id: 'audio-456',
      media_type: 'audio',
      attachment: 'note.webm',
      duration: 18,
    };

    render(<MessageBubble message={audioMessage} isSelf={false} />);

    expect(screen.getByTestId('audio-player')).toBeInTheDocument();
    expect(screen.getByText('0:18')).toBeInTheDocument();
    const playIcon = screen.getByText('play_arrow');
    expect(playIcon).toBeInTheDocument();
  });

  it('applies pink-cloud bounce and soft-cloud styling when wrapped in ThemeProvider with pink-cloud', () => {
    localStorage.setItem('wingfucat_theme', JSON.stringify({ id: 'pink-cloud', bubbleStyle: 'soft-cloud' }));
    render(
      <ThemeProvider>
        <MessageBubble message={baseMessage} isSelf={false} />
      </ThemeProvider>
    );

    const bubble = screen.getByTestId('message-bubble');
    expect(bubble).toHaveClass('animate-pink-bounce');
    expect(bubble).toHaveClass('rounded-3xl');
  });

  it('applies sharp and glass styles correctly', () => {
    localStorage.setItem('wingfucat_theme', JSON.stringify({ id: 'cyberpunk', bubbleStyle: 'sharp' }));
    const { unmount } = render(
      <ThemeProvider>
        <MessageBubble message={baseMessage} isSelf={false} />
      </ThemeProvider>
    );
    expect(screen.getByTestId('message-bubble')).toHaveClass('rounded-none');
    unmount();

    localStorage.setItem('wingfucat_theme', JSON.stringify({ id: 'futuristic', bubbleStyle: 'glass' }));
    render(
      <ThemeProvider>
        <MessageBubble message={baseMessage} isSelf={false} />
      </ThemeProvider>
    );
    expect(screen.getByTestId('message-bubble')).toHaveClass('backdrop-blur-md');
  });

  it('applies tui-bubble-user and tui-bubble-partner classes on terminal-tui preset', () => {
    localStorage.setItem('wingfucat_theme', JSON.stringify({ id: 'terminal-tui' }));
    const { unmount } = render(
      <ThemeProvider>
        <MessageBubble message={baseMessage} isSelf={true} />
      </ThemeProvider>
    );
    expect(screen.getByTestId('message-bubble')).toHaveClass('tui-bubble-user');
    unmount();

    render(
      <ThemeProvider>
        <MessageBubble message={baseMessage} isSelf={false} />
      </ThemeProvider>
    );
    expect(screen.getByTestId('message-bubble')).toHaveClass('tui-bubble-partner');
  });

  it('applies backdrop filter when bubbleTransparent is enabled', () => {
    localStorage.setItem('wingfucat_theme', JSON.stringify({ id: 'minimalist-oled', bubbleTransparent: true, bubbleOpacity: 60 }));
    render(
      <ThemeProvider>
        <MessageBubble message={baseMessage} isSelf={true} />
      </ThemeProvider>
    );
    const bubble = screen.getByTestId('message-bubble');
    expect(bubble).toBeInTheDocument();
    expect(bubble.style.backdropFilter).toBe('var(--theme-bubble-backdrop, none)');
  });
});

