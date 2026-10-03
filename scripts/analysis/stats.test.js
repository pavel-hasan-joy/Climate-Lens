import { describe, it, expect } from 'vitest';
import {
  sensSlope,
  mannKendall,
  baselineAnomaly,
  percentileRank,
  spearmanCorrelation,
  detrend,
  computeExtremeIndicators,
  normalCdf,
} from './stats.mjs';

describe('Statistical analysis functions', () => {
  describe('normalCdf', () => {
    it('calculates standard normal probabilities accurately', () => {
      expect(normalCdf(0)).toBeCloseTo(0.5, 4);
      expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
      expect(normalCdf(-1.96)).toBeCloseTo(0.025, 3);
    });
  });

  describe('sensSlope', () => {
    it('computes exact slope for linear series', () => {
      const xs = [2000, 2001, 2002, 2003, 2004];
      const ys = [10, 12, 14, 16, 18]; // slope = 2.0 / year -> 20.0 / decade
      const res = sensSlope(xs, ys);
      expect(res.slope).toBe(2);
      expect(res.slopePerDecade).toBe(20);
      expect(res.intercept).toBe(-3990); // 10 - 2 * 2000
    });

    it('is robust to single outlier', () => {
      const xs = [1, 2, 3, 4, 5];
      const ys = [1, 2, 999, 4, 5]; // Median slope is still 1
      const res = sensSlope(xs, ys);
      expect(res.slope).toBe(1);
      expect(res.slopePerDecade).toBe(10);
    });
  });

  describe('mannKendall', () => {
    it('detects strong significant positive trend', () => {
      const ys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const res = mannKendall(ys);
      expect(res.trend).toBe('increasing');
      expect(res.S).toBe(45); // 10*9/2
      expect(res.pValue).toBeLessThan(0.001);
    });

    it('detects no trend for oscillating series', () => {
      const ys = [5, 4, 6, 5, 4, 6, 5, 4, 6, 5];
      const res = mannKendall(ys);
      expect(res.trend).toBe('no_trend');
      expect(res.pValue).toBeGreaterThan(0.05);
    });

    it('handles tied observations properly', () => {
      const ys = [2, 2, 2, 3, 3, 4, 5, 5, 6, 7];
      const res = mannKendall(ys);
      expect(res.trend).toBe('increasing');
      expect(res.varS).toBeGreaterThan(0);
    });
  });

  describe('baselineAnomaly', () => {
    it('computes absolute and percentage anomaly vs baseline mean', () => {
      const baseline = [100, 110, 90, 100]; // mean = 100
      const res = baselineAnomaly(125, baseline);
      expect(res.baselineMean).toBe(100);
      expect(res.anomaly).toBe(25);
      expect(res.pctAnomaly).toBe(25);
    });

    it('computes negative anomaly', () => {
      const baseline = [20, 25, 15]; // mean = 20
      const res = baselineAnomaly(15, baseline);
      expect(res.anomaly).toBe(-5);
      expect(res.pctAnomaly).toBe(-25);
    });
  });

  describe('percentileRank', () => {
    it('ranks value properly against history', () => {
      const history = [10, 20, 30, 40, 50];
      expect(percentileRank(5, history)).toBe(0);
      expect(percentileRank(55, history)).toBe(100);
      expect(percentileRank(30, history)).toBe(50);
    });
  });

  describe('detrend', () => {
    it('removes linear trend from series', () => {
      const ys = [10, 20, 30, 40, 50];
      const residuals = detrend(ys);
      expect(residuals.every((r) => Math.abs(r) < 1e-10)).toBe(true);
    });
  });

  describe('spearmanCorrelation', () => {
    it('gives rho = 1 for monotonic increasing ranks', () => {
      const xs = [1, 2, 3, 4, 5, 6, 7];
      const ys = [10, 25, 30, 80, 90, 120, 200];
      const res = spearmanCorrelation(xs, ys);
      expect(res.rho).toBe(1);
      expect(res.pValue).toBeLessThan(0.01);
      expect(res.n).toBe(7);
    });

    it('gives negative correlation for opposing series', () => {
      const xs = [1, 2, 3, 4, 5, 6, 7];
      const ys = [100, 80, 70, 50, 40, 20, 10];
      const res = spearmanCorrelation(xs, ys);
      expect(res.rho).toBe(-1);
      expect(res.pValue).toBeLessThan(0.01);
    });
  });

  describe('computeExtremeIndicators', () => {
    it('computes heatwave days, longest dry spell and heavy rain days', () => {
      const daily = [
        { date: '2026-04-01', tmax: 35.0, rain: 0 },
        { date: '2026-04-02', tmax: 37.0, rain: 0 }, // heatwave
        { date: '2026-04-03', tmax: 38.5, rain: 0 }, // heatwave
        { date: '2026-04-04', tmax: 32.0, rain: 60 }, // heavy rain, breaks dry spell (3 days dry)
        { date: '2026-04-05', tmax: 30.0, rain: 0 },
        { date: '2026-04-06', tmax: 29.0, rain: 0 },
        { date: '2026-04-07', tmax: 31.0, rain: 0 },
        { date: '2026-04-08', tmax: 32.0, rain: 0 }, // 4 days dry
      ];

      const res = computeExtremeIndicators(daily, { heatwaveThreshold: 36.0, heavyRainThreshold: 50.0 });
      expect(res.heatwaveDays).toBe(2);
      expect(res.heavyRainDays).toBe(1);
      expect(res.longestDrySpell).toBe(4);
      expect(res.maxTmax).toBe(38.5);
      expect(res.maxDailyRain).toBe(60);
    });
  });
});
