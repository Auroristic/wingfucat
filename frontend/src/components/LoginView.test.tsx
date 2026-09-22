import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginView } from './LoginView';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { pb } from '../lib/pocketbase';

// Helper component to test useAuth hook values
function AuthConsumer() {
  const { user, login, logout, isLoading } = useAuth();
  return (
    <div>
      <div data-testid="auth-user">{user ? user.username || user.id : 'anonymous'}</div>
      <div data-testid="auth-loading">{isLoading ? 'loading' : 'idle'}</div>
      <button onClick={() => login('alice', 'password123', false)}>Login Session</button>
      <button onClick={() => login('bob', 'password456', true)}>Login Local</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe('LoginView Component', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    pb.authStore.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    pb.authStore.clear();
  });

  it('renders username, password, lock icon, and submit button', () => {
    render(
      <AuthProvider>
        <LoginView />
      </AuthProvider>
    );

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in|log in/i })).toBeInTheDocument();

    // Verify lock icon is rendered
    const lockIcon = screen.getByText('lock');
    expect(lockIcon).toBeInTheDocument();
    expect(lockIcon.className).toContain('material-symbols-rounded');
  });

  it('"Remember this device" checkbox defaults to unchecked (false)', () => {
    render(
      <AuthProvider>
        <LoginView />
      </AuthProvider>
    );

    const checkbox = screen.getByRole('checkbox', { name: /remember this device/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    // Verify public safety warning caption
    expect(screen.getByText(/leave unchecked on public computers/i)).toBeInTheDocument();
  });

  it('prevents submission when fields are empty', async () => {
    const mockAuthWithPassword = vi.spyOn(pb.collection('users'), 'authWithPassword');

    render(
      <AuthProvider>
        <LoginView />
      </AuthProvider>
    );

    const form = screen.getByRole('button', { name: /sign in|log in/i }).closest('form')!;
    fireEvent.submit(form);

    expect(mockAuthWithPassword).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/please enter both username and password/i);
  });

  it('submits credentials with rememberMe=false by default', async () => {
    const mockAuthWithPassword = vi.spyOn(pb.collection('users'), 'authWithPassword').mockResolvedValueOnce({
      token: 'fake-token-session',
      record: { id: 'usr_1', username: 'retro', collectionId: 'users', collectionName: 'users', created: '', updated: '' },
    } as any);

    render(
      <AuthProvider>
        <LoginView />
      </AuthProvider>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in|log in/i });

    fireEvent.change(usernameInput, { target: { value: 'retro' } });
    fireEvent.change(passwordInput, { target: { value: 'supersecret' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAuthWithPassword).toHaveBeenCalledWith('retro', 'supersecret');
      expect(sessionStorage.getItem('pocketbase_auth')).toBeTruthy();
    });

    // Token should be in sessionStorage, NOT in localStorage
    expect(localStorage.getItem('pocketbase_auth')).toBeNull();
  });

  it('submits credentials with rememberMe=true when checked', async () => {
    const mockAuthWithPassword = vi.spyOn(pb.collection('users'), 'authWithPassword').mockResolvedValueOnce({
      token: 'fake-token-local',
      record: { id: 'usr_2', username: 'partner', collectionId: 'users', collectionName: 'users', created: '', updated: '' },
    } as any);

    render(
      <AuthProvider>
        <LoginView />
      </AuthProvider>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const checkbox = screen.getByRole('checkbox', { name: /remember this device/i });
    const submitBtn = screen.getByRole('button', { name: /sign in|log in/i });

    fireEvent.change(usernameInput, { target: { value: 'partner' } });
    fireEvent.change(passwordInput, { target: { value: 'mypassword' } });
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAuthWithPassword).toHaveBeenCalledWith('partner', 'mypassword');
      expect(localStorage.getItem('pocketbase_auth')).toBeTruthy();
    });

    // Token should be in localStorage, NOT in sessionStorage
    expect(sessionStorage.getItem('pocketbase_auth')).toBeNull();
  });

  it('renders error message on invalid credentials', async () => {
    vi.spyOn(pb.collection('users'), 'authWithPassword').mockRejectedValueOnce(
      new Error('Failed to authenticate.')
    );

    render(
      <AuthProvider>
        <LoginView />
      </AuthProvider>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in|log in/i });

    fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/failed to authenticate|invalid/i)).toBeInTheDocument();
    });
  });
});

describe('Session State & Public-Device Safety', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    pb.authStore.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    pb.authStore.clear();
  });

  it('stores token in sessionStorage only when rememberMe is false', async () => {
    vi.spyOn(pb.collection('users'), 'authWithPassword').mockResolvedValueOnce({
      token: 'session-jwt-token',
      record: { id: 'usr_safe', username: 'safe_user', collectionId: 'users', collectionName: 'users', created: '', updated: '' },
    } as any);

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Login Session'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-user')).toHaveTextContent('safe_user');
      expect(sessionStorage.getItem('pocketbase_auth')).toContain('session-jwt-token');
    });

    expect(localStorage.getItem('pocketbase_auth')).toBeNull();
  });

  it('persists token in localStorage when rememberMe is true', async () => {
    vi.spyOn(pb.collection('users'), 'authWithPassword').mockResolvedValueOnce({
      token: 'local-jwt-token',
      record: { id: 'usr_persisted', username: 'persisted_user', collectionId: 'users', collectionName: 'users', created: '', updated: '' },
    } as any);

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Login Local'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-user')).toHaveTextContent('persisted_user');
      expect(localStorage.getItem('pocketbase_auth')).toContain('local-jwt-token');
    });

    expect(sessionStorage.getItem('pocketbase_auth')).toBeNull();
  });

  it('logout handler clears both sessionStorage and localStorage', async () => {
    vi.spyOn(pb.collection('users'), 'authWithPassword').mockResolvedValueOnce({
      token: 'session-token-to-clear',
      record: { id: 'usr_test', username: 'logout_user', collectionId: 'users', collectionName: 'users', created: '', updated: '' },
    } as any);

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Login Session'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-user')).toHaveTextContent('logout_user');
      expect(sessionStorage.getItem('pocketbase_auth')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-user')).toHaveTextContent('anonymous');
    });

    expect(sessionStorage.getItem('pocketbase_auth')).toBeNull();
    expect(localStorage.getItem('pocketbase_auth')).toBeNull();
  });

  it('throws an error if useAuth is used outside AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<AuthConsumer />)).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });
});
