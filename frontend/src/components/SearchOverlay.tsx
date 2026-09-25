import { useState, useEffect, useMemo, useRef } from 'react';
import { Icon } from './Icon';
import type { Message } from './MessageBubble';
import { useTheme } from '../context/ThemeContext';

export interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onActiveMatchChange?: (messageId: string | null, query: string) => void;
}

export function SearchOverlay({
  isOpen,
  onClose,
  messages,
  onActiveMatchChange,
}: SearchOverlayProps) {
  const { theme } = useTheme();
  const isTui = theme.id === 'terminal-tui';

  const [query, setQuery] = useState('');
  const [matchIndex, setMatchIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setMatchIndex(0);
      onActiveMatchChange?.(null, '');
    }
  }, [isOpen]);

  // Compute matching messages
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return messages.filter(
      (m) => m.text && m.text.toLowerCase().includes(q)
    );
  }, [messages, query]);

  // Synchronize active match when matches change
  useEffect(() => {
    if (!isOpen) return;
    const q = query.trim();
    if (!q) {
      setMatchIndex(0);
      onActiveMatchChange?.(null, '');
      return;
    }

    if (matches.length === 0) {
      setMatchIndex(0);
      onActiveMatchChange?.(null, q);
    } else {
      const safeIndex = Math.min(matchIndex, matches.length - 1);
      setMatchIndex(safeIndex);
      onActiveMatchChange?.(matches[safeIndex].id, q);
    }
  }, [matches, query, isOpen]);

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

  const handleNext = () => {
    if (matches.length <= 1) return;
    const nextIdx = (matchIndex + 1) % matches.length;
    setMatchIndex(nextIdx);
    onActiveMatchChange?.(matches[nextIdx].id, query.trim());
  };

  const handlePrev = () => {
    if (matches.length <= 1) return;
    const prevIdx = (matchIndex - 1 + matches.length) % matches.length;
    setMatchIndex(prevIdx);
    onActiveMatchChange?.(matches[prevIdx].id, query.trim());
  };

  const handleClear = () => {
    setQuery('');
    setMatchIndex(0);
    onActiveMatchChange?.(null, '');
    inputRef.current?.focus();
  };

  return (
    <div
      data-testid="search-overlay"
      className={`relative z-20 flex items-center gap-2 px-3 py-2 border-b transition-all select-none animate-fadeIn ${
        isTui
          ? 'bg-black border-[#00ff41] text-[#00ff41] font-mono shadow-[0_4px_12px_rgba(0,255,65,0.15)]'
          : 'bg-zinc-900/95 backdrop-blur-md border-zinc-800 text-zinc-100 shadow-md'
      }`}
    >
      <Icon name="search" className="text-lg opacity-70 shrink-0" />

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setMatchIndex(0);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
              handlePrev();
            } else {
              handleNext();
            }
          }
        }}
        placeholder="Search in conversation..."
        aria-label="Search messages input"
        className={`w-full bg-transparent text-xs sm:text-sm outline-none placeholder:opacity-50 ${
          isTui ? 'caret-[#00ff41]' : 'caret-blue-400'
        }`}
      />

      {/* Match counter / status */}
      {query.trim() && (
        <div className="shrink-0 flex items-center gap-1.5 text-xs">
          {matches.length > 0 ? (
            <span className="tabular-nums font-medium opacity-80 whitespace-nowrap">
              {matchIndex + 1} of {matches.length}
            </span>
          ) : (
            <span className="text-red-400/90 whitespace-nowrap">No results</span>
          )}

          {/* Navigation arrows */}
          <div className="flex items-center gap-0.5 ml-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={matches.length <= 1}
              aria-label="Previous match"
              title="Previous match (Shift+Enter)"
              className={`flex h-6 w-6 items-center justify-center rounded cursor-pointer transition-colors disabled:opacity-30 ${
                isTui
                  ? 'hover:bg-[#00ff41]/20 disabled:hover:bg-transparent'
                  : 'hover:bg-white/10 disabled:hover:bg-transparent'
              }`}
            >
              <Icon name="keyboard_arrow_up" className="text-base" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={matches.length <= 1}
              aria-label="Next match"
              title="Next match (Enter)"
              className={`flex h-6 w-6 items-center justify-center rounded cursor-pointer transition-colors disabled:opacity-30 ${
                isTui
                  ? 'hover:bg-[#00ff41]/20 disabled:hover:bg-transparent'
                  : 'hover:bg-white/10 disabled:hover:bg-transparent'
              }`}
            >
              <Icon name="keyboard_arrow_down" className="text-base" />
            </button>
          </div>

          {/* Clear query */}
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search query"
            className="flex h-6 w-6 items-center justify-center rounded opacity-70 hover:opacity-100 cursor-pointer ml-0.5"
          >
            <Icon name="backspace" className="text-xs" />
          </button>
        </div>
      )}

      {/* Close search button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close search"
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full cursor-pointer transition-colors ml-1 ${
          isTui
            ? 'border border-[#00ff41] hover:bg-[#00ff41] hover:text-black'
            : 'hover:bg-white/10 text-zinc-400 hover:text-white'
        }`}
      >
        <Icon name="close" className="text-sm" />
      </button>
    </div>
  );
}

export default SearchOverlay;
