import { Icon } from './Icon';
import { AudioPlayer } from './AudioPlayer';
import { pb } from '../lib/pocketbase';

export interface Message {
  id: string;
  sender: string;
  text?: string;
  attachment?: string;
  media_type?: 'text' | 'image' | 'audio';
  duration?: number;
  read_at?: string | null;
  created: string;
  updated?: string;
}

export interface MessageBubbleProps {
  message: Message;
  isSelf?: boolean;
  currentUserId?: string;
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

export function MessageBubble({ message, isSelf, currentUserId }: MessageBubbleProps) {
  const isOwn = isSelf ?? (currentUserId ? message.sender === currentUserId : false);
  const fileUrl = getMessageFileUrl(message);

  return (
    <div
      data-testid="message-bubble-wrapper"
      className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div
        data-testid="message-bubble"
        className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-xs break-words ${
          isOwn
            ? 'bg-zinc-100 text-zinc-950 rounded-tr-xs'
            : 'bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-tl-xs'
        }`}
      >
        {message.media_type === 'image' && fileUrl && (
          <div className="overflow-hidden rounded-xl mb-1.5 max-w-full">
            <img
              src={fileUrl}
              alt={message.text || 'Attachment'}
              loading="lazy"
              className="max-h-80 w-auto rounded-xl object-cover hover:opacity-95 transition-opacity cursor-pointer"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.open(fileUrl, '_blank', 'noopener,noreferrer');
                }
              }}
            />
          </div>
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
            isOwn ? 'justify-end text-zinc-500' : 'justify-start text-zinc-400'
          }`}
        >
          <span>{formatMessageTime(message.created)}</span>
          {isOwn && (
            <Icon
              name={message.read_at ? 'done_all' : 'done'}
              className={`text-sm ${message.read_at ? 'text-zinc-700' : 'text-zinc-400'}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
