import { useState, useRef } from 'react';
import { Icon } from './Icon';
import { useTheme } from '../context/ThemeContext';

export interface VideoPlayerProps {
  src: string;
  isSelf?: boolean;
  poster?: string;
  className?: string;
  onOpenFullscreen?: () => void;
}

function formatVideoTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function VideoPlayer({
  src,
  isSelf = false,
  poster,
  className = '',
  onOpenFullscreen,
}: VideoPlayerProps) {
  const { theme } = useTheme();
  const isTui = theme.id === 'terminal-tui';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleFullscreen = () => {
    if (onOpenFullscreen) {
      onOpenFullscreen();
    } else if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen().catch(() => {});
      }
    }
  };

  return (
    <div
      data-testid="video-player"
      className={`relative overflow-hidden group max-w-sm sm:max-w-md my-1.5 ${
        isTui
          ? 'rounded-none border border-[#00ff41] bg-black text-[#00ff41] font-mono'
          : isSelf
          ? 'rounded-2xl border border-white/20 bg-zinc-900 shadow-md'
          : 'rounded-2xl border border-zinc-800 bg-zinc-900 shadow-md'
      } ${className}`}
    >
      <video
        ref={videoRef}
        data-testid="video-element"
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
        className="w-full max-h-72 object-contain bg-black/90 cursor-pointer block"
      />

      {/* Control overlay bar */}
      <div
        className={`px-3 py-2 flex flex-col gap-1.5 transition-opacity ${
          isTui
            ? 'border-t border-[#00ff41] bg-black'
            : 'border-t border-white/10 bg-zinc-950/80 backdrop-blur-md text-zinc-100'
        }`}
      >
        {/* Progress scrubber */}
        <div className="flex items-center gap-2 w-full">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            aria-label="Video progress scrubber"
            className={`w-full h-1.5 cursor-pointer appearance-none rounded-lg ${
              isTui ? 'accent-[#00ff41] bg-zinc-800' : 'accent-emerald-400 bg-zinc-700'
            }`}
          />
        </div>

        {/* Buttons and time display */}
        <div className="flex items-center justify-between text-xs select-none">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
              className={`flex h-7 w-7 items-center justify-center transition-colors cursor-pointer ${
                isTui
                  ? 'border border-[#00ff41] hover:bg-[#00ff41] hover:text-black'
                  : 'rounded-full bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <Icon name={isPlaying ? 'pause' : 'play_arrow'} className="text-base" />
            </button>

            <span className="text-[11px] opacity-80 tabular-nums">
              {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              className={`flex h-7 w-7 items-center justify-center transition-colors cursor-pointer ${
                isTui
                  ? 'border border-[#00ff41] hover:bg-[#00ff41] hover:text-black'
                  : 'rounded-full hover:bg-white/15 text-zinc-300 hover:text-white'
              }`}
            >
              <Icon name={isMuted ? 'volume_off' : 'volume_up'} className="text-base" />
            </button>

            <button
              type="button"
              onClick={handleFullscreen}
              aria-label="Fullscreen"
              className={`flex h-7 w-7 items-center justify-center transition-colors cursor-pointer ${
                isTui
                  ? 'border border-[#00ff41] hover:bg-[#00ff41] hover:text-black'
                  : 'rounded-full hover:bg-white/15 text-zinc-300 hover:text-white'
              }`}
            >
              <Icon name="fullscreen" className="text-base" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
