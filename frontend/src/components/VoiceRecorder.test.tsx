import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VoiceRecorder } from './VoiceRecorder';

describe('VoiceRecorder Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders live recording elapsed timer and action buttons', async () => {
    const onSend = vi.fn();
    const onCancel = vi.fn();

    render(<VoiceRecorder onSend={onSend} onCancel={onCancel} />);

    // Flush async getUserMedia microtask
    await act(async () => {
      await Promise.resolve();
    });

    // Shows initial timer
    expect(screen.getByText('0:00')).toBeInTheDocument();

    // Advance 5 seconds
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('0:05')).toBeInTheDocument();

    // Shows close/cancel icon and send icon
    const closeIcon = screen.getByText('close');
    expect(closeIcon).toBeInTheDocument();
    expect(closeIcon).toHaveClass('material-symbols-rounded');

    const sendIcon = screen.getByText('send');
    expect(sendIcon).toBeInTheDocument();
    expect(sendIcon).toHaveClass('material-symbols-rounded');
  });

  it('triggers onCancel when close button is clicked', async () => {
    const onSend = vi.fn();
    const onCancel = vi.fn();

    render(<VoiceRecorder onSend={onSend} onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSend).not.toHaveBeenCalled();
  });

  it('triggers onSend with audio file and duration when send button is clicked', async () => {
    const onSend = vi.fn();
    const onCancel = vi.fn();

    render(<VoiceRecorder onSend={onSend} onCancel={onCancel} />);

    // Flush async getUserMedia microtask
    await act(async () => {
      await Promise.resolve();
    });

    // Advance 6 seconds
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.getByText('0:06')).toBeInTheDocument();

    const sendButton = screen.getByRole('button', { name: /send/i });
    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(onSend).toHaveBeenCalledTimes(1);
    const [fileArg, durationArg] = onSend.mock.calls[0];
    expect(fileArg).toBeInstanceOf(File);
    expect(durationArg).toBe(6);
  });

  it('renders error message when microphone access is rejected', async () => {
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(new Error('Permission denied'));

    const onSend = vi.fn();
    const onCancel = vi.fn();

    render(<VoiceRecorder onSend={onSend} onCancel={onCancel} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Permission denied')).toBeInTheDocument();

    navigator.mediaDevices.getUserMedia = originalGetUserMedia;
  });
});
