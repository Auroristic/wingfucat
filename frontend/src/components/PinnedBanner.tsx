import { useState, useMemo } from 'react';
import { Icon } from './Icon';
import type { Message } from './MessageBubble';
import { useTheme } from '../context/ThemeContext';
import { parseDate } from '../utils/date';

export interface PinnedBannerProps {
  pinnedMessages: Message[];
  onSelect: (messageId: string) => void;
  onUnpin: (messageId: string) => void;
}

export function PinnedBanner({
  pinnedMessages,
  onSelect,
  onUnpin,
}: PinnedBannerProps) {
  const { theme } = useTheme();
  const isTui = theme.id === 'terminal-tui';
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Sort pins descending by pinned_at or created
  const sortedPins = useMemo(() => {
    return [...pinnedMessages].sort((a, b) => {
      const timeB = parseDate(b.pinned_at || b.created);
      const timeA = parseDate(a.pinned_at || a.created);
      return timeB - timeA;
    });
  }, [pinnedMessages]);

  if (sortedPins.length === 0) return null;

  const latestPin = sortedPins[0];

  const getPinSnippet = (msg: Message) => {
    if (msg.text) return msg.text;
    if (msg.media_type) return `[${msg.media_type.toUpperCase()}] ${msg.file_name || 'Attachment'}`;
    return 'Pinned message';
  };

  return (
    <div
      data-testid="pinned-banner"
      className={`relative z-10 w-full border-b select-none transition-all ${
        isTui
          ? 'bg-black border-[#00ff41] text-[#00ff41] font-mono'
          : 'bg-zinc-900/90 backdrop-blur-md border-zinc-800 text-zinc-100 shadow-sm'
      }`}
    >
      {/* Collapsed top bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 gap-2 text-xs">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <Icon
            name="keep"
            className={`text-sm shrink-0 ${isTui ? 'text-[#00ff41]' : 'text-amber-400'}`}
          />

          <button
            type="button"
            onClick={() => onSelect(latestPin.id)}
            aria-label="Jump to pinned message"
            className="flex items-center gap-1.5 overflow-hidden text-left truncate cursor-pointer hover:opacity-80 transition-opacity"
          >
            <span className="truncate max-w-[200px] sm:max-w-md font-medium">
              {getPinSnippet(latestPin)}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {sortedPins.length > 1 && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-label="View all pinned messages"
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                isTui
                  ? 'border border-[#00ff41] hover:bg-[#00ff41] hover:text-black'
                  : 'bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white'
              }`}
            >
              <span>{sortedPins.length} pinned</span>
              <Icon
                name={isExpanded ? 'expand_less' : 'expand_more'}
                className="text-xs"
              />
            </button>
          )}

          <button
            type="button"
            onClick={() => onUnpin(latestPin.id)}
            aria-label="Unpin message"
            title="Unpin message"
            className={`flex h-6 w-6 items-center justify-center rounded cursor-pointer transition-colors ${
              isTui
                ? 'hover:bg-[#00ff41]/20 text-[#00ff41]'
                : 'hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <Icon name="close" className="text-xs" />
          </button>
        </div>
      </div>

      {/* Expanded list of pins (when > 1 pin) */}
      {isExpanded && sortedPins.length > 1 && (
        <div
          className={`border-t px-3.5 py-2 space-y-1.5 max-h-48 overflow-y-auto ${
            isTui ? 'border-[#00ff41] bg-black/95' : 'border-zinc-800 bg-zinc-950/70'
          }`}
        >
          {sortedPins.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex items-center justify-between gap-2 p-1.5 rounded transition-colors text-xs ${
                isTui
                  ? 'hover:bg-[#00ff41]/10'
                  : 'hover:bg-white/5'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  onSelect(msg.id);
                  setIsExpanded(false);
                }}
                className="flex items-center gap-2 overflow-hidden text-left flex-1 cursor-pointer"
              >
                <span className="opacity-50 text-[10px] tabular-nums shrink-0">
                  #{idx + 1}
                </span>
                <span className="truncate max-w-[220px] sm:max-w-md font-medium">
                  {getPinSnippet(msg)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onUnpin(msg.id)}
                aria-label={`Unpin message ${idx + 1}`}
                className="shrink-0 p-1 rounded hover:bg-white/10 cursor-pointer opacity-70 hover:opacity-100"
              >
                <Icon name="keep_off" className="text-xs" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PinnedBanner;
