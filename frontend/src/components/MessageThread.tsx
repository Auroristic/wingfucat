import { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { MessageBubble, type Message } from './MessageBubble';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export interface MessageThreadProps {
  messages: Message[];
  isLoading?: boolean;
  isPartnerTyping?: boolean;
  currentUserId?: string;
  className?: string;
}

export function MessageThread({
  messages,
  isLoading = false,
  isPartnerTyping: _isPartnerTyping = false,
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
    let themeId = 'minimalist-oled';
    try {
      const themeCtx = useTheme();
      if (themeCtx?.theme?.id) {
        themeId = themeCtx.theme.id;
      }
    } catch (_) {
      themeId = 'minimalist-oled';
    }

    return (
      <div
        data-testid="message-thread-empty"
        className={`flex-1 flex flex-col items-center justify-center p-6 text-center select-none ${className}`}
      >
        {themeId === 'pink-cloud' && (
          <div className="flex flex-col items-center gap-2 max-w-xs animate-pink-bounce">
            <div className="h-16 w-16 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 shadow-lg">
              <Icon name="pets" className="text-3xl" />
            </div>
            <span className="text-sm font-semibold text-pink-200">No messages yet</span>
            <p className="text-xs text-pink-300/80 leading-relaxed">
              Send a sweet hello to start your story together! ✨🐾
            </p>
          </div>
        )}

        {themeId === 'cyberpunk' && (
          <div className="flex flex-col items-start gap-1.5 max-w-sm w-full p-4 border border-cyan-500/40 bg-black/70 font-mono text-left shadow-[0_0_15px_rgba(0,240,255,0.15)]">
            <div className="flex items-center gap-2 text-[11px] text-cyan-400 border-b border-cyan-900/60 pb-1.5 w-full">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>[SYS.STATUS] UPLINK_ONLINE // WAITING_FOR_DATA</span>
            </div>
            <span className="text-xs text-yellow-400 mt-1 font-semibold">No messages yet</span>
            <p className="text-[11px] text-zinc-400">
              &gt; Secure telemetry buffer is clear. Transmit packet to begin exchange.
            </p>
          </div>
        )}

        {themeId === 'lavender-dream' && (
          <div className="flex flex-col items-center gap-2 max-w-xs">
            <div className="h-14 w-14 rounded-full bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-sm">
              <Icon name="auto_awesome" className="text-2xl" />
            </div>
            <span className="text-sm font-semibold text-purple-200">No messages yet</span>
            <p className="text-xs text-purple-300/70 leading-relaxed">
              A serene quiet space. Reach out whenever you are ready. 🌙
            </p>
          </div>
        )}

        {themeId === 'futuristic' && (
          <div className="flex flex-col items-center gap-2 max-w-xs">
            <div className="h-14 w-14 rounded-2xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-sm">
              <Icon name="hub" className="text-2xl" />
            </div>
            <span className="text-sm font-semibold text-blue-200">No messages yet</span>
            <p className="text-xs text-blue-300/70 leading-relaxed">
              Subspace relay operational. Ready to link across the stars.
            </p>
          </div>
        )}

        {themeId === 'terminal-tui' && (
          <div className="flex flex-col items-start gap-1 max-w-sm w-full p-4 border border-[#00ff41] bg-black font-mono text-left shadow-[0_0_12px_rgba(0,255,65,0.2)]">
            <div className="text-[11px] text-[#00ff41] border-b border-[#00ff41]/40 pb-1 w-full flex items-center justify-between">
              <span>[TTY_01: ONLINE]</span>
              <span className="animate-pulse">_</span>
            </div>
            <span className="text-xs text-[#00ff41] mt-1 font-bold">No messages yet</span>
            <p className="text-[11px] text-[#00aa2b]">
              &gt; Buffer initialized. Input transmission to commence session.
            </p>
          </div>
        )}

        {themeId === 'daylight' && (
          <div className="flex flex-col items-center gap-1.5 text-zinc-500 text-sm max-w-xs">
            <div className="h-12 w-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-1 shadow-xs">
              <Icon name="wb_sunny" className="text-2xl" />
            </div>
            <span className="font-semibold text-zinc-800">No messages yet</span>
            <p className="text-xs text-zinc-500">Send a note to start today's conversation</p>
          </div>
        )}

        {themeId === 'minimalist-oled' && (
          <div className="flex flex-col items-center gap-1.5 text-zinc-500 text-sm">
            <Icon name="chat_bubble_outline" className="text-2xl text-zinc-600 mb-1" />
            <span className="font-medium text-zinc-400">No messages yet</span>
            <p className="text-xs text-zinc-600">Send a note to begin</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-testid="message-thread"
      className={`flex-1 overflow-y-auto px-4 pt-12 pb-16 space-y-3 ${className}`}
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 36px, black calc(100% - 48px), transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 36px, black calc(100% - 48px), transparent 100%)',
      }}
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
  isPartnerTyping?: boolean;
  className?: string;
}

export function LiveMessageThread({ archivedAt, isPartnerTyping = false, className }: LiveMessageThreadProps) {
  const { messages, isLoading } = useMessages({ archivedAt });
  return (
    <MessageThread
      messages={messages}
      isLoading={isLoading}
      isPartnerTyping={isPartnerTyping}
      className={className}
    />
  );
}

export default MessageThread;
