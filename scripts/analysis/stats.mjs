/**
 * Statistical analysis library for climate, biodiversity, and crop data.
 *
 * Implements:
 *   - Theil–Sen estimator (Sen's slope per decade)
 *   - Mann–Kendall trend test with tie-corrected variance & two-tailed p-value
 *   - Baseline anomalies (vs 2001–2010 baseline)
 *   - Percentile ranking
 *   - Linear detrending
 *   - Spearman rank correlation with p-value and 95% Fisher CI
 *   - Climate extreme indicators (heatwave days, dry spells, heavy rain days)
 */

export const r1 = (n) => (n == null || Number.isNaN(n) ? null : Math.round(n * 10) / 10);
export const r2 = (n) => (n == null || Number.isNaN(n) ? null : Math.round(n * 100) / 100);
export const r3 = (n) => (n == null || Number.isNaN(n) ? null : Math.round(n * 1000) / 1000);
export const r4 = (n) => (n == null || Number.isNaN(n) ? null : Math.round(n * 10000) / 10000);

export function mean(arr) {
  if (!arr || !arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function median(arr) {
  if (!arr || !arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Standard Normal Cumulative Distribution Function Φ(z)
 * Uses Abramowitz and Stegun 7.1.26 approximation for erf
 */
export function normalCdf(z) {
  if (z === 0) return 0.5;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;

  // Abramowitz and Stegun formula 7.1.26
  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const t = 1.0 / (1.0 + p * x);
  const erf = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * erf);
}

/**
 * Sen's slope (Theil–Sen estimator).
 * @param {number[]} xs - Independent variable (e.g. years)
 * @param {number[]} ys - Dependent variable (e.g. temperature, precipitation)
 * @returns {{ slope: number, slopePerDecade: number, intercept: number }}
 */
export function sensSlope(xs, ys) {
  if (!xs || !ys || xs.length !== ys.length || xs.length < 2) {
    return { slope: 0, slopePerDecade: 0, intercept: 0 };
  }

  const slopes = [];
  const n = xs.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = xs[j] - xs[i];
      if (dx !== 0) {
        slopes.push((ys[j] - ys[i]) / dx);
      }
    }
  }

  if (slopes.length === 0) {
    return { slope: 0, slopePerDecade: 0, intercept: ys[0] ?? 0 };
  }

  const slope = median(slopes);
  const intercepts = ys.map((y, i) => y - slope * xs[i]);
  const intercept = median(intercepts);

  return {
    slope: r4(slope),
    slopePerDecade: r4(slope * 10),
    intercept: r4(intercept),
  };
}

/**
 * Mann–Kendall non-parametric trend test.
 * @param {number[]} ys - Time series values in chronological order
 * @returns {{ S: number, varS: number, z: number, pValue: number, trend: 'increasing'|'decreasing'|'no_trend' }}
 */
export function mannKendall(ys) {
  const n = ys?.length ?? 0;
  if (n < 4) {
    return { S: 0, varS: 0, z: 0, pValue: 1, trend: 'no_trend' };
  }

  let S = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const diff = ys[j] - ys[i];
      if (diff > 0) S += 1;
      else if (diff < 0) S -= 1;
    }
  }

  // Count tied groups
  const counts = new Map();
  for (const y of ys) {
    counts.set(y, (counts.get(y) || 0) + 1);
  }

  let tieTerm = 0;
  for (const count of counts.values()) {
    if (count > 1) {
      tieTerm += count * (count - 1) * (2 * count + 5);
    }
  }

  const varS = (n * (n - 1) * (2 * n + 5) - tieTerm) / 18;

  let z = 0;
  if (varS > 0) {
    if (S > 0) z = (S - 1) / Math.sqrt(varS);
    else if (S < 0) z = (S + 1) / Math.sqrt(varS);
  }

  // Two-tailed p-value
  const pValue = 2 * (1 - normalCdf(Math.abs(z)));

  let trend = 'no_trend';
  if (pValue < 0.05) {
    trend = S > 0 ? 'increasing' : 'decreasing';
  }

  return {
    S,
    varS: r2(varS),
    z: r4(z),
    pValue: r4(pValue),
    trend,
  };
}

/**
 * Calculate anomaly against a baseline period.
 * @param {number} value - Target value
 * @param {number[]} baselineValues - Values during baseline period (e.g. 2001–2010)
 * @returns {{ anomaly: number, pctAnomaly: number|null, baselineMean: number }}
 */
export function baselineAnomaly(value, baselineValues) {
  if (!baselineValues || baselineValues.length === 0 || value == null) {
    return { anomaly: 0, pctAnomaly: null, baselineMean: 0 };
  }
  const baseMean = mean(baselineValues);
  const diff = value - baseMean;
  const pct = baseMean !== 0 ? (diff / baseMean) * 100 : null;
  return {
    anomaly: r2(diff),
    pctAnomaly: pct != null ? r2(pct) : null,
    baselineMean: r2(baseMean),
  };
}

/**
 * Percentile of value versus historical distribution.
 * @param {number} value
 * @param {number[]} history
 * @returns {number} Percentile 0..100
 */
export function percentileRank(value, history) {
  if (!history || !history.length || value == null) return 50;
  let strictlyLess = 0;
  let equal = 0;
  for (const v of history) {
    if (v < value) strictlyLess++;
    else if (v === value) equal++;
  }
  return r2(((strictlyLess + 0.5 * equal) / history.length) * 100);
}

/**
 * Assign fractional ranks (handles ties by average rank).
 */
