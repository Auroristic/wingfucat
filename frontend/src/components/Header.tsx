import { useState, useCallback } from 'react';
import { Icon } from './Icon';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { pb } from '../lib/pocketbase';
import { parseDate, toPocketBaseDate } from '../utils/date';

export interface PartnerInfo {
  id: string;
  display_name?: string;
  username?: string;
  avatar?: string;
  last_seen?: string;
  typing_until?: string;
  is_online?: boolean;
  is_typing?: boolean;
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
  onOpenThemeSettings?: () => void;
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
  onOpenThemeSettings,
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
            archived_at: toPocketBaseDate(new Date()),
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

  // Check if partner is online
  const lastSeenMs = parseDate(partner?.last_seen);
  const isOnline = isPartnerOnline !== undefined
    ? isPartnerOnline
    : (partner?.is_online !== undefined
        ? Boolean(partner.is_online)
        : Boolean(lastSeenMs > 0 && Date.now() - lastSeenMs < 25000));

  // Check if partner is typing
  const typingUntilMs = parseDate(partner?.typing_until);
  const isTyping = isPartnerTyping !== undefined
    ? isPartnerTyping
    : (partner?.is_typing !== undefined
        ? Boolean(partner.is_typing)
        : Boolean(typingUntilMs > 0 && typingUntilMs > Date.now()));

  let themeObj: any = null;
  try {
    const themeCtx = useTheme();
    themeObj = themeCtx.theme;
  } catch (_) {}
  const themeId = themeObj?.id || 'minimalist-oled';

  const getHeaderButtonClasses = () => {
    if (themeId === 'terminal-tui') {
      return 'border border-[#00ff41] bg-black text-[#00ff41] hover:bg-[#00ff41] hover:text-black rounded-none font-mono tracking-wider shadow-[0_0_6px_rgba(0,255,65,0.2)] active:scale-95';
    }
    if (themeId === 'daylight') {
      return 'border border-zinc-200 bg-white/90 hover:bg-zinc-100 text-zinc-800 rounded-full shadow-xs backdrop-blur-md active:scale-95';
    }
    return 'border border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_2px_8px_rgba(0,0,0,0.25)] backdrop-blur-md active:scale-95';
  };

  return (
    <>
      <header
        className={`mx-3 sm:mx-4 mt-2 mb-1 flex h-14 shrink-0 items-center justify-between px-4 select-none rounded-2xl border transition-all duration-200 ${
          themeId === 'terminal-tui'
            ? 'border-[#00ff41] bg-black rounded-none shadow-[0_0_12px_rgba(0,255,65,0.25)]'
            : themeId === 'daylight'
            ? 'border-zinc-200 bg-white/95 text-zinc-900 shadow-xs backdrop-blur-md'
            : 'border-white/15 glass-pane'
        } ${className}`}
        style={{
          backgroundColor: themeId === 'terminal-tui' ? '#000000' : 'var(--theme-bg-glass)',
          borderColor: themeId === 'terminal-tui' ? '#00ff41' : 'var(--theme-border-subtle)',
        }}
      >
        {/* Left: Partner info & Online status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            {partnerAvatarUrl ? (
              <img
                src={partnerAvatarUrl}
                alt={partnerName}
                className={`h-8 w-8 object-cover ${
                  themeId === 'terminal-tui'
                    ? 'rounded-none border border-[#00ff41]'
                    : themeId === 'daylight'
                    ? 'rounded-full border border-zinc-200'
                    : 'rounded-full border border-white/20'
                }`}
              />
            ) : (
              <div
                className={`flex h-8 w-8 items-center justify-center text-xs font-semibold ${
                  themeId === 'terminal-tui'
                    ? 'rounded-none bg-black border border-[#00ff41] text-[#00ff41] font-mono'
                    : themeId === 'daylight'
                    ? 'rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800'
                    : 'rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-md'
                }`}
              >
                {partnerInitial}
              </div>
            )}
            {/* Green indicator dot only when partner is verified online */}
            {isOnline && (
              <span
                data-testid="partner-online-indicator"
                title="Online"
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 ${
                  themeId === 'terminal-tui'
                    ? 'rounded-none bg-[#00ff41] ring-1 ring-black'
                    : 'rounded-full bg-emerald-500 ring-2 ring-zinc-950'
                }`}
              />
            )}
          </div>

          <div className="flex flex-col leading-tight">
            <span
              className={`text-xs font-semibold tracking-tight truncate max-w-[120px] sm:max-w-[180px] ${
                themeId === 'terminal-tui'
                  ? 'text-[#00ff41] font-mono'
                  : themeId === 'daylight'
                  ? 'text-zinc-900'
                  : 'text-white'
              }`}
            >
              {partnerName}
            </span>
            {!isConnected ? (
              <span
                data-testid="connection-indicator"
                className={`flex items-center gap-1 text-[10px] font-medium ${
                  themeId === 'terminal-tui' ? 'text-amber-400 font-mono' : 'text-amber-400'
                }`}
              >
                <span className={`h-1.5 w-1.5 ${themeId === 'terminal-tui' ? 'rounded-none bg-amber-400' : 'rounded-full bg-amber-400'}`} />
                Offline
              </span>
            ) : isTyping ? (
              <span
                data-testid="partner-typing"
                className={`text-[10px] font-medium animate-pulse ${
                  themeId === 'terminal-tui' ? 'text-[#00ff41] font-mono' : 'text-emerald-400'
                }`}
              >
                typing...
              </span>
            ) : (
              <span
                data-testid="partner-status"
                className={`text-[10px] ${
                  themeId === 'terminal-tui'
                    ? 'text-[#00ff41]/70 font-mono'
                    : themeId === 'daylight'
                    ? 'text-zinc-500'
                    : isOnline
                    ? 'text-zinc-400'
                    : 'text-zinc-500'
                }`}
              >
                {isOnline ? 'Online' : 'Offline'}
              </span>
            )}
          </div>
        </div>

        {/* Center: Brand (on medium+ screens) */}
        <div
          className={`hidden md:flex items-center gap-1.5 text-xs ${
            themeId === 'terminal-tui'
              ? 'text-[#00ff41]/80 font-mono'
              : themeId === 'daylight'
              ? 'text-zinc-500'
              : 'text-zinc-400'
          }`}
        >
          <Icon
            name="terminal"
            className={`text-base ${themeId === 'terminal-tui' ? 'text-[#00ff41]' : 'text-zinc-500'}`}
          />
          <span className="font-semibold tracking-wider uppercase text-[11px]">
            wingfucat
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {currentUser && (
            <span
              className={`hidden lg:inline text-xs mr-1 ${
                themeId === 'terminal-tui'
                  ? 'text-[#00ff41]/80 font-mono'
                  : themeId === 'daylight'
                  ? 'text-zinc-500'
                  : 'text-zinc-400'
              }`}
            >
              {currentUser.display_name || currentUser.username || currentUser.email}
            </span>
          )}

          {/* View Archive button (visible when chat has an active archive boundary) */}
          {archivedAt && onOpenArchive && (
            <button
              type="button"
              onClick={onOpenArchive}
              aria-label="View archive"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium cursor-pointer transition-all ${getHeaderButtonClasses()}`}
            >
              <Icon name="archive" className="text-base text-inherit" />
              <span className="hidden sm:inline">View Archive</span>
            </button>
          )}

