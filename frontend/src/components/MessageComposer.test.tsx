import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MessageComposer } from './MessageComposer';
import { pb } from '../lib/pocketbase';

// Mock PocketBase
vi.mock('../lib/pocketbase', () => ({
  pb: {
    authStore: {
      record: { id: 'test-user-id' },
    },
    collection: vi.fn(() => ({
      create: vi.fn().mockResolvedValue({ id: 'msg-new', text: 'Sent message' }),
    })),
  },
}));

// Mock imageCompressor
vi.mock('../utils/imageCompressor', () => ({
  compressImage: vi.fn((file: File) => Promise.resolve(file)),
}));

describe('MessageComposer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders text input, image attach, voice record, and send button', () => {
    render(<MessageComposer />);

    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();

    const imageIcon = screen.getByText('image');
    expect(imageIcon).toBeInTheDocument();
    expect(imageIcon).toHaveClass('material-symbols-rounded');

    const micIcon = screen.getByText('mic');
    expect(micIcon).toBeInTheDocument();
    expect(micIcon).toHaveClass('material-symbols-rounded');

    const sendIcon = screen.getByText('send');
    expect(sendIcon).toBeInTheDocument();
    expect(sendIcon).toHaveClass('material-symbols-rounded');
  });

  it('sends text message via FormData upload to PocketBase', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: 'msg-1', text: 'Hello love' });
    (pb.collection as any).mockReturnValue({ create: mockCreate });

    render(<MessageComposer currentUserId="test-user-id" />);

    const textarea = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(textarea, { target: { value: 'Hello love' } });

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const formDataArg = mockCreate.mock.calls[0][0];
    expect(formDataArg).toBeInstanceOf(FormData);
    expect(formDataArg.get('media_type')).toBe('text');
    expect(formDataArg.get('text')).toBe('Hello love');
    expect(formDataArg.get('sender')).toBe('test-user-id');

    // Text input is cleared
    expect(textarea).toHaveValue('');
  });

  it('attaches image, renders preview with remove option, and uploads via FormData', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: 'msg-2', media_type: 'image' });
    (pb.collection as any).mockReturnValue({ create: mockCreate });

    const { container } = render(<MessageComposer currentUserId="test-user-id" />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const testFile = new File(['image-bytes'], 'photo.jpg', { type: 'image/jpeg' });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [testFile] } });
    });

    // Preview should appear with remove button
    expect(screen.getByTestId('image-preview')).toBeInTheDocument();
    const removeBtn = screen.getByRole('button', { name: /remove attachment/i });
    expect(removeBtn).toBeInTheDocument();

    // Send the image
    const sendButton = screen.getByRole('button', { name: /send message/i });
    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const formDataArg = mockCreate.mock.calls[0][0];
    expect(formDataArg.get('media_type')).toBe('image');
    expect(formDataArg.get('sender')).toBe('test-user-id');
    expect(formDataArg.get('attachment')).toBeInstanceOf(File);

    // Preview is cleared
    expect(screen.queryByTestId('image-preview')).toBeNull();
  });

  it('switches to VoiceRecorder on mic click and cancels back to normal composer', async () => {
    render(<MessageComposer />);

    const micButton = screen.getByRole('button', { name: /record voice note/i });
    await act(async () => {
      fireEvent.click(micButton);
    });

    // Voice recorder should be visible
    expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();

    // Text input should be hidden while recording
    expect(screen.queryByPlaceholderText(/type a message/i)).toBeNull();

    // Click cancel in voice recorder
    const cancelButton = screen.getByRole('button', { name: /cancel recording/i });
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    // Normal composer restored
    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    expect(screen.queryByTestId('voice-recorder')).toBeNull();
  });
});
