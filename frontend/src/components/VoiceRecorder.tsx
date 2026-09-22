import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from './Icon';
import { formatAudioDuration } from './AudioPlayer';

export interface VoiceRecorderProps {
  onSend: (audioFile: File, durationSeconds: number) => Promise<void> | void;
  onCancel: () => void;
  className?: string;
}

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidateTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/aac',
  ];
  for (const type of candidateTypes) {
    if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

export function VoiceRecorder({ onSend, onCancel, className = '' }: VoiceRecorderProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const elapsedSecondsRef = useRef<number>(0);
  elapsedSecondsRef.current = elapsedSeconds;

  const cleanupStream = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (_) {}
      mediaStreamRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    cleanupStream();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    audioChunksRef.current = [];
    onCancel();
  }, [cleanupStream, onCancel]);

  const handleSend = useCallback(() => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      setIsSubmitting(false);
      return;
    }

    recorder.onstop = async () => {
      cleanupStream();
      const mimeType = recorder.mimeType || getSupportedMimeType() || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      const audioFile = new File([audioBlob], `voice-note-${Date.now()}.${ext}`, {
        type: mimeType,
        lastModified: Date.now(),
      });

      const finalDuration = Math.max(1, elapsedSecondsRef.current);
      try {
        await onSend(audioFile, finalDuration);
      } catch (err) {
        console.error('Failed to send voice note:', err);
      } finally {
        setIsSubmitting(false);
      }
    };

    try {
      recorder.stop();
    } catch (_) {
      setIsSubmitting(false);
    }
  }, [isSubmitting, cleanupStream, onSend]);

  useEffect(() => {
    let mounted = true;

    async function startRecording() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Microphone access is not supported in this environment');
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;
        audioChunksRef.current = [];

        const mimeType = getSupportedMimeType();
        const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
        const recorder = new MediaRecorder(stream, options);

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.start(250);
        mediaRecorderRef.current = recorder;

        timerIntervalRef.current = setInterval(() => {
          setElapsedSeconds((prev) => prev + 1);
        }, 1000);
      } catch (err: any) {
        if (mounted) {
          setErrorMessage(err?.message || 'Could not access microphone');
        }
      }
    }

    startRecording();

    return () => {
      mounted = false;
      cleanupStream();
    };
  }, [cleanupStream]);

  if (errorMessage) {
    return (
      <div className={`flex items-center justify-between gap-3 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-red-400 ${className}`}>
        <span>{errorMessage}</span>
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Close"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <Icon name="close" className="text-lg" />
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="voice-recorder"
      className={`flex items-center justify-between gap-3 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white select-none ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
        </span>
        <span className="font-mono text-sm tracking-wide font-medium">
          {formatAudioDuration(elapsedSeconds)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          aria-label="Cancel recording"
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Icon name="close" className="text-xl" />
        </button>

        <button
          type="button"
          onClick={handleSend}
          disabled={isSubmitting}
          aria-label="Send voice note"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-950 hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Icon name="send" className="text-lg" />
        </button>
      </div>
    </div>
  );
}

export default VoiceRecorder;
