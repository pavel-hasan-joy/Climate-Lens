import { describe, expect, it } from 'vitest';
import {
  mean,
  median,
  theilSen,
  mannKendall,
  calculateExtremeIndicators,
  fromMonths,
  monthlyValue,
  DAYS,
  statsFor,
  idsOf,
  districts,
} from './metrics.js';

describe('Statistical calculations (mean & median)', () => {
  it('calculates arithmetic mean correctly', () => {
    expect(mean([10, 20, 30])).toBe(20);
    expect(mean([0, 0, 0])).toBe(0);
    expect(mean([-5, 5])).toBe(0);
  });

  it('calculates median for odd and even length arrays', () => {
    expect(median([1, 9, 3])).toBe(3);
    expect(median([1, 2, 8, 10])).toBe(5); // (2 + 8) / 2
    expect(median([7])).toBe(7);
  });
});

describe('Theil–Sen robust trend estimation', () => {
  it('correctly fits a straight line with known slope and intercept', () => {
    const xs = [2000, 2001, 2002, 2003, 2004];
    const ys = [10, 12, 14, 16, 18]; // slope = 2, intercept = 10 - 2*2000 = -3990
    const res = theilSen(xs, ys);

    expect(res.slope).toBeCloseTo(2, 5);
    expect(res.at(2005)).toBeCloseTo(20, 5);
    expect(res.at(2040)).toBeCloseTo(90, 5);
    expect(res.sd).toBeCloseTo(0, 5);
  });

  it('is robust to single-point extreme outliers', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [2, 4, 100, 8, 10]; // Outlier at index 2 (100 instead of 6)
    const res = theilSen(xs, ys);

    // Median slope should remain 2 despite 100 outlier
    expect(res.slope).toBeCloseTo(2, 1);
    expect(res.at(6)).toBeCloseTo(12, 1);
  });
});

describe('Metric aggregations from monthly data', () => {
  const dummyMonths = {
    rain: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // mm/day
    tmax: [20, 22, 28, 32, 34, 31, 30, 29, 28, 26, 24, 21], // °C
    wet: [0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.7, 0.8, 0.75, 0.6, 0.4, 0.35], // fraction
  };

  it('calculates monsoon rain for Jun-Sep (indices 5, 6, 7, 8)', () => {
    // Jun (30d), Jul (31d), Aug (31d), Sep (30d)
    const expected = 6 * DAYS[5] + 7 * DAYS[6] + 8 * DAYS[7] + 9 * DAYS[8];
    expect(fromMonths.monsoon(dummyMonths)).toBe(expected);
  });

  it('calculates full yearly rainfall across all 12 months', () => {
    const expected = dummyMonths.rain.reduce((sum, r, i) => sum + r * DAYS[i], 0);
    expect(fromMonths.rain(dummyMonths)).toBe(expected);
  });

  it('calculates peak summer heat average for Mar-May (indices 2, 3, 4)', () => {
    const expected = (28 + 32 + 34) / 3;
    expect(fromMonths.heat(dummyMonths)).toBeCloseTo(expected, 4);
  });

  it('calculates root-zone soil wetness percentage over the year', () => {
    const avgFraction = dummyMonths.wet.reduce((a, b) => a + b, 0) / 12;
    expect(fromMonths.wet(dummyMonths)).toBeCloseTo(avgFraction * 100, 4);
  });

  it('produces correct monthly values for the seasonal cycle', () => {
    // June rain as monthly total
    expect(monthlyValue.rain(dummyMonths, 5)).toBe(dummyMonths.rain[5] * DAYS[5]);
    // March heat as max temperature
    expect(monthlyValue.heat(dummyMonths, 2)).toBe(dummyMonths.tmax[2]);
    // May soil wetness as percentage
    expect(monthlyValue.wet(dummyMonths, 4)).toBeCloseTo(dummyMonths.wet[4] * 100, 4);
  });
});

