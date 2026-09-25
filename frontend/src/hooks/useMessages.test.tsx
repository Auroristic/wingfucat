import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMessages } from './useMessages';
import { pb } from '../lib/pocketbase';
import type { Message } from '../components/MessageBubble';

describe('useMessages hook', () => {
  const mockCurrentUser = { id: 'usr_me', username: 'me' };
  let mockSubscribeCallback: ((data: any) => void) | null = null;
  let unsubscribeMock: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockSubscribeCallback = null;
    unsubscribeMock = vi.fn().mockResolvedValue(undefined);

    // Default mock auth record
    pb.authStore.save('test-token', mockCurrentUser as any);

    // Mock pb.collection('messages')
    vi.spyOn(pb.collection('messages'), 'getFullList').mockResolvedValue([] as any);
    vi.spyOn(pb.collection('messages'), 'subscribe').mockImplementation((_topic: string, callback: any) => {
      mockSubscribeCallback = callback;
      return Promise.resolve(unsubscribeMock);
    });
    vi.spyOn(pb.collection('messages'), 'unsubscribe').mockResolvedValue(undefined);
    vi.spyOn(pb.collection('messages'), 'update').mockResolvedValue({} as any);

    // Mock pb.collection('chat_settings')
    vi.spyOn(pb.collection('chat_settings'), 'getFullList').mockResolvedValue([
      { id: 'settings_1', archived_at: '' }
    ] as any);
    vi.spyOn(pb.collection('chat_settings'), 'subscribe').mockResolvedValue(vi.fn());
    vi.spyOn(pb.collection('chat_settings'), 'unsubscribe').mockResolvedValue(undefined);
  });

  afterEach(() => {
    pb.authStore.clear();
  });

  it('fetches messages on mount with correct archive filter', async () => {
    const mockMessages: Message[] = [
      { id: 'msg_1', sender: 'usr_partner', text: 'Hello', created: '2026-09-22T10:00:00Z', read_at: '2026-09-22T10:01:00Z' },
      { id: 'msg_2', sender: 'usr_me', text: 'Hey!', created: '2026-09-22T10:02:00Z', read_at: null },
    ];

    vi.spyOn(pb.collection('messages'), 'getFullList').mockResolvedValueOnce(mockMessages as any);

    const { result } = renderHook(() => useMessages({ archivedAt: null }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.messages).toHaveLength(2);
    });

    expect(pb.collection('messages').getFullList).toHaveBeenCalledWith({
      filter: '',
      sort: 'created',
    });
  });

  it('applies archive filter when archivedAt timestamp is present', async () => {
    const archivedTimestamp = '2026-09-22T12:00:00.000Z';
    const { result } = renderHook(() => useMessages({ archivedAt: archivedTimestamp }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(pb.collection('messages').getFullList).toHaveBeenCalledWith({
      filter: 'created > "2026-09-22 12:00:00.000Z"',
      sort: 'created',
    });
  });

  it('subscribes to realtime messages and appends new messages on "create"', async () => {
    const { result } = renderHook(() => useMessages({ currentUserId: 'usr_me' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(pb.collection('messages').subscribe).toHaveBeenCalledWith('*', expect.any(Function));

    const newMsg: Message = {
      id: 'msg_new',
      sender: 'usr_me',
      text: 'Newly sent message',
      created: '2026-09-22T12:05:00Z',
      read_at: null,
    };

    act(() => {
      mockSubscribeCallback?.({
        action: 'create',
        record: newMsg,
      });
    });

    expect(result.current.messages).toContainEqual(newMsg);
  });

  it('updates existing message in state on "update" event', async () => {
    const initialMsg: Message = {
      id: 'msg_1',
      sender: 'usr_me',
      text: 'My message',
      created: '2026-09-22T10:00:00Z',
      read_at: null,
    };

    vi.spyOn(pb.collection('messages'), 'getFullList').mockResolvedValueOnce([initialMsg] as any);

    const { result } = renderHook(() => useMessages({ currentUserId: 'usr_me' }));

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });

    const updatedMsg: Message = {
      ...initialMsg,
      read_at: '2026-09-22T10:05:00Z',
    };

    act(() => {
      mockSubscribeCallback?.({
        action: 'update',
        record: updatedMsg,
      });
    });

    expect(result.current.messages[0].read_at).toBe('2026-09-22T10:05:00Z');
  });

  it('automatically marks unread partner messages as read and adheres strictly to security rule', async () => {
    const updateSpy = vi.spyOn(pb.collection('messages'), 'update').mockResolvedValue({} as any);

    const partnerMsg: Message = {
      id: 'msg_partner_1',
      sender: 'usr_partner',
      text: 'Hey are you there?',
      created: '2026-09-22T10:00:00Z',
      read_at: null,
    };

    vi.spyOn(pb.collection('messages'), 'getFullList').mockResolvedValueOnce([partnerMsg] as any);

    renderHook(() => useMessages({ currentUserId: 'usr_me' }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        'msg_partner_1',
        expect.objectContaining({
          read_at: expect.any(String),
        })
      );
    });

    // SECURITY VERIFICATION: Verify payload ONLY contains read_at
    const callArgs = updateSpy.mock.calls[0];
    expect(callArgs[0]).toBe('msg_partner_1');
    expect(Object.keys(callArgs[1] as Record<string, any>)).toEqual(['read_at']);
  });

  it('does NOT mark own unread messages as read', async () => {
    const updateSpy = vi.spyOn(pb.collection('messages'), 'update');

    const ownMsg: Message = {
      id: 'msg_own_1',
      sender: 'usr_me',
      text: 'My own message',
      created: '2026-09-22T10:00:00Z',
      read_at: null,
    };

    vi.spyOn(pb.collection('messages'), 'getFullList').mockResolvedValueOnce([ownMsg] as any);

    renderHook(() => useMessages({ currentUserId: 'usr_me' }));

    await waitFor(() => {
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  it('unsubscribes from realtime subscription on unmount', async () => {
    const { unmount, result } = renderHook(() => useMessages({ currentUserId: 'usr_me' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    unmount();

    await waitFor(() => {
      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  it('does not fetch or subscribe when enabled is false', async () => {
    const getFullListSpy = vi.spyOn(pb.collection('messages'), 'getFullList');
    const subscribeSpy = vi.spyOn(pb.collection('messages'), 'subscribe');

    const { result } = renderHook(() => useMessages({ enabled: false }));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.messages).toEqual([]);
    expect(getFullListSpy).not.toHaveBeenCalled();
    expect(subscribeSpy).not.toHaveBeenCalled();
  });
});
