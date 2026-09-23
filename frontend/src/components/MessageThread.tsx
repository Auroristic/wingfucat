import { useEffect, useRef } from 'react';
import { MessageBubble, type Message } from './MessageBubble';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../context/AuthContext';

export interface MessageThreadProps {
  messages: Message[];
  isLoading?: boolean;
  currentUserId?: string;
  className?: string;
}

export function MessageThread({
  messages,
  isLoading = false,
  currentUserId: propCurrentUserId,
  className = '',
}: MessageThreadProps) {
  let authUserId: string | undefined;
  try {
    const auth = useAuth();
    authUserId = auth?.user?.id;
  } catch (_) {
    // AuthContext may not be provided in isolated component tests
    authUserId = undefined;
  }

  const currentUserId = propCurrentUserId ?? authUserId;
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevCountRef = useRef(messages?.length ?? 0);

  // Auto-scroll to bottom only when a new message is appended or user is near bottom
  useEffect(() => {
    const prevCount = prevCountRef.current;
    const currentCount = messages?.length ?? 0;
    prevCountRef.current = currentCount;

    const container = containerRef.current;
    const isNearBottom = container
      ? container.scrollHeight - container.scrollTop - container.clientHeight < 120
      : true;

    if (currentCount > prevCount || isNearBottom) {
      if (bottomRef.current && typeof bottomRef.current.scrollIntoView === 'function') {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  if (isLoading && (!messages || messages.length === 0)) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-4 text-zinc-500 text-sm ${className}`}>
        <span>Loading messages...</span>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-4 text-zinc-600 text-sm ${className}`}>
        <span>No messages yet</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-testid="message-thread"
      className={`flex-1 overflow-y-auto p-4 space-y-3 ${className}`}
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          currentUserId={currentUserId}
        />
      ))}
      <div ref={bottomRef} data-testid="thread-bottom" />
    </div>
  );
}

export interface LiveMessageThreadProps {
  archivedAt?: string | null;
  className?: string;
}

export function LiveMessageThread({ archivedAt, className }: LiveMessageThreadProps) {
  const { messages, isLoading } = useMessages({ archivedAt });
  return <MessageThread messages={messages} isLoading={isLoading} className={className} />;
}

export default MessageThread;
