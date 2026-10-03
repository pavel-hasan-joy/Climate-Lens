import { useState, useEffect, useCallback } from 'react';
import { districts } from '../lib/metrics';
import { apiCache, apiQueue, fetchWithBackoff, validatePowerPayload } from '../lib/apiCache';
import { analyzeDistrictAsync, type DistrictAnalysisResult } from '../lib/workerMetrics';
import prebuiltClimateStats from '../data/analysis/climate-stats.json';
import prebuiltExtremes from '../data/analysis/extremes.json';

export interface UseDistrictAnalysisOptions {
  districtId: string | null;
  startYear?: number;
  endYear?: number;
  autoFetch?: boolean;
}

export interface UseDistrictAnalysisResult {
  loading: boolean;
  error: string | null;
  status: 'idle' | 'loading' | 'success' | 'fallback' | 'error';
  isLive: boolean;
  isCached: boolean;
  isFallback: boolean;
  fetchedAt: string | null;
  source: string;
  warnings: string[];
  analysis: DistrictAnalysisResult | null;
  refetch: () => Promise<void>;
}

const POWER_BASE = 'https://power.larc.nasa.gov/api/temporal';
const PARAMS = 'PRECTOTCORR,T2M_MAX,GWETROOT';

export function useDistrictAnalysis({
  districtId,
  startYear = 2001,
  endYear = 2025,
  autoFetch = true,
}: UseDistrictAnalysisOptions): UseDistrictAnalysisResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'fallback' | 'error'>('idle');
  const [isLive, setIsLive] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [source, setSource] = useState('NASA POWER');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<DistrictAnalysisResult | null>(null);

  // Fallback loader from Phase 9A pre-built snapshots
  const loadFallback = useCallback((id: string, reason?: string) => {
    const dStats = (prebuiltClimateStats.districts as Record<string, any>)[id];
    const dExtremes = (prebuiltExtremes.districts as Record<string, any>)[id];

    if (!dStats) {
      setError(`No fallback data available for district: ${id}`);
      setStatus('error');
      return;
    }

    const fallbackResult: DistrictAnalysisResult = {
      metrics: {
        monsoon: {
          series: [],
          slopePerYear: dStats.metrics.monsoon.sensSlopePerYear,
          slopePerDecade: dStats.metrics.monsoon.sensSlopePerDecade,
          intercept: dStats.metrics.monsoon.intercept,
          mannKendall: {
            s: dStats.metrics.monsoon.mannKendall.S,
            z: dStats.metrics.monsoon.mannKendall.z,
            p: dStats.metrics.monsoon.mannKendall.pValue,
            significant: dStats.metrics.monsoon.mannKendall.pValue < 0.05,
            trend: dStats.metrics.monsoon.mannKendall.trend,
          },
          baselineMean: dStats.metrics.monsoon.baseline2001_2010.mean,
          latestAnomaly: dStats.metrics.monsoon.baseline2001_2010.latestYearAnomaly,
          latestPctAnomaly: dStats.metrics.monsoon.baseline2001_2010.recent12MoPctAnomaly,
          latestPercentile: dStats.metrics.monsoon.recent12MoPercentile,
        },
        rain: {
          series: [],
          slopePerYear: dStats.metrics.rain.sensSlopePerYear,
          slopePerDecade: dStats.metrics.rain.sensSlopePerDecade,
          intercept: dStats.metrics.rain.intercept,
          mannKendall: {
            s: dStats.metrics.rain.mannKendall.S,
            z: dStats.metrics.rain.mannKendall.z,
            p: dStats.metrics.rain.mannKendall.pValue,
            significant: dStats.metrics.rain.mannKendall.pValue < 0.05,
            trend: dStats.metrics.rain.mannKendall.trend,
          },
          baselineMean: dStats.metrics.rain.baseline2001_2010.mean,
          latestAnomaly: dStats.metrics.rain.baseline2001_2010.latestYearAnomaly,
          latestPctAnomaly: dStats.metrics.rain.baseline2001_2010.recent12MoPctAnomaly,
          latestPercentile: dStats.metrics.rain.recent12MoPercentile,
        },
        heat: {
          series: [],
          slopePerYear: dStats.metrics.heat.sensSlopePerYear,
          slopePerDecade: dStats.metrics.heat.sensSlopePerDecade,
          intercept: dStats.metrics.heat.intercept,
          mannKendall: {
            s: dStats.metrics.heat.mannKendall.S,
            z: dStats.metrics.heat.mannKendall.z,
            p: dStats.metrics.heat.mannKendall.pValue,
            significant: dStats.metrics.heat.mannKendall.pValue < 0.05,
            trend: dStats.metrics.heat.mannKendall.trend,
          },
          baselineMean: dStats.metrics.heat.baseline2001_2010.mean,
          latestAnomaly: dStats.metrics.heat.baseline2001_2010.latestYearAnomaly,
          latestPctAnomaly: dStats.metrics.heat.baseline2001_2010.recent12MoPctAnomaly,
          latestPercentile: dStats.metrics.heat.recent12MoPercentile,
        },
        wet: {
          series: [],
          slopePerYear: dStats.metrics.wet.sensSlopePerYear,
          slopePerDecade: dStats.metrics.wet.sensSlopePerDecade,
          intercept: dStats.metrics.wet.intercept,
          mannKendall: {
            s: dStats.metrics.wet.mannKendall.S,
            z: dStats.metrics.wet.mannKendall.z,
            p: dStats.metrics.wet.mannKendall.pValue,
            significant: dStats.metrics.wet.mannKendall.pValue < 0.05,
            trend: dStats.metrics.wet.mannKendall.trend,
          },
          baselineMean: dStats.metrics.wet.baseline2001_2010.mean,
          latestAnomaly: dStats.metrics.wet.baseline2001_2010.latestYearAnomaly,
          latestPctAnomaly: dStats.metrics.wet.baseline2001_2010.recent12MoPctAnomaly,
          latestPercentile: dStats.metrics.wet.recent12MoPercentile,
        },
      },
      extremes: {
        heatwaveDays36C: dExtremes?.indicators.heatwaveDays36C ?? 0,
        heatwaveDays38C: dExtremes?.indicators.heatwaveDays38C ?? 0,
        heavyRainDays50mm: dExtremes?.indicators.heavyRainDays50mm ?? 0,
        longestDrySpellDays: dExtremes?.indicators.longestDrySpellDays ?? 0,
        maxDailyRainMm: dExtremes?.indicators.maxDailyRainMm ?? 0,
        maxRecordedTmaxC: dExtremes?.indicators.maxRecordedTmaxC ?? 0,
        totalRainMm: dExtremes?.indicators.totalPeriodRainMm ?? 0,
      },
    };

    setAnalysis(fallbackResult);
    setIsLive(false);
    setIsCached(false);
    setIsFallback(true);
    setFetchedAt(prebuiltClimateStats.metadata.fetchedAt);
    setSource('NASA POWER (Pre-built snapshot)');
    setStatus('fallback');
    setWarnings(reason ? [reason] : ['Using saved pre-built data from snapshot.']);
  }, []);

  const runAnalysis = useCallback(
    async (forceLive = false) => {
      if (!districtId) return;
      const d = districts.find((x) => x.id === districtId);
      if (!d) return;

      const cacheKey = `analysis_${districtId}_${startYear}_${endYear}`;

      // 1. Check Cache first if not forcing live refresh
      if (!forceLive) {
        const cached = apiCache.get<DistrictAnalysisResult>(cacheKey);
        if (cached) {
          setAnalysis(cached.data);
          setIsLive(false);
          setIsCached(true);
          setIsFallback(false);
          setFetchedAt(new Date(cached.fetchedAt).toLocaleTimeString());
          setSource(cached.source);
          setWarnings(cached.warnings);
          setStatus('success');
          return;
        }
      }

      setLoading(true);
      setError(null);
      setStatus('loading');

      try {
        // Enqueue request politely
        const liveResult = await apiQueue.enqueue(async () => {
          const q = `parameters=${PARAMS}&community=AG&longitude=${d.anchor[0]}&latitude=${d.anchor[1]}&format=JSON`;
          const url = `${POWER_BASE}/monthly/point?${q}&start=${startYear}&end=${endYear}`;

          const res = await fetchWithBackoff(url, {}, 2, 800);
          const json = await res.json();
          const rawParams = json?.properties?.parameter;

          // 2. Validate payload (scrub -999, detect empty/outliers)
          const validation = validatePowerPayload(rawParams);
          if (!validation.valid || !validation.sanitizedData) {
            throw new Error(`Invalid NASA POWER payload: ${validation.warnings.join(' ')}`);
          }

          const sp = validation.sanitizedData;
          const yearsArr: number[] = [];
          for (let y = startYear; y <= endYear; y++) yearsArr.push(y);

          const grid = (key: string) =>
            yearsArr.map((y) =>
              Array.from({ length: 12 }, (_, m) => {
                const ym = `${y}${String(m + 1).padStart(2, '0')}`;
                return sp[key]?.[ym] ?? 0;
              }),
            );

          const monthlyGrid = {
            rain: grid('PRECTOTCORR'),
            tmax: grid('T2M_MAX'),
            wet: grid('GWETROOT'),
          };

          // 3. Web Worker Offload for Sen's slope, Mann-Kendall, anomalies & extremes
          const computed = await analyzeDistrictAsync({
            years: yearsArr,
            monthly: monthlyGrid,
            baselineStart: 2001,
            baselineEnd: 2010,
          });

          return { computed, warnings: validation.warnings };
        });

        // 4. Save to Cache with 6h TTL
        apiCache.set(cacheKey, liveResult.computed, 'NASA POWER API (Live)', 6 * 3600 * 1000, liveResult.warnings);

        setAnalysis(liveResult.computed);
        setIsLive(true);
        setIsCached(false);
        setIsFallback(false);
        setFetchedAt(new Date().toLocaleTimeString());
        setSource('NASA POWER API (Live)');
        setWarnings(liveResult.warnings);
        setStatus('success');
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[Live Analysis] Live fetch failed for ${districtId}:`, errorMsg);
        setError(errorMsg);

        // 5. Offline / Failure Fallback: use pre-built snapshot and notify user
        loadFallback(districtId, `Live fetch failed (${errorMsg}). Showing saved data from snapshot.`);
      } finally {
        setLoading(false);
      }
    },
    [districtId, startYear, endYear, loadFallback],
  );

  useEffect(() => {
    if (autoFetch && districtId) {
      runAnalysis(false);
    }
  }, [districtId, startYear, endYear, autoFetch, runAnalysis]);

  return {
    loading,
    error,
    status,
    isLive,
    isCached,
    isFallback,
    fetchedAt,
    source,
    warnings,
    analysis,
    refetch: () => runAnalysis(true),
  };
}