export function rankData(arr) {
  const n = arr.length;
  const indexed = arr.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => a.val - b.val);

  const ranks = new Array(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n - 1 && indexed[j + 1].val === indexed[j].val) {
      j++;
    }
    const avgRank = (i + j + 2) / 2; // 1-based ranks
    for (let k = i; k <= j; k++) {
      ranks[indexed[k].idx] = avgRank;
    }
    i = j + 1;
  }
  return ranks;
}

/**
 * Linear detrending of a series.
 * Returns residuals added back to mean, or raw residuals.
 */
export function detrend(ys) {
  const n = ys.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const xMean = mean(xs);
  const yMean = mean(ys);

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) * (xs[i] - xMean);
  }
  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;

  // Residuals
  return ys.map((y, i) => y - (intercept + slope * xs[i]));
}

/**
 * Student's t cumulative distribution function approximation (for degrees of freedom df).
 */
function studentTCdf(t, df) {
  if (df <= 0) return 0.5;
  // For df >= 30, t is very close to standard normal
  if (df >= 30) return normalCdf(t);

  // Direct transform to beta distribution approximation / Hill's algorithm
  const _x = (t + Math.sqrt(t * t + df)) / (2 * Math.sqrt(t * t + df));
  // Standard normal approximation with Cornish-Fisher adjustment for moderate df
  const z = t * (1 - 1 / (4 * df)) / Math.sqrt(1 + (t * t) / (2 * df));
  return normalCdf(z);
}

/**
 * Spearman rank correlation with p-value and 95% Confidence Interval.
 * @param {number[]} xs
 * @param {number[]} ys
 * @returns {{ rho: number, pValue: number, n: number, ci95: [number, number] }}
 */
export function spearmanCorrelation(xs, ys) {
  if (!xs || !ys || xs.length !== ys.length || xs.length < 4) {
    return { rho: 0, pValue: 1, n: xs?.length ?? 0, ci95: [-1, 1] };
  }

  const n = xs.length;
  const rx = rankData(xs);
  const ry = rankData(ys);

  const meanRx = mean(rx);
  const meanRy = mean(ry);

  let cov = 0;
  let varRx = 0;
  let varRy = 0;

  for (let i = 0; i < n; i++) {
    const dx = rx[i] - meanRx;
    const dy = ry[i] - meanRy;
    cov += dx * dy;
    varRx += dx * dx;
    varRy += dy * dy;
  }

  const denom = Math.sqrt(varRx * varRy);
  const rho = denom !== 0 ? cov / denom : 0;

  // t-test for Spearman rho
  const tStat = Math.abs(rho) < 1 ? rho * Math.sqrt((n - 2) / (1 - rho * rho)) : 999;
  const pValue = 2 * (1 - studentTCdf(Math.abs(tStat), n - 2));

  // Fisher z-transformation for 95% CI
  let ci95 = [-1, 1];
  if (n > 3 && Math.abs(rho) < 0.9999) {
    const z = 0.5 * Math.log((1 + rho) / (1 - rho));
    const se = 1 / Math.sqrt(n - 3);
    const zLow = z - 1.96 * se;
    const zHigh = z + 1.96 * se;
    const rLow = (Math.exp(2 * zLow) - 1) / (Math.exp(2 * zLow) + 1);
    const rHigh = (Math.exp(2 * zHigh) - 1) / (Math.exp(2 * zHigh) + 1);
    ci95 = [r2(Math.max(-1, rLow)), r2(Math.min(1, rHigh))];
  }

  return {
    rho: r3(rho),
    pValue: r4(pValue),
    n,
    ci95,
  };
}

/**
 * Compute extreme weather indicators from daily time series.
 * @param {Array<{ date: string, tmax: number, rain: number }>} dailyRecords
 * @param {object} [config]
 * @param {number} [config.heatwaveThreshold=36.0] - Daily max temp (°C) for heatwave day
 * @param {number} [config.heavyRainThreshold=50.0] - Daily rainfall (mm) for heavy rain day
 * @param {number} [config.drySpellThreshold=1.0] - Rainfall (mm) below which a day is dry
 */
export function computeExtremeIndicators(dailyRecords, config = {}) {
  const {
    heatwaveThreshold = 36.0,
    heavyRainThreshold = 50.0,
    drySpellThreshold = 1.0,
  } = config;

  if (!dailyRecords || !dailyRecords.length) {
    return {
      heatwaveDays: 0,
      heavyRainDays: 0,
      longestDrySpell: 0,
      totalRain: 0,
      maxDailyRain: 0,
      maxTmax: 0,
    };
  }

  let heatwaveDays = 0;
  let heavyRainDays = 0;
  let longestDrySpell = 0;
  let currentDrySpell = 0;
  let totalRain = 0;
  let maxDailyRain = 0;
  let maxTmax = -Infinity;

  for (const rec of dailyRecords) {
    const tmax = rec.tmax ?? 0;
    const rain = rec.rain ?? 0;

    if (tmax >= heatwaveThreshold) heatwaveDays++;
    if (tmax > maxTmax) maxTmax = tmax;

    if (rain >= heavyRainThreshold) heavyRainDays++;
    if (rain > maxDailyRain) maxDailyRain = rain;
    totalRain += rain;

    if (rain < drySpellThreshold) {
      currentDrySpell++;
      if (currentDrySpell > longestDrySpell) {
        longestDrySpell = currentDrySpell;
      }
    } else {
      currentDrySpell = 0;
    }
  }

  return {
    heatwaveDays,
    heavyRainDays,
    longestDrySpell,
    totalRain: r1(totalRain),
    maxDailyRain: r1(maxDailyRain),
    maxTmax: r1(maxTmax),
  };
}

