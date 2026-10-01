/**
 * Builds the app's data snapshot from open sources.
 *
 *   Borders : geoBoundaries (gbOpen, BGD ADM1 / ADM2)          — CC BY 4.0
 *   Climate : NASA POWER (NASA Langley, Earth science data)      — public domain
 *             PRECTOTCORR  precipitation (mm/day, bias-corrected, from GPM IMERG / MERRA-2)
 *             T2M_MAX      maximum air temperature at 2 m (°C)
 *             GWETROOT     root-zone soil wetness (0–1)
 *
 * Output per district:
 *   monthly  — monthly means, FIRST_YEAR..LAST_FULL_YEAR
 *   recent   — the latest 12 complete months, aggregated from daily data ("now")
 *   daily    — the latest 60 days
 *
 * Run:  npm run data
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import * as turf from '@turf/turf';
import { generateCmip6 } from './build-cmip6.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const RAW = path.join(ROOT, 'data-raw');
const OUT = path.join(ROOT, 'src/data');

const GB = 'https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/gbOpen/BGD';
const POWER = 'https://power.larc.nasa.gov/api/temporal';
const PARAMS = 'PRECTOTCORR,T2M_MAX,GWETROOT';
// POWER precipitation shows source discontinuities before ~2000, so the analysis starts in 2001
const FIRST_YEAR = 2001;
const LAST_FULL_YEAR = 2025;

// geoBoundaries spellings → common English spellings
const RENAME = { Rajshani: 'Rajshahi', Brahamanbaria: 'Brahmanbaria', Nawabganj: 'Chapai Nawabganj' };

const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
const r1 = (n) => Math.round(n * 10) / 10;
const r2 = (n) => Math.round(n * 100) / 100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');

async function loadBorders(level) {
  const file = path.join(RAW, `bgd-${level}.geojson`);
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    const res = await fetch(`${GB}/${level}/geoBoundaries-BGD-${level}_simplified.geojson`);
    const json = await res.json();
    await fs.mkdir(RAW, { recursive: true });
    await fs.writeFile(file, JSON.stringify(json));
    return json;
  }
}

// Round coordinates to ~10 m to keep the bundle small
function trim(feature, tolerance) {
  const f = turf.simplify(feature, { tolerance, highQuality: true });
  turf.coordEach(f, (c) => { c[0] = +c[0].toFixed(4); c[1] = +c[1].toFixed(4); });
  return f;
}

// Division that contains the district: by its anchor point, else by majority of its vertices
function divisionOf(district, anchor, divisions) {
  const hit = divisions.find((d) => turf.booleanPointInPolygon(anchor, d));
  if (hit) return hit;
  const votes = new Map();
  turf.coordEach(district, (c) => {
    const d = divisions.find((x) => turf.booleanPointInPolygon(c, x));
    if (d) votes.set(d, (votes.get(d) || 0) + 1);
  });
  return [...votes].sort((a, b) => b[1] - a[1])[0]?.[0];
}

async function getJSON(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
      console.warn(`  ${res.status} — retrying`);
    } catch (e) {
      console.warn(`  ${e.message} — retrying`);
    }
    await sleep(2000 * (i + 1));
  }
  throw new Error(`Failed: ${url}`);
}

async function fetchDistrict([lng, lat]) {
  const q = `parameters=${PARAMS}&community=AG&longitude=${lng}&latitude=${lat}&format=JSON`;

  // Monthly means 1981 → last full year
  const monthly = await getJSON(`${POWER}/monthly/point?${q}&start=${FIRST_YEAR}&end=${LAST_FULL_YEAR}`);
  const mp = monthly.properties.parameter;
  const years = [];
  for (let y = FIRST_YEAR; y <= LAST_FULL_YEAR; y++) years.push(y);
  const grid = (key) => years.map((y) =>
    Array.from({ length: 12 }, (_, m) => {
      const v = mp[key][`${y}${String(m + 1).padStart(2, '0')}`];
      return v == null || v < -900 ? null : r2(v);
    }));

  // Daily for the last ~400 days → the "now" window
  const end = new Date();
  const start = new Date(end.getTime() - 400 * 864e5);
  const daily = await getJSON(`${POWER}/daily/point?${q}&start=${ymd(start)}&end=${ymd(end)}`);
  const dp = daily.properties.parameter;
  const days = Object.keys(dp.PRECTOTCORR).filter((d) => dp.PRECTOTCORR[d] > -900);

  // Latest 12 complete calendar months, as monthly means (same units as `monthly`)
  const lastDay = days.at(-1);
  const months = [];
  let y = +lastDay.slice(0, 4);
  let m = +lastDay.slice(4, 6) - 1; // the last month is incomplete → start one before
  for (let i = 0; i < 12; i++) {
    if (m === 0) { m = 12; y--; }
    months.unshift(`${y}${String(m).padStart(2, '0')}`);
    m--;
  }
  // Match POWER's monthly definitions: PRECTOTCORR & GWETROOT are monthly means,
  // T2M_MAX is the highest daily maximum of the month
  const mean = (key, mo) => {
    const v = days.filter((d) => d.startsWith(mo)).map((d) => dp[key][d]);
    return r2(key === 'T2M_MAX' ? Math.max(...v) : v.reduce((a, b) => a + b, 0) / v.length);
  };
  const last60 = days.slice(-60);

  return {
    monthly: { rain: grid('PRECTOTCORR'), tmax: grid('T2M_MAX'), wet: grid('GWETROOT') },
    recent: {
      months,
      rain: months.map((mo) => mean('PRECTOTCORR', mo)),
      tmax: months.map((mo) => mean('T2M_MAX', mo)),
      wet: months.map((mo) => mean('GWETROOT', mo)),
    },
    daily: {
      dates: last60,
      rain: last60.map((d) => r1(dp.PRECTOTCORR[d])),
      tmax: last60.map((d) => r1(dp.T2M_MAX[d])),
      wet: last60.map((d) => r2(dp.GWETROOT[d])),
    },
  };
}

async function main() {
  const adm1 = await loadBorders('ADM1');
  const adm2 = await loadBorders('ADM2');

  const divisions = adm1.features.map((f) => {
    const name = RENAME[f.properties.shapeName] ?? f.properties.shapeName;
    const g = trim(f, 0.003);
    return { type: 'Feature', geometry: g.geometry, properties: { id: slug(name), name } };
  });

  const districts = adm2.features.map((f) => {
    const name = RENAME[f.properties.shapeName] ?? f.properties.shapeName;
    const anchor = turf.pointOnFeature(f).geometry.coordinates.map((c) => +c.toFixed(3));
    const division = divisionOf(f, anchor, divisions);
    if (!division) throw new Error(`No division for ${name}`);
    const g = trim(f, 0.002);
    return {
      type: 'Feature',
      geometry: g.geometry,
      properties: { id: slug(name), name, division: division.properties.id, anchor },
    };
  }).sort((a, b) => a.properties.name.localeCompare(b.properties.name));

  districts.forEach((f, i) => { f.id = i; }); // numeric id for map feature-state

  await fs.mkdir(OUT, { recursive: true });
  await fs.writeFile(path.join(OUT, 'divisions.geo.json'), JSON.stringify({ type: 'FeatureCollection', features: divisions }));
  await fs.writeFile(path.join(OUT, 'districts.geo.json'), JSON.stringify({ type: 'FeatureCollection', features: districts }));
  console.log(`Borders: ${divisions.length} divisions, ${districts.length} districts`);

  const climate = {
    source: 'NASA POWER (power.larc.nasa.gov) — PRECTOTCORR, T2M_MAX, GWETROOT',
    generated: new Date().toISOString().slice(0, 10),
    firstYear: FIRST_YEAR,
    lastFullYear: LAST_FULL_YEAR,
    districts: {},
  };

  // Small concurrency to stay polite with the NASA API
  const queue = [...districts];
  const worker = async () => {
    while (queue.length) {
      const f = queue.shift();
      const { id, name, anchor } = f.properties;
      climate.districts[id] = await fetchDistrict(anchor);
      console.log(`  ✓ ${name}`);
    }
  };
  await Promise.all([worker(), worker(), worker()]);

  await fs.writeFile(path.join(OUT, 'climate.json'), JSON.stringify(climate));
  console.log('Climate snapshot written.');

  await generateCmip6();
}

main().catch((e) => { console.error(e); process.exit(1); });
