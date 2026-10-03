/**
 * Heavy statistical & climate model computation worker.
 * Offloads Theil-Sen regression, Mann-Kendall trend tests, multi-district
 * CMIP6 projection matrix aggregations, and district live analysis off the browser main UI thread.
 */

// Normal CDF approximation (Abramowitz & Stegun)
function normalCdf(x: number): number {
  const b1 = 0.31938153;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  if (x >= 0) {
    const t = 1.0 / (1.0 + p * x);
    return 1.0 - c * Math.exp((-x * x) / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  }
  const t = 1.0 / (1.0 - p * x);
  return c * Math.exp((-x * x) / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
}

function median(a: number[]): number {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const h = s.length >> 1;
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
}

function mean(a: number[]): number {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
}

export function mannKendall(ys: number[]) {
  const n = ys.length;
  if (n < 4) return { s: 0, z: 0, p: 1, significant: false, trend: 'no_trend' as const };

  let s = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const diff = ys[j] - ys[i];
      if (diff > 0) s += 1;
      else if (diff < 0) s -= 1;
    }
  }

  const counts = new Map<number, number>();
  ys.forEach((y) => counts.set(y, (counts.get(y) || 0) + 1));
  let tieSum = 0;
  for (const t of counts.values()) {
    if (t > 1) tieSum += t * (t - 1) * (2 * t + 5);
  }

  const varS = (n * (n - 1) * (2 * n + 5) - tieSum) / 18;
  const sdS = Math.sqrt(varS);
  let z = 0;
  if (s > 0) z = (s - 1) / sdS;
  else if (s < 0) z = (s + 1) / sdS;

  const p = 2 * (1 - normalCdf(Math.abs(z)));
  const significant = p < 0.05;
  const trend = significant ? (s > 0 ? 'increasing' : 'decreasing') : 'no_trend';

  return { s, z: Math.round(z * 100) / 100, p: Math.round(p * 1000) / 1000, significant, trend };
}

export function theilSen(xs: number[], ys: number[]) {
  const slopes: number[] = [];
  for (let i = 0; i < xs.length; i++) {
    for (let j = i + 1; j < xs.length; j++) {
      slopes.push((ys[j] - ys[i]) / (xs[j] - xs[i]));
    }
  }
  const slope = median(slopes);
  const intercept = median(ys.map((y, i) => y - slope * xs[i]));
  const resid = ys.map((y, i) => y - (intercept + slope * xs[i]));
  const sd = Math.sqrt(mean(resid.map((r) => r * r)));
  return { slope, intercept, sd };
}

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONSOON_MONTHS = [5, 6, 7, 8];
const SUMMER_MONTHS = [2, 3, 4];

