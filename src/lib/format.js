import { METRIC } from './constants.js';

export const formatNumber = (n, digits = 0) =>
  n == null || Number.isNaN(n)
    ? '–'
    : n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const formatValue = (metricId, v) => {
  const m = METRIC[metricId];
  return `${formatNumber(v, m.digits)}${m.unit === '%' ? '%' : ' ' + m.unit}`;
};

// Change from the past baseline, in the way people read each metric
export function formatChange(metricId, past, value) {
  if (past == null || value == null) return '';
  const d = value - past;
  const arrow = d >= 0 ? '▲' : '▼';
  if (metricId === 'heat') return `${arrow} ${formatNumber(Math.abs(d), 1)} °C vs past`;
  if (metricId === 'wet') return `${arrow} ${formatNumber(Math.abs(d), 0)} pts vs past`;
  return `${arrow} ${formatNumber(Math.abs((d / past) * 100), 0)}% vs past`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthName = (i) => MONTHS[i];

// "202509" → "Sep 2025"
export const yyyymm = (s) => `${MONTHS[+s.slice(4, 6) - 1]} ${s.slice(0, 4)}`;
// "20260924" → "24 Sep 2026"
export const yyyymmdd = (s) => `${+s.slice(6, 8)} ${MONTHS[+s.slice(4, 6) - 1]} ${s.slice(0, 4)}`;

// Hex ramp → colour at t ∈ [0,1]
export function rampColor(ramp, t) {
  const x = Math.max(0, Math.min(1, t)) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(x));
  const a = hexToRgb(ramp[i]);
  const b = hexToRgb(ramp[i + 1]);
  const f = x - i;
  return a.map((v, k) => Math.round(v + (b[k] - v) * f));
}

export const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const rgb = ([r, g, b]) => `rgb(${r},${g},${b})`;
