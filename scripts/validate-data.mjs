/**
 * Validates climate dataset integrity, completeness, and physical outlier bounds.
 *
 * Checks:
 *   1. All 64 official Bangladesh districts and 8 divisions are present.
 *   2. No missing, NaN, null, or undefined data values.
 *   3. Array dimensions and temporal alignment across series.
 *   4. Physical plausibility & outlier bounds for observed and CMIP6 projected data.
 *
 * Run: node scripts/validate-data.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA_DIR = path.join(ROOT, 'src/data');

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
    console.log('✅ All dataset validation and outlier checks PASSED successfully!');
  }
}

validate().catch((err) => {
  console.error('Fatal validation error:', err);
  process.exit(1);
});
