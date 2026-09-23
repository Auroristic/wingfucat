import { describe, it, expect } from 'vitest';
import { parseDate } from './date';

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