describe('Past, Now, and Future district stats', () => {
  it('computes valid stats for all 64 districts', () => {
    expect(districts.length).toBe(64);
    const dhakaId = districts.find((d) => d.name === 'Dhaka')?.id;
    expect(dhakaId).toBeDefined();

    const dhakaRain = statsFor([dhakaId], 'rain');
    expect(dhakaRain.past).toBeGreaterThan(500); // Annual rain mm
    expect(dhakaRain.now).toBeGreaterThan(500);
    expect(dhakaRain.future).toBeGreaterThan(500);
    expect(dhakaRain.band).toBeGreaterThan(0);
    expect(dhakaRain.byYear.length).toBe(50); // 2001 to 2050
    expect(dhakaRain.cycle.past.length).toBe(12);
    expect(dhakaRain.cycle.now.length).toBe(12);
    expect(dhakaRain.cycle.future.length).toBe(12);
  });

  it('aggregates divisional and national stats correctly', () => {
    const allIds = idsOf(null);
    expect(allIds.length).toBe(64);

    const nationalHeat = statsFor(allIds, 'heat');
    expect(nationalHeat.past).toBeGreaterThan(25);
    expect(nationalHeat.past).toBeLessThan(45);
    expect(nationalHeat.future).toBeGreaterThan(25);
    expect(nationalHeat.future).toBeLessThan(45);
  });
});

describe('Mann–Kendall trend significance test', () => {
  it('computes exact S statistic, Z score, and p-value for known monotonic 5-element sequence', () => {
    // Strictly increasing 5-element sequence: [1, 2, 3, 4, 5]
    // Total pairs = 5*4/2 = 10, all diffs > 0 -> S = 10
    // Var(S) = (5 * 4 * 15) / 18 = 300 / 18 = 16.6667
    // sd(S) = sqrt(16.6667) = 4.08248
    // Z = (10 - 1) / 4.08248 = 2.2045
    // p-value ≈ 0.0275 < 0.05
    const series = [1, 2, 3, 4, 5];
    const res = mannKendall(series);
    expect(res.s).toBe(10);
    expect(res.z).toBeCloseTo(2.2045, 3);
    expect(res.p).toBeCloseTo(0.0275, 2);
    expect(res.significant).toBe(true);
  });

  it('computes exact S statistic and negative Z for strictly decreasing sequence', () => {
    const series = [10, 8, 6, 4, 2];
    const res = mannKendall(series);
    expect(res.s).toBe(-10);
    expect(res.z).toBeCloseTo(-2.2045, 3);
    expect(res.p).toBeCloseTo(0.0275, 2);
    expect(res.significant).toBe(true);
  });

  it('correctly accounts for tied values in variance reduction', () => {
    // Series with ties: [2, 2, 2, 5, 5] -> ties of 3 (value 2) and 2 (value 5)
    // S: pairs (2,2): 0, pairs (2,5): 3*2 = 6, pairs (5,5): 0 -> S = 6
    // n = 5: n*(n-1)*(2n+5) = 300
    // tieSum: t=3 -> 3*2*11 = 66, t=2 -> 2*1*9 = 18 -> tieSum = 84
    // Var(S) = (300 - 84) / 18 = 216 / 18 = 12
    // sd(S) = sqrt(12) = 3.4641
    // Z = (6 - 1) / 3.4641 = 1.4434
    // p-value ≈ 0.1489 -> not significant (p >= 0.05)
    const series = [2, 2, 2, 5, 5];
    const res = mannKendall(series);
    expect(res.s).toBe(6);
    expect(res.z).toBeCloseTo(1.4434, 3);
    expect(res.p).toBeGreaterThan(0.05);
    expect(res.significant).toBe(false);
  });

  it('detects a statistically significant upward trend in longer climate series', () => {
    const series = [1, 2, 4, 5, 7, 8, 10, 12, 14, 16, 18, 20, 22, 25];
    const res = mannKendall(series);
    expect(res.s).toBeGreaterThan(0);
    expect(res.z).toBeGreaterThan(1.96);
    expect(res.p).toBeLessThan(0.05);
    expect(res.significant).toBe(true);
  });

  it('detects non-significant random or flat sequence', () => {
    const series = [10, 11, 9, 10, 10, 11, 9, 10, 10, 11];
    const res = mannKendall(series);
    expect(res.p).toBeGreaterThan(0.05);
    expect(res.significant).toBe(false);
  });
});

describe('Extreme event indicator calculations', () => {
  const dummyDaily = {
    dates: ['20260801', '20260802', '20260803', '20260804', '20260805', '20260806'],
    tmax: [34, 36.5, 37.2, 33, 35, 38], // 3 days >= 36°C
    rain: [0, 0, 0, 55, 0, 60], // 2 days >= 50 mm, longest dry spell = 3 days (indices 0, 1, 2)
  };

  it('counts heatwave days, longest dry spell, and heavy rain days accurately', () => {
    const res = calculateExtremeIndicators(dummyDaily, 36.0, 50.0);
    expect(res.heatwaveDays).toBe(3);
    expect(res.longestDrySpell).toBe(3);
    expect(res.heavyRainDays).toBe(2);
    expect(res.totalDays).toBe(6);
  });
});

