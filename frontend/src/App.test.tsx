import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';
import * as AuthModule from './context/AuthContext';
import { pb } from './lib/pocketbase';

vi.mock('./components/MessageThread', () => ({
  LiveMessageThread: () => <div data-testid="live-thread">Live Message Thread</div>,
}));

vi.mock('./components/MessageComposer', () => ({
  MessageComposer: () => <div data-testid="mock-composer">Message Composer</div>,
}));

describe('App Root Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(pb.collection('users'), 'getFullList').mockResolvedValue([] as any);
    vi.spyOn(pb.collection('chat_settings'), 'getFullList').mockResolvedValue([
      { id: 'settings_1', archived_at: '' },
    ] as any);
    vi.spyOn(pb.collection('chat_settings'), 'subscribe').mockResolvedValue(vi.fn());
    vi.spyOn(pb.collection('chat_settings'), 'unsubscribe').mockResolvedValue(undefined);
  });

  it('renders LoginView when user is not authenticated', () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<App />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByTestId('live-thread')).toBeNull();
  });

  it('renders chat thread and composer when user is authenticated', () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      user: {
        id: 'u-1',
        collectionId: 'users',
        collectionName: 'users',
        email: 'alice@example.com',
        username: 'alice',
        display_name: 'Alice',
        avatar: '',
        created: '2026-09-22',
        updated: '2026-09-22',
      },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByTestId('live-thread')).toBeInTheDocument();
    expect(screen.getByTestId('mock-composer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  it('sends is_online: true heartbeat when user is authenticated', () => {
    const updateSpy = vi.spyOn(pb.collection('users'), 'update').mockResolvedValue({} as any);

    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      user: {
        id: 'u-1',
        collectionId: 'users',
        collectionName: 'users',
        email: 'alice@example.com',
        username: 'alice',
        display_name: 'Alice',
        avatar: '',
        created: '2026-09-22',
        updated: '2026-09-22',
      },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(<App />);
    expect(updateSpy).toHaveBeenCalledWith('u-1', expect.objectContaining({ is_online: true }));
  });
});