          {/* Theme Settings button */}
          {onOpenThemeSettings && (
            <button
              type="button"
              onClick={onOpenThemeSettings}
              aria-label="Appearance & Themes"
              title="Appearance & Themes"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium cursor-pointer transition-all ${getHeaderButtonClasses()}`}
            >
              <Icon name="palette" className="text-base text-inherit" />
              <span className="hidden sm:inline">Theme</span>
            </button>
          )}

          {/* Archive chat button */}
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            aria-label="Archive chat"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium cursor-pointer transition-all ${getHeaderButtonClasses()}`}
          >
            <Icon name="archive" className="text-base text-inherit" />
            <span className="hidden sm:inline">Archive</span>
          </button>

          {/* Prominent Log Out button for fast, safe exit */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium cursor-pointer transition-all ${getHeaderButtonClasses()}`}
          >
            <Icon name="logout" className="text-base text-inherit" />
            <span>Log out</span>
          </button>
        </div>
      </header>

      {/* Archive Confirmation Dialog */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div
            className={`w-full max-w-sm p-6 space-y-4 ${
              themeId === 'terminal-tui'
                ? 'rounded-none border border-[#00ff41] bg-black text-[#00ff41] font-mono shadow-[0_0_20px_rgba(0,255,65,0.3)]'
                : 'rounded-2xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon
                name="archive"
                className={`text-xl ${themeId === 'terminal-tui' ? 'text-[#00ff41]' : 'text-zinc-300'}`}
              />
              <h2 className="text-sm font-semibold tracking-wide">
                {themeId === 'terminal-tui' ? '[ ARCHIVE CHAT? ]' : 'Archive Chat?'}
              </h2>
            </div>
            <p
              className={`text-xs leading-relaxed ${
                themeId === 'terminal-tui' ? 'text-[#00ff41]/80 font-mono' : 'text-zinc-400'
              }`}
            >
              Active thread will be cleared. You can view or restore historical messages anytime from the archive browser.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isArchiving}
                className={`px-3.5 py-1.5 text-xs font-medium cursor-pointer disabled:opacity-50 transition-colors ${
                  themeId === 'terminal-tui'
                    ? 'rounded-none border border-[#00ff41] bg-black text-[#00ff41] hover:bg-[#00ff41]/20 font-mono'
                    : 'rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                disabled={isArchiving}
                aria-label="Confirm archive"
                className={`flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors ${
                  themeId === 'terminal-tui'
                    ? 'rounded-none border border-[#00ff41] bg-[#00ff41] text-black hover:bg-[#00ff41]/90 font-mono font-bold'
                    : 'rounded-lg bg-white text-black hover:bg-zinc-200'
                }`}
              >
                <Icon name="archive" className="text-base text-inherit" />
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
