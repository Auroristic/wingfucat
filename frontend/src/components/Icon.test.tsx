import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icon } from './Icon';

describe('Icon component', () => {
  it('renders Material Symbols Rounded icon', () => {
    render(<Icon name="send" />);
    const icon = screen.getByText('send');
    expect(icon).toBeInTheDocument();
    expect(icon.tagName.toLowerCase()).toBe('span');
    expect(icon.className).toContain('material-symbols-rounded');
    expect(icon.className).toContain('select-none');
    expect(icon.textContent).toBe('send');
  });

  it('applies custom className', () => {
    render(<Icon name="mic" className="text-zinc-400" />);
    const icon = screen.getByText('mic');
    expect(icon.className).toContain('material-symbols-rounded');
    expect(icon.className).toContain('select-none');
    expect(icon.className).toContain('text-zinc-400');
  });
});
