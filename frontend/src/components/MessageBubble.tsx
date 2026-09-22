import { Icon } from './Icon';

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

export function MessageBubble({ message, isSelf, currentUserId }: MessageBubbleProps) {
  const isOwn = isSelf ?? (currentUserId ? message.sender === currentUserId : false);

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
