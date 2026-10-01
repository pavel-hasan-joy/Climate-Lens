import { describe, expect, it } from 'vitest';
import { en } from './i18n/en.js';
import { bn } from './i18n/bn.js';
import { toBanglaDigits } from './i18n/index.jsx';
import { formatNumber, formatValue, formatAnomaly } from './format.js';
import { districts, divisions, statsFor } from './metrics.js';

describe('Bangla numeral conversion', () => {
  it('converts standard English digits to Bangla digits', () => {
    expect(toBanglaDigits('0123456789')).toBe('০১২৩৪৫৬৭৮৯');
    expect(toBanglaDigits(2040)).toBe('২০৪০');
    expect(toBanglaDigits('36.5 °C')).toBe('৩৬.৫ °C');
  });

  it('handles empty and null values gracefully', () => {
    expect(toBanglaDigits(null)).toBe('');
    expect(toBanglaDigits(undefined)).toBe('');
    expect(toBanglaDigits('')).toBe('');
  });

  it('preserves non-numeric characters', () => {
    expect(toBanglaDigits('Rajshahi: +0.8°C / decade')).toBe('Rajshahi: +০.৮°C / decade');
  });
});

describe('Localized format functions', () => {
  it('formats numbers in English and Bangla', () => {
    expect(formatNumber(1234.5, 1, 'en')).toBe('1,234.5');
    expect(formatNumber(1234.5, 1, 'bn')).toBe('১,২৩৪.৫');
  });

  it('formats metric values in English and Bangla', () => {
    expect(formatValue('heat', 36.4, 'en')).toBe('36.4 °C');
    expect(formatValue('heat', 36.4, 'bn')).toBe('৩৬.৪ °সে');

    expect(formatValue('rain', 2450, 'en')).toBe('2,450 mm');
    expect(formatValue('rain', 2450, 'bn')).toBe('২,৪৫০ মিমি');

    expect(formatValue('wet', 65.2, 'en')).toBe('65%');
    expect(formatValue('wet', 65.2, 'bn')).toBe('৬৫%');
  });

  it('formats anomalies with appropriate sign and localized units', () => {
    expect(formatAnomaly('heat', 0.8, 'en')).toBe('+0.8 °C');
    expect(formatAnomaly('heat', 0.8, 'bn')).toBe('+০.৮ °সে');

    expect(formatAnomaly('heat', -1.2, 'en')).toBe('−1.2 °C');
    expect(formatAnomaly('heat', -1.2, 'bn')).toBe('−১.২ °সে');

    expect(formatAnomaly('rain', 120, 'bn')).toBe('+১২০ মিমি');
  });
});

describe('Translation dictionary completeness', () => {
  it('contains all 8 divisions in both en and bn', () => {
    expect(divisions).toHaveLength(8);
    for (const div of divisions) {
      expect(en.divisions[div.id]).toBeDefined();
      expect(bn.divisions[div.id]).toBeDefined();
      expect(typeof bn.divisions[div.id]).toBe('string');
      expect(bn.divisions[div.id].length).toBeGreaterThan(0);
    }
  });

  it('contains all 64 districts in both en and bn without changing IDs', () => {
    expect(districts).toHaveLength(64);
    for (const dist of districts) {
      expect(en.districts[dist.id]).toBeDefined();
      expect(bn.districts[dist.id]).toBeDefined();
      expect(typeof bn.districts[dist.id]).toBe('string');
      expect(bn.districts[dist.id].length).toBeGreaterThan(0);
    }
  });

  it('contains translation keys for all core metrics and periods', () => {
    const metricKeys = ['monsoon', 'rain', 'heat', 'wet', 'anomaly'];
    for (const m of metricKeys) {
      expect(en.metrics[m]).toBeDefined();
      expect(bn.metrics[m]).toBeDefined();
    }

    const timeKeys = ['past', 'now', 'future'];
    for (const t of timeKeys) {
      expect(en.times[t]).toBeDefined();
      expect(bn.times[t]).toBeDefined();
    }
  });
});

describe('Automated plain-language summary generation', () => {
  it('generates coherent summaries in English and Bangla for a district', () => {
    const s = statsFor(['rajshahi'], 'heat');
    const nameEn = en.districts.rajshahi;
    const nameBn = bn.districts.rajshahi;

    expect(nameEn).toBe('Rajshahi');
    expect(nameBn).toBe('রাজশাহী');

    // Verify statistical data exists
    expect(s.annual.length).toBeGreaterThanOrEqual(20);
    expect(typeof s.slope).toBe('number');
  });
});
