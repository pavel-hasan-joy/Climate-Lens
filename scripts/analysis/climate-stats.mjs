/**
 * District-level and metric-level climate statistics and extremes analyzer.
 *
 * Implements:
 *   1. Per district and metric (monsoon rain, annual rain, summer heat, soil wetness):
 *      - Sen's slope per decade
 *      - Mann–Kendall test statistic S, z, p-value, and trend direction
 *      - 2001–2010 baseline mean & anomaly vs baseline
 *      - Percentile rank of latest 12 months vs full historical series
 *   2. Extreme indicators:
 *      - Heatwave days (T2M_MAX >= 36°C and >= 38°C)
 *      - Longest dry spell (consecutive days with rain < 1mm)
 *      - Heavy rain days (daily rain >= 50mm and >= 100mm)
 *
 * Output:
 *   - src/data/analysis/climate-stats.json
 *   - src/data/analysis/extremes.json
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  sensSlope,
  mannKendall,
  baselineAnomaly,
  percentileRank,
  computeExtremeIndicators,
  mean,
  r1,
  r2,
} from './stats.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT_DIR = path.join(ROOT, 'src/data/analysis');

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const ALL_MONTHS = Array.from({ length: 12 }, (_, i) => i);
const MONSOON_MONTHS = [5, 6, 7, 8]; // Jun–Sep
const SUMMER_MONTHS = [2, 3, 4]; // Mar–May

const sumRain = (monthlyRain, idx) => idx.reduce((sum, i) => sum + (monthlyRain[i] ?? 0) * DAYS[i], 0);
const avg = (arr, idx) => idx.reduce((sum, i) => sum + (arr[i] ?? 0), 0) / idx.length;

export async function analyzeClimateData() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const climate = JSON.parse(await fs.readFile(path.join(ROOT, 'src/data/climate.json'), 'utf8'));
  const districtsGeo = JSON.parse(await fs.readFile(path.join(ROOT, 'src/data/districts.geo.json'), 'utf8'));

  const firstYear = climate.firstYear; // 2001
  const lastYear = climate.lastFullYear; // 2025
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i);
  const baselineIndices = years.map((y, i) => (y >= 2001 && y <= 2010 ? i : -1)).filter((i) => i >= 0);

  const districtFeatures = districtsGeo.features;
  const statsResult = {
    metadata: {
      source: 'NASA POWER (power.larc.nasa.gov) — PRECTOTCORR, T2M_MAX, GWETROOT',
      sourceUrl: 'https://power.larc.nasa.gov/api/temporal/monthly/point',
      fetchedAt: climate.generated,
      analysisTimestamp: new Date().toISOString(),
      baselinePeriod: '2001–2010',
      analysisPeriod: `${firstYear}–${lastYear}`,
      totalDistricts: districtFeatures.length,
      metrics: ['monsoon', 'rain', 'heat', 'wet'],
      license: 'NASA Open Data Policy (Public Domain)',
      citation: 'NASA Prediction Of Worldwide Energy Resources (POWER) Project, NASA Langley Research Center',
    },
    districts: {},
    nationalSummary: {},
  };

  const extremesResult = {
    metadata: {
      source: 'NASA POWER Daily Meteorological Surface Archive',
      sourceUrl: 'https://power.larc.nasa.gov/api/temporal/daily/point',
      thresholds: {
        heatwaveModerateC: 36.0,
        heatwaveSevereC: 38.0,
        heavyRainMm: 50.0,
        extremeRainMm: 100.0,
        dryDayThresholdMm: 1.0,
      },
      analysisTimestamp: new Date().toISOString(),
      license: 'NASA Open Data Policy (Public Domain)',
      citation: 'NASA POWER Daily Point API, NASA Langley Research Center',
    },
    districts: {},
  };

  const metrics = ['monsoon', 'rain', 'heat', 'wet'];

  for (const feature of districtFeatures) {
    const { id, name, division } = feature.properties;
    const d = climate.districts[id];
    if (!d) continue;

    // Build annual time series for each metric
    const annualData = {
      monsoon: [],
      rain: [],
      heat: [],
      wet: [],
    };

    for (let yi = 0; yi < years.length; yi++) {
      const rMonths = d.monthly.rain[yi];
      const tMonths = d.monthly.tmax[yi];
      const wMonths = d.monthly.wet[yi];

      annualData.monsoon.push(r1(sumRain(rMonths, MONSOON_MONTHS)));
      annualData.rain.push(r1(sumRain(rMonths, ALL_MONTHS)));
      annualData.heat.push(r2(avg(tMonths, SUMMER_MONTHS)));
      annualData.wet.push(r2(avg(wMonths, ALL_MONTHS) * 100)); // Percentage 0-100
    }

    // Recent 12 complete calendar months values
    const recentMonsoon = r1(sumRain(d.recent.rain, MONSOON_MONTHS));
    const recentRain = r1(sumRain(d.recent.rain, ALL_MONTHS));
    const recentHeat = r2(avg(d.recent.tmax, SUMMER_MONTHS));
    const recentWet = r2(avg(d.recent.wet, ALL_MONTHS) * 100);

    const recentValues = {
      monsoon: recentMonsoon,
      rain: recentRain,
      heat: recentHeat,
      wet: recentWet,
    };

    const districtMetricStats = {};

    for (const m of metrics) {
      const ys = annualData[m];
      const slopeInfo = sensSlope(years, ys);
      const mk = mannKendall(ys);

      const baselineVals = baselineIndices.map((i) => ys[i]);
      const anomaly2025 = baselineAnomaly(ys.at(-1), baselineVals);
      const anomalyRecent = baselineAnomaly(recentValues[m], baselineVals);

      const recentPercentile = percentileRank(recentValues[m], ys);

      districtMetricStats[m] = {
        sensSlopePerYear: slopeInfo.slope,
        sensSlopePerDecade: slopeInfo.slopePerDecade,
        intercept: slopeInfo.intercept,
        mannKendall: {
          S: mk.S,
          varS: mk.varS,
          z: mk.z,
          pValue: mk.pValue,
          trend: mk.trend,
        },
        baseline2001_2010: {
          mean: anomalyRecent.baselineMean,
          latestYearAnomaly: anomaly2025.anomaly,
          recent12MoAnomaly: anomalyRecent.anomaly,
          recent12MoPctAnomaly: anomalyRecent.pctAnomaly,
        },
        recent12MoPercentile: recentPercentile,
        historicalMin: Math.min(...ys),
        historicalMax: Math.max(...ys),
        historicalMean: r2(mean(ys)),
      };
    }

    statsResult.districts[id] = {
      id,
      name,
      division,
      metrics: districtMetricStats,
    };

    // Extreme Indicators from recent daily data
    const dailyRecords = (d.daily?.dates || []).map((date, i) => ({
      date,
      tmax: d.daily.tmax[i],
      rain: d.daily.rain[i],
      wet: d.daily.wet[i],
    }));

    const moderateExtremes = computeExtremeIndicators(dailyRecords, {
      heatwaveThreshold: 36.0,
      heavyRainThreshold: 50.0,
      drySpellThreshold: 1.0,
    });

    const severeExtremes = computeExtremeIndicators(dailyRecords, {
      heatwaveThreshold: 38.0,
      heavyRainThreshold: 100.0,
      drySpellThreshold: 1.0,
    });

    extremesResult.districts[id] = {
      id,
      name,
      division,
      observationDays: dailyRecords.length,
      recentPeriod: {
        start: dailyRecords[0]?.date || null,
        end: dailyRecords.at(-1)?.date || null,
      },
      indicators: {
        heatwaveDays36C: moderateExtremes.heatwaveDays,
        heatwaveDays38C: severeExtremes.heatwaveDays,
        heavyRainDays50mm: moderateExtremes.heavyRainDays,
        extremeRainDays100mm: severeExtremes.heavyRainDays,
        longestDrySpellDays: moderateExtremes.longestDrySpell,
        maxDailyRainMm: moderateExtremes.maxDailyRain,
        maxRecordedTmaxC: moderateExtremes.maxTmax,
        totalPeriodRainMm: moderateExtremes.totalRain,
      },
    };
  }

  // National Summary
  const natSummary = {};
  for (const m of metrics) {
    const allSlopes = Object.values(statsResult.districts).map((d) => d.metrics[m].sensSlopePerDecade);
    const sigTrends = Object.values(statsResult.districts).filter((d) => d.metrics[m].mannKendall.pValue < 0.05);
    const avgRecentAnom = Object.values(statsResult.districts).map((d) => d.metrics[m].baseline2001_2010.recent12MoAnomaly);

    natSummary[m] = {
      meanSlopePerDecade: r2(mean(allSlopes)),
      significantTrendsCount: sigTrends.length,
      increasingCount: sigTrends.filter((d) => d.metrics[m].mannKendall.trend === 'increasing').length,
      decreasingCount: sigTrends.filter((d) => d.metrics[m].mannKendall.trend === 'decreasing').length,
      meanRecentAnomalyVsBaseline: r2(mean(avgRecentAnom)),
    };
  }
  statsResult.nationalSummary = natSummary;

  await fs.writeFile(path.join(OUT_DIR, 'climate-stats.json'), JSON.stringify(statsResult, null, 2));
  await fs.writeFile(path.join(OUT_DIR, 'extremes.json'), JSON.stringify(extremesResult, null, 2));

  console.log(`[Climate Stats] Wrote climate-stats.json and extremes.json for ${districtFeatures.length} districts.`);

  return {
    districtsAnalyzed: districtFeatures.length,
    metricsAnalyzed: metrics.length,
  };
}

if (process.argv[1] && process.argv[1].endsWith('climate-stats.mjs')) {
  analyzeClimateData().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
