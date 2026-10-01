import { Line } from 'react-chartjs-2';
import { FUTURE_YEAR, METRIC, PAST_YEARS, TIME } from '../../lib/constants.js';
import { ALL_YEARS } from '../../lib/metrics.js';
import { baseOptions, crosshairPlugin, INK, shadePlugin } from './setup.js';

const alpha = (hex, a) => hex + Math.round(a * 255).toString(16).padStart(2, '0');

// History 2001–2025, "now" point, and the projected trend with its 95% band
export default function YearChart({ stats, metric, time, year }) {
  const { unit } = METRIC[metric];
  const labels = ALL_YEARS.map(String);
  const nowYear = 2026;
  const iNow = ALL_YEARS.indexOf(nowYear);
  const iFut = ALL_YEARS.indexOf(FUTURE_YEAR);
  const upper = stats.projected.map((v) => (v == null ? null : v + stats.band));
  const lower = stats.projected.map((v) => (v == null ? null : Math.max(0, v - stats.band)));
  const history = stats.annual.concat(Array(ALL_YEARS.length - stats.annual.length).fill(null));
  const emph = (t) => (time === t && year == null ? 1 : 0.45);

  const data = {
    labels,
    datasets: [
      { label: 'Upper', data: upper, borderWidth: 0, pointRadius: 0, fill: false, hideInTooltip: true },
      {
        label: '95% range', data: lower, borderWidth: 0, pointRadius: 0, hideInTooltip: true,
        fill: '-1', backgroundColor: alpha(TIME.future.color, 0.14 * (emph('future') + 0.4)),
      },
      {
        label: 'Recorded', data: history, borderColor: INK.secondary, borderWidth: 2, tension: 0.3,
        pointRadius: 0, pointHoverRadius: 4, pointBackgroundColor: INK.primary,
      },
      {
        label: 'Our projection', data: stats.projected, borderColor: TIME.future.color, borderWidth: 2,
        borderDash: [6, 5], pointRadius: 0, pointHoverRadius: 4,
      },
      {
        label: 'Past average', data: ALL_YEARS.map((y) => (y >= PAST_YEARS[0] && y <= PAST_YEARS[1] ? stats.past : null)),
        borderColor: TIME.past.color, borderWidth: 3 * emph('past') + 1, pointRadius: 0,
      },
      {
        label: 'Now (last 12 months)', data: ALL_YEARS.map((_, i) => (i === iNow ? stats.now : null)),
        pointRadius: 5 + 4 * emph('now'), pointBackgroundColor: TIME.now.color, pointBorderColor: '#0b0f19', pointBorderWidth: 2,
        showLine: false,
      },
      {
        label: `${FUTURE_YEAR} projection`, data: ALL_YEARS.map((_, i) => (i === iFut ? stats.future : null)),
        pointRadius: 5 + 4 * emph('future'), pointBackgroundColor: TIME.future.color, pointBorderColor: '#0b0f19', pointBorderWidth: 2,
        showLine: false,
      },
    ],
  };

  const options = baseOptions(unit);
  const ranges = [{ from: String(PAST_YEARS[0]), to: String(PAST_YEARS[1]), color: alpha(TIME.past.color, 0.1 * emph('past') + 0.04) }];
  if (year != null) ranges.push({ from: String(year), to: String(year), color: 'rgba(255,255,255,.18)' });
  options.plugins.shade = { ranges };

  return <Line data={data} options={options} plugins={[shadePlugin, crosshairPlugin]} />;
}
