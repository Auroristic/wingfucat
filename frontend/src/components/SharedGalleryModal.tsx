import { useState, useMemo, useEffect } from 'react';
import { Icon } from './Icon';
import { DocumentCard } from './DocumentCard';
import { getMessageFileUrl, type Message } from './MessageBubble';
import { useTheme } from '../context/ThemeContext';

export interface SharedGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onSelectMedia: (msg: Message) => void;
}

type GalleryTab = 'photos' | 'videos' | 'files';

export function SharedGalleryModal({
  isOpen,
  onClose,
  messages,
  onSelectMedia,
}: SharedGalleryModalProps) {
  const { theme } = useTheme();
  const isTui = theme.id === 'terminal-tui';
  const [activeTab, setActiveTab] = useState<GalleryTab>('photos');

  // Filter messages into categories
  const photos = useMemo(
    () => messages.filter((m) => m.attachment && m.media_type === 'image'),
    [messages]
  );
  const videos = useMemo(
    () => messages.filter((m) => m.attachment && m.media_type === 'video'),
    [messages]
  );
  const files = useMemo(
    () => messages.filter((m) => m.attachment && m.media_type === 'file'),
    [messages]
  );

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="shared-gallery-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Shared Media Gallery"
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn select-none ${
        isTui ? 'font-mono text-[#00ff41]' : 'text-zinc-100'
      }`}
    >
      <div
        className={`relative w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl transition-all ${
          isTui
            ? 'rounded-none border-2 border-[#00ff41] bg-black shadow-[0_0_20px_rgba(0,255,65,0.25)]'
            : 'rounded-3xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isTui ? 'border-[#00ff41] bg-black' : 'border-zinc-800 bg-zinc-900/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon name="photo_library" className="text-xl" />
            <h2 className="text-base font-bold tracking-tight">
              {isTui ? '[MEDIA VAULT]' : 'Shared Media'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close gallery"
            className={`flex h-8 w-8 items-center justify-center transition-colors cursor-pointer ${
              isTui
                ? 'border border-[#00ff41] hover:bg-[#00ff41] hover:text-black'
                : 'rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
            }`}
          >
            <Icon name="close" className="text-base" />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          className={`flex border-b text-xs font-semibold px-4 pt-2 gap-2 ${
            isTui ? 'border-[#00ff41] bg-black' : 'border-zinc-800/80 bg-zinc-900/30'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'photos'
                ? isTui
                  ? 'border-[#00ff41] text-[#00ff41]'
                  : 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon name="image" className="text-sm" />
            <span>Photos ({photos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'videos'
                ? isTui
                  ? 'border-[#00ff41] text-[#00ff41]'
                  : 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon name="movie" className="text-sm" />
            <span>Videos ({videos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'files'
                ? isTui
                  ? 'border-[#00ff41] text-[#00ff41]'
                  : 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon name="description" className="text-sm" />
            <span>Files ({files.length})</span>
          </button>
        </div>

        {/* Tab content body */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'photos' && (
            <div>
              {photos.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-zinc-500 text-sm">
                  <Icon name="image_not_supported" className="text-3xl mb-2 opacity-50" />
                  <span>No shared photos yet</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {photos.map((msg) => {
                    const url = getMessageFileUrl(msg);
                    return (
                      <button
                        key={msg.id}
                        type="button"
                        onClick={() => onSelectMedia(msg)}
                        className={`group relative aspect-square overflow-hidden rounded-xl bg-zinc-900 border transition-all cursor-pointer ${
                          isTui
                            ? 'border-[#00ff41] rounded-none hover:opacity-80'
                            : 'border-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        <img
                          src={url}
                          alt={msg.text || 'Shared photo'}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'videos' && (
            <div>
              {videos.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-zinc-500 text-sm">
                  <Icon name="videocam_off" className="text-3xl mb-2 opacity-50" />
                  <span>No shared videos yet</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {videos.map((msg) => {
                    const url = getMessageFileUrl(msg);
                    return (
                      <button
                        key={msg.id}
                        type="button"
                        onClick={() => onSelectMedia(msg)}
                        className={`group relative flex flex-col overflow-hidden p-2 text-left bg-zinc-900 border transition-all cursor-pointer ${
                          isTui
                            ? 'border-[#00ff41] rounded-none'
                            : 'rounded-xl border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="relative aspect-video w-full rounded-lg bg-black flex items-center justify-center overflow-hidden mb-2">
                          <video
                            src={url}
                            preload="metadata"
                            className="h-full w-full object-cover opacity-75"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md group-hover:scale-110 transition-transform">
                              <Icon name="play_arrow" className="text-xl" />
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold truncate max-w-full">
                          {msg.file_name || 'Video clip'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-2">
              {files.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-zinc-500 text-sm">
                  <Icon name="folder_off" className="text-3xl mb-2 opacity-50" />
                  <span>No shared files yet</span>
                </div>
              ) : (
                files.map((msg) => (
                  <DocumentCard
                    key={msg.id}
                    fileName={msg.file_name}
                    fileSize={msg.file_size}
                    fileUrl={getMessageFileUrl(msg)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SharedGalleryModal;
