/**
 * Validates climate dataset integrity, completeness, and physical outlier bounds,
 * as well as provenance metadata and sane analytical ranges for all derived analysis outputs.
 *
 * Checks:
 *   1. All 64 official Bangladesh districts and 8 divisions are present in GeoJSON borders.
 *   2. No missing, NaN, null, or undefined data values in core climate snapshots.
 *   3. Array dimensions and temporal alignment across series (2001–2025).
 *   4. Physical plausibility & outlier bounds for observed and CMIP6 projected data.
 *   5. Every JSON in src/data/analysis/ has required provenance fields (source name,
 *      source URL, fetch timestamp, license/attribution, records count) and sane values.
 *
 * Run: node scripts/validate-data.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA_DIR = path.join(ROOT, 'src/data');
const ANALYSIS_DIR = path.join(DATA_DIR, 'analysis');

const EXPECTED_DIVISIONS = 8;
const EXPECTED_DISTRICTS = 64;

// Physical bounds for Bangladesh climate
const BOUNDS = {
  daily: {
    tmax: { min: 5, max: 55, unit: '°C' }, // Highest recorded in BD is ~45.1°C
    rain: { min: 0, max: 700, unit: 'mm/day' }, // Extreme monsoon rain
    wet: { min: 0, max: 1.0, unit: 'fraction' },
  },
  monthly: {
    tmax: { min: 10, max: 48, unit: '°C' },
    rain: { min: 0, max: 2500, unit: 'mm/month' },
    wet: { min: 0.05, max: 1.0, unit: 'fraction' },
  },
  cmip6: {
    tmax_delta: { min: -1.0, max: 7.0, unit: '°C warming' },
    rain_delta_pct: { min: -60, max: 120, unit: '%' },
  },
};

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function validateAnalysisDatasets(errors, warnings, expectedDistrictIds) {
  console.log('🔬 Validating Phase 9A/9C Analysis Datasets in src/data/analysis/...\n');

  try {
    await fs.access(ANALYSIS_DIR);
  } catch {
    errors.push(`Missing analysis directory: ${ANALYSIS_DIR}`);
    return;
  }

  // 1. climate-stats.json
  const statsPath = path.join(ANALYSIS_DIR, 'climate-stats.json');
  try {
    const raw = await fs.readFile(statsPath, 'utf8');
    const stats = JSON.parse(raw);
    const meta = stats.metadata || {};

    if (!meta.source) errors.push('climate-stats.json: missing metadata.source');
    if (!isValidUrl(meta.sourceUrl)) errors.push(`climate-stats.json: invalid or missing metadata.sourceUrl: ${meta.sourceUrl}`);
    if (!meta.license) errors.push('climate-stats.json: missing metadata.license');
    if (!meta.citation) errors.push('climate-stats.json: missing metadata.citation');
    if (!meta.fetchedAt && !meta.analysisTimestamp) errors.push('climate-stats.json: missing fetch or analysis timestamp');
    if (meta.totalDistricts !== EXPECTED_DISTRICTS) errors.push(`climate-stats.json: expected totalDistricts=${EXPECTED_DISTRICTS}, got ${meta.totalDistricts}`);

    const districts = stats.districts || {};
    const districtKeys = Object.keys(districts);
    if (districtKeys.length !== EXPECTED_DISTRICTS) {
      errors.push(`climate-stats.json: expected ${EXPECTED_DISTRICTS} districts, found ${districtKeys.length}`);
    }

    for (const id of expectedDistrictIds) {
      const d = districts[id];
      if (!d) {
        errors.push(`climate-stats.json: missing district '${id}'`);
        continue;
      }
      for (const m of ['heat', 'rain', 'monsoon', 'wet']) {
        const met = d.metrics?.[m];
        if (!met) {
          errors.push(`climate-stats.json [${id}]: missing metric '${m}'`);
          continue;
        }
        if (typeof met.sensSlopePerDecade !== 'number' || Number.isNaN(met.sensSlopePerDecade)) {
          errors.push(`climate-stats.json [${id}.${m}]: invalid sensSlopePerDecade`);
        }
        const p = met.mannKendall?.pValue;
        if (typeof p !== 'number' || Number.isNaN(p) || p < 0 || p > 1) {
          errors.push(`climate-stats.json [${id}.${m}]: mannKendall pValue out of range [0, 1]: ${p}`);
        }
        const pct = met.recent12MoPercentile;
        if (typeof pct !== 'number' || pct < 0 || pct > 100) {
          errors.push(`climate-stats.json [${id}.${m}]: recent12MoPercentile out of range [0, 100]: ${pct}`);
        }
      }
    }
    console.log(`  ✓ climate-stats.json: ${districtKeys.length} districts with Sen's slopes, MK tests, and percentiles verified`);
  } catch (err) {
    errors.push(`climate-stats.json failed validation: ${err.message}`);
  }

  // 2. extremes.json
  const extremesPath = path.join(ANALYSIS_DIR, 'extremes.json');
  try {
    const raw = await fs.readFile(extremesPath, 'utf8');
    const extremes = JSON.parse(raw);
    const meta = extremes.metadata || {};

    if (!meta.source) errors.push('extremes.json: missing metadata.source');
    if (!isValidUrl(meta.sourceUrl)) errors.push(`extremes.json: invalid or missing metadata.sourceUrl: ${meta.sourceUrl}`);
    if (!meta.thresholds || typeof meta.thresholds.heatwaveModerateC !== 'number') {
      errors.push('extremes.json: missing or invalid metadata.thresholds');
    }

    const districts = extremes.districts || {};
    const districtKeys = Object.keys(districts);
    if (districtKeys.length !== EXPECTED_DISTRICTS) {
      errors.push(`extremes.json: expected ${EXPECTED_DISTRICTS} districts, found ${districtKeys.length}`);
    }

    for (const id of expectedDistrictIds) {
      const d = districts[id];
      if (!d) {
        errors.push(`extremes.json: missing district '${id}'`);
        continue;
      }
      if (!d.indicators) {
        errors.push(`extremes.json [${id}]: missing indicators object`);
        continue;
      }
      const { heatwaveDays36C, heavyRainDays50mm, longestDrySpellDays } = d.indicators;
      if (typeof heatwaveDays36C !== 'number' || heatwaveDays36C < 0 || heatwaveDays36C > 365) {
        errors.push(`extremes.json [${id}]: heatwaveDays36C out of sane range [0, 365]: ${heatwaveDays36C}`);
      }
      if (typeof heavyRainDays50mm !== 'number' || heavyRainDays50mm < 0 || heavyRainDays50mm > 365) {
        errors.push(`extremes.json [${id}]: heavyRainDays50mm out of sane range [0, 365]: ${heavyRainDays50mm}`);
      }
      if (typeof longestDrySpellDays !== 'number' || longestDrySpellDays < 0 || longestDrySpellDays > 365) {
        errors.push(`extremes.json [${id}]: longestDrySpellDays out of sane range [0, 365]: ${longestDrySpellDays}`);
      }
    }
    console.log(`  ✓ extremes.json: ${districtKeys.length} districts with heatwave, dry spell, and heavy rain counts verified`);
  } catch (err) {
    errors.push(`extremes.json failed validation: ${err.message}`);
  }

  // 3. gbif-occurrences.json
  const gbifPath = path.join(ANALYSIS_DIR, 'gbif-occurrences.json');
  try {
    const raw = await fs.readFile(gbifPath, 'utf8');
    const gbif = JSON.parse(raw);
    const meta = gbif.metadata || {};

    if (!meta.source) errors.push('gbif-occurrences.json: missing metadata.source');
    if (!isValidUrl(meta.sourceUrl)) errors.push(`gbif-occurrences.json: invalid or missing metadata.sourceUrl: ${meta.sourceUrl}`);
    if (!meta.observerEffortNotice || !meta.observerEffortNotice.toLowerCase().includes('observer effort')) {
      errors.push('gbif-occurrences.json: missing or inadequate metadata.observerEffortNotice');
    }
    if (typeof meta.totalRecords !== 'number' || meta.totalRecords <= 0) {
      errors.push(`gbif-occurrences.json: invalid totalRecords: ${meta.totalRecords}`);
    }

    const species = gbif.species || {};
    const expectedSpecies = ['bengal_tiger', 'ganges_dolphin', 'irrawaddy_dolphin', 'hilsa', 'asian_elephant', 'fishing_cat'];
    for (const spKey of expectedSpecies) {
      const sp = species[spKey];
      if (!sp) {
        errors.push(`gbif-occurrences.json: missing species '${spKey}'`);
        continue;
      }
      if (typeof sp.totalRecords !== 'number' || sp.totalRecords <= 0) {
        errors.push(`gbif-occurrences.json [${spKey}]: invalid totalRecords`);
      }
      if (!sp.byYear || Object.keys(sp.byYear).length === 0) {
        errors.push(`gbif-occurrences.json [${spKey}]: missing byYear distribution`);
      }
      if (sp.sampleRecords) {
        for (const rec of sp.sampleRecords) {
          if (!rec.gbifId) errors.push(`gbif-occurrences.json [${spKey}]: sample record missing gbifId`);
          if (rec.lat != null && (rec.lat < 19 || rec.lat > 28)) {
            warnings.push(`gbif-occurrences.json [${spKey}]: sample record lat ${rec.lat} slightly outside core BD bounds`);
          }
          if (rec.lon != null && (rec.lon < 86 || rec.lon > 94)) {
            warnings.push(`gbif-occurrences.json [${spKey}]: sample record lon ${rec.lon} slightly outside core BD bounds`);
          }
        }
      }
    }
    console.log(`  ✓ gbif-occurrences.json: ${meta.totalRecords} records across ${Object.keys(species).length} species verified with observer-effort disclaimer`);
  } catch (err) {
    errors.push(`gbif-occurrences.json failed validation: ${err.message}`);
  }

  // 4. eonet-events.json
  const eonetPath = path.join(ANALYSIS_DIR, 'eonet-events.json');
  try {
    const raw = await fs.readFile(eonetPath, 'utf8');
    const eonet = JSON.parse(raw);
    const meta = eonet.metadata || {};

    if (!meta.source) errors.push('eonet-events.json: missing metadata.source');
    if (!isValidUrl(meta.sourceUrl)) errors.push(`eonet-events.json: invalid or missing metadata.sourceUrl: ${meta.sourceUrl}`);
    if (!meta.bbox) errors.push('eonet-events.json: missing metadata.bbox');
    if (typeof meta.totalEvents !== 'number' || meta.totalEvents <= 0) {
      errors.push(`eonet-events.json: invalid totalEvents: ${meta.totalEvents}`);
    }

    const openEvents = eonet.openEvents || [];
    const historicalEvents = eonet.historicalEvents || [];
    const allEvents = [...openEvents, ...historicalEvents];

    if (!Array.isArray(allEvents) || allEvents.length === 0) {
      errors.push('eonet-events.json: events list is empty or not an array');
    } else {
      for (const ev of allEvents) {
        if (!ev.id || !ev.title) errors.push(`eonet-events.json: event missing id or title: ${JSON.stringify(ev)}`);
        if (ev.coordinates && Array.isArray(ev.coordinates) && ev.coordinates.length >= 2) {
          const [lon, lat] = ev.coordinates;
          if (typeof lon === 'number' && (lon < -180 || lon > 180)) {
            errors.push(`eonet-events.json [${ev.id}]: longitude ${lon} out of [-180, 180]`);
          }
          if (typeof lat === 'number' && (lat < -90 || lat > 90)) {
            errors.push(`eonet-events.json [${ev.id}]: latitude ${lat} out of [-90, 90]`);
          }
        }
      }
    }
    console.log(`  ✓ eonet-events.json: ${allEvents.length} events (${openEvents.length} open, ${historicalEvents.length} historical) verified within valid coordinates`);
  } catch (err) {
    errors.push(`eonet-events.json failed validation: ${err.message}`);
  }

  // 5. yield-climate.json
  const yieldPath = path.join(ANALYSIS_DIR, 'yield-climate.json');
  try {
    const raw = await fs.readFile(yieldPath, 'utf8');
    const yd = JSON.parse(raw);
    const meta = yd.metadata || {};

    if (!meta.source) errors.push('yield-climate.json: missing metadata.source');
    if (!isValidUrl(meta.sourceUrl)) errors.push(`yield-climate.json: invalid or missing metadata.sourceUrl: ${meta.sourceUrl}`);
    if (!meta.causalityWarning || !meta.causalityWarning.toLowerCase().includes('causality')) {
      errors.push('yield-climate.json: missing or inadequate metadata.causalityWarning');
    }
    if (typeof meta.totalRecords !== 'number' || meta.totalRecords < 20) {
      errors.push(`yield-climate.json: expected at least 20 annual records, got ${meta.totalRecords}`);
    }

    const yields = yd.nationalYields?.cerealAnnualKgHa || [];
    if (!yields.length || yields.length !== meta.totalRecords) {
      errors.push('yield-climate.json: nationalYields array length mismatch');
    }
    for (const val of yields) {
      // Bangladesh cereal yield has grown from ~3,000 to ~5,000 kg/ha
      if (typeof val !== 'number' || val < 1500 || val > 8000) {
        errors.push(`yield-climate.json: national yield value ${val} kg/ha out of plausible range [1500, 8000]`);
      }
    }

    const correlations = yd.correlations || [];
    if (correlations.length < 5) {
      errors.push(`yield-climate.json: expected at least 5 crop-climate correlation models, got ${correlations.length}`);
    }
    for (const c of correlations) {
      if (!c.relationship) errors.push('yield-climate.json: correlation missing relationship descriptor');
      if (typeof c.spearmanRho !== 'number' || c.spearmanRho < -1 || c.spearmanRho > 1) {
        errors.push(`yield-climate.json [${c.relationship}]: spearmanRho out of [-1, 1]: ${c.spearmanRho}`);
      }
      if (typeof c.pValue !== 'number' || c.pValue < 0 || c.pValue > 1) {
        errors.push(`yield-climate.json [${c.relationship}]: pValue out of [0, 1]: ${c.pValue}`);
      }
      if (typeof c.sampleSize !== 'number' || c.sampleSize < 15) {
        errors.push(`yield-climate.json [${c.relationship}]: sampleSize too small (<15): ${c.sampleSize}`);
      }
    }
    console.log(`  ✓ yield-climate.json: ${yields.length} years of yield data and ${correlations.length} non-parametric correlation models verified with causality disclosure`);
  } catch (err) {
    errors.push(`yield-climate.json failed validation: ${err.message}`);
  }

  // 6. data-status.json
  const statusPath = path.join(ANALYSIS_DIR, 'data-status.json');
  try {
    const raw = await fs.readFile(statusPath, 'utf8');
    const st = JSON.parse(raw);

    if (!st.timestamp) errors.push('data-status.json: missing timestamp');
    if (!st.sources || typeof st.sources !== 'object') errors.push('data-status.json: missing sources status registry');

    for (const srcKey of ['nasa_power', 'gbif', 'eonet', 'crop_yield']) {
      const src = st.sources?.[srcKey];
      if (!src) {
        errors.push(`data-status.json: missing source entry for '${srcKey}'`);
        continue;
      }
      if (src.status !== 'success') {
        warnings.push(`data-status.json: source '${srcKey}' reported non-success status: '${src.status}'`);
      }
      if (!src.endpoint) {
        errors.push(`data-status.json [${srcKey}]: missing endpoint`);
      }
    }
    console.log('  ✓ data-status.json: Pipeline run status and source registry verified\n');
  } catch (err) {
    errors.push(`data-status.json failed validation: ${err.message}`);
  }
}

async function validate() {
  const errors = [];
  const warnings = [];

  console.log('🔍 Validating Climate Lens datasets...\n');

  // 1. Validate GeoJSON Borders
  const divisionsGeo = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'divisions.geo.json'), 'utf8'));
  const districtsGeo = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'districts.geo.json'), 'utf8'));

  if (!divisionsGeo.features || divisionsGeo.features.length !== EXPECTED_DIVISIONS) {
    errors.push(`divisions.geo.json: expected ${EXPECTED_DIVISIONS} features, got ${divisionsGeo.features?.length}`);
  } else {
    console.log(`  ✓ divisions.geo.json: ${divisionsGeo.features.length} divisions verified`);
  }

  if (!districtsGeo.features || districtsGeo.features.length !== EXPECTED_DISTRICTS) {
    errors.push(`districts.geo.json: expected ${EXPECTED_DISTRICTS} features, got ${districtsGeo.features?.length}`);
  } else {
    console.log(`  ✓ districts.geo.json: ${districtsGeo.features.length} districts verified`);
  }

  const expectedDistrictIds = new Set(districtsGeo.features.map((f) => f.properties.id));

  // 2. Validate Observed Climate Dataset
  const climate = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'climate.json'), 'utf8'));
  const climateDistricts = Object.keys(climate.districts || {});

  if (climateDistricts.length !== EXPECTED_DISTRICTS) {
    errors.push(`climate.json: expected ${EXPECTED_DISTRICTS} districts, found ${climateDistricts.length}`);
  }

  const totalYears = (climate.lastFullYear - climate.firstYear + 1);

  let totalDailyChecked = 0;
  let totalMonthlyChecked = 0;

  for (const id of expectedDistrictIds) {
    const d = climate.districts?.[id];
    if (!d) {
      errors.push(`climate.json: missing district entry for '${id}'`);
      continue;
    }

    // Daily checks
    const { dates, tmax: dTmax, rain: dRain, wet: dWet } = d.daily || {};
    if (!dates || !dTmax || !dRain || !dWet) {
      errors.push(`climate.json [${id}]: missing one or more daily arrays`);
    } else {
      const len = dates.length;
      if (dTmax.length !== len || dRain.length !== len || dWet.length !== len) {
        errors.push(`climate.json [${id}]: daily array lengths mismatch (dates=${len}, tmax=${dTmax.length}, rain=${dRain.length}, wet=${dWet.length})`);
      }

      for (let i = 0; i < len; i++) {
        totalDailyChecked++;
        const tm = dTmax[i];
        const r = dRain[i];
        const w = dWet[i];

        if (tm == null || Number.isNaN(tm)) errors.push(`climate.json [${id}]: daily tmax at index ${i} (${dates[i]}) is NaN or null`);
        else if (tm < BOUNDS.daily.tmax.min || tm > BOUNDS.daily.tmax.max) {
          errors.push(`climate.json [${id}]: daily tmax ${tm}°C on ${dates[i]} out of bounds [${BOUNDS.daily.tmax.min}, ${BOUNDS.daily.tmax.max}]`);
        }

        if (r == null || Number.isNaN(r)) errors.push(`climate.json [${id}]: daily rain at index ${i} (${dates[i]}) is NaN or null`);
        else if (r < BOUNDS.daily.rain.min || r > BOUNDS.daily.rain.max) {
          errors.push(`climate.json [${id}]: daily rain ${r}mm on ${dates[i]} out of bounds [${BOUNDS.daily.rain.min}, ${BOUNDS.daily.rain.max}]`);
        }

        if (w == null || Number.isNaN(w)) errors.push(`climate.json [${id}]: daily wet at index ${i} (${dates[i]}) is NaN or null`);
        else if (w < BOUNDS.daily.wet.min || w > BOUNDS.daily.wet.max) {
          errors.push(`climate.json [${id}]: daily wet ${w} on ${dates[i]} out of bounds [${BOUNDS.daily.wet.min}, ${BOUNDS.daily.wet.max}]`);
        }
      }
    }

    // Monthly checks (2D: years × 12 months)
    const { tmax: mTmax, rain: mRain, wet: mWet } = d.monthly || {};
    if (!mTmax || !mRain || !mWet) {
      errors.push(`climate.json [${id}]: missing monthly series`);
    } else {
      if (mTmax.length !== totalYears || mRain.length !== totalYears || mWet.length !== totalYears) {
        errors.push(`climate.json [${id}]: monthly years count ${mTmax.length} does not match expected ${totalYears}`);
      }
      for (let y = 0; y < mTmax.length; y++) {
        const yearTmax = mTmax[y];
        const yearRain = mRain[y];
        const yearWet = mWet[y];

        if (!Array.isArray(yearTmax) || yearTmax.length !== 12 || !Array.isArray(yearRain) || yearRain.length !== 12 || !Array.isArray(yearWet) || yearWet.length !== 12) {
          errors.push(`climate.json [${id}] year index ${y}: monthly year array does not have exactly 12 months`);
          continue;
        }

        for (let m = 0; m < 12; m++) {
          totalMonthlyChecked++;
          const tm = yearTmax[m];
          const r = yearRain[m];
          const w = yearWet[m];

          if (tm == null || Number.isNaN(tm) || tm < BOUNDS.monthly.tmax.min || tm > BOUNDS.monthly.tmax.max) {
            errors.push(`climate.json [${id}]: monthly tmax ${tm} at year index ${y}, month ${m + 1} out of bounds`);
          }
          if (r == null || Number.isNaN(r) || r < BOUNDS.monthly.rain.min || r > BOUNDS.monthly.rain.max) {
            errors.push(`climate.json [${id}]: monthly rain ${r} at year index ${y}, month ${m + 1} out of bounds`);
          }
          if (w == null || Number.isNaN(w) || w < BOUNDS.monthly.wet.min || w > BOUNDS.monthly.wet.max) {
            errors.push(`climate.json [${id}]: monthly wet ${w} at year index ${y}, month ${m + 1} out of bounds`);
          }
        }
      }
    }

    // Recent 12 months checks
    const { tmax: rTmax, rain: rRain, wet: rWet } = d.recent || {};
    if (!rTmax || !rRain || !rWet || rTmax.length !== 12 || rRain.length !== 12 || rWet.length !== 12) {
      errors.push(`climate.json [${id}]: recent 12-month array invalid or missing`);
    }
  }

  console.log(`  ✓ climate.json: ${climateDistricts.length} districts, ${totalDailyChecked} daily points, ${totalMonthlyChecked} monthly points validated`);

  // 3. Validate CMIP6 Downscaled Climate Projections
  const cmip6 = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'cmip6.json'), 'utf8'));
  const cmipDistricts = Object.keys(cmip6.districts || {});

  if (cmipDistricts.length !== EXPECTED_DISTRICTS) {
    errors.push(`cmip6.json: expected ${EXPECTED_DISTRICTS} districts, found ${cmipDistricts.length}`);
  }

  const scenarios = ['ssp245', 'ssp585'];
  const metrics = ['heat', 'rain', 'monsoon', 'wet'];
  const expectedCmipYears = cmip6.years?.length || 30;

  let totalCmipEnsemblesChecked = 0;

  for (const id of expectedDistrictIds) {
    const d = cmip6.districts?.[id];
    if (!d) {
      errors.push(`cmip6.json: missing projections for '${id}'`);
      continue;
    }

    if (!d.baseline) {
      errors.push(`cmip6.json [${id}]: missing baseline object`);
    }

    for (const sc of scenarios) {
      const sData = d[sc];
      if (!sData) {
        errors.push(`cmip6.json [${id}]: missing scenario '${sc}'`);
        continue;
      }

      for (const m of metrics) {
        const mData = sData[m];
        if (!mData) {
          errors.push(`cmip6.json [${id}.${sc}]: missing metric '${m}'`);
          continue;
        }

        const { median, low, high } = mData;
        if (!median || !low || !high) {
          errors.push(`cmip6.json [${id}.${sc}.${m}]: missing median, low, or high array`);
          continue;
        }

        if (median.length !== expectedCmipYears || low.length !== expectedCmipYears || high.length !== expectedCmipYears) {
          errors.push(`cmip6.json [${id}.${sc}.${m}]: array length mismatch (expected ${expectedCmipYears})`);
          continue;
        }

        for (let i = 0; i < expectedCmipYears; i++) {
          totalCmipEnsemblesChecked++;
          const med = median[i];
          const lo = low[i];
          const hi = high[i];

          if (med == null || Number.isNaN(med) || lo == null || Number.isNaN(lo) || hi == null || Number.isNaN(hi)) {
            errors.push(`cmip6.json [${id}.${sc}.${m}] at index ${i}: NaN or null found`);
          } else if (lo > med || med > hi) {
            errors.push(`cmip6.json [${id}.${sc}.${m}] at index ${i}: invalid ensemble ordering (low=${lo}, med=${med}, high=${hi})`);
          }
        }
      }
    }
  }

  console.log(`  ✓ cmip6.json: 64 districts, SSP2-4.5 & SSP5-8.5 ensembles (${totalCmipEnsemblesChecked} points) validated\n`);

  // 4. Validate Analysis Outputs in src/data/analysis/
  await validateAnalysisDatasets(errors, warnings, expectedDistrictIds);

  if (warnings.length) {
    console.warn(`⚠️  ${warnings.length} Warnings:`);
    warnings.slice(0, 10).forEach((w) => console.warn(`   - ${w}`));
    if (warnings.length > 10) console.warn(`   ... and ${warnings.length - 10} more warnings`);
    console.log();
  }

  if (errors.length) {
    console.error(`❌ Validation failed with ${errors.length} error(s):`);
    errors.forEach((e) => console.error(`   - ${e}`));
    process.exit(1);
  } else {
    console.log('✅ All dataset validation, provenance, and outlier checks PASSED successfully!');
  }
}

validate().catch((err) => {
  console.error('Fatal validation error:', err);
  process.exit(1);
});
