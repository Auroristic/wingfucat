import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeSettingsModal } from './ThemeSettingsModal';
import { ThemeProvider } from '../context/ThemeContext';

describe('ThemeSettingsModal Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders modal with live preview box and 5 presets when open', () => {
    render(
      <ThemeProvider>
        <ThemeSettingsModal isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>
    );

    expect(screen.getByText(/appearance & themes/i)).toBeInTheDocument();
    expect(screen.getByTestId('theme-preview-box')).toBeInTheDocument();

    // 5 Presets
    expect(screen.getByText('Minimalist OLED')).toBeInTheDocument();
    expect(screen.getByText('Pink Cloud')).toBeInTheDocument();
    expect(screen.getByText('Cyberpunk')).toBeInTheDocument();
    expect(screen.getByText('Lavender Dream')).toBeInTheDocument();
    expect(screen.getByText('Futuristic')).toBeInTheDocument();
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
});
