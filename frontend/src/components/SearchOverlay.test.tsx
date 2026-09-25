import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchOverlay } from './SearchOverlay';
import type { Message } from './MessageBubble';

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    sender: 'user-1',
    text: 'Hello world! Beautiful sunny morning.',
    created: '2026-09-22T10:00:00Z',
  },
  {
    id: 'msg-2',
    sender: 'user-2',
    text: 'Good morning! How are you doing today?',
    created: '2026-09-22T10:01:00Z',
  },
  {
    id: 'msg-3',
    sender: 'user-1',
    text: 'Doing great, coffee is awesome.',
    created: '2026-09-22T10:02:00Z',
  },
];

describe('SearchOverlay Component', () => {
  const onClose = vi.fn();
  const onActiveMatchChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(
      <SearchOverlay
        isOpen={false}
        onClose={onClose}
        messages={mockMessages}
        onActiveMatchChange={onActiveMatchChange}
      />
    );
    expect(screen.queryByTestId('search-overlay')).toBeNull();
  });

  it('renders search input when isOpen is true', () => {
    render(
      <SearchOverlay
        isOpen={true}
        onClose={onClose}
        messages={mockMessages}
        onActiveMatchChange={onActiveMatchChange}
      />
    );
    expect(screen.getByTestId('search-overlay')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search in conversation/i)).toBeInTheDocument();
  });

  it('filters matches, shows count, and calls onActiveMatchChange', () => {
    render(
      <SearchOverlay
        isOpen={true}
        onClose={onClose}
        messages={mockMessages}
        onActiveMatchChange={onActiveMatchChange}
      />
    );

    const input = screen.getByPlaceholderText(/search in conversation/i);
    fireEvent.change(input, { target: { value: 'morning' } });

    expect(screen.getByText('1 of 2')).toBeInTheDocument();
    expect(onActiveMatchChange).toHaveBeenCalledWith('msg-1', 'morning');
  });

  it('navigates next and previous matches', () => {
    render(
      <SearchOverlay
        isOpen={true}
        onClose={onClose}
        messages={mockMessages}
        onActiveMatchChange={onActiveMatchChange}
      />
    );

    const input = screen.getByPlaceholderText(/search in conversation/i);
    fireEvent.change(input, { target: { value: 'morning' } });

    const nextBtn = screen.getByLabelText(/next match/i);
    fireEvent.click(nextBtn);

    expect(screen.getByText('2 of 2')).toBeInTheDocument();
    expect(onActiveMatchChange).toHaveBeenCalledWith('msg-2', 'morning');

    const prevBtn = screen.getByLabelText(/previous match/i);
    fireEvent.click(prevBtn);

    expect(screen.getByText('1 of 2')).toBeInTheDocument();
    expect(onActiveMatchChange).toHaveBeenCalledWith('msg-1', 'morning');
  });

  it('shows no matches message when query does not match', () => {
    render(
      <SearchOverlay
        isOpen={true}
        onClose={onClose}
        messages={mockMessages}
        onActiveMatchChange={onActiveMatchChange}
      />
    );

    const input = screen.getByPlaceholderText(/search in conversation/i);
    fireEvent.change(input, { target: { value: 'nonexistent keyword' } });

    expect(screen.getByText(/no results/i)).toBeInTheDocument();
    expect(onActiveMatchChange).toHaveBeenCalledWith(null, 'nonexistent keyword');
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <SearchOverlay
        isOpen={true}
        onClose={onClose}
        messages={mockMessages}
        onActiveMatchChange={onActiveMatchChange}
      />
    );

    const closeBtn = screen.getByLabelText(/close search/i);
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    render(
      <SearchOverlay
        isOpen={true}
        onClose={onClose}
        messages={mockMessages}
        onActiveMatchChange={onActiveMatchChange}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
