/**
 * Climate Lens — Back-Testing & Statistical Validation
 *
 * Trains the Theil–Sen projection model using only historical observations
 * from 2001–2015 (15 years) and predicts climate values for 2016–2025 (10 test years).
 * Evaluates performance against actual NASA POWER observations for all 64 districts
 * and all 4 metrics (monsoon rain, annual rain, summer heat, root-zone soil wetness).
 *
 * Metrics computed per district and aggregated by division and national totals:
 *   - MAE (Mean Absolute Error)
 *   - RMSE (Root Mean Squared Error)
 *   - 95% Prediction Interval Coverage (% of test observations inside ±1.96 SD band)
 *
 * Outputs compact JSON to src/data/validation.json.
 * Run: node scripts/backtest.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA_DIR = path.join(ROOT, 'src/data');

const TRAIN_START = 2001;
const TRAIN_END = 2015;
const TEST_START = 2016;
const TEST_END = 2025;

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const ALL_MONTHS = Array.from({ length: 12 }, (_, i) => i);
const MONSOON_MONTHS = [5, 6, 7, 8]; // Jun–Sep
const SUMMER_MONTHS = [2, 3, 4]; // Mar–May

const sumRain = (months, idx) => idx.reduce((sum, i) => sum + months[i] * DAYS[i], 0);
const avg = (arr, idx) => idx.reduce((sum, i) => sum + arr[i], 0) / idx.length;

const fromMonths = {
  monsoon: (m) => sumRain(m.rain, MONSOON_MONTHS),
  rain: (m) => sumRain(m.rain, ALL_MONTHS),
  heat: (m) => avg(m.tmax, SUMMER_MONTHS),
  wet: (m) => avg(m.wet, ALL_MONTHS) * 100,
};

const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const median = (a) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

function theilSen(xs, ys) {
  const slopes = [];
  for (let i = 0; i < xs.length; i++) {
    for (let j = i + 1; j < xs.length; j++) {
      slopes.push((ys[j] - ys[i]) / (xs[j] - xs[i]));
    }
  }
  const slope = median(slopes);
  const intercept = median(ys.map((y, i) => y - slope * xs[i]));
  const residuals = ys.map((y, i) => y - (intercept + slope * xs[i]));
  const sd = Math.sqrt(mean(residuals.map((r) => r * r)));
  return { slope, intercept, sd, at: (x) => intercept + slope * x };
}

async function runBacktest() {
  console.log('🔬 Running Theil–Sen Back-Testing on NASA POWER 2001–2025...\n');

  const climate = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'climate.json'), 'utf8'));
  const districtsGeo = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'districts.geo.json'), 'utf8'));
  const divisionsGeo = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'divisions.geo.json'), 'utf8'));

  const firstYear = climate.firstYear;
  const lastYear = climate.lastFullYear;
  const allYears = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i);

  const trainIndices = allYears
    .map((y, i) => (y >= TRAIN_START && y <= TRAIN_END ? i : -1))
    .filter((i) => i >= 0);
  const testIndices = allYears
    .map((y, i) => (y >= TEST_START && y <= TEST_END ? i : -1))
    .filter((i) => i >= 0);

  const trainXs = trainIndices.map((i) => allYears[i]);
  const testXs = testIndices.map((i) => allYears[i]);

  const metrics = ['monsoon', 'rain', 'heat', 'wet'];
  const districtFeatures = districtsGeo.features;
  const districtValidation = {};

  for (const feature of districtFeatures) {
    const { id, name, division } = feature.properties;
    const d = climate.districts[id];
    if (!d) continue;

    districtValidation[id] = {
      id,
      name,
      division,
      metrics: {},
    };

    for (const metric of metrics) {
      const clampLow = metric === 'heat' ? -Infinity : 0;
      // 25-year observed annual series
      const annual = allYears.map((_, yi) =>
        fromMonths[metric]({
          rain: d.monthly.rain[yi],
          tmax: d.monthly.tmax[yi],
          wet: d.monthly.wet[yi],
        }),
      );

      const trainYs = trainIndices.map((i) => annual[i]);
      const testYs = testIndices.map((i) => annual[i]);

      // Fit Theil–Sen on 2001–2015 only
      const model = theilSen(trainXs, trainYs);
      const band = 1.96 * model.sd;

      // Predict 2016–2025
      const predicted = testXs.map((x) => Math.max(clampLow, Math.round(model.at(x) * 100) / 100));
      const actual = testYs.map((y) => Math.round(y * 100) / 100);

      // Errors
      const errors = actual.map((act, i) => act - predicted[i]);
      const absErrors = errors.map((e) => Math.abs(e));
      const sqErrors = errors.map((e) => e * e);

      const inBandCount = actual.filter((act, i) => {
        const pred = predicted[i];
        return act >= pred - band && act <= pred + band;
      }).length;

      const mae = Math.round(mean(absErrors) * 100) / 100;
      const rmse = Math.round(Math.sqrt(mean(sqErrors)) * 100) / 100;
      const coverage = Math.round((inBandCount / testXs.length) * 1000) / 10; // e.g. 90.0%

      districtValidation[id].metrics[metric] = {
        mae,
        rmse,
        coverage,
        predicted,
        actual,
        band: Math.round(band * 100) / 100,
        slopePerDecade: Math.round(model.slope * 10 * 100) / 100,
      };
    }
  }

  // Aggregate by Division
  const divisionList = divisionsGeo.features.map((f) => f.properties);
  const byDivision = {};

  for (const div of divisionList) {
    const divDistricts = Object.values(districtValidation).filter((d) => d.division === div.id);
    byDivision[div.id] = {
      id: div.id,
      name: div.name,
      districtCount: divDistricts.length,
      metrics: {},
    };

    for (const metric of metrics) {
      const maes = divDistricts.map((d) => d.metrics[metric].mae);
      const rmses = divDistricts.map((d) => d.metrics[metric].rmse);
      const coverages = divDistricts.map((d) => d.metrics[metric].coverage);

      byDivision[div.id].metrics[metric] = {
        mae: Math.round(mean(maes) * 100) / 100,
        rmse: Math.round(mean(rmses) * 100) / 100,
        coverage: Math.round(mean(coverages) * 10) / 10,
      };
    }
  }

  // Aggregate Overall National
  const allDistricts = Object.values(districtValidation);
  const overall = {};

  for (const metric of metrics) {
    const maes = allDistricts.map((d) => d.metrics[metric].mae);
    const rmses = allDistricts.map((d) => d.metrics[metric].rmse);
    const coverages = allDistricts.map((d) => d.metrics[metric].coverage);

    overall[metric] = {
      mae: Math.round(mean(maes) * 100) / 100,
      rmse: Math.round(mean(rmses) * 100) / 100,
      coverage: Math.round(mean(coverages) * 10) / 10,
    };
  }

  const result = {
    metadata: {
      trainYears: [TRAIN_START, TRAIN_END],
      testYears: [TEST_START, TEST_END],
      testYearCount: testXs.length,
      totalDistricts: allDistricts.length,
      method: 'Theil–Sen robust linear regression with ±1.96 SD prediction interval (empirical backtest)',
      generatedAt: new Date().toISOString(),
    },
    overall,
    byDivision,
    districts: districtValidation,
  };

  const outFile = path.join(DATA_DIR, 'validation.json');
  await fs.writeFile(outFile, JSON.stringify(result, null, 2));

  console.log(`✅ Back-testing complete! Saved to ${outFile}\n`);
  console.log('--- Overall Validation Summary (Train: 2001–2015 | Test: 2016–2025) ---');
  for (const metric of metrics) {
    const o = overall[metric];
    const unit = metric === 'heat' ? '°C' : metric === 'wet' ? '%' : 'mm';
    console.log(
      `  • ${metric.padEnd(8)}: MAE = ${o.mae} ${unit} | RMSE = ${o.rmse} ${unit} | 95% Band Coverage = ${o.coverage}%`,
    );
  }
}

runBacktest().catch((err) => {
  console.error('Backtest error:', err);
  process.exit(1);
});
