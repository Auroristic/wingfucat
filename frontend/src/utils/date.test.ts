import { describe, it, expect } from 'vitest';
import { parseDate, toPocketBaseDate } from './date';

describe('parseDate utility', () => {
  it('returns 0 for empty or invalid inputs', () => {
    expect(parseDate(null)).toBe(0);
    expect(parseDate(undefined)).toBe(0);
    expect(parseDate('')).toBe(0);
    expect(parseDate('   ')).toBe(0);
    expect(parseDate('invalid-date')).toBe(0);
  });

  it('correctly parses ISO 8601 timestamps', () => {
    const iso = '2026-09-23T10:00:00.000Z';
    expect(parseDate(iso)).toBe(new Date(iso).getTime());
  });

  it('correctly normalizes and parses PocketBase space-separated dates', () => {
    const pbDate = '2026-09-23 10:00:00.000Z';
    const expected = new Date('2026-09-23T10:00:00.000Z').getTime();
    expect(parseDate(pbDate)).toBe(expected);
  });
});

describe('toPocketBaseDate utility', () => {
  it('returns empty string for falsy/invalid inputs', () => {
    expect(toPocketBaseDate(null)).toBe('');
    expect(toPocketBaseDate(undefined)).toBe('');
    expect(toPocketBaseDate('')).toBe('');
    expect(toPocketBaseDate('invalid')).toBe('');
  });

  it('formats Date object to space-separated PocketBase datetime string', () => {
    const d = new Date('2026-09-23T10:30:00.000Z');
    expect(toPocketBaseDate(d)).toBe('2026-09-23 10:30:00.000Z');
  });

  it('normalizes ISO string with T to PocketBase string with space', () => {
    expect(toPocketBaseDate('2026-09-23T10:30:00.000Z')).toBe('2026-09-23 10:30:00.000Z');
  });

  it('preserves existing PocketBase space-separated format', () => {
    expect(toPocketBaseDate('2026-09-23 10:30:00.000Z')).toBe('2026-09-23 10:30:00.000Z');
  });
});
