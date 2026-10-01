/**
 * Turns the NASA POWER snapshot into Past / Now / Future values.
 *
 *   Past   — average of 2001–2010
 *   Now    — the latest 12 complete months (from daily data)
 *   Future — our projection: a robust (Theil–Sen) trend fitted on 2001–2025,
 *            evaluated at 2040, with a ±95% band from the year-to-year spread
 */
import climateRaw from '../data/climate.json';
import cmip6Raw from '../data/cmip6.json';
import districtsGeoRaw from '../data/districts.geo.json';
import divisionsGeoRaw from '../data/divisions.geo.json';
import { FUTURE_YEAR, LAST_PROJECTED_YEAR, METRICS, PAST_YEARS } from './constants';
import type {
  ClimateData,
  Cmip6Data,
  Cmip6Result,
  DistrictProperties,
  DistrictStats,
  DivisionProperties,
  DomainRange,
  ExtremeIndicatorsResult,
  MannKendallResult,
  MetricId,
  ScenarioId,
  TimeId,
  TrendResult,
} from './types';

export const climate = climateRaw as unknown as ClimateData;
export const cmip6 = cmip6Raw as unknown as Cmip6Data;
export const districtsGeo = districtsGeoRaw as unknown as {
  type: string;
  features: Array<{ type: string; properties: DistrictProperties; geometry: unknown }>;
};
export const divisionsGeo = divisionsGeoRaw as unknown as {
  type: string;
  features: Array<{ type: string; properties: DivisionProperties; geometry: unknown }>;
};

export const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const FIRST = climate.firstYear;
const LAST = climate.lastFullYear;
export const YEARS: number[] = Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i);
export const ALL_YEARS: number[] = Array.from({ length: LAST_PROJECTED_YEAR - FIRST + 1 }, (_, i) => FIRST + i);

// ---- one year of monthly means → the metric's value ----
const sumRain = (months: number[], idx: number[]) => idx.reduce((a, i) => a + months[i] * DAYS[i], 0);
const avg = (months: number[], idx: number[]) => idx.reduce((a, i) => a + months[i], 0) / idx.length;
export const ALL = [...Array(12).keys()];
export const MONSOON = [5, 6, 7, 8];
export const SUMMER = [2, 3, 4];

interface MonthRecord {
  rain: number[];
  tmax: number[];
  wet: number[];
}

export const fromMonths: Record<MetricId, (m: MonthRecord) => number> = {
  monsoon: (m) => sumRain(m.rain, MONSOON),
  rain: (m) => sumRain(m.rain, ALL),
  heat: (m) => avg(m.tmax, SUMMER),
  wet: (m) => avg(m.wet, ALL) * 100,
};

// Per-month value for the seasonal cycle (rain as monthly totals)
export const monthlyValue: Record<MetricId, (m: MonthRecord, i: number) => number> = {
  monsoon: (m, i) => m.rain[i] * DAYS[i],
  rain: (m, i) => m.rain[i] * DAYS[i],
  heat: (m, i) => m.tmax[i],
  wet: (m, i) => m.wet[i] * 100,
};

// ---- statistics ----
export const mean = (a: number[]): number => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
export const median = (a: number[]): number => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const h = s.length >> 1;
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
};

export function theilSen(xs: number[], ys: number[]): TrendResult {
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
  return { slope, intercept, sd, at: (x: number) => intercept + slope * x };
}

/**
 * Standard Mann–Kendall non-parametric monotonic trend test.
 * Computes Kendall's S statistic, variance with tie adjustments, normal Z, and two-tailed p-value.
 */
export function mannKendall(ys: number[]): MannKendallResult {
  const n = ys.length;
  if (n < 4) return { s: 0, z: 0, p: 1, significant: false };

  let s = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const diff = ys[j] - ys[i];
      if (diff > 0) s += 1;
      else if (diff < 0) s -= 1;
    }
  }

  // Count tied groups
  const counts = new Map<number, number>();
  ys.forEach((y) => counts.set(y, (counts.get(y) || 0) + 1));
  let tieSum = 0;
  for (const t of counts.values()) {
    if (t > 1) {
      tieSum += t * (t - 1) * (2 * t + 5);
    }
  }

  const varS = (n * (n - 1) * (2 * n + 5) - tieSum) / 18;
  const sdS = Math.sqrt(varS);
  let z = 0;
  if (s > 0) z = (s - 1) / sdS;
  else if (s < 0) z = (s + 1) / sdS;

  // Error function approximation for complementary error / normal CDF
  const erf = (x: number): number => {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    return sign * y;
  };

  const p = Math.max(0, Math.min(1, 1 - erf(Math.abs(z) / Math.SQRT2)));
  return { s, z, p, significant: p < 0.05 };
}

