import { useState, useEffect, useCallback } from 'react';
import { Icon } from './Icon';
import { MessageBubble, type Message } from './MessageBubble';
import { pb } from '../lib/pocketbase';

export interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  archivedAt?: string | null;
  onRestore?: () => void | Promise<void>;
  currentUserId?: string;
  messages?: Message[];
  className?: string;
}

export function ArchiveModal({
  isOpen,
  onClose,
  archivedAt,
  onRestore,
  currentUserId,
  messages: propMessages,
  className = '',
}: ArchiveModalProps) {
  const [archivedMessages, setArchivedMessages] = useState<Message[]>(propMessages || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  // Sync prop messages when provided
  useEffect(() => {
    if (propMessages) {
      setArchivedMessages(propMessages);
    }
  }, [propMessages]);

  // Fetch historical messages from PocketBase if not passed as prop
  useEffect(() => {
    if (!isOpen || propMessages !== undefined) return;

    let isMounted = true;
    const fetchArchive = async () => {
      setIsLoading(true);
      try {
        const filter = archivedAt ? `created < "${archivedAt}"` : '';
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

    return () => {
      isMounted = false;
    };
  }, [isOpen, archivedAt, propMessages]);

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

  if (!isOpen) {
    return null;
  }

  const messagesToDisplay = propMessages ?? archivedMessages;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Archived Messages"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 sm:p-6 select-none"
    >
      <div
        className={`flex flex-col h-[85vh] max-h-[720px] w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden ${className}`}
      >
        {/* Modal Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-4">
          <div className="flex items-center gap-2">
            <Icon name="archive" className="text-lg text-zinc-300" />
            <h2 className="text-sm font-semibold tracking-wide text-white">
              Archived Messages
            </h2>
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
              Read-Only
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Restore History Button */}
            <button
              type="button"
              onClick={handleRestore}
              disabled={isRestoring}
              aria-label="Restore history"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Icon name="unarchive" className="text-base text-zinc-200" />
              <span>{isRestoring ? 'Restoring...' : 'Restore History'}</span>
            </button>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close archive"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <Icon name="close" className="text-xl" />
            </button>
          </div>
        </header>

        {/* Modal Content / Message Thread */}
        <div
          data-testid="archive-messages"
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-xs text-zinc-500">
              <span>Loading archive...</span>
            </div>
          ) : messagesToDisplay.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-zinc-500">
              <span>No archived messages found.</span>
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
