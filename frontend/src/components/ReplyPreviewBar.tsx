import { Icon } from './Icon';
import { useTheme } from '../context/ThemeContext';
import type { Message } from './MessageBubble';

export interface ReplyPreviewBarProps {
  message: Message;
  partnerName?: string;
  currentUserId?: string;
  onCancel: () => void;
  className?: string;
}

export function getMessageSnippet(message: Message): string {
  if (message.text) return message.text;
  if (message.media_type === 'image') return '📷 Photo';
  if (message.media_type === 'video') return '🎥 Video';
  if (message.media_type === 'audio') return '🎤 Voice Note';
  if (message.media_type === 'file') return `📎 ${message.file_name || 'Document'}`;
  return 'Attachment';
}

export function ReplyPreviewBar({
  message,
  partnerName = 'Partner',
  currentUserId,
  onCancel,
  className = '',
}: ReplyPreviewBarProps) {
  const { theme } = useTheme();
  const isTui = theme.id === 'terminal-tui';
  const isOwn = currentUserId ? message.sender === currentUserId : false;
  const authorName = isOwn ? 'You' : partnerName;
  const snippet = getMessageSnippet(message);

  return (
    <div
      data-testid="reply-preview-bar"
      className={`flex items-center justify-between gap-3 px-3 py-1.5 transition-all select-none ${
        isTui
          ? 'rounded-none border border-[#00ff41] bg-black text-[#00ff41] font-mono text-xs'
          : 'rounded-xl border-l-4 bg-zinc-900/90 text-zinc-200 border border-zinc-700/60 shadow-xs backdrop-blur-md'
      } ${className}`}
      style={
        isTui
          ? undefined
          : {
              borderLeftColor: 'var(--theme-accent, #3b82f6)',
              backgroundColor: 'var(--theme-bg-surface, rgba(24, 24, 27, 0.85))',
            }
      }
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Icon
          name="reply"
          className={`text-lg shrink-0 ${isTui ? 'text-[#00ff41]' : 'text-zinc-400'}`}
          style={!isTui ? { color: 'var(--theme-accent)' } : undefined}
        />
        <div className="flex flex-col min-w-0">
          <span
            className="text-xs font-semibold truncate"
            style={!isTui ? { color: 'var(--theme-accent)' } : undefined}
          >
            {isTui ? `[REPLYING TO: ${authorName}]` : authorName}
          </span>
          <span className="text-xs opacity-75 truncate max-w-xs sm:max-w-md">
            {snippet}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel reply"
        className={`flex h-6 w-6 shrink-0 items-center justify-center transition-colors cursor-pointer ${
          isTui
            ? 'border border-[#00ff41] hover:bg-[#00ff41] hover:text-black'
            : 'rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white'
        }`}
      >
        <Icon name="close" className="text-sm" />
      </button>
    </div>
  );
}

export default ReplyPreviewBar;
