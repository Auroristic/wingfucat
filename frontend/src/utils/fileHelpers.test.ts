import { describe, it, expect } from 'vitest';
import { formatBytes, getFileCategory, getFileIconName } from './fileHelpers';

describe('fileHelpers', () => {
  describe('formatBytes', () => {
    it('formats 0 bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('formats byte quantities below 1 KB', () => {
      expect(formatBytes(512)).toBe('512 B');
    });

    it('formats kilobytes correctly', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(2048)).toBe('2 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1572864)).toBe('1.5 MB');
    });

    it('formats gigabytes correctly', () => {
      expect(formatBytes(1073741824)).toBe('1 GB');
    });
  });

  describe('getFileCategory', () => {
    it('identifies image files by mime type or extension', () => {
      expect(getFileCategory({ type: 'image/jpeg', name: 'photo.jpg' })).toBe('image');
      expect(getFileCategory({ type: 'image/png', name: 'screenshot.png' })).toBe('image');
      expect(getFileCategory({ type: '', name: 'image.webp' })).toBe('image');
    });

    it('identifies video files by mime type or extension', () => {
      expect(getFileCategory({ type: 'video/mp4', name: 'clip.mp4' })).toBe('video');
      expect(getFileCategory({ type: 'video/webm', name: 'stream.webm' })).toBe('video');
      expect(getFileCategory({ type: '', name: 'movie.mov' })).toBe('video');
    });

    it('identifies documents and other files as "file"', () => {
      expect(getFileCategory({ type: 'application/pdf', name: 'contract.pdf' })).toBe('file');
      expect(getFileCategory({ type: 'application/zip', name: 'archive.zip' })).toBe('file');
      expect(getFileCategory({ type: 'text/plain', name: 'notes.txt' })).toBe('file');
      expect(getFileCategory({ type: '', name: 'unknown_binary' })).toBe('file');
    });
  });

  describe('getFileIconName', () => {
    it('returns picture_as_pdf for PDF files', () => {
      expect(getFileIconName('invoice.pdf')).toBe('picture_as_pdf');
      expect(getFileIconName('DOCUMENT.PDF')).toBe('picture_as_pdf');
    });

    it('returns folder_zip for archive files', () => {
      expect(getFileIconName('backup.zip')).toBe('folder_zip');
      expect(getFileIconName('data.tar.gz')).toBe('folder_zip');
      expect(getFileIconName('package.7z')).toBe('folder_zip');
    });

    it('returns video_file for video extensions', () => {
      expect(getFileIconName('vacation.mp4')).toBe('video_file');
      expect(getFileIconName('clip.webm')).toBe('video_file');
      expect(getFileIconName('recording.mov')).toBe('video_file');
    });

    it('returns audio_file for audio extensions', () => {
      expect(getFileIconName('song.mp3')).toBe('audio_file');
      expect(getFileIconName('voice.ogg')).toBe('audio_file');
    });

    it('returns description for documents', () => {
      expect(getFileIconName('resume.docx')).toBe('description');
      expect(getFileIconName('letter.doc')).toBe('description');
    });

    it('returns table_chart for spreadsheets', () => {
      expect(getFileIconName('budget.xlsx')).toBe('table_chart');
      expect(getFileIconName('metrics.csv')).toBe('table_chart');
    });

    it('returns text_snippet for code/text files', () => {
      expect(getFileIconName('notes.txt')).toBe('text_snippet');
      expect(getFileIconName('README.md')).toBe('text_snippet');
    });

    it('returns insert_drive_file for general/unknown files', () => {
      expect(getFileIconName('unknown.bin')).toBe('insert_drive_file');
      expect(getFileIconName('mystery')).toBe('insert_drive_file');
    });
  });
});