describe('Anomaly calculations and domain generation', () => {
  it('correctly calculates baseline anomaly difference in statsFor', () => {
    const allIds = idsOf(null);
    const s = statsFor(allIds, 'heat');
    expect(s.anomaly).toBeDefined();
    expect(s.anomaly.now).toBeCloseTo(s.now - s.past, 5);
    expect(s.anomaly.future).toBeCloseTo(s.future - s.past, 5);
  });
});

describe('Back-testing & Validation Dataset', () => {
  it('contains valid overall, division, and district level backtest statistics', async () => {
    const { validation } = await import('./metrics.js');
    expect(validation).toBeDefined();
    expect(validation.metadata.trainYears).toEqual([2001, 2015]);
    expect(validation.metadata.testYears).toEqual([2016, 2025]);
    expect(validation.metadata.totalDistricts).toBe(64);

    const metrics = ['monsoon', 'rain', 'heat', 'wet'];
    for (const m of metrics) {
      const o = validation.overall[m];
      expect(o).toBeDefined();
      expect(o.mae).toBeGreaterThan(0);
      expect(o.rmse).toBeGreaterThan(0);
      expect(o.coverage).toBeGreaterThanOrEqual(0);
      expect(o.coverage).toBeLessThanOrEqual(100);
    }

    // Check all 8 divisions are present
    const divisionKeys = Object.keys(validation.byDivision);
    expect(divisionKeys.length).toBe(8);

    // Check Dhaka district
    const dhaka = validation.districts['dhaka'];
    expect(dhaka).toBeDefined();
    expect(dhaka.name).toBe('Dhaka');
    expect(dhaka.metrics.heat.predicted.length).toBe(10);
    expect(dhaka.metrics.heat.actual.length).toBe(10);
  });
});

describe('NASA SEDAC Population & Exposure Impact Calculation', () => {
  it('loads valid 64-district population dataset', async () => {
    const { population } = await import('./metrics.js');
    expect(population).toBeDefined();
    expect(population.totalPopulation).toBeGreaterThan(160000000);
    expect(Object.keys(population.districts).length).toBe(64);

    const dhaka = population.districts['dhaka'];
    expect(dhaka.population).toBeGreaterThan(10000000);
    expect(dhaka.density).toBeGreaterThan(5000);
  });

  it('calculates exposed population with Mann–Kendall significance filtering', async () => {
    const { calculatePopulationExposure } = await import('./metrics.js');
    const exposure = calculatePopulationExposure();

    expect(exposure).toBeDefined();
    expect(exposure.totalNationalPop).toBeGreaterThan(160000000);
    // 63 out of 64 districts in Bangladesh exhibit statistically significant rainfall / wetting intensification
    expect(exposure.exposedPopTotal).toBeGreaterThan(150000000);
    expect(exposure.exposedDistrictsCount).toBe(63);
    expect(exposure.exposedWettingCount).toBe(63);
    expect(exposure.exposedWettingPop).toBeGreaterThan(150000000);
    expect(exposure.exposedPctTotal).toBeGreaterThan(95);

    // Each exposed district must have significant trend flagged
    for (const d of exposure.exposedDistricts) {
      expect(d.hasSignificantTrend).toBe(true);
      expect(d.population).toBeGreaterThan(0);
      expect(d.name).toBeDefined();
      expect(d.division).toBeDefined();
    }
  });
});

describe('NASA MODIS NDVI Dataset', () => {
  it('loads valid 64-district NDVI profiles with seasonal crop cycles', async () => {
    const { ndvi, getDistrictNdvi } = await import('./metrics.js');
    expect(ndvi).toBeDefined();
    expect(Object.keys(ndvi.districts).length).toBe(64);

    const bagerhat = getDistrictNdvi('bagerhat');
    expect(bagerhat).toBeDefined();
    expect(bagerhat.baselineMonthly.length).toBe(12);
    expect(bagerhat.recentMonthly.length).toBe(12);
    expect(bagerhat.seasons.boro.baseline).toBeGreaterThan(0.2);
    expect(bagerhat.seasons.aman.baseline).toBeGreaterThan(0.2);
    expect(['robust', 'normal', 'moderate-stress', 'severe-stress']).toContain(bagerhat.status);
  });
});
