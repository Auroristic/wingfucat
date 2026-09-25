import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MessageComposer } from './MessageComposer';
import { ThemeProvider } from '../context/ThemeContext';
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

  it('renders Discord-style typing indicator when partner is typing', () => {
    render(<MessageComposer isPartnerTyping={true} partnerName="wingfu" />);

    expect(screen.getByTestId('partner-typing-indicator')).toBeInTheDocument();
    expect(screen.getByText('wingfu')).toBeInTheDocument();
    expect(screen.getByText(/is typing\.\.\./i)).toBeInTheDocument();
  });

  it('does not render typing indicator when partner is not typing', () => {
    render(<MessageComposer isPartnerTyping={false} partnerName="wingfu" />);

    expect(screen.queryByTestId('partner-typing-indicator')).toBeNull();
  });

  it('renders all typing animation variants and applies bubbly-press on pink-cloud', () => {
    // 1. hearts + pink-cloud
    localStorage.setItem('wingfucat_theme', JSON.stringify({ id: 'pink-cloud', typingAnimation: 'hearts' }));
    const { unmount: unmount1 } = render(
      <ThemeProvider>
        <MessageComposer isPartnerTyping={true} partnerName="wingfu" />
      </ThemeProvider>
    );
    expect(screen.getByTestId('typing-hearts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toHaveClass('bubbly-press');
    unmount1();

    // 2. neon-pulse
    localStorage.setItem('wingfucat_theme', JSON.stringify({ id: 'cyberpunk', typingAnimation: 'neon-pulse' }));
    const { unmount: unmount2 } = render(
      <ThemeProvider>
        <MessageComposer isPartnerTyping={true} partnerName="wingfu" />
      </ThemeProvider>
    );
    expect(screen.getByTestId('typing-neon-pulse')).toBeInTheDocument();
    unmount2();

    // 3. glow-bar
    localStorage.setItem('wingfucat_theme', JSON.stringify({ id: 'futuristic', typingAnimation: 'glow-bar' }));
    const { unmount: unmount3 } = render(
      <ThemeProvider>
        <MessageComposer isPartnerTyping={true} partnerName="wingfu" />
      </ThemeProvider>
    );
    expect(screen.getByTestId('typing-glow-bar')).toBeInTheDocument();
    unmount3();

    // 4. dots
    localStorage.setItem('wingfucat_theme', JSON.stringify({ id: 'minimalist-oled', typingAnimation: 'dots' }));
    render(
      <ThemeProvider>
        <MessageComposer isPartnerTyping={true} partnerName="wingfu" />
      </ThemeProvider>
    );
    expect(screen.getByTestId('typing-dots')).toBeInTheDocument();
  });

  it('attaches video, renders preview with filename and size, and uploads with media_type video', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: 'msg-video', media_type: 'video' });
    (pb.collection as any).mockReturnValue({ create: mockCreate });

    const { container } = render(<MessageComposer currentUserId="test-user-id" />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const videoFile = new File(['fake-video-content'], 'test.mp4', { type: 'video/mp4' });
    Object.defineProperty(videoFile, 'size', { value: 2097152 }); // 2 MB

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [videoFile] } });
    });

    expect(screen.getByTestId('attachment-preview')).toBeInTheDocument();
    expect(screen.getByText('test.mp4')).toBeInTheDocument();
    expect(screen.getByText('2 MB')).toBeInTheDocument();

    const sendButton = screen.getByRole('button', { name: /send message/i });
    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const formDataArg = mockCreate.mock.calls[0][0];
    expect(formDataArg.get('media_type')).toBe('video');
    expect(formDataArg.get('file_name')).toBe('test.mp4');
    expect(formDataArg.get('file_size')).toBe('2097152');
    expect(formDataArg.get('sender')).toBe('test-user-id');
  });

  it('attaches document, renders preview with icon and size, and uploads with media_type file', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: 'msg-doc', media_type: 'file' });
    (pb.collection as any).mockReturnValue({ create: mockCreate });

    const { container } = render(<MessageComposer currentUserId="test-user-id" />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const docFile = new File(['pdf-data'], 'doc.pdf', { type: 'application/pdf' });
    Object.defineProperty(docFile, 'size', { value: 1048576 }); // 1 MB

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [docFile] } });
    });

    expect(screen.getByTestId('attachment-preview')).toBeInTheDocument();
    expect(screen.getByText('doc.pdf')).toBeInTheDocument();
    expect(screen.getByText('1 MB')).toBeInTheDocument();
    expect(screen.getByText('picture_as_pdf')).toBeInTheDocument();

    const sendButton = screen.getByRole('button', { name: /send message/i });
    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const formDataArg = mockCreate.mock.calls[0][0];
    expect(formDataArg.get('media_type')).toBe('file');
    expect(formDataArg.get('file_name')).toBe('doc.pdf');
    expect(formDataArg.get('file_size')).toBe('1048576');
  });
});
