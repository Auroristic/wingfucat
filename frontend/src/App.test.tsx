import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';
import * as AuthModule from './context/AuthContext';

vi.mock('./components/MessageThread', () => ({
  LiveMessageThread: () => <div data-testid="live-thread">Live Message Thread</div>,
}));

vi.mock('./components/MessageComposer', () => ({
  MessageComposer: () => <div data-testid="mock-composer">Message Composer</div>,
}));

describe('App Root Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
