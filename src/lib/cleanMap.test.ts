import { describe, expect, it } from 'vitest';
import { en } from './i18n/en';
import { bn } from './i18n/bn';

describe('Clean Map / Focus Mode i18n & configuration', () => {
  it('defines all required cleanMap translation keys in English', () => {
    expect(en.cleanMap).toBeDefined();
    expect(en.cleanMap.focus).toBe('Clean Map');
    expect(en.cleanMap.restore).toBe('Show Panels');
    expect(en.cleanMap.shortcut).toBe('F');
    expect(en.cleanMap.exitShortcut).toBe('Esc');
    expect(en.cleanMap.tooltipFocus).toContain('F');
    expect(en.cleanMap.tooltipRestore).toContain('Esc');
  });

  it('defines all required cleanMap translation keys in Bangla', () => {
    expect(bn.cleanMap).toBeDefined();
    expect(bn.cleanMap.focus).toBe('ক্লিন ম্যাপ');
    expect(bn.cleanMap.restore).toBe('প্যানেল দেখান');
    expect(bn.cleanMap.shortcut).toBe('F');
    expect(bn.cleanMap.exitShortcut).toBe('Esc');
    expect(bn.cleanMap.tooltipFocus).toContain('F');
    expect(bn.cleanMap.tooltipRestore).toContain('Esc');
  });

  it('preserves matching key structures between en and bn for cleanMap', () => {
    const enKeys = Object.keys(en.cleanMap).sort();
    const bnKeys = Object.keys(bn.cleanMap).sort();
    expect(enKeys).toEqual(bnKeys);
  });
});
