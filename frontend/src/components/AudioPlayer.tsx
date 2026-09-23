import { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from './Icon';

export interface AudioPlayerProps {
  src: string;
  duration?: number;
  isOwn?: boolean;
  className?: string;
}

export function formatAudioDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) {
    return '0:00';
  }
  const rounded = Math.floor(seconds);
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioPlayer({
  src,
  duration = 0,
  isOwn = false,
  className = '',
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(duration);

  // Sync prop duration if provided and totalDuration is 0
  useEffect(() => {
    if (duration > 0 && totalDuration === 0) {
      setTotalDuration(duration);
    }
  }, [duration, totalDuration]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Audio playback error:', err);
        setIsPlaying(false);
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
      setTotalDuration(Math.round(audio.duration));
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  }, []);

  const displayedTime = currentTime > 0
    ? formatAudioDuration(currentTime)
    : formatAudioDuration(totalDuration || duration || 0);

  return (
    <div
      data-testid="audio-player"
      className={`flex items-center gap-2.5 min-w-[200px] max-w-[320px] select-none ${className}`}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer ${
          isOwn
            ? 'bg-zinc-900 text-white hover:bg-zinc-800'
            : 'bg-zinc-100 text-zinc-950 hover:bg-white'
        }`}
      >
        <Icon name={isPlaying ? 'pause' : 'play_arrow'} className="text-xl" />
      </button>

      <div className="flex flex-1 flex-col justify-center">
        <input
          type="range"
          min={0}
          max={totalDuration > 0 ? totalDuration : 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          aria-label="Audio progress"
          className={`h-1.5 w-full cursor-pointer appearance-none rounded-full transition-all ${
            isOwn
              ? 'bg-zinc-300 accent-zinc-900'
              : 'bg-zinc-800 accent-zinc-100'
          }`}
        />
        <div
          className={`mt-0.5 text-[10px] font-mono ${
            isOwn ? 'text-zinc-600' : 'text-zinc-400'
          }`}
        >
          <span>{displayedTime}</span>
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer;
