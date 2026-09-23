import { useState, useRef, useCallback, useEffect } from 'react';
import { Icon } from './Icon';
import { VoiceRecorder } from './VoiceRecorder';
import { compressImage } from '../utils/imageCompressor';
import { pb } from '../lib/pocketbase';
import { useTheme } from '../context/ThemeContext';
import type { Message } from './MessageBubble';

export interface MessageComposerProps {
  currentUserId?: string;
  onMessageSent?: (message: Message) => void;
  onTyping?: (isTyping: boolean) => void;
  isPartnerTyping?: boolean;
  partnerName?: string;
  className?: string;
}

export function MessageComposer({
  currentUserId: propCurrentUserId,
  onMessageSent,
  onTyping,
  isPartnerTyping = false,
  partnerName = 'Partner',
  className = '',
}: MessageComposerProps) {
  const [text, setText] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const getActiveUserId = useCallback((): string | null => {
    return propCurrentUserId ?? pb.authStore.record?.id ?? null;
  }, [propCurrentUserId]);

  const clearImage = useCallback(() => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImage(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [imagePreviewUrl]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setSelectedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setErrorMessage(null);
  };

  const lastTypingSentRef = useRef<number>(0);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

    if (onTyping) {
      if (val.trim().length > 0) {
        const now = Date.now();
        if (now - lastTypingSentRef.current > 2000) {
          lastTypingSentRef.current = now;
          onTyping(true);
        }
      } else {
        lastTypingSentRef.current = 0;
        onTyping(false);
      }
    }
  };

  const handleSend = async () => {
    if (isUploading) return;
    const trimmed = text.trim();
    if (!trimmed && !selectedImage) return;

    const uid = getActiveUserId();
    if (!uid) {
      setErrorMessage('User session not authenticated');
      return;
    }

    onTyping?.(false);
    lastTypingSentRef.current = 0;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('sender', uid);

      if (selectedImage) {
        formData.append('media_type', 'image');
        const compressed = await compressImage(selectedImage);
        formData.append('attachment', compressed);
        if (trimmed) {
          formData.append('text', trimmed);
        }
      } else {
        formData.append('media_type', 'text');
        formData.append('text', trimmed);
      }

      const created = await pb.collection('messages').create<Message>(formData);

      setText('');
      clearImage();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      onMessageSent?.(created);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to send message');
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceSend = async (audioFile: File, durationSeconds: number) => {
    const uid = getActiveUserId();
    if (!uid) {
      setErrorMessage('User session not authenticated');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('sender', uid);
      formData.append('media_type', 'audio');
      formData.append('attachment', audioFile);
      formData.append('duration', String(durationSeconds));

      const created = await pb.collection('messages').create<Message>(formData);
      setIsRecordingAudio(false);
      onMessageSent?.(created);
    } catch (err: any) {
      setIsRecordingAudio(false);
      setErrorMessage(err?.message || 'Failed to send voice note');
    } finally {
      setIsUploading(false);
    }
  };

  const { theme } = useTheme();

  return (
    <div
      data-testid="message-composer"
      className={`px-3 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-colors duration-200 ${className}`}
    >
      <div className="mx-auto w-full max-w-3xl flex flex-col gap-1">
        {/* Themed typing indicator */}
        <div className="h-5 px-2 flex items-center text-xs text-zinc-400 select-none overflow-hidden">
          {isPartnerTyping && (
            <div
              data-testid="partner-typing-indicator"
              data-typing-variant={theme.typingAnimation}
              className="flex items-center gap-1.5"
            >
              {theme.typingAnimation === 'dots' && (
                <span className="flex items-center gap-0.5" data-testid="typing-dots">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.32s]"
                    style={{ backgroundColor: 'var(--theme-accent)' }}
                  />
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.16s]"
                    style={{ backgroundColor: 'var(--theme-accent)' }}
                  />
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce"
                    style={{ backgroundColor: 'var(--theme-accent)' }}
                  />
                </span>
              )}
              {theme.typingAnimation === 'hearts' && (
                <span className="flex items-center gap-1 text-xs text-rose-300" data-testid="typing-hearts">
                  <span className="animate-heart-beat text-xs">♥</span>
                  <span className="animate-heart-beat [animation-delay:0.2s] text-xs">♥</span>
                  <span className="animate-heart-beat [animation-delay:0.4s] text-xs">♥</span>
                </span>
              )}
              {theme.typingAnimation === 'neon-pulse' && (
                <span className="flex items-center gap-1" data-testid="typing-neon-pulse">
                  <span className="h-1.5 w-1.5 rounded-sm bg-[#00f0ff] animate-ping" />
                  <span className="h-1.5 w-1.5 rounded-sm bg-[#ff003c] animate-pulse" />
                </span>
              )}
              {theme.typingAnimation === 'glow-bar' && (
                <div className="relative h-1 w-16 overflow-hidden rounded-full bg-zinc-800" data-testid="typing-glow-bar">
                  <div
                    className="absolute inset-y-0 w-6 rounded-full animate-sweep-glow"
                    style={{
                      background: 'linear-gradient(90deg, #4f7cff, #a855f7)',
                      boxShadow: '0 0 8px #a855f7',
                    }}
                  />
                </div>
              )}
              <span className="truncate">
                <strong className="font-semibold text-zinc-200">{partnerName}</strong> is typing...
              </span>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mb-1 flex items-center justify-between rounded-xl bg-red-950/70 border border-red-900 px-3 py-1.5 text-xs text-red-200 backdrop-blur-md">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white"
            >
              <Icon name="close" className="text-sm" />
            </button>
          </div>
        )}

        {isRecordingAudio ? (
          <VoiceRecorder
            onSend={handleVoiceSend}
            onCancel={() => setIsRecordingAudio(false)}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {imagePreviewUrl && (
              <div
                data-testid="image-preview"
                className="relative inline-flex items-center gap-2 self-start rounded-2xl border p-1.5 backdrop-blur-md shadow-md"
                style={{
                  backgroundColor: 'var(--theme-bg-glass)',
                  borderColor: 'var(--theme-border-subtle)',
                }}
              >
                <img
                  src={imagePreviewUrl}
                  alt="Selected attachment preview"
                  className="h-16 w-16 rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  aria-label="Remove attachment"
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
                >
                  <Icon name="close" className="text-sm" />
                </button>
              </div>
            )}

            <div
              className={`flex items-end gap-2 p-1.5 backdrop-blur-md transition-all duration-200 ${
                theme.bubbleStyle === 'soft-cloud'
                  ? 'rounded-3xl border shadow-lg'
                  : theme.bubbleStyle === 'sharp'
                  ? 'rounded-none border-2'
                  : theme.bubbleStyle === 'glass'
                  ? 'rounded-2xl border shadow-xl'
                  : 'rounded-2xl border shadow-sm'
              }`}
              style={{
                backgroundColor: 'var(--theme-bg-glass)',
                borderColor: 'var(--theme-border-subtle)',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach image"
                disabled={isUploading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
              >
                <Icon name="image" className="text-xl" />
              </button>

              <button
                type="button"
                onClick={() => setIsRecordingAudio(true)}
                aria-label="Record voice note"
                disabled={isUploading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
              >
                <Icon name="mic" className="text-xl" />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={theme.id === 'pink-cloud' ? 'Send a sweet message... ✨' : 'Type a message...'}
                disabled={isUploading}
                className="flex-1 max-h-32 min-h-[36px] resize-none bg-transparent py-2 px-2 text-sm focus:outline-hidden leading-normal selection:bg-zinc-700"
                style={{
                  color: 'var(--theme-text-primary)',
                }}
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={isUploading || (!text.trim() && !selectedImage)}
                aria-label="Send message"
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer disabled:opacity-40 ${
                  theme.id === 'pink-cloud'
                    ? 'bubbly-press shadow-md text-zinc-950 font-bold'
                    : 'bg-zinc-100 text-zinc-950 hover:bg-white'
                }`}
                style={
                  theme.id === 'pink-cloud'
                    ? { backgroundColor: 'var(--theme-accent)', color: '#1a1017' }
                    : { backgroundColor: 'var(--theme-text-primary)', color: 'var(--theme-bg-primary)' }
                }
              >
                <Icon name="send" className="text-lg" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageComposer;
