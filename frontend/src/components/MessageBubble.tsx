import { Icon } from './Icon';
import { AudioPlayer } from './AudioPlayer';
import { DocumentCard } from './DocumentCard';
import { VideoPlayer } from './VideoPlayer';
import { pb } from '../lib/pocketbase';
import { useTheme, type BubbleStyle } from '../context/ThemeContext';

export interface Message {
  id: string;
  sender: string;
  text?: string;
  attachment?: string;
  media_type?: 'text' | 'image' | 'audio' | 'video' | 'file';
  duration?: number;
  file_name?: string;
  file_size?: number;
  reply_to?: string;
  is_pinned?: boolean;
  pinned_at?: string;
  read_at?: string | null;
  created: string;
  updated?: string;
}

export interface MessageBubbleProps {
  message: Message;
  isSelf?: boolean;
  currentUserId?: string;
  onOpenMedia?: (url: string, type: 'image' | 'video', caption?: string) => void;
  onReply?: (message: Message) => void;
  onTogglePin?: (messageId: string, currentPinned: boolean) => void;
  onNavigateToMessage?: (messageId: string) => void;
  searchQuery?: string;
  replyMessage?: Message | null;
}

export function formatMessageTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getMessageFileUrl(message: { id: string; attachment?: string }): string {
  if (!message.attachment) return '';
  const base = pb.baseUrl ? pb.baseUrl.replace(/\/+$/, '') : '';
  return `${base}/api/files/messages/${message.id}/${message.attachment}`;
}

export function getBubbleShapeClasses(isOwn: boolean, style: BubbleStyle): string {
  switch (style) {
    case 'soft-cloud':
      return isOwn ? 'rounded-3xl rounded-br-xs' : 'rounded-3xl rounded-bl-xs';
    case 'sharp':
      return isOwn ? 'rounded-none border-r-2' : 'rounded-none border-l-2';
    case 'glass':
      return 'rounded-xl backdrop-blur-md border';
    case 'rounded':
    default:
      return isOwn ? 'rounded-2xl rounded-tr-xs' : 'rounded-2xl rounded-tl-xs';
  }
}

export function MessageBubble({
  message,
  isSelf,
  currentUserId,
  onOpenMedia,
  onReply,
  onTogglePin,
  onNavigateToMessage,
  searchQuery,
  replyMessage,
}: MessageBubbleProps) {
  const { theme } = useTheme();
  const isOwn = isSelf ?? (currentUserId ? message.sender === currentUserId : false);
  const fileUrl = getMessageFileUrl(message);
  const shapeClasses = getBubbleShapeClasses(isOwn, theme.bubbleStyle);
  const bounceClass = theme.id === 'pink-cloud' ? 'animate-pink-bounce' : '';

  const isTui = theme.id === 'terminal-tui';
  const isGlass = theme.bubbleStyle === 'glass';

  let customBubbleClass = '';
  if (isTui) {
    customBubbleClass = isOwn ? 'tui-bubble-user' : 'tui-bubble-partner';
  } else if (isGlass) {
    customBubbleClass = isOwn ? 'glass-bubble-user' : 'glass-bubble-partner';
  }

  // Clip path chamfering is only applied to Cyberpunk sharp bubbles, NOT to Terminal TUI
  const clipPathStyle = (!isTui && theme.bubbleStyle === 'sharp')
    ? (isOwn
        ? 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
        : 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)')
    : undefined;

  const dropShadowFilter = (!isTui && theme.bubbleStyle === 'sharp')
    ? 'drop-shadow(0 0 6px var(--theme-accent))'
    : undefined;

  return (
    <div
      id={`message-${message.id}`}
      data-testid="message-bubble-wrapper"
      className={`group/wrapper relative flex w-full my-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className="max-w-[85%] sm:max-w-[75%] md:max-w-[65%]"
        style={{
          filter: dropShadowFilter,
        }}
      >
        <div
          data-testid="message-bubble"
          data-bubble-style={theme.bubbleStyle}
          className={`w-full px-4 py-2.5 shadow-xs break-words transition-all duration-200 ${
            isOwn
              ? 'bg-zinc-100 text-zinc-950'
              : 'bg-zinc-900 text-zinc-100 border border-zinc-800'
          } ${shapeClasses} ${bounceClass} ${customBubbleClass}`}
          style={{
            backgroundColor: isTui
              ? undefined
              : (isOwn ? 'var(--theme-bubble-user-bg)' : 'var(--theme-bubble-partner-bg)'),
            color: isTui
              ? undefined
              : (isOwn ? 'var(--theme-bubble-user-text)' : 'var(--theme-bubble-partner-text)'),
            borderColor: isTui
              ? undefined
              : (!isOwn ? 'var(--theme-border-subtle)' : (theme.bubbleTransparent ? 'rgba(255,255,255,0.12)' : undefined)),
            clipPath: clipPathStyle,
            backdropFilter: isTui ? undefined : 'var(--theme-bubble-backdrop, none)',
            WebkitBackdropFilter: isTui ? undefined : 'var(--theme-bubble-backdrop, none)',
          }}
        >
          {message.media_type === 'image' && fileUrl && (
            <div className="overflow-hidden rounded-xl mb-1.5 max-w-full">
              <img
                src={fileUrl}
                alt={message.text || 'Attachment'}
                loading="lazy"
                className="max-h-80 w-auto rounded-xl object-cover hover:opacity-95 transition-opacity cursor-pointer"
                onClick={() => {
                  if (onOpenMedia) {
                    onOpenMedia(fileUrl, 'image', message.text);
                  } else if (typeof window !== 'undefined') {
                    window.open(fileUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
              />
            </div>
          )}

          {message.media_type === 'video' && fileUrl && (
            <VideoPlayer
              src={fileUrl}
              isSelf={isOwn}
              onOpenFullscreen={() => onOpenMedia?.(fileUrl, 'video', message.text)}
            />
          )}

          {message.media_type === 'file' && fileUrl && (
            <DocumentCard
              fileName={message.file_name}
              fileSize={message.file_size}
              fileUrl={fileUrl}
              isSelf={isOwn}
            />
          )}

          {message.media_type === 'audio' && fileUrl && (
            <div className="py-1">
              <AudioPlayer
                src={fileUrl}
                duration={message.duration}
                isOwn={isOwn}
              />
            </div>
          )}

          {message.text && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap selection:bg-zinc-300">
              {message.text}
            </p>
          )}

          <div
            className={`flex items-center gap-1 mt-1 text-[11px] select-none ${
              isOwn ? 'justify-end opacity-80' : 'justify-start opacity-75'
            }`}
          >
            <span>{formatMessageTime(message.created)}</span>
            {isOwn && (
              <Icon
                name={message.read_at ? 'done_all' : 'done'}
                className={`text-sm ${
                  message.read_at
                    ? (isTui ? 'text-[#00ff41] font-bold' : 'text-emerald-400 font-semibold opacity-100')
                    : 'opacity-60 text-inherit'
                }`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
