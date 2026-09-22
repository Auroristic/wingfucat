import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageThread } from './MessageThread';
import type { Message } from './MessageBubble';

describe('MessageThread Component', () => {
  const mockMessages: Message[] = [
    {
      id: 'msg_1',
      sender: 'usr_partner',
      text: 'Good morning!',
      created: '2026-09-22T08:00:00Z',
      read_at: '2026-09-22T08:05:00Z',
    },
    {
      id: 'msg_2',
      sender: 'usr_me',
      text: 'Morning! Did you sleep well?',
      created: '2026-09-22T08:02:00Z',
      read_at: null,
    },
  ];

  beforeEach(() => {
    // Provide a mock for Element.prototype.scrollIntoView if not defined in happy-dom
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = vi.fn();
    }
  });

  it('renders loading state when isLoading is true and no messages are present', () => {
    render(<MessageThread messages={[]} isLoading={true} currentUserId="usr_me" />);

    expect(screen.getByText(/loading messages/i)).toBeInTheDocument();
  });

  it('renders empty placeholder when not loading and message list is empty', () => {
    render(<MessageThread messages={[]} isLoading={false} currentUserId="usr_me" />);

    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });

  it('renders messages with correct alignment and bubble styling', () => {
    render(<MessageThread messages={mockMessages} isLoading={false} currentUserId="usr_me" />);

    expect(screen.getByText('Good morning!')).toBeInTheDocument();
    expect(screen.getByText('Morning! Did you sleep well?')).toBeInTheDocument();

    const wrappers = screen.getAllByTestId('message-bubble-wrapper');
    expect(wrappers).toHaveLength(2);

    // First message is partner's -> left
    expect(wrappers[0]).toHaveClass('justify-start');

    // Second message is user's -> right
    expect(wrappers[1]).toHaveClass('justify-end');
  });

  it('scrolls to bottom on mount and when messages update', () => {
    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    const { rerender } = render(
      <MessageThread messages={mockMessages} isLoading={false} currentUserId="usr_me" />
    );

    expect(scrollIntoViewMock).toHaveBeenCalled();

    const updatedMessages = [
      ...mockMessages,
      {
        id: 'msg_3',
        sender: 'usr_partner',
        text: 'Yes I did! Heading out now.',
        created: '2026-09-22T08:10:00Z',
        read_at: null,
      },
    ];

    rerender(<MessageThread messages={updatedMessages} isLoading={false} currentUserId="usr_me" />);
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(2);
  });
});
