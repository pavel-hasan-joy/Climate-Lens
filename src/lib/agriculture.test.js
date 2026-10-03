import { describe, expect, it } from 'vitest';
import { CROPS, analyzeCropClimate, checkUnusualNow, generateDistrictStory } from './agriculture.js';
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

  it('computes rainfall, soil wetness, and max temperature for baseline, now, and projected 2040', () => {
    for (const distId of testDistricts) {
      for (const cropId of ['aman', 'aus', 'boro']) {
        const res = analyzeCropClimate(distId, cropId);
        expect(res).toBeDefined();

        // Baseline, Now, Projected
        expect(res.baseline.rain).toBeGreaterThan(0);
        expect(res.baseline.wet).toBeGreaterThan(0);
        expect(res.baseline.tmax).toBeGreaterThan(15);

        expect(res.now.rain).toBeGreaterThan(0);
        expect(res.now.wet).toBeGreaterThan(0);
        expect(res.now.tmax).toBeGreaterThan(15);

        expect(res.projected.rain).toBeGreaterThan(0);
        expect(res.projected.wet).toBeGreaterThan(0);
        expect(res.projected.tmax).toBeGreaterThan(15);

        // Changes
        expect(typeof res.changes.rainDiffPct).toBe('number');
        expect(typeof res.changes.wetDiffPts).toBe('number');
        expect(typeof res.changes.tmaxDiff).toBe('number');

        // Risk & Reasoning
        expect(['low', 'medium', 'high']).toContain(res.risk);
        expect(res.reasonEn).toBeTruthy();
        expect(res.reasonBn).toBeTruthy();

        // Transparent non-black-box decision rule criteria
        expect(res.ruleCriteriaEn).toBeTruthy();
        expect(res.ruleCriteriaBn).toBeTruthy();
        expect(res.ruleCriteriaEn).toContain('Risk');
      }
    }
  });

  it('handles fallbacks for unknown district IDs gracefully', () => {
    const res = analyzeCropClimate('non-existent-district', 'aman');
    expect(res).toBeDefined();
    expect(res.baseline.rain).toBeGreaterThan(0);
    expect(res.baseline.tmax).toBeGreaterThan(0);
  });
});

describe('District Story Card Generation (3 Plain-Language Sentences)', () => {
  const regions = [
    { id: 'satkhira', zone: 'coastal' },
    { id: 'rajshahi', zone: 'barind' },
    { id: 'sunamganj', zone: 'haor' },
    { id: 'bandarban', zone: 'hill tracts' },
    { id: 'dhaka', zone: 'urban/floodplain' },
  ];

  it('generates 3 distinct sentences in English and Bengali for diverse ecological zones', () => {
    for (const { id } of regions) {
      const storyEn = generateDistrictStory(id, 'en');
      expect(storyEn).toBeDefined();
      expect(storyEn.sentence1).toBeTruthy();
      expect(storyEn.sentence2).toBeTruthy();
      expect(storyEn.sentence3).toBeTruthy();
      expect(storyEn.fullText).toContain(storyEn.sentence1);

      // Sentence 1 checks 20-year change
      expect(storyEn.sentence1).toMatch(/2001–2025/);

      // Sentence 2 checks 2040 projection
      expect(storyEn.sentence2).toMatch(/2040/);

      // Sentence 3 checks affected population
      expect(storyEn.sentence3.length).toBeGreaterThan(20);

      const storyBn = generateDistrictStory(id, 'bn');
      expect(storyBn.sentence1).toMatch(/২০০১–২০২৫/);
      expect(storyBn.sentence2).toMatch(/২০৪০/);
      expect(storyBn.sentence3.length).toBeGreaterThan(20);
    }
  });
});

describe('"Unusual now" 30–60 day historical normal comparison', () => {
  it('correctly evaluates 60-day readings against historical baseline and percentiles', () => {
    const res = checkUnusualNow('dhaka');
    expect(res).toBeDefined();
    expect(typeof res.isUnusual).toBe('boolean');
    expect(res.totalDays).toBe(60);
    expect(res.curRain).toBeGreaterThanOrEqual(0);
    expect(res.meanRain).toBeGreaterThanOrEqual(0);
    expect(res.pRain).toBeGreaterThanOrEqual(1);
    expect(res.pRain).toBeLessThanOrEqual(99);
    expect(res.pTmax).toBeGreaterThanOrEqual(1);
    expect(res.pTmax).toBeLessThanOrEqual(99);
    expect(res.pWet).toBeGreaterThanOrEqual(1);
    expect(res.pWet).toBeLessThanOrEqual(99);
    expect(res.p10Rain).toBeLessThanOrEqual(res.p90Rain);
    expect(res.p10Tmax).toBeLessThanOrEqual(res.p90Tmax);
    expect(res.metrics).toHaveLength(3);
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
      expect(res.metrics).toBeDefined();
      expect(res.metrics.length).toBe(3);
    }
  });
});
