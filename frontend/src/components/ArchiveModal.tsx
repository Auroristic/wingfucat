import { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from './Icon';
import { MessageBubble, type Message } from './MessageBubble';
import { pb } from '../lib/pocketbase';
import { toPocketBaseDate } from '../utils/date';
import { useTheme } from '../context/ThemeContext';

export interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  archivedAt?: string | null;
  onRestore?: () => void | Promise<void>;
  onCleared?: () => void | Promise<void>;
  currentUserId?: string;
  messages?: Message[];
  className?: string;
}

export function ArchiveModal({
  isOpen,
  onClose,
  archivedAt,
  onRestore,
  onCleared,
  currentUserId,
  messages: propMessages,
  className = '',
}: ArchiveModalProps) {
  const [archivedMessages, setArchivedMessages] = useState<Message[]>(propMessages || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [confirmClearStep, setConfirmClearStep] = useState<'idle' | 'counting' | 'ready'>('idle');
  const [countdown, setCountdown] = useState<number>(0);
  const [clearError, setClearError] = useState<string | null>(null);

  let themeObj: any = null;
  try {
    const themeCtx = useTheme();
    themeObj = themeCtx.theme;
  } catch (_) {}
  const themeId = themeObj?.id || 'minimalist-oled';
  const isTui = themeId === 'terminal-tui';
  const isDaylight = themeId === 'daylight';

  // Sync prop messages when provided
  useEffect(() => {
    if (propMessages) {
      setArchivedMessages(propMessages);
    }
  }, [propMessages]);

  // Fetch historical messages from PocketBase if not passed as prop
  useEffect(() => {
    if (!isOpen || propMessages !== undefined) return;

    if (!archivedAt) {
      setArchivedMessages([]);
      return;
    }

    let isMounted = true;
    const fetchArchive = async () => {
      setIsLoading(true);
      try {
        const pbArchivedAt = toPocketBaseDate(archivedAt);
        const filter = `created < "${pbArchivedAt}"`;
        const records = await pb.collection('messages').getFullList<Message>({
          filter,
          sort: 'created',
        });
        if (isMounted) {
          setArchivedMessages(records);
        }
      } catch (err) {
        console.error('Failed to fetch archived messages:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchArchive();

    // Subscribe to PocketBase realtime delete events so modal stays synchronized
    let unsubscribe: (() => void) | null = null;
    pb.collection('messages').subscribe('*', (e) => {
      if (e.action === 'delete') {
        setArchivedMessages((prev) => prev.filter((m) => m.id !== e.record.id));
      }
    }).then((unsub) => {
      unsubscribe = unsub;
    }).catch(() => {});

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, archivedAt, propMessages]);

  // Reset confirmation state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmClearStep('idle');
      setCountdown(0);
      setClearError(null);
    }
  }, [isOpen]);

  // 3-second cooldown countdown timer
  useEffect(() => {
    if (confirmClearStep !== 'counting') return;
    if (countdown <= 0) {
      setConfirmClearStep('ready');
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [confirmClearStep, countdown]);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Escape key and mobile back gesture listener for modal accessibility
  useEffect(() => {
    if (!isOpen) return;

    let hasPushed = false;
    if (typeof window !== 'undefined') {
      window.history.pushState({ modal: 'archive' }, '');
      hasPushed = true;
    }

    const handlePopState = () => {
      hasPushed = false;
      onCloseRef.current();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      if (hasPushed && typeof window !== 'undefined' && window.history.state?.modal === 'archive') {
        window.history.back();
      }
    };
  }, [isOpen]);

  const handleRestore = useCallback(async () => {
    setIsRestoring(true);
    try {
      if (onRestore) {
        await onRestore();
      } else {
        const settings = await pb.collection('chat_settings').getFullList();
        if (settings && settings[0]) {
          await pb.collection('chat_settings').update(settings[0].id, {
            archived_at: '',
          });
        }
      }
      onClose();
    } catch (err) {
      console.error('Failed to restore history:', err);
    } finally {
      setIsRestoring(false);
    }
  }, [onRestore, onClose]);

  const handleStartClear = () => {
    setConfirmClearStep('counting');
    setCountdown(3);
    setClearError(null);
  };

  const handleCancelClear = () => {
    setConfirmClearStep('idle');
    setCountdown(0);
    setClearError(null);
  };

  // Safe chunked batch deletion (groups of 50 via Promise.allSettled)
  const handleConfirmClear = async () => {
    setIsClearing(true);
    setClearError(null);
    try {
      const messagesToDelete = [...archivedMessages];
      const chunkSize = 50;
      let failedIds: string[] = [];

      for (let i = 0; i < messagesToDelete.length; i += chunkSize) {
        const chunk = messagesToDelete.slice(i, i + chunkSize);
        const results = await Promise.allSettled(
          chunk.map((msg) => pb.collection('messages').delete(msg.id))
        );
        results.forEach((res, idx) => {
          if (res.status === 'rejected') {
            failedIds.push(chunk[idx].id);
          }
        });
      }

      if (failedIds.length > 0) {
        setClearError(`Failed to delete ${failedIds.length} message(s). Click retry.`);
        setArchivedMessages((prev) => prev.filter((m) => failedIds.includes(m.id)));
      } else {
        // Clear archived_at timestamp on chat_settings
        const settings = await pb.collection('chat_settings').getFullList();
        if (settings && settings[0]) {
          await pb.collection('chat_settings').update(settings[0].id, {
            archived_at: '',
          });
        }
        setArchivedMessages([]);
        setConfirmClearStep('idle');
        if (onCleared) {
          await onCleared();
        }
      }
    } catch (err: any) {
      setClearError(err?.message || 'Failed to clear archive.');
    } finally {
      setIsClearing(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const messagesToDisplay = propMessages ?? archivedMessages;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Archived Messages"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 sm:p-6 select-none"
    >
      <div
        className={`flex flex-col h-[85vh] max-h-[720px] w-full max-w-2xl overflow-hidden shadow-2xl transition-all duration-200 ${
          isTui
            ? 'rounded-none border border-[#00ff41] bg-black text-[#00ff41] font-mono shadow-[0_0_24px_rgba(0,255,65,0.25)]'
            : isDaylight
            ? 'rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-xl'
            : 'rounded-2xl border border-white/20 bg-zinc-950/85 backdrop-blur-xl text-white shadow-2xl'
        } ${className}`}
      >
        {/* Modal Header */}
        <header
          className={`flex h-14 shrink-0 items-center justify-between px-4 border-b transition-colors ${
            isTui
              ? 'border-[#00ff41] bg-black text-[#00ff41]'
              : isDaylight
              ? 'border-zinc-200 bg-zinc-50/80 text-zinc-900'
              : 'border-white/10 bg-white/5 backdrop-blur-md text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon
              name="history"
              className={`text-lg ${isTui ? 'text-[#00ff41]' : isDaylight ? 'text-zinc-600' : 'text-zinc-300'}`}
            />
            <h2 className="text-sm font-semibold tracking-wide">
              {isTui ? '[ ARCHIVED MESSAGES ]' : 'Archived Messages'}
            </h2>
            <span
              className={`px-2 py-0.5 text-[10px] font-mono ${
                isTui
                  ? 'border border-[#00ff41]/50 text-[#00ff41] bg-black'
                  : isDaylight
                  ? 'rounded-md bg-zinc-200 text-zinc-700'
                  : 'rounded-md bg-zinc-800 text-zinc-400'
              }`}
            >
              {isTui ? 'READ_ONLY' : 'Read-Only'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Clear Archive Buttons (with 3s inline cooldown) */}
            {messagesToDisplay.length > 0 && (
              <>
                {confirmClearStep === 'idle' && (
                  <button
                    type="button"
                    onClick={handleStartClear}
                    disabled={isClearing || isRestoring}
                    aria-label="Clear archive"
                    title="Permanently wipe archived chat"
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer transition-all disabled:opacity-50 ${
                      isTui
                        ? 'rounded-none border border-[#ff0055] bg-black text-[#ff0055] hover:bg-[#ff0055] hover:text-black font-mono'
                        : isDaylight
                        ? 'rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                        : 'rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 backdrop-blur-md'
                    }`}
                  >
                    <Icon name="delete_sweep" className="text-base text-inherit" />
                    <span>{isTui ? '[ CLEAR ARCHIVE ]' : 'Clear Archive'}</span>
                  </button>
                )}

                {confirmClearStep === 'counting' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold cursor-not-allowed opacity-60 ${
                        isTui
                          ? 'rounded-none border border-[#ff0055] bg-black text-[#ff0055] font-mono'
                          : isDaylight
                          ? 'rounded-lg bg-red-100 text-red-700 border border-red-200'
                          : 'rounded-lg bg-red-500/20 text-red-200 border border-red-500/30'
                      }`}
                    >
                      <Icon name="hourglass_empty" className="text-sm animate-spin" />
                      <span>{isTui ? `[ COOLDOWN ${countdown}s ]` : `Wait (${countdown}s)...`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelClear}
                      className={`px-2 py-1.5 text-xs cursor-pointer ${
                        isTui
                          ? 'border border-[#00ff41] bg-black text-[#00ff41] font-mono hover:bg-[#00ff41]/20'
                          : 'rounded-lg border border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {confirmClearStep === 'ready' && (
                  <div className="flex items-center gap-1.5 animate-pulse">
                    <button
                      type="button"
                      onClick={handleConfirmClear}
                      disabled={isClearing}
                      aria-label="Confirm clear archive"
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold cursor-pointer transition-all ${
                        isTui
                          ? 'rounded-none border border-[#ff0055] bg-[#ff0055] text-black hover:bg-[#ff0055]/90 font-mono shadow-[0_0_12px_rgba(255,0,85,0.4)]'
                          : isDaylight
                          ? 'rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-md'
                          : 'rounded-lg bg-red-600 text-white hover:bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                      }`}
                    >
                      <Icon name="delete_forever" className="text-base text-inherit" />
                      <span>{isClearing ? 'Deleting...' : isTui ? '[ CONFIRM WIPE? ]' : 'Confirm Wipe Archive'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelClear}
                      disabled={isClearing}
                      className={`px-2 py-1.5 text-xs cursor-pointer ${
                        isTui
                          ? 'border border-[#00ff41] bg-black text-[#00ff41] font-mono hover:bg-[#00ff41]/20'
                          : 'rounded-lg border border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Restore History Button */}
            {confirmClearStep === 'idle' && (
              <button
                type="button"
                onClick={handleRestore}
                disabled={isRestoring || isClearing}
                aria-label="Restore history"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer transition-all disabled:opacity-50 ${
                  isTui
                    ? 'rounded-none border border-[#00ff41] bg-black text-[#00ff41] hover:bg-[#00ff41] hover:text-black font-mono'
                    : isDaylight
                    ? 'rounded-lg border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 shadow-xs'
                    : 'rounded-lg border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 hover:border-zinc-600'
                }`}
              >
                <Icon name="unarchive" className="text-base text-inherit" />
                <span>{isRestoring ? 'Restoring...' : isTui ? '[ RESTORE ]' : 'Restore History'}</span>
              </button>
            )}

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close archive"
              className={`flex h-8 w-8 items-center justify-center cursor-pointer transition-colors ${
                isTui
                  ? 'rounded-none border border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41] hover:text-black font-mono'
                  : isDaylight
                  ? 'rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                  : 'rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Icon name="close" className="text-xl" />
            </button>
          </div>
        </header>

        {/* Partial Clear Error Notice */}
        {clearError && (
          <div
            className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
              isTui
                ? 'border-[#ff0055] bg-black text-[#ff0055] font-mono'
                : 'border-red-900 bg-red-950/70 text-red-200'
            }`}
          >
            <span>{clearError}</span>
            <button
              type="button"
              onClick={handleConfirmClear}
              className="underline font-semibold cursor-pointer ml-2 hover:opacity-80"
            >
              Retry
            </button>
          </div>
        )}

        {/* Modal Content / Message Thread */}
        <div
          data-testid="archive-messages"
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {isLoading ? (
            <div
              className={`flex h-full items-center justify-center text-xs ${
                isTui ? 'text-[#00ff41] font-mono' : 'text-zinc-500'
              }`}
            >
              <span>{isTui ? '>>> LOADING ARCHIVE BUFFER...' : 'Loading archive...'}</span>
            </div>
          ) : messagesToDisplay.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 p-6 select-none">
              {isTui ? (
                <div className="flex flex-col items-center gap-2 font-mono text-[#00ff41]">
                  <Icon name="terminal" className="text-3xl" />
                  <span className="text-sm font-bold tracking-wider">[ ARCHIVE: EMPTY // 0 RECORDS ]</span>
                  <span className="text-xs text-[#00ff41]/60">System buffer clear. All archived logs purged.</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                      isDaylight ? 'bg-zinc-100 border-zinc-200 text-zinc-500' : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    <Icon name="inventory_2" className="text-2xl" />
                  </div>
                  <span
                    className={`text-sm font-semibold ${isDaylight ? 'text-zinc-800' : 'text-zinc-300'}`}
                  >
                    Archive is Empty
                  </span>
                  <span
                    className={`text-xs max-w-xs ${isDaylight ? 'text-zinc-500' : 'text-zinc-400'}`}
                  >
                    No archived messages found in history.
                  </span>
                </div>
              )}
            </div>
          ) : (
            messagesToDisplay.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                currentUserId={currentUserId}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ArchiveModal;