/**
 * Calculates extreme-event indicators from daily records:
 * - Heatwave days: count of days with T2M_MAX >= threshold
 * - Longest dry spell: maximum consecutive days with rain < 1.0 mm
 * - Heavy rain days: count of days with rain >= threshold
 */
export function calculateExtremeIndicators(
  daily: { dates: string[]; rain: number[]; tmax: number[]; wet: number[] } | undefined,
  heatwaveThresh: number = 36.0,
  heavyRainThresh: number = 50.0,
): ExtremeIndicatorsResult {
  if (!daily || !daily.dates || !daily.dates.length) {
    return { heatwaveDays: 0, longestDrySpell: 0, heavyRainDays: 0, totalDays: 0 };
  }
  let heatwaveDays = 0;
  let heavyRainDays = 0;
  let maxDrySpell = 0;
  let currentDrySpell = 0;

  const n = daily.dates.length;
  for (let i = 0; i < n; i++) {
    const tmax = daily.tmax[i];
    const rain = daily.rain[i];

    if (tmax >= heatwaveThresh) heatwaveDays++;
    if (rain >= heavyRainThresh) heavyRainDays++;

    if (rain < 1.0) {
      currentDrySpell++;
      if (currentDrySpell > maxDrySpell) maxDrySpell = currentDrySpell;
    } else {
      currentDrySpell = 0;
    }
  }

  return {
    heatwaveDays,
    longestDrySpell: maxDrySpell,
    heavyRainDays,
    totalDays: n,
  };
}

// ---- per district ----
function monthsOfYear(
  d: { monthly: { rain: number[][]; tmax: number[][]; wet: number[][] } },
  yi: number,
): MonthRecord {
  return { rain: d.monthly.rain[yi], tmax: d.monthly.tmax[yi], wet: d.monthly.wet[yi] };
}

// "Now" window reordered into Jan..Dec
function recentMonths(d: { recent: { months: string[]; rain: number[]; tmax: number[]; wet: number[] } }): MonthRecord {
  const out: MonthRecord = { rain: [], tmax: [], wet: [] };
  d.recent.months.forEach((mo, k) => {
    const i = +mo.slice(4, 6) - 1;
    out.rain[i] = d.recent.rain[k];
    out.tmax[i] = d.recent.tmax[k];
    out.wet[i] = d.recent.wet[k];
  });
  return out;
}

function buildDistrict(d: ClimateData['districts'][string]): Record<MetricId, DistrictStats> {
  const recent = recentMonths(d);
  const pastIdx = YEARS.map((y, i) => (y >= PAST_YEARS[0] && y <= PAST_YEARS[1] ? i : -1)).filter((i) => i >= 0);
  const out = {} as Record<MetricId, DistrictStats>;

  for (const { id } of METRICS) {
    const annual = YEARS.map((_, yi) => fromMonths[id](monthsOfYear(d, yi)));
    const trend = theilSen(YEARS, annual);
    const clampLow = id === 'heat' ? -Infinity : 0;
    const project = (y: number) => Math.max(clampLow, trend.at(y));

    const past = mean(pastIdx.map((i) => annual[i]));
    const now = fromMonths[id](recent);
    const future = project(FUTURE_YEAR);

    // Seasonal cycle for each period
    const pastCycle = ALL.map((i) => mean(pastIdx.map((yi) => monthlyValue[id](monthsOfYear(d, yi), i))));
    const nowCycle = ALL.map((i) => monthlyValue[id](recent, i));
    const ratio = past ? future / past : 1;
    const futureCycle =
      id === 'heat' || id === 'wet' ? pastCycle.map((v) => v + (future - past)) : pastCycle.map((v) => v * ratio);

    const mk = mannKendall(annual);

    // Full 25-year monthly matrix for year x month heatmap: [25 years][12 months]
    const monthlyMatrix = YEARS.map((_, yi) => {
      const mo = monthsOfYear(d, yi);
      return ALL.map((i) => monthlyValue[id](mo, i));
    });

    out[id] = {
      past,
      now,
      future,
      anomaly: {
        now: now - past,
        future: future - past,
        byYear: ALL_YEARS.map((y) => (y <= LAST ? annual[y - FIRST] - past : project(y) - past)),
      },
      band: 1.96 * trend.sd,
      slope: trend.slope,
      mk,
      annual,
      byYear: ALL_YEARS.map((y) => (y <= LAST ? annual[y - FIRST] : project(y))),
      projected: ALL_YEARS.map((y) => (y < LAST ? null : project(y))),
      cycle: { past: pastCycle, now: nowCycle, future: futureCycle },
      monthlyMatrix,
    };
  }
  return out;
}

