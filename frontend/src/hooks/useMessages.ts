import { useState, useEffect, useRef, useCallback } from 'react';
import type { RecordSubscription } from 'pocketbase';
import { pb } from '../lib/pocketbase';
import type { Message } from '../components/MessageBubble';
import { parseDate, toPocketBaseDate } from '../utils/date';

export interface UseMessagesOptions {
  archivedAt?: string | null;
  currentUserId?: string;
  autoMarkRead?: boolean;
  enabled?: boolean;
}

export interface UseMessagesResult {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (text: string) => Promise<Message>;
  markAsRead: (messageId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useMessages(options: UseMessagesOptions = {}): UseMessagesResult {
  const { archivedAt: explicitArchivedAt, currentUserId: explicitUserId, autoMarkRead = true, enabled = true } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  // Derive active current user id
  const currentUserId = explicitUserId ?? pb.authStore.record?.id ?? null;

  // Track in-flight read receipt requests to avoid duplicate parallel updates
  const inFlightReadIds = useRef<Set<string>>(new Set());

  // Ref to always access latest messages without recreating callbacks/listeners
  const messagesRef = useRef<Message[]>(messages);
  messagesRef.current = messages;

  const currentUserIdRef = useRef<string | null>(currentUserId);
  currentUserIdRef.current = currentUserId;

  // Mark a specific message as read (ONLY sends read_at to adhere to DB security rule)
  const markAsRead = useCallback(async (messageId: string): Promise<void> => {
    if (inFlightReadIds.current.has(messageId)) return;
    inFlightReadIds.current.add(messageId);

    const nowIso = new Date().toISOString();
    try {
      await pb.collection('messages').update(messageId, {
        read_at: nowIso,
      });

      // Optimistically update message in local state
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, read_at: nowIso } : m))
      );
    } catch (err) {
      inFlightReadIds.current.delete(messageId);
      console.error(`Failed to mark message ${messageId} as read:`, err);
    }
  }, []);

  // Mark all unread partner messages in the given list as read if window is visible
  const checkAndMarkUnread = useCallback(
    (msgs: Message[]) => {
      if (!autoMarkRead) return;
      const uid = currentUserIdRef.current;
      if (!uid) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

      const unreadPartnerMsgs = msgs.filter((m) => m.sender !== uid && !m.read_at);
      if (unreadPartnerMsgs.length > 0) {
        // Process sequentially to avoid concurrent burst fan-out and render churn
        (async () => {
          for (const msg of unreadPartnerMsgs) {
            await markAsRead(msg.id);
          }
        })();
      }
    },
    [autoMarkRead, markAsRead]
  );

  // Fetch messages from PocketBase with archive filtering
  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let resolvedArchivedAt = explicitArchivedAt;

      // If archivedAt was not explicitly provided in options, check chat_settings
      if (resolvedArchivedAt === undefined) {
        try {
          const settings = await pb.collection('chat_settings').getFullList();
          resolvedArchivedAt = settings[0]?.archived_at || null;
        } catch (_) {
          resolvedArchivedAt = null;
        }
      }

      const pbArchivedAt = resolvedArchivedAt ? toPocketBaseDate(resolvedArchivedAt) : '';
      const filter = pbArchivedAt ? `created > "${pbArchivedAt}"` : '';
      const records = await pb.collection('messages').getFullList<Message>({
        filter,
        sort: 'created',
      });

      setMessages(records);
      checkAndMarkUnread(records);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [explicitArchivedAt, checkAndMarkUnread]);

  // Initial load
  useEffect(() => {
    if (!enabled) return;
    fetchMessages();
  }, [enabled, fetchMessages]);

  // Realtime SSE subscription
  useEffect(() => {
    if (!enabled) return;
    let isSubscribed = true;

    const subPromise = pb.collection('messages').subscribe<Message>('*', (e: RecordSubscription<Message>) => {
      if (!isSubscribed) return;

      if (e.action === 'create') {
        // Apply archive filter if set using numerical epoch comparison
        if (explicitArchivedAt && parseDate(e.record.created) <= parseDate(explicitArchivedAt)) {
          return;
        }

        setMessages((prev) => {
          if (prev.some((m) => m.id === e.record.id)) {
            return prev;
          }
          return [...prev, e.record];
        });

        // If partner message arrived while viewing, mark read immediately
        const uid = currentUserIdRef.current;
        if (
          autoMarkRead &&
          uid &&
          e.record.sender !== uid &&
          !e.record.read_at &&
          typeof document !== 'undefined' &&
          document.visibilityState === 'visible'
        ) {
          markAsRead(e.record.id);
        }
      } else if (e.action === 'update') {
        setMessages((prev) =>
          prev.map((m) => (m.id === e.record.id ? { ...m, ...e.record } : m))
        );
      } else if (e.action === 'delete') {
        setMessages((prev) => prev.filter((m) => m.id !== e.record.id));
      }
    }).catch((err) => {
      console.error('Failed to subscribe to realtime messages:', err);
      return null;
    });

    return () => {
      isSubscribed = false;
      subPromise.then((unsub) => {
        if (typeof unsub === 'function') {
          unsub();
        }
      }).catch(() => {});
      pb.collection('messages').unsubscribe('*').catch(() => {});
    };
  }, [enabled, explicitArchivedAt, autoMarkRead, markAsRead]);

  // Window visibility & focus listener for read receipts
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkAndMarkUnread(messagesRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [checkAndMarkUnread]);

  // Send message helper
  const sendMessage = useCallback(
    async (text: string): Promise<Message> => {
      const uid = currentUserIdRef.current;
      if (!uid) {
        throw new Error('User must be authenticated to send messages');
      }

      const createdRecord = await pb.collection('messages').create<Message>({
        sender: uid,
        text: text.trim(),
        media_type: 'text',
      });

      return createdRecord;
    },
    []
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
  };
}

export default useMessages;
