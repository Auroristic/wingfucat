import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { Header } from './Header';
import { ArchiveModal } from './ArchiveModal';
import * as AuthModule from '../context/AuthContext';
import { pb } from '../lib/pocketbase';
import type { Message } from './MessageBubble';

// Mock PocketBase
vi.mock('../lib/pocketbase', () => ({
  pb: {
    baseUrl: 'http://127.0.0.1:8090',
    files: {
      getURL: vi.fn((record: any, filename: string) => `http://127.0.0.1:8090/api/files/users/${record.id}/${filename}`),
    },
    collection: vi.fn(() => ({
      getFullList: vi.fn().mockResolvedValue([{ id: 'settings_1', archived_at: '2026-09-22T10:00:00Z' }]),
      update: vi.fn().mockResolvedValue({ id: 'settings_1', archived_at: '' }),
    })),
  },
}));

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders partner info as offline when partner has no recent last_seen', () => {
    render(
      <Header
        partner={{
          id: 'partner-1',
          username: 'sweetheart',
          display_name: 'Sweetheart',
          last_seen: '2020-01-01T00:00:00.000Z',
        }}
        isConnected={true}
      />
    );

    // Partner name should be visible
    expect(screen.getByText('Sweetheart')).toBeInTheDocument();

    // No online dot, text is Offline
    expect(screen.queryByTestId('partner-online-indicator')).toBeNull();
    expect(screen.getByText('Offline')).toBeInTheDocument();

    // Logout and archive buttons exist with correct icons
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
    expect(screen.getByText('logout')).toHaveClass('material-symbols-rounded');

    expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument();
    expect(screen.getByText('archive')).toHaveClass('material-symbols-rounded');
  });

  it('renders green indicator and Online status when partner is verified online', () => {
    render(
      <Header
        partner={{
          id: 'partner-1',
          username: 'sweetheart',
          display_name: 'Sweetheart',
          last_seen: new Date().toISOString(),
        }}
        isConnected={true}
      />
    );

    expect(screen.getByTestId('partner-online-indicator')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders typing indicator in header when partner is typing', () => {
    render(
      <Header
        partner={{
          id: 'partner-1',
          username: 'sweetheart',
          display_name: 'Sweetheart',
          last_seen: new Date().toISOString(),
        }}
        isConnected={true}
        isPartnerTyping={true}
      />
    );

    expect(screen.getByTestId('partner-typing')).toBeInTheDocument();
    expect(screen.getByText('typing...')).toBeInTheDocument();
  });

  it('renders offline connection indicator when isConnected is false', () => {
    render(
      <Header
        partner={{
          id: 'partner-1',
          username: 'sweetheart',
          display_name: 'Sweetheart',
        }}
        isConnected={false}
      />
    );

    const indicator = screen.getByTestId('connection-indicator');
    expect(indicator).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('calls logout handler when logout button is clicked', () => {
    const mockLogout = vi.fn();
    render(<Header onLogout={mockLogout} />);

    const logoutButton = screen.getByRole('button', { name: /log out/i });
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('falls back to useAuth logout when onLogout prop is omitted', () => {
    const authLogoutMock = vi.fn();
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      user: { id: 'u1' } as any,
      isLoading: false,
      login: vi.fn(),
      logout: authLogoutMock,
    });

    render(<Header />);

    const logoutButton = screen.getByRole('button', { name: /log out/i });
    fireEvent.click(logoutButton);

    expect(authLogoutMock).toHaveBeenCalledTimes(1);
  });

  it('archive button opens confirmation dialog and confirms archive action', async () => {
    const mockArchive = vi.fn();
    render(<Header onArchive={mockArchive} />);

    // Confirmation dialog should initially not be visible
    expect(screen.queryByText(/archive chat\?/i)).toBeNull();

    // Click archive button
    const archiveButton = screen.getByRole('button', { name: /archive chat/i });
    fireEvent.click(archiveButton);

    // Confirmation dialog appears
    expect(screen.getByText(/archive chat\?/i)).toBeInTheDocument();
    expect(screen.getByText(/active thread will be cleared/i)).toBeInTheDocument();

    // Click cancel button closes dialog without archiving
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    expect(screen.queryByText(/archive chat\?/i)).toBeNull();
    expect(mockArchive).not.toHaveBeenCalled();

    // Open dialog again and click confirm
    fireEvent.click(archiveButton);
    const confirmButton = screen.getByRole('button', { name: /confirm archive/i });
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    expect(mockArchive).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/archive chat\?/i)).toBeNull();
  });

  it('renders View Archive button when archivedAt is present and calls onOpenArchive', () => {
    const mockOpenArchive = vi.fn();
    render(
      <Header
        archivedAt="2026-09-22T10:00:00.000Z"
        onOpenArchive={mockOpenArchive}
      />
    );

    const viewArchiveButton = screen.getByRole('button', { name: /view archive/i });
    expect(viewArchiveButton).toBeInTheDocument();

    fireEvent.click(viewArchiveButton);
    expect(mockOpenArchive).toHaveBeenCalledTimes(1);
  });

  it('respects partner.is_online boolean directly without depending on timestamps', () => {
    // Partner has an old last_seen (e.g. clock skew) but is_online is true
    render(
      <Header
        partner={{
          id: 'partner-1',
          username: 'sweetheart',
          display_name: 'Sweetheart',
          last_seen: '2020-01-01T00:00:00.000Z',
          is_online: true,
        }}
        isConnected={true}
      />
    );

    expect(screen.getByTestId('partner-online-indicator')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('respects partner.is_typing boolean directly without depending on timestamps', () => {
    render(
      <Header
        partner={{
          id: 'partner-1',
          username: 'sweetheart',
          display_name: 'Sweetheart',
          is_typing: true,
        }}
        isConnected={true}
      />
    );

    expect(screen.getByTestId('partner-typing')).toBeInTheDocument();
    expect(screen.getByText('typing...')).toBeInTheDocument();
  });
});

describe('ArchiveModal Component', () => {
  const mockMessages: Message[] = [
    {
      id: 'msg-old-1',
      sender: 'partner-1',
      text: 'Remember when we met?',
      created: '2026-09-20T10:00:00Z',
    },
    {
      id: 'msg-old-2',
      sender: 'user-1',
      text: 'Yes, of course!',
      created: '2026-09-20T10:05:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ArchiveModal
        isOpen={false}
        onClose={vi.fn()}
        archivedAt="2026-09-22T10:00:00Z"
        messages={mockMessages}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders read-only archived messages and close button when open', () => {
    const mockClose = vi.fn();
    render(
      <ArchiveModal
        isOpen={true}
        onClose={mockClose}
        archivedAt="2026-09-22T10:00:00Z"
        messages={mockMessages}
        currentUserId="user-1"
      />
    );

    expect(screen.getByText(/archived messages/i)).toBeInTheDocument();
    expect(screen.getByText('Remember when we met?')).toBeInTheDocument();
    expect(screen.getByText('Yes, of course!')).toBeInTheDocument();

    // Close button triggers onClose
    const closeBtn = screen.getByRole('button', { name: /close archive/i });
    fireEvent.click(closeBtn);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('restoring history calls onRestore callback', async () => {
    const mockRestore = vi.fn();
    const mockClose = vi.fn();

    render(
      <ArchiveModal
        isOpen={true}
        onClose={mockClose}
        archivedAt="2026-09-22T10:00:00Z"
        onRestore={mockRestore}
        messages={mockMessages}
      />
    );

    const restoreButton = screen.getByRole('button', { name: /restore history/i });
    expect(restoreButton).toBeInTheDocument();
    expect(screen.getByText('unarchive')).toHaveClass('material-symbols-rounded');

    await act(async () => {
      fireEvent.click(restoreButton);
    });

    expect(mockRestore).toHaveBeenCalledTimes(1);
  });

  it('restoring history resets archived_at to empty string via PocketBase when onRestore omitted', async () => {
    const updateSpy = vi.fn().mockResolvedValue({ id: 'settings_1', archived_at: '' });
    (pb.collection as any).mockReturnValue({
      getFullList: vi.fn().mockResolvedValue([{ id: 'settings_1', archived_at: '2026-09-22T10:00:00Z' }]),
      update: updateSpy,
    });

    const mockClose = vi.fn();
    render(
      <ArchiveModal
        isOpen={true}
        onClose={mockClose}
        archivedAt="2026-09-22T10:00:00Z"
        messages={mockMessages}
      />
    );

    const restoreButton = screen.getByRole('button', { name: /restore history/i });
    await act(async () => {
      fireEvent.click(restoreButton);
    });

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('settings_1', { archived_at: '' });
    });
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
