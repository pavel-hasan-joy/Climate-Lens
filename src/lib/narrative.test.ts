import { describe, it, expect } from 'vitest';
import { generateDistrictNarrative } from './narrative';

describe('generateDistrictNarrative', () => {
  it('generates statistically significant sentences in English', () => {
    const res = generateDistrictNarrative({
      districtName: 'Rajshahi',
      metric: 'heat',
      lang: 'en',
      slopePerDecade: 0.42,
      slopePerYear: 0.042,
      pValue: 0.008,
      significant: true,
      trend: 'increasing',
      latestAnomaly: 0.65,
      pctAnomaly: 2.1,
      baselineMean: 33.5,
      percentile: 94,
      heatwaveDays36C: 48,
      heavyRainDays50mm: 6,
      longestDrySpellDays: 28,
    });

    expect(res.trendSentence).toContain('In Rajshahi, the average maximum temperature rose by 0.42 °C per decade');
    expect(res.trendSentence).toContain('statistically significant, p = 0.008');
    expect(res.anomalySentence).toContain('The latest 12 months were 0.7 °C above the 2001–2010 baseline');
    expect(res.anomalySentence).toContain('94th historical percentile');
    expect(res.extremeSentence).toContain('48 heatwave days (≥36°C)');
  });

  it('generates non-significant sentences in English clearly stating non-significance', () => {
    const res = generateDistrictNarrative({
      districtName: 'Sylhet',
      metric: 'rain',
      lang: 'en',
      slopePerDecade: 12.5,
      slopePerYear: 1.25,
      pValue: 0.342,
      significant: false,
      trend: 'no_trend',
      latestAnomaly: -45.0,
      pctAnomaly: -1.2,
      baselineMean: 4100,
      percentile: 45,
      heatwaveDays36C: 2,
      heavyRainDays50mm: 32,
      longestDrySpellDays: 14,
    });

    expect(res.trendSentence).toContain('not statistically significant (p = 0.342)');
    expect(res.anomalySentence).toContain('below the 2001–2010 baseline');
  });

  it('generates sentences in Bangla with Bengali numerals', () => {
    const res = generateDistrictNarrative({
      districtName: 'রাজশাহী',
      metric: 'heat',
      lang: 'bn',
      slopePerDecade: 0.4,
      slopePerYear: 0.04,
      pValue: 0.015,
      significant: true,
      trend: 'increasing',
      latestAnomaly: 0.8,
      pctAnomaly: 2.5,
      baselineMean: 33.5,
      percentile: 92,
      heatwaveDays36C: 45,
      heavyRainDays50mm: 4,
      longestDrySpellDays: 25,
    });

    expect(res.trendSentence).toContain('রাজশাহী-এ');
    expect(res.trendSentence).toContain('পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ');
    expect(res.trendSentence).toContain('০.৪০');
    expect(res.anomalySentence).toContain('ঐতিহাসিক ৯২তম পার্সেন্টাইলে');
    expect(res.extremeSentence).toContain('৪৫ দিন তীব্র তাপপ্রবাহ');
  });
});
