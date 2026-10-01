import { METRIC } from './constants';
import type { Language, MetricId } from './types';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export const toBanglaDigits = (strOrNum: string | number | null | undefined): string => {
  if (strOrNum == null) return '';
  return String(strOrNum).replace(/[0-9]/g, (d) => BN_DIGITS[+d]);
};

export const formatNumber = (n: number | null | undefined, digits: number = 0, lang: Language = 'en'): string => {
  if (n == null || Number.isNaN(n)) return '–';
  const enFormatted = n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return lang === 'bn' ? toBanglaDigits(enFormatted) : enFormatted;
};

export const formatValue = (metricId: MetricId, v: number | null | undefined, lang: Language = 'en'): string => {
  const m = METRIC[metricId];
  if (!m) return '';
  const num = formatNumber(v, m.digits, lang);
  const unit =
    lang === 'bn' ? (m.unit === '°C' ? '°সে' : m.unit === '%' ? '%' : ' মিমি') : m.unit === '%' ? '%' : ' ' + m.unit;
  return `${num}${unit.startsWith(' ') || unit === '%' ? unit : ' ' + unit}`;
};

export const formatAnomaly = (metricId: MetricId, diff: number | null | undefined, lang: Language = 'en'): string => {
  if (diff == null || Number.isNaN(diff)) return '–';
  const m = METRIC[metricId];
  if (!m) return '';
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : '±';
  const num = formatNumber(Math.abs(diff), m.digits, lang);
  const unit =
    lang === 'bn' ? (m.unit === '°C' ? '°সে' : m.unit === '%' ? '%' : ' মিমি') : m.unit === '%' ? '%' : ' ' + m.unit;
  return `${sign}${num}${unit.startsWith(' ') || unit === '%' ? unit : ' ' + unit}`;
};

// Change from the past baseline, in the way people read each metric
export function formatChange(
  metricId: MetricId,
  past: number | null | undefined,
  value: number | null | undefined,
  lang: Language = 'en',
): string {
  if (past == null || value == null) return '';
  const d = value - past;
  const arrow = d >= 0 ? '▲' : '▼';
  const suffix = lang === 'bn' ? 'অতীতের তুলনায়' : 'vs past';

  if (metricId === 'heat') {
    const val = formatNumber(Math.abs(d), 1, lang);
    const unit = lang === 'bn' ? '°সে' : '°C';
    return `${arrow} ${val} ${unit} ${suffix}`;
  }
  if (metricId === 'wet') {
    const val = formatNumber(Math.abs(d), 0, lang);
    const unit = lang === 'bn' ? 'শতাংশ' : 'pts';
    return `${arrow} ${val} ${unit} ${suffix}`;
  }
  const pct = formatNumber(Math.abs((d / past) * 100), 0, lang);
  return `${arrow} ${pct}% ${suffix}`;
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const MONTHS_BN = [
  'জানু',
  'ফেব্রু',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টে',
  'অক্টো',
  'নভে',
  'ডিসে',
] as const;

export const monthName = (i: number, lang: Language = 'en'): string =>
  lang === 'bn' ? (MONTHS_BN[i] ?? '') : (MONTHS_EN[i] ?? '');

// "202509" → "Sep 2025" / "সেপ্টে ২০২৫"
export const yyyymm = (s: string, lang: Language = 'en'): string => {
  const mIdx = +s.slice(4, 6) - 1;
  const m = monthName(mIdx, lang);
  const yr = lang === 'bn' ? toBanglaDigits(s.slice(0, 4)) : s.slice(0, 4);
  return `${m} ${yr}`;
};

// "20260924" → "24 Sep 2026" / "২৪ সেপ্টে ২০২৬"
export const yyyymmdd = (s: string, lang: Language = 'en'): string => {
  const d = lang === 'bn' ? toBanglaDigits(+s.slice(6, 8)) : +s.slice(6, 8);
  const mIdx = +s.slice(4, 6) - 1;
  const m = monthName(mIdx, lang);
  const yr = lang === 'bn' ? toBanglaDigits(s.slice(0, 4)) : s.slice(0, 4);
  return `${d} ${m} ${yr}`;
};

// Hex ramp → colour at t ∈ [0,1]
export function rampColor(ramp: readonly string[] | string[], t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t)) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(x));
  const a = hexToRgb(ramp[i]);
  const b = hexToRgb(ramp[i + 1]);
  const f = x - i;
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ];
}

export const hexToRgb = (h: string): [number, number, number] => {
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return [r, g, b];
};

export const rgb = ([r, g, b]: [number, number, number]): string => `rgb(${r},${g},${b})`;
