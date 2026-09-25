import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentCard } from './DocumentCard';
import { ThemeProvider } from '../context/ThemeContext';

describe('DocumentCard Component', () => {
  it('renders file name, formatted size, and download link', () => {
    render(
      <DocumentCard
        fileName="Contract_Final.pdf"
        fileSize={2097152}
        fileUrl="https://example.com/files/Contract_Final.pdf"
        isSelf={false}
      />
    );

    expect(screen.getByText('Contract_Final.pdf')).toBeInTheDocument();
    expect(screen.getByText('2 MB')).toBeInTheDocument();
    expect(screen.getByText('picture_as_pdf')).toBeInTheDocument();

    const downloadLink = screen.getByRole('link', { name: /download/i });
    expect(downloadLink).toHaveAttribute('href', 'https://example.com/files/Contract_Final.pdf');
    expect(downloadLink).toHaveAttribute('download', 'Contract_Final.pdf');
  });

  it('renders ASCII brackets and terminal styling under terminal-tui theme', () => {
    localStorage.setItem('wingfucat_theme', JSON.stringify({ id: 'terminal-tui' }));

    render(
      <ThemeProvider>
        <DocumentCard
          fileName="report.zip"
          fileSize={1048576}
          fileUrl="https://example.com/files/report.zip"
          isSelf={true}
        />
      </ThemeProvider>
    );

    expect(screen.getByText(/\[FILE: report\.zip\]/i)).toBeInTheDocument();
    expect(screen.getByTestId('document-card')).toHaveClass('font-mono');
  });
});
