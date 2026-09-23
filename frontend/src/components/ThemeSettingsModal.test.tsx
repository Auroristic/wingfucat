import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeSettingsModal } from './ThemeSettingsModal';
import { ThemeProvider } from '../context/ThemeContext';

describe('ThemeSettingsModal Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders modal with live preview box and 7 presets when open', () => {
    render(
      <ThemeProvider>
        <ThemeSettingsModal isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>
    );

    expect(screen.getByText(/appearance & themes/i)).toBeInTheDocument();
    expect(screen.getByTestId('theme-preview-box')).toBeInTheDocument();

    // 7 Presets
    expect(screen.getByText('Minimalist OLED')).toBeInTheDocument();
    expect(screen.getByText('Pink Cloud')).toBeInTheDocument();
    expect(screen.getByText('Cyberpunk')).toBeInTheDocument();
    expect(screen.getByText('Lavender Dream')).toBeInTheDocument();
    expect(screen.getByText('Futuristic')).toBeInTheDocument();
    expect(screen.getByText('Terminal TUI')).toBeInTheDocument();
    expect(screen.getByText('Daylight')).toBeInTheDocument();
  });

  it('updates live preview when selecting a preset', () => {
    render(
      <ThemeProvider>
        <ThemeSettingsModal isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>
    );

    const pinkCloudButton = screen.getByRole('button', { name: /pink cloud/i });
    fireEvent.click(pinkCloudButton);

    const preview = screen.getByTestId('theme-preview-box');
    expect(preview).toHaveAttribute('data-preview-theme', 'pink-cloud');
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <ThemeProvider>
        <ThemeSettingsModal isOpen={true} onClose={handleClose} />
      </ThemeProvider>
    );

    const closeBtn = screen.getByRole('button', { name: /close appearance settings/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders wallpaper controls and updates wallpaper via URL input', () => {
    render(
      <ThemeProvider>
        <ThemeSettingsModal isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>
    );

    expect(screen.getByText(/wallpaper & atmosphere/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload image/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/paste wallpaper url/i)).toBeInTheDocument();

    const urlInput = screen.getByPlaceholderText(/paste wallpaper url/i);
    fireEvent.change(urlInput, { target: { value: 'https://example.com/custom.jpg' } });

    const applyBtn = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyBtn);

    const preview = screen.getByTestId('theme-preview-box');
    expect(preview.style.backgroundImage).toContain('https://example.com/custom.jpg');
  });

  it('renders sound effects controls and toggles sound setting in Sensory tab', () => {
    render(
      <ThemeProvider>
        <ThemeSettingsModal isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>
    );

    const sensoryTab = screen.getByRole('button', { name: /sensory/i });
    fireEvent.click(sensoryTab);

    expect(screen.getByText(/sound effects/i)).toBeInTheDocument();
    const testSoundBtn = screen.getByRole('button', { name: /test sound/i });
    expect(testSoundBtn).toBeInTheDocument();

    const switchBtn = screen.getByRole('switch', { name: /toggle sound effects/i });
    expect(switchBtn).toBeInTheDocument();
    expect(switchBtn).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(switchBtn);
    expect(switchBtn).toHaveAttribute('aria-checked', 'false');
    expect(testSoundBtn).toBeDisabled();
  });

  it('allows adjusting frost level in Interface tab, and locks at 0% when Terminal TUI is active', () => {
    render(
      <ThemeProvider>
        <ThemeSettingsModal isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>
    );

    const interfaceTab = screen.getByRole('button', { name: /interface/i });
    fireEvent.click(interfaceTab);

    expect(screen.getByText(/glass frost level/i)).toBeInTheDocument();
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();

    // Now switch to vibe tab and pick Terminal TUI
    const vibeTab = screen.getByRole('button', { name: /vibe/i });
    fireEvent.click(vibeTab);
    const tuiButton = screen.getByRole('button', { name: /terminal tui/i });
    fireEvent.click(tuiButton);

    // Switch back to interface tab
    fireEvent.click(interfaceTab);
    expect(screen.getByText(/glass frost locked at 0%/i)).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeDisabled();
  });
});
