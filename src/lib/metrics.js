/**
 * Turns the NASA POWER snapshot into Past / Now / Future values.
 *
 *   Past   — average of 2001–2010
 *   Now    — the latest 12 complete months (from daily data)
 *   Future — our projection: a robust (Theil–Sen) trend fitted on 2001–2025,
 *            evaluated at 2040, with a ±95% band from the year-to-year spread
 */
import climate from '../data/climate.json';
import districtsGeo from '../data/districts.geo.json';
import divisionsGeo from '../data/divisions.geo.json';
import { FUTURE_YEAR, LAST_PROJECTED_YEAR, METRICS, PAST_YEARS } from './constants.js';

export { climate, districtsGeo, divisionsGeo };

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const FIRST = climate.firstYear;
const LAST = climate.lastFullYear;
export const YEARS = Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i);
export const ALL_YEARS = Array.from({ length: LAST_PROJECTED_YEAR - FIRST + 1 }, (_, i) => FIRST + i);

// ---- one year of monthly means → the metric's value ----
const sumRain = (months, idx) => idx.reduce((a, i) => a + months[i] * DAYS[i], 0);
const avg = (months, idx) => idx.reduce((a, i) => a + months[i], 0) / idx.length;
const ALL = [...Array(12).keys()];
const MONSOON = [5, 6, 7, 8];
const SUMMER = [2, 3, 4];

const fromMonths = {
  monsoon: (m) => sumRain(m.rain, MONSOON),
  rain: (m) => sumRain(m.rain, ALL),
  heat: (m) => avg(m.tmax, SUMMER),
  wet: (m) => avg(m.wet, ALL) * 100,
};

// Per-month value for the seasonal cycle (rain as monthly totals)
const monthlyValue = {
  monsoon: (m, i) => m.rain[i] * DAYS[i],
  rain: (m, i) => m.rain[i] * DAYS[i],
  heat: (m, i) => m.tmax[i],
  wet: (m, i) => m.wet[i] * 100,
};

// ---- statistics ----
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  const h = s.length >> 1;
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
};

function theilSen(xs, ys) {
  const slopes = [];
  for (let i = 0; i < xs.length; i++)
    for (let j = i + 1; j < xs.length; j++) slopes.push((ys[j] - ys[i]) / (xs[j] - xs[i]));
  const slope = median(slopes);
  const intercept = median(ys.map((y, i) => y - slope * xs[i]));
  const resid = ys.map((y, i) => y - (intercept + slope * xs[i]));
  const sd = Math.sqrt(mean(resid.map((r) => r * r)));
  return { slope, intercept, sd, at: (x) => intercept + slope * x };
}

// ---- per district ----
function monthsOfYear(d, yi) {
  return { rain: d.monthly.rain[yi], tmax: d.monthly.tmax[yi], wet: d.monthly.wet[yi] };
}

// "Now" window reordered into Jan..Dec
function recentMonths(d) {
  const out = { rain: [], tmax: [], wet: [] };
  d.recent.months.forEach((mo, k) => {
    const i = +mo.slice(4, 6) - 1;
    out.rain[i] = d.recent.rain[k];
    out.tmax[i] = d.recent.tmax[k];
    out.wet[i] = d.recent.wet[k];
  });
  return out;
}

function buildDistrict(d) {
  const recent = recentMonths(d);
  const pastIdx = YEARS.map((y, i) => (y >= PAST_YEARS[0] && y <= PAST_YEARS[1] ? i : -1)).filter((i) => i >= 0);
  const out = {};

  for (const { id } of METRICS) {
    const annual = YEARS.map((_, yi) => fromMonths[id](monthsOfYear(d, yi)));
    const trend = theilSen(YEARS, annual);
    const clampLow = id === 'heat' ? -Infinity : 0;
    const project = (y) => Math.max(clampLow, trend.at(y));

    const past = mean(pastIdx.map((i) => annual[i]));
    const now = fromMonths[id](recent);
    const future = project(FUTURE_YEAR);

    // Seasonal cycle for each period
    const pastCycle = ALL.map((i) => mean(pastIdx.map((yi) => monthlyValue[id](monthsOfYear(d, yi), i))));
    const nowCycle = ALL.map((i) => monthlyValue[id](recent, i));
    const ratio = past ? future / past : 1;
    const futureCycle = id === 'heat' || id === 'wet'
      ? pastCycle.map((v) => v + (future - past))
      : pastCycle.map((v) => v * ratio);

    out[id] = {
      past, now, future,
      band: 1.96 * trend.sd,
      slope: trend.slope,
      annual,
      byYear: ALL_YEARS.map((y) => (y <= LAST ? annual[y - FIRST] : project(y))),
      projected: ALL_YEARS.map((y) => (y < LAST ? null : project(y))),
      cycle: { past: pastCycle, now: nowCycle, future: futureCycle },
    };
  }
  return out;
}

export const districts = districtsGeo.features.map((f) => f.properties);
export const divisions = divisionsGeo.features
  .map((f) => f.properties)
  .sort((a, b) => a.name.localeCompare(b.name));

const stats = Object.fromEntries(districts.map((p) => [p.id, buildDistrict(climate.districts[p.id])]));

// Average any set of districts (a division, or the whole country)
const cache = new Map();
export function statsFor(ids, metric) {
  const key = metric + ids.join();
  if (!cache.has(key)) cache.set(key, aggregate(ids, metric));
  return cache.get(key);
}

function aggregate(ids, metric) {
  const list = ids.map((id) => stats[id][metric]);
  if (list.length === 1) return list[0];
  const m = (k) => mean(list.map((s) => s[k]));
  const arr = (get) => get(list[0]).map((_, i) => {
    const vals = list.map((s) => get(s)[i]);
    return vals[0] == null ? null : mean(vals);
  });
  return {
    past: m('past'), now: m('now'), future: m('future'), band: m('band'), slope: m('slope'),
    annual: arr((s) => s.annual),
    byYear: arr((s) => s.byYear),
    projected: arr((s) => s.projected),
    cycle: { past: arr((s) => s.cycle.past), now: arr((s) => s.cycle.now), future: arr((s) => s.cycle.future) },
  };
}

// Recent daily readings, averaged over the given districts
export function dailyFor(ids, metric) {
  const key = metric === 'heat' ? 'tmax' : metric === 'wet' ? 'wet' : 'rain';
  const first = climate.districts[ids[0]].daily;
  return {
    dates: first.dates,
    values: first.dates.map((_, i) => mean(ids.map((id) => climate.districts[id].daily[key][i])) * (key === 'wet' ? 100 : 1)),
    key,
  };
}

export const valueAt = (id, metric, time, year) => {
  const s = stats[id][metric];
  if (year != null) return s.byYear[year - FIRST];
  return s[time];
};

// Colour / height scale: the spread of the given districts over every period and year
const domainCache = new Map();
export function domainFor(ids, metric) {
  const key = metric + ids.join();
  if (!domainCache.has(key)) {
    const vals = ids.flatMap((id) => {
      const s = stats[id][metric];
      return [s.past, s.now, s.future, ...s.byYear];
    }).sort((a, b) => a - b);
    const q = (p) => vals[Math.floor(p * (vals.length - 1))];
    domainCache.set(key, [q(0.02), q(0.98)]);
  }
  return domainCache.get(key);
}

export const idsOf = (divisionId) =>
  districts.filter((d) => !divisionId || d.division === divisionId).map((d) => d.id);

export const latestDaily = climate.districts[districts[0].id].daily.dates.at(-1);
export const nowWindow = climate.districts[districts[0].id].recent.months;
