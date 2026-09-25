import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PinnedBanner } from './PinnedBanner';
import type { Message } from './MessageBubble';

const mockPinnedMessages: Message[] = [
  {
    id: 'pin-1',
    sender: 'user-1',
    text: 'First pinned note: door code is 4455',
    is_pinned: true,
    pinned_at: '2026-09-22T10:00:00Z',
    created: '2026-09-22T09:00:00Z',
  },
  {
    id: 'pin-2',
    sender: 'user-2',
    text: 'Second pinned note: dinner at 8pm tonight',
    is_pinned: true,
    pinned_at: '2026-09-22T11:00:00Z',
    created: '2026-09-22T09:30:00Z',
  },
];

describe('PinnedBanner Component', () => {
  const onSelect = vi.fn();
  const onUnpin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when pinnedMessages is empty', () => {
    render(
      <PinnedBanner
        pinnedMessages={[]}
        onSelect={onSelect}
        onUnpin={onUnpin}
      />
    );
    expect(screen.queryByTestId('pinned-banner')).toBeNull();
  });

  it('renders single pinned message snippet and unpin button', () => {
    render(
      <PinnedBanner
        pinnedMessages={[mockPinnedMessages[0]]}
        onSelect={onSelect}
        onUnpin={onUnpin}
      />
    );

    expect(screen.getByTestId('pinned-banner')).toBeInTheDocument();
    expect(screen.getByText(/door code is 4455/i)).toBeInTheDocument();

    const jumpBtn = screen.getByRole('button', { name: /jump to pinned message/i });
    fireEvent.click(jumpBtn);
    expect(onSelect).toHaveBeenCalledWith('pin-1');

    const unpinBtn = screen.getByRole('button', { name: /unpin message/i });
    fireEvent.click(unpinBtn);
    expect(onUnpin).toHaveBeenCalledWith('pin-1');
  });

  it('shows count and allows expanding to view all pinned messages', () => {
    render(
      <PinnedBanner
        pinnedMessages={mockPinnedMessages}
        onSelect={onSelect}
        onUnpin={onUnpin}
      />
    );

    // Shows latest pinned message (pin-2) and count
    expect(screen.getByText(/dinner at 8pm tonight/i)).toBeInTheDocument();
    expect(screen.getByText(/2 pinned/i)).toBeInTheDocument();

    // Expand menu
    const expandBtn = screen.getByRole('button', { name: /view all pinned messages/i });
    fireEvent.click(expandBtn);

    // Both messages visible
    expect(screen.getByText(/door code is 4455/i)).toBeInTheDocument();
    expect(screen.getAllByText(/dinner at 8pm tonight/i).length).toBeGreaterThanOrEqual(1);

    // Click older pin in list
    const olderPin = screen.getByText(/door code is 4455/i);
    fireEvent.click(olderPin);
    expect(onSelect).toHaveBeenCalledWith('pin-1');
  });
});
