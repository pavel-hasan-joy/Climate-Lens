import { describe, it, expect } from 'vitest';
import { computeMannKendallAsync, computeTheilSenAsync, analyzeDistrictAsync } from './workerMetrics';
import { mannKendall, theilSen } from './metrics';

describe('workerMetrics', () => {
  const series = [10.2, 11.4, 11.8, 12.5, 12.9, 13.4, 14.1, 14.9, 15.3, 16.0];
  const xs = series.map((_, i) => 2000 + i);

  it('computes Mann-Kendall matching synchronous implementation', async () => {
    const expected = mannKendall(series);
    const result = await computeMannKendallAsync(series);

    expect(result.s).toBe(expected.s);
    expect(result.significant).toBe(expected.significant);
    expect(result.p).toBeCloseTo(expected.p, 3);
  });

  it('computes Theil-Sen regression matching synchronous implementation', async () => {
    const expected = theilSen(xs, series);
    const result = await computeTheilSenAsync(xs, series);

    expect(result.slope).toBeCloseTo(expected.slope, 4);
    expect(result.intercept).toBeCloseTo(expected.intercept, 4);
    expect(result.sd).toBeCloseTo(expected.sd, 4);
    expect(result.at(2010)).toBeCloseTo(expected.at(2010), 4);
  });

  it('computes comprehensive district statistical analysis via analyzeDistrictAsync', async () => {
    // 5 years of data: 2020..2024
    const years = [2020, 2021, 2022, 2023, 2024];
    // 12 months for each year
    const monthlyRain = years.map((_, yIdx) => Array.from({ length: 12 }, (_, mIdx) => 50 + yIdx * 10 + mIdx));
    const monthlyTmax = years.map((_, yIdx) => Array.from({ length: 12 }, (_, mIdx) => 28 + yIdx * 0.5 + mIdx * 0.2));
    const monthlyWet = years.map(() => Array.from({ length: 12 }, () => 0.65));

    // Daily test data with known extremes:
    // Heatwave days >= 36C and >= 38C
    // Heavy rain >= 50mm
    // Dry spell
    const dates = [
      '20240401',
      '20240402',
      '20240403',
      '20240404',
      '20240405',
      '20240406',
      '20240407',
      '20240408',
      '20240409',
      '20240410',
    ];
    const dailyTmax = [35.0, 36.5, 38.5, 39.0, 34.0, 32.0, 33.0, 34.0, 35.0, 36.2];
    const dailyRain = [0.0, 0.0, 0.0, 0.0, 0.0, 65.0, 0.0, 10.0, 0.0, 0.0];

    const result = await analyzeDistrictAsync({
      years,
      monthly: {
        rain: monthlyRain,
        tmax: monthlyTmax,
        wet: monthlyWet,
      },
      daily: {
        dates,
        tmax: dailyTmax,
        rain: dailyRain,
      },
      baselineStart: 2020,
      baselineEnd: 2022,
    });

    // Check statistical metrics
    expect(result.metrics).toBeDefined();
    expect(result.metrics.heat).toBeDefined();
    expect(result.metrics.rain).toBeDefined();

    // Heat trend should be increasing since temperatures increase each year
    expect(result.metrics.heat.slopePerYear).toBeGreaterThan(0);
    expect(result.metrics.heat.slopePerDecade).toBeCloseTo(result.metrics.heat.slopePerYear * 10, 3);
    expect(result.metrics.heat.mannKendall.trend).toBe('increasing');
    expect(result.metrics.heat.latestAnomaly).toBeGreaterThan(0);

    // Check extremes computation
    expect(result.extremes).toBeDefined();
    // In dailyTmax: 36.5, 38.5, 39.0, 36.2 are >= 36°C (4 days)
    expect(result.extremes.heatwaveDays36C).toBe(4);
    // In dailyTmax: 38.5, 39.0 are >= 38°C (2 days)
    expect(result.extremes.heatwaveDays38C).toBe(2);
    // In dailyRain: 65.0 is >= 50 mm (1 day)
    expect(result.extremes.heavyRainDays50mm).toBe(1);
    // Longest dry spell: 20240401-20240405 is 5 consecutive days with rain < 1mm
    expect(result.extremes.longestDrySpellDays).toBe(5);
    expect(result.extremes.maxDailyRainMm).toBe(65.0);
    expect(result.extremes.maxRecordedTmaxC).toBe(39.0);
  });
});
