import { useState, useCallback } from 'react';
import { Icon } from './Icon';
import { useAuth } from '../context/AuthContext';
import { pb } from '../lib/pocketbase';
import { parseDate } from '../utils/date';

export interface PartnerInfo {
  id: string;
  display_name?: string;
  username?: string;
  avatar?: string;
  last_seen?: string;
  typing_until?: string;
  [key: string]: any;
}

export interface CurrentUserInfo {
  id?: string;
  display_name?: string;
  username?: string;
  email?: string;
  [key: string]: any;
}

export interface HeaderProps {
  partner?: PartnerInfo | null;
  currentUser?: CurrentUserInfo | null;
  isConnected?: boolean;
  isPartnerOnline?: boolean;
  isPartnerTyping?: boolean;
  archivedAt?: string | null;
  onArchive?: () => void | Promise<void>;
  onOpenArchive?: () => void;
  onLogout?: () => void;
  className?: string;
}

export function Header({
  partner,
  currentUser: propCurrentUser,
  isConnected = true,
  isPartnerOnline,
  isPartnerTyping,
  archivedAt,
  onArchive,
  onOpenArchive,
  onLogout,
  className = '',
}: HeaderProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [isArchiving, setIsArchiving] = useState<boolean>(false);

  // Safe fallback to AuthContext when props are omitted
  let authContextUser: any = null;
  let authContextLogout: (() => void) | null = null;
  try {
    const auth = useAuth();
    authContextUser = auth.user;
    authContextLogout = auth.logout;
  } catch (_) {
    // AuthContext may not be provided in isolated component tests
  }

  const currentUser = propCurrentUser ?? authContextUser;

  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout();
    } else if (authContextLogout) {
      authContextLogout();
    }
  }, [onLogout, authContextLogout]);

  const handleConfirmArchive = useCallback(async () => {
    setIsArchiving(true);
    try {
      if (onArchive) {
        await onArchive();
      } else {
        const settings = await pb.collection('chat_settings').getFullList();
        if (settings[0]) {
          await pb.collection('chat_settings').update(settings[0].id, {
            archived_at: new Date().toISOString(),
          });
        }
      }
      setIsConfirmOpen(false);
    } catch (err) {
      console.error('Failed to archive chat:', err);
    } finally {
      setIsArchiving(false);
    }
  }, [onArchive]);

  const partnerName = partner?.display_name || partner?.username || 'Partner';
  const partnerInitial = partnerName.charAt(0).toUpperCase() || 'P';

  const partnerAvatarUrl = partner?.avatar && partner?.id
    ? (typeof pb.files?.getURL === 'function'
        ? pb.files.getURL(partner as any, partner.avatar)
        : `${pb.baseUrl || ''}/api/files/users/${partner.id}/${partner.avatar}`)
    : null;

  // Check if partner is online (last_seen within 25s)
  const lastSeenMs = parseDate(partner?.last_seen);
  const isOnline = isPartnerOnline !== undefined
    ? isPartnerOnline
    : Boolean(lastSeenMs > 0 && Date.now() - lastSeenMs < 25000);

  // Check if partner is typing (typing_until is in the future)
  const typingUntilMs = parseDate(partner?.typing_until);
  const isTyping = isPartnerTyping !== undefined
    ? isPartnerTyping
    : Boolean(typingUntilMs > 0 && typingUntilMs > Date.now());

  return (
    <>
      <header
        className={`flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 select-none ${className}`}
      >
        {/* Left: Partner info & Online status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            {partnerAvatarUrl ? (
              <img
                src={partnerAvatarUrl}
                alt={partnerName}
                className="h-8 w-8 rounded-full object-cover border border-zinc-800"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200">
                {partnerInitial}
              </div>
            )}
            {/* Green indicator dot only when partner is verified online */}
            {isOnline && (
              <span
                data-testid="partner-online-indicator"
                title="Online"
                className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-zinc-950 bg-emerald-500"
              />
            )}
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-white tracking-tight truncate max-w-[120px] sm:max-w-[180px]">
              {partnerName}
            </span>
            {!isConnected ? (
              <span
                data-testid="connection-indicator"
                className="flex items-center gap-1 text-[10px] text-amber-400 font-medium"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Offline
              </span>
            ) : isTyping ? (
              <span
                data-testid="partner-typing"
                className="text-[10px] text-emerald-400 font-medium animate-pulse"
              >
                typing...
              </span>
            ) : (
              <span
                data-testid="partner-status"
                className={`text-[10px] ${isOnline ? 'text-zinc-400' : 'text-zinc-500'}`}
              >
                {isOnline ? 'Online' : 'Offline'}
              </span>
            )}
          </div>
        </div>

        {/* Center: Brand (on medium+ screens) */}
        <div className="hidden md:flex items-center gap-1.5 text-zinc-500 text-xs">
          <Icon name="chat" className="text-base text-zinc-600" />
          <span className="font-semibold tracking-wider uppercase text-[11px] text-zinc-400">
            wingfucat
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {currentUser && (
            <span className="hidden lg:inline text-xs text-zinc-400 mr-1">
              {currentUser.display_name || currentUser.username || currentUser.email}
            </span>
          )}

          {/* View Archive button (visible when chat has an active archive boundary) */}
          {archivedAt && onOpenArchive && (
            <button
              type="button"
              onClick={onOpenArchive}
              aria-label="View archive"
              className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-600 hover:text-white transition-colors cursor-pointer"
            >
              <Icon name="archive" className="text-base" />
              <span className="hidden sm:inline">View Archive</span>
            </button>
          )}

          {/* Archive chat button */}
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            aria-label="Archive chat"
            className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors cursor-pointer"
          >
            <Icon name="archive" className="text-base" />
            <span className="hidden sm:inline">Archive</span>
          </button>

          {/* Prominent Log Out button for fast, safe exit */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors cursor-pointer"
          >
            <Icon name="logout" className="text-base" />
            <span>Log out</span>
          </button>
        </div>
      </header>

      {/* Archive Confirmation Dialog */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Icon name="archive" className="text-xl text-zinc-300" />
              <h2 className="text-sm font-semibold tracking-wide">Archive Chat?</h2>
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">
              Active thread will be cleared. You can view or restore historical messages anytime from the archive browser.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isArchiving}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                disabled={isArchiving}
                aria-label="Confirm archive"
                className="flex items-center gap-1 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Icon name="archive" className="text-base" />
                <span>{isArchiving ? 'Archiving...' : 'Confirm Archive'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