export const districts: DistrictProperties[] = districtsGeo.features.map((f) => f.properties);
export const divisions: DivisionProperties[] = divisionsGeo.features
  .map((f) => f.properties)
  .sort((a, b) => a.name.localeCompare(b.name));

const stats: Record<string, Record<MetricId, DistrictStats>> = Object.fromEntries(
  districts.map((p) => [p.id, buildDistrict(climate.districts[p.id])]),
);

// Average any set of districts (a division, or the whole country)
const cache = new Map<string, DistrictStats>();
export function statsFor(ids: string[], metric: MetricId): DistrictStats {
  const key = metric + ids.join();
  if (!cache.has(key)) cache.set(key, aggregate(ids, metric));
  return cache.get(key)!;
}

function aggregate(ids: string[], metric: MetricId): DistrictStats {
  const list = ids.map((id) => stats[id][metric]);
  if (list.length === 1) return list[0];
  const m = (k: keyof DistrictStats) => mean(list.map((s) => s[k] as number));
  const arr = (get: (s: DistrictStats) => (number | null)[]) =>
    get(list[0]).map((_, i) => {
      const vals = list.map((s) => get(s)[i]).filter((v): v is number => v != null);
      return vals.length === 0 ? null : mean(vals);
    });

  const annual = list[0].annual.map((_, i) => mean(list.map((s) => s.annual[i])));
  const mk = mannKendall(annual);

  // Average 25x12 monthly matrix
  const monthlyMatrix = list[0].monthlyMatrix.map((row, yi) =>
    row.map((_, mi) => mean(list.map((s) => s.monthlyMatrix[yi][mi]))),
  );

  const past = m('past');
  const now = m('now');
  const future = m('future');
  const byYear = list[0].byYear.map((_, i) => {
    const vs = list.map((s) => s.byYear[i]).filter((v): v is number => v != null);
    return vs.length ? mean(vs) : null;
  });

  return {
    past,
    now,
    future,
    anomaly: {
      now: now - past,
      future: future - past,
      byYear: byYear.map((v) => (v == null ? null : v - past)),
    },
    band: m('band'),
    slope: m('slope'),
    mk,
    annual,
    byYear,
    projected: arr((s) => s.projected),
    cycle: {
      past: list[0].cycle.past.map((_, i) => mean(list.map((s) => s.cycle.past[i]))),
      now: list[0].cycle.now.map((_, i) => mean(list.map((s) => s.cycle.now[i]))),
      future: list[0].cycle.future.map((_, i) => mean(list.map((s) => s.cycle.future[i]))),
    },
    monthlyMatrix,
  };
}

// Extreme events indicators summary for a set of districts
export function extremesFor(ids: string[], heatwaveThresh?: number, heavyRainThresh?: number): ExtremeIndicatorsResult {
  const list = ids.map((id) =>
    calculateExtremeIndicators(climate.districts[id]?.daily, heatwaveThresh, heavyRainThresh),
  );
  return {
    heatwaveDays: Math.round(mean(list.map((x) => x.heatwaveDays))),
    longestDrySpell: Math.round(mean(list.map((x) => x.longestDrySpell))),
    heavyRainDays: Math.round(mean(list.map((x) => x.heavyRainDays))),
    totalDays: list[0]?.totalDays || 60,
  };
}

// Recent daily readings, averaged over the given districts
export function dailyFor(ids: string[], metric: MetricId): { dates: string[]; values: number[]; key: string } {
  const key = metric === 'heat' ? 'tmax' : metric === 'wet' ? 'wet' : 'rain';
  const first = climate.districts[ids[0]].daily;
  return {
    dates: first.dates,
    values: first.dates.map(
      (_d: string, i: number) =>
        mean(ids.map((id) => climate.districts[id].daily[key as 'tmax' | 'wet' | 'rain'][i])) *
        (key === 'wet' ? 100 : 1),
    ),
    key,
  };
}

