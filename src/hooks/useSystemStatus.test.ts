import { describe, it, expect } from 'vitest';
import { formatStatusDate } from './useSystemStatus';

describe('formatStatusDate', () => {
  it('formats ISO date in English correctly', () => {
    const formatted = formatStatusDate('2026-10-02T16:33:32.499Z', 'en');
    expect(formatted).toBe('2 Oct 2026');
  });

  it('formats ISO date in Bengali numerals and localized month', () => {
    const formatted = formatStatusDate('2026-10-02T16:33:32.499Z', 'bn');
    expect(formatted).toBe('২ অক্টো ২০২৬');
  });

  it('handles invalid date strings gracefully', () => {
    const fallback = formatStatusDate('not-a-valid-date', 'en');
    expect(fallback).toBe('not-a-valid-date');
  });
});
