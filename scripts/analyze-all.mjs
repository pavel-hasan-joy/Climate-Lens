/**
 * Master Online Data Pipeline & Automated Analysis Runner.
 *
 * Coordinates:
 *   1. NASA POWER District Climate Analysis (Sen's slope, Mann-Kendall, Baseline Anomaly, Percentile)
 *   2. Climate Extremes Analysis (Heatwave days, Dry spells, Heavy rain)
 *   3. GBIF Priority Species Occurrences Fetcher & Spatial Aggregator
 *   4. NASA EONET v3 Natural Event Tracker (Historical and Open Events)
 *   5. Crop Yield & Climate Association Analyzer (World Bank / FAO / BBS)
 *
 * Produces:
 *   - src/data/analysis/climate-stats.json
 *   - src/data/analysis/extremes.json
 *   - src/data/analysis/gbif-occurrences.json
 *   - src/data/analysis/eonet-events.json
 *   - src/data/analysis/yield-climate.json
 *   - src/data/analysis/data-status.json
 *
 * Reproducible command:
 *   npm run data
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { analyzeClimateData } from './analysis/climate-stats.mjs';
import { fetchGbifOccurrences } from './fetch-gbif.mjs';
import { fetchEonetEvents } from './fetch-eonet.mjs';
import { fetchYieldAndAnalyze } from './fetch-yield.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'src/data/analysis');
const STATUS_FILE = path.join(OUT_DIR, 'data-status.json');

async function getFileSizeKb(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return Math.round((stat.size / 1024) * 10) / 10;
  } catch {
    return null;
  }
}

export async function runAllAnalyses() {
  console.log('🚀 Starting Phase 9A Online Data Pipeline & Automated Analysis...\n');
  const startTime = Date.now();
  await fs.mkdir(OUT_DIR, { recursive: true });

  const status = {
    pipeline: 'Climate Lens Online Data Pipeline (Phase 9A)',
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    sources: {},
    failures: [],
    outputs: {},
    overallSuccess: true,
  };

  // 1. NASA POWER Climate Analysis & Extremes
  try {
    console.log('--- [1/4] NASA POWER Climate & Extremes Analysis ---');
    const res = await analyzeClimateData();
    status.sources.nasa_power = {
      name: 'NASA POWER (Prediction Of Worldwide Energy Resources)',
      endpoint: 'https://power.larc.nasa.gov/api/temporal',
      status: 'success',
      districtsAnalyzed: res.districtsAnalyzed,
      metricsAnalyzed: res.metricsAnalyzed,
      coverage: '2001–2025 (25 full years)',
      lastFetch: new Date().toISOString(),
    };
  } catch (err) {
    console.error('❌ NASA POWER analysis failed:', err.message);
    status.sources.nasa_power = { status: 'failed', error: err.message };
    status.failures.push({ source: 'nasa_power', error: err.message });
    status.overallSuccess = false;
  }

  // 2. GBIF Priority Species Occurrences
  try {
    console.log('\n--- [2/4] GBIF Occurrence API (country=BD) ---');
    const gbifRes = await fetchGbifOccurrences();
    status.sources.gbif = {
      name: 'GBIF (Global Biodiversity Information Facility)',
      endpoint: 'https://api.gbif.org/v1/occurrence/search',
      status: gbifRes.success ? 'success' : 'fallback_cache_used',
      recordCount: gbifRes.recordCount,
      error: gbifRes.error || null,
      disclaimer: 'Occurrence counts reflect observer effort, NOT biological population size.',
      lastFetch: new Date().toISOString(),
    };
    if (!gbifRes.success) {
      status.failures.push({ source: 'gbif', error: gbifRes.error });
    }
  } catch (err) {
    console.error('❌ GBIF fetch failed:', err.message);
    status.sources.gbif = { status: 'failed', error: err.message };
    status.failures.push({ source: 'gbif', error: err.message });
    status.overallSuccess = false;
  }

  // 3. NASA EONET v3 Events
  try {
    console.log('\n--- [3/4] NASA EONET v3 Natural Event Tracker ---');
    const eonetRes = await fetchEonetEvents();
    status.sources.eonet = {
      name: 'NASA EONET v3 (Earth Observatory Natural Event Tracker)',
      endpoint: 'https://eonet.gsfc.nasa.gov/api/v3/events',
      status: eonetRes.success ? 'success' : 'fallback_cache_used',
      totalEvents: eonetRes.totalEvents,
      openEvents: eonetRes.openEvents,
      error: eonetRes.error || null,
      lastFetch: new Date().toISOString(),
    };
    if (!eonetRes.success) {
      status.failures.push({ source: 'eonet', error: eonetRes.error });
    }
  } catch (err) {
    console.error('❌ EONET fetch failed:', err.message);
    status.sources.eonet = { status: 'failed', error: err.message };
    status.failures.push({ source: 'eonet', error: err.message });
    status.overallSuccess = false;
  }

  // 4. Crop Yield & Climate Association (World Bank / FAO / BBS)
  try {
    console.log('\n--- [4/4] Crop Yield Data & Climate Associations ---');
    const yieldRes = await fetchYieldAndAnalyze();
    status.sources.crop_yield = {
      name: 'World Bank Open Data (FAOSTAT) & BBS Agricultural Statistics',
      endpoint: 'http://api.worldbank.org/v2/country/BGD/indicator/AG.YLD.CREL.KG',
      status: yieldRes.success ? 'success' : 'fallback_cache_used',
      yearsAnalyzed: yieldRes.yearsAnalyzed,
      relationshipsComputed: yieldRes.relationshipsComputed,
      spatialGranularity: 'National (district-level not available via open APIs; not fabricated)',
      error: yieldRes.error || null,
      lastFetch: new Date().toISOString(),
    };
    if (!yieldRes.success) {
      status.failures.push({ source: 'crop_yield', error: yieldRes.error });
    }
  } catch (err) {
    console.error('❌ Crop yield analysis failed:', err.message);
    status.sources.crop_yield = { status: 'failed', error: err.message };
    status.failures.push({ source: 'crop_yield', error: err.message });
    status.overallSuccess = false;
  }

  // Record outputs and sizes
  const outputFiles = [
    'climate-stats.json',
    'extremes.json',
    'gbif-occurrences.json',
    'eonet-events.json',
    'yield-climate.json',
  ];

  for (const f of outputFiles) {
    const fullPath = path.join(OUT_DIR, f);
    status.outputs[f] = {
      path: `src/data/analysis/${f}`,
      sizeKb: await getFileSizeKb(fullPath),
    };
  }

  status.durationMs = Date.now() - startTime;

  await fs.writeFile(STATUS_FILE, JSON.stringify(status, null, 2));
  console.log(`\n✅ Finished all pipeline tasks in ${(status.durationMs / 1000).toFixed(1)}s.`);
  console.log(`Status report written to ${STATUS_FILE}.`);

  return status;
}

if (process.argv[1] && process.argv[1].endsWith('analyze-all.mjs')) {
  runAllAnalyses().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
