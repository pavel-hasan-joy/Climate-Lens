import { mannKendall, theilSen } from './metrics';
import { analyzeDistrictPayload } from '../workers/metrics.worker';
import type { MannKendallResult, TrendResult } from './types';

export interface DistrictMetricAnalysis {
  series: number[];
  slopePerYear: number;
  slopePerDecade: number;
  intercept: number;
  mannKendall: {
    s: number;
    z: number;
    p: number;
    significant: boolean;
    trend: 'increasing' | 'decreasing' | 'no_trend';
  };
  baselineMean: number;
  latestAnomaly: number;
  latestPctAnomaly: number;
  latestPercentile: number;
}

export interface DistrictAnalysisResult {
  metrics: {
    monsoon: DistrictMetricAnalysis;
    rain: DistrictMetricAnalysis;
    heat: DistrictMetricAnalysis;
    wet: DistrictMetricAnalysis;
  };
  extremes: {
    heatwaveDays36C: number;
    heatwaveDays38C: number;
    heavyRainDays50mm: number;
    longestDrySpellDays: number;
    maxDailyRainMm: number;
    maxRecordedTmaxC: number;
    totalRainMm: number;
  };
}

let worker: Worker | null = null;
let reqCounter = 0;
const pending = new Map<number, { resolve: (res: any) => void; reject: (err: any) => void }>();

function getWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') return null;

  if (!worker) {
    try {
      worker = new Worker(new URL('../workers/metrics.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.onmessage = (e: MessageEvent) => {
        const { id, success, result, error } = e.data;
        const p = pending.get(id);
        if (!p) return;
        pending.delete(id);
        if (success) p.resolve(result);
        else p.reject(new Error(error));
      };
      worker.onerror = () => {
        // Fall back gracefully to main thread if worker fails to start
        worker = null;
      };
    } catch {
      worker = null;
    }
  }
  return worker;
}

/**
 * Computes Mann-Kendall statistics in a background Web Worker,
 * with transparent synchronous fallback on the main thread.
 */
export async function computeMannKendallAsync(ys: number[]): Promise<MannKendallResult> {
  const w = getWorker();
  if (!w) {
    return mannKendall(ys);
  }

  const id = ++reqCounter;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, type: 'MANN_KENDALL', payload: { ys } });
  });
}

/**
 * Computes Theil-Sen trend in a background Web Worker,
 * with transparent synchronous fallback on the main thread.
 */
export async function computeTheilSenAsync(xs: number[], ys: number[]): Promise<TrendResult> {
  const w = getWorker();
  if (!w) {
    return theilSen(xs, ys);
  }

  const id = ++reqCounter;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, type: 'THEIL_SEN', payload: { xs, ys } });
  }).then((res: any) => ({
    ...res,
    at: (x: number) => res.intercept + res.slope * x,
  }));
}

/**
 * Computes full district statistical trends, baseline anomalies, and extremes
 * in a Web Worker, with synchronous fallback.
 */
export async function analyzeDistrictAsync(payload: {
  years: number[];
  monthly: { rain: number[][]; tmax: number[][]; wet: number[][] };
  daily?: { dates: string[]; rain: number[]; tmax: number[] };
  baselineStart?: number;
  baselineEnd?: number;
}): Promise<DistrictAnalysisResult> {
  const w = getWorker();
  if (!w) {
    return analyzeDistrictPayload(payload) as unknown as DistrictAnalysisResult;
  }

  const id = ++reqCounter;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, type: 'ANALYZE_DISTRICT', payload });
  });
}
