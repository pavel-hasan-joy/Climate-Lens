import { describe, it, expect } from 'vitest';
import { computeMannKendallAsync, computeTheilSenAsync } from './workerMetrics';
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
});
