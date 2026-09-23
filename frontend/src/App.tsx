import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';
import { LiveMessageThread } from './components/MessageThread';
import { MessageComposer } from './components/MessageComposer';
import { Header, type PartnerInfo } from './components/Header';
import { ArchiveModal } from './components/ArchiveModal';
import { pb } from './lib/pocketbase';

function AuthenticatedApp() {
  const { user, logout } = useAuth();
  const [partner, setPartner] = useState<PartnerInfo | null>(null);
  const [chatSettingsRecordId, setChatSettingsRecordId] = useState<string | null>(null);
  const [archivedAt, setArchivedAt] = useState<string | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);

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

  // Periodic tick to re-evaluate partner online status smoothly
  const [, setPresenceTick] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => setPresenceTick((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  // User presence heartbeat (updates last_seen on users collection)
  useEffect(() => {
    if (!user) return;

    const sendHeartbeat = async (isOffline = false) => {
      try {
        const timestamp = isOffline
          ? new Date(Date.now() - 60000).toISOString()
          : new Date().toISOString();
        await pb.collection('users').update(user.id, { last_seen: timestamp });
      } catch (_) {}
    };

    sendHeartbeat(false);

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        sendHeartbeat(false);
      }
    }, 20000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat(false);
      } else {
        sendHeartbeat(true);
      }
    };

    const handleUnload = () => {
      sendHeartbeat(true);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [user]);

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
    const nowIso = new Date().toISOString();
    try {
      if (chatSettingsRecordId) {
        await pb.collection('chat_settings').update(chatSettingsRecordId, {
          archived_at: nowIso,
        });
      } else {
        const settings = await pb.collection('chat_settings').getFullList();
        if (settings[0]) {
          setChatSettingsRecordId(settings[0].id);
          await pb.collection('chat_settings').update(settings[0].id, {
            archived_at: nowIso,
          });
        }
      }
      setArchivedAt(nowIso);
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

  if (!user) {
    return <LoginView />;
  }

  const isPartnerOnline = Boolean(
    partner?.last_seen &&
    Date.now() - new Date(partner.last_seen).getTime() < 45000
  );

  return (
    <div className="flex h-dvh flex-col bg-black text-white">
      {/* Persistent Top Header */}
      <Header
        partner={partner}
        currentUser={user}
        isConnected={isConnected}
        isPartnerOnline={isPartnerOnline}
        archivedAt={archivedAt}
        onArchive={handleArchive}
        onOpenArchive={() => setIsArchiveModalOpen(true)}
        onLogout={logout}
      />

      {/* Main chat thread */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <LiveMessageThread archivedAt={archivedAt} className="flex-1" />
      </main>

      {/* Message Composer */}
      <footer className="shrink-0">
        <MessageComposer currentUserId={user.id} />
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
