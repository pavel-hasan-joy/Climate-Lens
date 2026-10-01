import { describe, expect, it } from 'vitest';
import { CROPS, analyzeCropClimate, checkUnusualNow } from './agriculture.js';
import { districts } from './metrics.js';

describe('Agricultural Crop Calendars & Metadata', () => {
  it('defines crop calendars for Aman, Aus, and Boro rice', () => {
    expect(CROPS).toHaveProperty('aman');
    expect(CROPS).toHaveProperty('aus');
    expect(CROPS).toHaveProperty('boro');
  });

  it('contains valid month indices [0..11] and bilingual titles for each crop', () => {
    for (const [id, crop] of Object.entries(CROPS)) {
      expect(crop.id).toBe(id);
      expect(crop.nameEn).toBeTruthy();
      expect(crop.nameBn).toBeTruthy();
      expect(crop.seasonEn).toBeTruthy();
      expect(crop.seasonBn).toBeTruthy();
      expect(crop.months.length).toBeGreaterThanOrEqual(4);
      crop.months.forEach((m) => {
        expect(m).toBeGreaterThanOrEqual(0);
        expect(m).toBeLessThanOrEqual(11);
      });
    }
  });
});

describe('Growing season climate analysis and risk estimation', () => {
  const testDistricts = ['dhaka', 'rajshahi', 'sylhet', 'cox-s-bazar'];

  it('computes rainfall and soil wetness for baseline, now, and projected 2040', () => {
    for (const distId of testDistricts) {
      for (const cropId of ['aman', 'aus', 'boro']) {
        const res = analyzeCropClimate(distId, cropId);
        expect(res).toBeDefined();

        expect(res.baseline.rain).toBeGreaterThan(0);
        expect(res.baseline.wet).toBeGreaterThan(0);
        expect(res.now.rain).toBeGreaterThan(0);
        expect(res.now.wet).toBeGreaterThan(0);
        expect(res.projected.rain).toBeGreaterThan(0);
        expect(res.projected.wet).toBeGreaterThan(0);

        expect(['low', 'medium', 'high']).toContain(res.risk);
        expect(res.reasonEn).toBeTruthy();
        expect(res.reasonBn).toBeTruthy();
      }
    }
  });

  it('handles fallbacks for unknown district IDs gracefully', () => {
    const res = analyzeCropClimate('non-existent-district', 'aman');
    expect(res).toBeDefined();
    expect(res.baseline.rain).toBeGreaterThan(0);
  });
});

describe('"Unusual now" 30–60 day historical normal comparison', () => {
  it('correctly evaluates 60-day readings against historical baseline', () => {
    const res = checkUnusualNow('dhaka');
    expect(res).toBeDefined();
    expect(typeof res.isUnusual).toBe('boolean');
    expect(res.totalDays).toBe(60);
    expect(res.curRain).toBeGreaterThanOrEqual(0);
    expect(res.meanRain).toBeGreaterThanOrEqual(0);
    expect(res.titleEn).toBeTruthy();
    expect(res.titleBn).toBeTruthy();
    expect(res.detailEn).toBeTruthy();
    expect(res.detailBn).toBeTruthy();
  });

  it('runs across all 64 districts without error', () => {
    for (const d of districts) {
      const res = checkUnusualNow(d.id);
      expect(typeof res.isUnusual).toBe('boolean');
      expect(['normal', 'alert']).toContain(res.badgeType);
    }
  });
});