// Aggregated CMIP6 multi-model downscaled projections for a set of districts
export function cmip6For(ids: string[], metric: MetricId, scenario: ScenarioId = 'ssp245'): Cmip6Result | null {
  if (!scenario || scenario === 'statistical') return null;
  const sc = cmip6.scenarios?.[scenario as 'ssp245' | 'ssp585'];
  if (!sc) return null;

  const years = cmip6.years; // [2021..2050]
  const n = years.length;
  const validIds = ids.filter((id) => cmip6.districts[id]?.[scenario as 'ssp245' | 'ssp585']?.[metric]);
  if (!validIds.length) return null;

  const median = Array(n).fill(0);
  const low = Array(n).fill(0);
  const high = Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    let sumM = 0;
    let sumL = 0;
    let sumH = 0;
    for (const id of validIds) {
      const d = cmip6.districts[id][scenario as 'ssp245' | 'ssp585'][metric];
      sumM += d.median[i];
      sumL += d.low[i];
      sumH += d.high[i];
    }
    const count = validIds.length;
    median[i] = Math.round((sumM / count) * 10) / 10;
    low[i] = Math.round((sumL / count) * 10) / 10;
    high[i] = Math.round((sumH / count) * 10) / 10;
  }

  const iFut = years.indexOf(FUTURE_YEAR);
  return {
    scenario,
    info: sc,
    years,
    median,
    low,
    high,
    at2040: {
      median: iFut >= 0 ? median[iFut] : (median.at(-1) ?? 0),
      low: iFut >= 0 ? low[iFut] : (low.at(-1) ?? 0),
      high: iFut >= 0 ? high[iFut] : (high.at(-1) ?? 0),
    },
  };
}

export const valueAt = (
  id: string,
  metric: MetricId,
  time: TimeId,
  year?: number | null,
  isAnomaly: boolean = false,
  scenario: ScenarioId = 'statistical',
): number | null => {
  const s = stats[id][metric];

  // If a CMIP6 model scenario is selected and we are inspecting future mode / future years
  if (scenario && scenario !== 'statistical' && cmip6.districts[id]?.[scenario as 'ssp245' | 'ssp585']?.[metric]) {
    const scData = cmip6.districts[id][scenario as 'ssp245' | 'ssp585'][metric];
    const cmipYears = cmip6.years;

    if (year != null && year >= cmipYears[0] && year <= cmipYears[cmipYears.length - 1]) {
      const idx = year - cmipYears[0];
      const val = scData.median[idx];
      return isAnomaly ? Math.round((val - s.past) * 10) / 10 : val;
    }

    if (time === 'future' && year == null) {
      const idx = FUTURE_YEAR - cmipYears[0];
      const val = idx >= 0 && idx < scData.median.length ? scData.median[idx] : scData.median[scData.median.length - 1];
      return isAnomaly ? Math.round((val - s.past) * 10) / 10 : val;
    }
  }

  if (isAnomaly) {
    if (year != null) return s.anomaly.byYear[year - FIRST];
    if (time === 'past') return 0;
    return s.anomaly[time];
  }
  if (year != null) return s.byYear[year - FIRST];
  return s[time];
};

// Colour / height scale: the spread of the given districts over every period and year
const domainCache = new Map<string, DomainRange>();
export function domainFor(
  ids: string[],
  metric: MetricId,
  isAnomaly: boolean = false,
  scenario: ScenarioId = 'statistical',
): DomainRange {
  const key = metric + (isAnomaly ? ':anomaly:' : ':abs:') + scenario + ':' + ids.join();
  if (!domainCache.has(key)) {
    if (isAnomaly) {
      const diffs = ids.flatMap((id) => {
        const s = stats[id][metric];
        const res = [s.anomaly.now, s.anomaly.future, ...s.anomaly.byYear.filter((v): v is number => v != null)];
        if (
          scenario &&
          scenario !== 'statistical' &&
          cmip6.districts[id]?.[scenario as 'ssp245' | 'ssp585']?.[metric]
        ) {
          const med = cmip6.districts[id][scenario as 'ssp245' | 'ssp585'][metric].median;
          res.push(...med.map((v: number) => v - s.past));
        }
        return res;
      });
      const maxAbs = Math.max(...diffs.map((d) => Math.abs(d)));
      const bound = maxAbs === 0 ? 1 : Math.round(maxAbs * 1.15 * 10) / 10;
      domainCache.set(key, [-bound, bound]);
    } else {
      const vals = ids
        .flatMap((id) => {
          const s = stats[id][metric];
          const res: number[] = [s.past, s.now, s.future, ...s.byYear.filter((v): v is number => v != null)];
          if (
            scenario &&
            scenario !== 'statistical' &&
            cmip6.districts[id]?.[scenario as 'ssp245' | 'ssp585']?.[metric]
          ) {
            res.push(...cmip6.districts[id][scenario as 'ssp245' | 'ssp585'][metric].median);
          }
          return res;
        })
        .sort((a, b) => a - b);
      const q = (p: number) => vals[Math.floor(p * (vals.length - 1))];
      domainCache.set(key, [q(0.02), q(0.98)]);
    }
  }
  return domainCache.get(key)!;
}

export const idsOf = (divisionId?: string | null): string[] =>
  districts.filter((d) => !divisionId || d.division === divisionId).map((d) => d.id);

export const latestDaily: string = climate.districts[districts[0].id].daily.dates.at(-1)!;
export const nowWindow: string[] = climate.districts[districts[0].id].recent.months;
