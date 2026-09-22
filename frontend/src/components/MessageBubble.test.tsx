import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble, formatMessageTime } from './MessageBubble';
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
});
