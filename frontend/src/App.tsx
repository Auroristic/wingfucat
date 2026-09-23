import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';
import { LiveMessageThread } from './components/MessageThread';
import { MessageComposer } from './components/MessageComposer';
import { Header, type PartnerInfo } from './components/Header';
import { ArchiveModal } from './components/ArchiveModal';
import { pb } from './lib/pocketbase';
import { parseDate, toPocketBaseDate } from './utils/date';

function AuthenticatedApp() {
  const { user, logout } = useAuth();
  const [partner, setPartner] = useState<PartnerInfo | null>(null);
  const [chatSettingsRecordId, setChatSettingsRecordId] = useState<string | null>(null);
  const [archivedAt, setArchivedAt] = useState<string | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isPartnerTypingExpired, setIsPartnerTypingExpired] = useState<boolean>(false);

  // Local timestamp when partner update/heartbeat was last received on this device
  const partnerLastReceivedRef = useRef<number>(0);
  const typingTimeoutRef = useRef<any>(null);

  // Monitor network connectivity
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      setIsConnected(navigator.onLine);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Periodic tick every 4s to re-evaluate partner online & typing status smoothly
  const [, setPresenceTick] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => setPresenceTick((t) => t + 1), 4000);
    return () => clearInterval(timer);
  }, []);

  // User presence heartbeat (updates is_online and last_seen on users collection)
  useEffect(() => {
    if (!user) return;

    let heartbeatTimer: any = null;

    const sendHeartbeat = async (isActive = true) => {
      try {
        const timestamp = isActive ? new Date().toISOString() : '';
        await pb.collection('users').update(user.id, {
          is_online: isActive,
          last_seen: timestamp,
          ...(isActive ? {} : { is_typing: false, typing_until: '' }),
        });
      } catch (_) {}
    };

    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      sendHeartbeat(true);
    }

    heartbeatTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        sendHeartbeat(true);
      }
    }, 12000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat(true);
      } else {
        sendHeartbeat(false);
      }
    };

    const handlePageHide = () => {
      sendHeartbeat(false);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      clearInterval(heartbeatTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      sendHeartbeat(false);
    };
  }, [user]);

  // Handle typing state broadcast with sender-side auto-reset
  const handleTyping = useCallback(
    async (isTyping: boolean) => {
      if (!user) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      try {
        if (isTyping) {
          await pb.collection('users').update(user.id, {
            is_typing: true,
            typing_until: new Date(Date.now() + 4000).toISOString(),
          });

          // Automatically clear typing state after 3.5s of typing inactivity
          typingTimeoutRef.current = setTimeout(async () => {
            try {
              await pb.collection('users').update(user.id, {
                is_typing: false,
                typing_until: '',
              });
            } catch (_) {}
          }, 3500);
        } else {
          await pb.collection('users').update(user.id, {
            is_typing: false,
            typing_until: '',
          });
        }
      } catch (_) {}
    },
    [user]
  );

  // Receiver safety timer: auto-clear partner typing after 4.5s if not refreshed
  useEffect(() => {
    if (partner?.is_typing) {
      setIsPartnerTypingExpired(false);
      const timer = setTimeout(() => {
        setIsPartnerTypingExpired(true);
      }, 4500);
      return () => clearTimeout(timer);
    } else {
      setIsPartnerTypingExpired(false);
    }
  }, [partner?.is_typing, partner?.updated]);

  // Fetch partner info and chat_settings
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    // Fetch partner (other user in users collection)
    const fetchPartner = async () => {
      try {
        const users = await pb.collection('users').getFullList<PartnerInfo>();
        const partnerUser = users.find((u) => u.id !== user.id);
        if (isMounted && partnerUser) {
          const lastSeenMs = parseDate(partnerUser.last_seen);
          if (lastSeenMs > 0 && Math.abs(Date.now() - lastSeenMs) < 60000) {
            partnerLastReceivedRef.current = Date.now();
          } else {
            partnerLastReceivedRef.current = 0;
          }
          setPartner(partnerUser);
        }
      } catch (_) {
        // PocketBase may be unreachable in disconnected / test environment
      }
    };

    // Fetch chat_settings
    const fetchSettings = async () => {
      try {
        const settings = await pb.collection('chat_settings').getFullList();
        if (isMounted && settings.length > 0) {
          setChatSettingsRecordId(settings[0].id);
          setArchivedAt(settings[0].archived_at || '');
        }
      } catch (_) {
        // PocketBase may be unreachable in disconnected / test environment
      }
    };

    fetchPartner();
    fetchSettings();

    // Subscribe to partner user record changes for real-time presence
    let unsubUsersPromise: Promise<any> | null = null;
    try {
      unsubUsersPromise = pb.collection('users').subscribe<PartnerInfo>('*', (e) => {
        if (!isMounted) return;
        if (e.action === 'update' && e.record.id !== user.id) {
          partnerLastReceivedRef.current = Date.now();
          setPartner(e.record);
        }
      });
      unsubUsersPromise.catch(() => {});
    } catch (_) {}

    // Subscribe to chat_settings realtime changes
    let unsubPromise: Promise<any> | null = null;
    try {
      unsubPromise = pb.collection('chat_settings').subscribe('*', (e) => {
        if (!isMounted) return;
        if (e.action === 'create' || e.action === 'update') {
          setChatSettingsRecordId(e.record.id);
          setArchivedAt(e.record.archived_at || '');
        }
      });
      unsubPromise.catch(() => {});
    } catch (_) {}

    return () => {
      isMounted = false;
      pb.collection('users').unsubscribe('*').catch(() => {});
      pb.collection('chat_settings').unsubscribe('*').catch(() => {});
    };
  }, [user]);

  const handleArchive = useCallback(async () => {
    const nowPbDate = toPocketBaseDate(new Date());
    try {
      if (chatSettingsRecordId) {
        await pb.collection('chat_settings').update(chatSettingsRecordId, {
          archived_at: nowPbDate,
        });
      } else {
        const settings = await pb.collection('chat_settings').getFullList();
        if (settings[0]) {
          setChatSettingsRecordId(settings[0].id);
          await pb.collection('chat_settings').update(settings[0].id, {
            archived_at: nowPbDate,
          });
        }
      }
      setArchivedAt(nowPbDate);
    } catch (err) {
      console.error('Failed to archive chat:', err);
    }
  }, [chatSettingsRecordId]);

  const handleRestore = useCallback(async () => {
    try {
      if (chatSettingsRecordId) {
        await pb.collection('chat_settings').update(chatSettingsRecordId, {
          archived_at: '',
        });
      } else {
        const settings = await pb.collection('chat_settings').getFullList();
        if (settings[0]) {
          setChatSettingsRecordId(settings[0].id);
          await pb.collection('chat_settings').update(settings[0].id, {
            archived_at: '',
          });
        }
      }
      setArchivedAt('');
    } catch (err) {
      console.error('Failed to restore chat:', err);
    }
  }, [chatSettingsRecordId]);

  const handleLogout = useCallback(async () => {
    if (user) {
      try {
        await pb.collection('users').update(user.id, {
          is_online: false,
          is_typing: false,
          typing_until: '',
        });
      } catch (_) {}
    }
    logout();
  }, [user, logout]);

  if (!user) {
    return <LoginView />;
  }

  const isPartnerOnline = (() => {
    if (!partner) return false;
    if (partner.is_online === false) return false;
    if (partner.is_online === true) {
      if (partnerLastReceivedRef.current > 0 && Date.now() - partnerLastReceivedRef.current < 40000) {
        return true;
      }
      const lastSeenMs = parseDate(partner.last_seen);
      if (lastSeenMs > 0 && Math.abs(Date.now() - lastSeenMs) < 60000) {
        return true;
      }
      return false;
    }
    const lastSeenMs = parseDate(partner.last_seen);
    return Boolean(lastSeenMs > 0 && Date.now() - lastSeenMs < 25000);
  })();

  const typingUntilMs = parseDate(partner?.typing_until);
  const isPartnerTyping = partner?.is_typing !== undefined
    ? Boolean(partner.is_typing && !isPartnerTypingExpired)
    : Boolean(typingUntilMs > 0 && typingUntilMs > Date.now());

  return (
    <div className="flex h-dvh flex-col bg-black text-white">
      {/* Persistent Top Header */}
      <Header
        partner={partner}
        currentUser={user}
        isConnected={isConnected}
        isPartnerOnline={isPartnerOnline}
        isPartnerTyping={isPartnerTyping}
        archivedAt={archivedAt}
        onArchive={handleArchive}
        onOpenArchive={() => setIsArchiveModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main chat thread */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <LiveMessageThread
          archivedAt={archivedAt}
          isPartnerTyping={isPartnerTyping}
          className="flex-1"
        />
      </main>

      {/* Message Composer */}
      <footer className="shrink-0">
        <MessageComposer
          currentUserId={user.id}
          onTyping={handleTyping}
        />
      </footer>

      {/* Archive Viewer / Restore Modal */}
      <ArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        archivedAt={archivedAt}
        onRestore={handleRestore}
        currentUserId={user.id}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