export function analyzeDistrictPayload(payload: {
  years: number[];
  monthly: { rain: number[][]; tmax: number[][]; wet: number[][] };
  daily?: { dates: string[]; rain: number[]; tmax: number[] };
  baselineStart?: number;
  baselineEnd?: number;
}) {
  const { years, monthly, daily, baselineStart = 2001, baselineEnd = 2010 } = payload;

  const nYears = years.length;
  const annualMonsoon: number[] = [];
  const annualRain: number[] = [];
  const annualHeat: number[] = [];
  const annualWet: number[] = [];

  for (let yi = 0; yi < nYears; yi++) {
    const rM = monthly.rain[yi] || [];
    const tM = monthly.tmax[yi] || [];
    const wM = monthly.wet[yi] || [];

    const mRain = MONSOON_MONTHS.reduce((s, m) => s + (rM[m] ?? 0) * DAYS[m], 0);
    const aRain = DAYS.reduce((s, d, m) => s + (rM[m] ?? 0) * d, 0);
    const sHeat = SUMMER_MONTHS.reduce((s, m) => s + (tM[m] ?? 0), 0) / 3;
    const aWet = (wM.reduce((s, w) => s + (w ?? 0), 0) / (wM.length || 1)) * 100;

    annualMonsoon.push(Math.round(mRain * 10) / 10);
    annualRain.push(Math.round(aRain * 10) / 10);
    annualHeat.push(Math.round(sHeat * 100) / 100);
    annualWet.push(Math.round(aWet * 100) / 100);
  }

  const baselineIndices = years.map((y, i) => (y >= baselineStart && y <= baselineEnd ? i : -1)).filter((i) => i >= 0);

  function analyzeMetric(ys: number[]) {
    const ts = theilSen(years, ys);
    const mk = mannKendall(ys);
    const baseVals = baselineIndices.length ? baselineIndices.map((i) => ys[i]) : ys.slice(0, 10);
    const baseMean = mean(baseVals);
    const latest = ys[ys.length - 1] ?? 0;
    const anomaly = Math.round((latest - baseMean) * 100) / 100;
    const pctAnomaly = baseMean !== 0 ? Math.round(((latest - baseMean) / baseMean) * 1000) / 10 : 0;

    // Percentile
    let less = 0;
    let eq = 0;
    ys.forEach((v) => {
      if (v < latest) less++;
      else if (v === latest) eq++;
    });
    const percentile = Math.round(((less + 0.5 * eq) / ys.length) * 100);

    return {
      series: ys,
      slopePerYear: Math.round(ts.slope * 10000) / 10000,
      slopePerDecade: Math.round(ts.slope * 100000) / 10000,
      intercept: Math.round(ts.intercept * 100) / 100,
      mannKendall: mk,
      baselineMean: Math.round(baseMean * 100) / 100,
      latestAnomaly: anomaly,
      latestPctAnomaly: pctAnomaly,
      latestPercentile: percentile,
    };
  }

  // Extreme indicators calculation
  let extremes = {
    heatwaveDays36C: 0,
    heatwaveDays38C: 0,
    heavyRainDays50mm: 0,
    longestDrySpellDays: 0,
    maxDailyRainMm: 0,
    maxRecordedTmaxC: 0,
    totalRainMm: 0,
  };

  if (daily && daily.dates && daily.dates.length > 0) {
    let curDry = 0;
    let maxDry = 0;
    let hw36 = 0;
    let hw38 = 0;
    let hr50 = 0;
    let maxR = 0;
    let maxT = -Infinity;
    let totR = 0;

    for (let i = 0; i < daily.dates.length; i++) {
      const t = daily.tmax[i] ?? 0;
      const r = daily.rain[i] ?? 0;

      if (t >= 36) hw36++;
      if (t >= 38) hw38++;
      if (t > maxT) maxT = t;

      if (r >= 50) hr50++;
      if (r > maxR) maxR = r;
      totR += r;

      if (r < 1.0) {
        curDry++;
        if (curDry > maxDry) maxDry = curDry;
      } else {
        curDry = 0;
      }
    }

    extremes = {
      heatwaveDays36C: hw36,
      heatwaveDays38C: hw38,
      heavyRainDays50mm: hr50,
      longestDrySpellDays: maxDry,
      maxDailyRainMm: Math.round(maxR * 10) / 10,
      maxRecordedTmaxC: maxT > -Infinity ? Math.round(maxT * 10) / 10 : 0,
      totalRainMm: Math.round(totR * 10) / 10,
    };
  }

  return {
    metrics: {
      monsoon: analyzeMetric(annualMonsoon),
      rain: analyzeMetric(annualRain),
      heat: analyzeMetric(annualHeat),
      wet: analyzeMetric(annualWet),
    },
    extremes,
  };
}

if (typeof self !== 'undefined') {
  self.onmessage = (e: MessageEvent) => {
    const { id, type, payload } = e.data;

    try {
      let result: unknown;
      if (type === 'MANN_KENDALL') {
        result = mannKendall(payload.ys);
      } else if (type === 'THEIL_SEN') {
        result = theilSen(payload.xs, payload.ys);
      } else if (type === 'ANALYZE_DISTRICT') {
        result = analyzeDistrictPayload(payload);
      } else {
        throw new Error(`Unknown worker command type: ${type}`);
      }

      self.postMessage({ id, success: true, result });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      self.postMessage({ id, success: false, error: errorMsg });
    }
  };
}
