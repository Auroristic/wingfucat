import { useState, useRef, useCallback } from 'react';
import { Icon } from './Icon';
import { VoiceRecorder } from './VoiceRecorder';
import { compressImage } from '../utils/imageCompressor';
import { pb } from '../lib/pocketbase';
import type { Message } from './MessageBubble';

export interface MessageComposerProps {
  currentUserId?: string;
  onMessageSent?: (message: Message) => void;
  className?: string;
}

export function MessageComposer({
  currentUserId: propCurrentUserId,
  onMessageSent,
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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
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
      setErrorMessage(err?.message || 'Failed to send voice note');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      data-testid="message-composer"
      className={`border-t border-zinc-800 bg-zinc-950 p-3 ${className}`}
    >
      {errorMessage && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-red-950/60 border border-red-900 px-3 py-1.5 text-xs text-red-200">
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
              className="relative inline-flex items-center gap-2 self-start rounded-xl border border-zinc-800 bg-zinc-900 p-1.5"
            >
              <img
                src={imagePreviewUrl}
                alt="Selected attachment preview"
                className="h-16 w-16 rounded-lg object-cover"
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

          <div className="flex items-end gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-1.5">
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
            >
              <Icon name="image" className="text-xl" />
            </button>

            <button
              type="button"
              onClick={() => setIsRecordingAudio(true)}
              aria-label="Record voice note"
              disabled={isUploading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
            >
              <Icon name="mic" className="text-xl" />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={isUploading}
              className="flex-1 max-h-32 min-h-[36px] resize-none bg-transparent py-2 px-1 text-sm text-white placeholder-zinc-500 focus:outline-hidden leading-normal selection:bg-zinc-700"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={isUploading || (!text.trim() && !selectedImage)}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 hover:bg-white transition-colors cursor-pointer disabled:opacity-40 disabled:hover:bg-zinc-100"
            >
              <Icon name="send" className="text-lg" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageComposer;
