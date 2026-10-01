import { Line } from 'react-chartjs-2';
import { FUTURE_YEAR, METRIC, PAST_YEARS, TIME } from '../../lib/constants';
import { ALL_YEARS } from '../../lib/metrics';
import { baseOptions, crosshairPlugin, INK, shadePlugin } from './setup';
import type { Cmip6Result, DistrictStats, MetricId, ScenarioId, TimeId } from '../../lib/types';

const alpha = (hex: string, a: number): string =>
  hex +
  Math.round(a * 255)
    .toString(16)
    .padStart(2, '0');

interface YearChartProps {
  stats: DistrictStats;
  compareStats?: DistrictStats | null;
  metric: MetricId;
  time: TimeId;
  year?: number | null;
  districtName?: string;
  compareName?: string;
  scenario?: ScenarioId;
  cmipData?: Cmip6Result | null;
  compareCmipData?: Cmip6Result | null;
}

// History 2001–2025, "now" point, and the projected trend with its 95% band
// Supports overlaid two-district comparison when compareStats is provided
// Supports real CMIP6 physics model downscaled projection curve and uncertainty band
export default function YearChart({
  stats,
  compareStats = null,
  metric,
  time,
  year,
  districtName = 'District 1',
  compareName = 'District 2',
  scenario = 'statistical',
  cmipData = null,
  compareCmipData = null,
}: YearChartProps) {
  const { unit } = METRIC[metric];
  const labels = ALL_YEARS.map(String);
  const nowYear = 2026;
  const iNow = ALL_YEARS.indexOf(nowYear);
  const iFut = ALL_YEARS.indexOf(FUTURE_YEAR);
  const emph = (t: TimeId) => (time === t && year == null ? 1 : 0.45);

  const isCompare = !!compareStats;
  const d1Color = isCompare ? '#3987e5' : INK.secondary;
  const d2Color = '#f59e0b';
  const hasCmip = scenario !== 'statistical' && cmipData != null;

  let datasets: Record<string, unknown>[] = [];

  if (isCompare && compareStats) {
    const history1 = (stats.annual as (number | null)[]).concat(
      Array(ALL_YEARS.length - stats.annual.length).fill(null),
    );
    const history2 = (compareStats.annual as (number | null)[]).concat(
      Array(ALL_YEARS.length - compareStats.annual.length).fill(null),
    );

    datasets = [
      // District 1 (Primary)
      {
        label: `${districtName} (Recorded)`,
        data: history1,
        borderColor: d1Color,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: d1Color,
      },
      {
        label: `${districtName} (Theil–Sen Trend)`,
        data: stats.projected,
        borderColor: d1Color,
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ];

    // CMIP6 for District 1
    if (hasCmip) {
      const cmip1Median = ALL_YEARS.map((y) => {
        const idx = cmipData.years.indexOf(y);
        return idx >= 0 ? cmipData.median[idx] : null;
      });
      datasets.push({
        label: `${districtName} (${cmipData.info.name})`,
        data: cmip1Median,
        borderColor: '#10b981',
        borderWidth: 2.5,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
      });
    }

    datasets.push(
      {
        label: `${districtName} (Now)`,
        data: ALL_YEARS.map((_, i) => (i === iNow ? stats.now : null)),
        pointRadius: 6,
        pointBackgroundColor: d1Color,
        pointBorderColor: '#0b0f19',
        pointBorderWidth: 2,
        showLine: false,
      },
      {
        label: `${districtName} (${FUTURE_YEAR})`,
        data: ALL_YEARS.map((_, i) => (i === iFut ? (hasCmip ? cmipData.at2040.median : stats.future) : null)),
        pointRadius: 6,
        pointBackgroundColor: hasCmip ? '#10b981' : d1Color,
        pointBorderColor: '#0b0f19',
        pointBorderWidth: 2,
        showLine: false,
      },
      // District 2 (Compare)
      {
        label: `${compareName} (Recorded)`,
        data: history2,
        borderColor: d2Color,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: d2Color,
      },
      {
        label: `${compareName} (Theil–Sen Trend)`,
        data: compareStats.projected,
        borderColor: d2Color,
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    );

    // CMIP6 for District 2
    if (scenario !== 'statistical' && compareCmipData) {
      const cmip2Median = ALL_YEARS.map((y) => {
        const idx = compareCmipData.years.indexOf(y);
        return idx >= 0 ? compareCmipData.median[idx] : null;
      });
      datasets.push({
        label: `${compareName} (${compareCmipData.info.name})`,
        data: cmip2Median,
        borderColor: '#ef4444',
        borderWidth: 2.5,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
      });
    }

    datasets.push(
      {
        label: `${compareName} (Now)`,
        data: ALL_YEARS.map((_, i) => (i === iNow ? compareStats.now : null)),
        pointRadius: 6,
        pointBackgroundColor: d2Color,
        pointBorderColor: '#0b0f19',
        pointBorderWidth: 2,
        showLine: false,
      },
      {
        label: `${compareName} (${FUTURE_YEAR})`,
        data: ALL_YEARS.map((_, i) =>
          i === iFut ? (compareCmipData ? compareCmipData.at2040.median : compareStats.future) : null,
        ),
        pointRadius: 6,
        pointBackgroundColor: compareCmipData ? '#ef4444' : d2Color,
        pointBorderColor: '#0b0f19',
        pointBorderWidth: 2,
        showLine: false,
      },
    );
  } else {
    // Single district / division mode
    const upper = stats.projected.map((v) => (v == null ? null : v + stats.band));
    const lower = stats.projected.map((v) => (v == null ? null : Math.max(0, v - stats.band)));
    const history = (stats.annual as (number | null)[]).concat(
      Array(ALL_YEARS.length - stats.annual.length).fill(null),
    );

    datasets = [];

    // CMIP6 Model Spread Ribbon (10th–90th percentile)
    if (hasCmip) {
      const cmipHigh = ALL_YEARS.map((y) => {
        const idx = cmipData.years.indexOf(y);
        return idx >= 0 ? cmipData.high[idx] : null;
      });
      const cmipLow = ALL_YEARS.map((y) => {
        const idx = cmipData.years.indexOf(y);
        return idx >= 0 ? cmipData.low[idx] : null;
      });

      datasets.push(
        {
          label: `${cmipData.info.name} 90th %ile`,
          data: cmipHigh,
          borderWidth: 0,
          pointRadius: 0,
          fill: false,
          hideInTooltip: true,
        },
        {
          label: `${cmipData.info.name} (10–90th %ile)`,
          data: cmipLow,
          borderWidth: 0,
          pointRadius: 0,
          hideInTooltip: true,
          fill: '-1',
          backgroundColor: alpha(cmipData.info.color, 0.2),
        },
      );
    } else {
      datasets.push(
        { label: 'Upper', data: upper, borderWidth: 0, pointRadius: 0, fill: false, hideInTooltip: true },
        {
          label: '95% range',
          data: lower,
          borderWidth: 0,
          pointRadius: 0,
          hideInTooltip: true,
          fill: '-1',
          backgroundColor: alpha(TIME.future.color, 0.14 * (emph('future') + 0.4)),
        },
      );
    }

    datasets.push(
      {
        label: 'Recorded (2001–2025)',
        data: history,
        borderColor: INK.secondary,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: INK.primary,
      },
      {
        label: 'Statistical Trend (Theil–Sen)',
        data: stats.projected,
        borderColor: TIME.future.color,
        borderWidth: 2,
        borderDash: [6, 5],
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    );

    // CMIP6 Median Line
    if (hasCmip) {
      const cmipMedian = ALL_YEARS.map((y) => {
        const idx = cmipData.years.indexOf(y);
        return idx >= 0 ? cmipData.median[idx] : null;
      });

      datasets.push({
        label: `${cmipData.info.name} (Model Median)`,
        data: cmipMedian,
        borderColor: cmipData.info.color,
        borderWidth: 2.5,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: cmipData.info.color,
      });
    }

    datasets.push(
      {
        label: 'Past average (2001–2010)',
        data: ALL_YEARS.map((y) => (y >= PAST_YEARS[0] && y <= PAST_YEARS[1] ? stats.past : null)),
        borderColor: TIME.past.color,
        borderWidth: 3 * emph('past') + 1,
        pointRadius: 0,
      },
      {
        label: 'Now (last 12 months)',
        data: ALL_YEARS.map((_, i) => (i === iNow ? stats.now : null)),
        pointRadius: 5 + 4 * emph('now'),
        pointBackgroundColor: TIME.now.color,
        pointBorderColor: '#0b0f19',
        pointBorderWidth: 2,
        showLine: false,
      },
      {
        label: hasCmip ? `${cmipData.info.name} (${FUTURE_YEAR})` : `${FUTURE_YEAR} projection`,
        data: ALL_YEARS.map((_, i) => (i === iFut ? (hasCmip ? cmipData.at2040.median : stats.future) : null)),
        pointRadius: 5 + 4 * emph('future'),
        pointBackgroundColor: hasCmip ? cmipData.info.color : TIME.future.color,
        pointBorderColor: '#0b0f19',
        pointBorderWidth: 2,
        showLine: false,
      },
    );
  }

  const data = { labels, datasets };

  const options: any = baseOptions(unit);
  const ranges: Array<{ from: string; to: string; color: string }> = [
    {
      from: String(PAST_YEARS[0]),
      to: String(PAST_YEARS[1]),
      color: alpha(TIME.past.color, 0.1 * emph('past') + 0.04),
    },
  ];
  if (year != null) ranges.push({ from: String(year), to: String(year), color: 'rgba(255,255,255,.18)' });
  options.plugins.shade = { ranges };

  if (hasCmip) {
    options.plugins.tooltip.callbacks.afterBody = (items: Array<{ label?: string }>) => {
      const yr = Number(items[0]?.label);
      if (!yr || yr < 2021 || yr > 2050) return '';
      const idx = cmipData.years.indexOf(yr);
      if (idx < 0) return '';
      const lo = cmipData.low[idx];
      const hi = cmipData.high[idx];
      return `   [${cmipData.info.name} 10–90th %ile: ${lo} – ${hi} ${unit}]`;
    };
  }

  // Slope per decade and Mann–Kendall significance
  const slopeDigits = metric === 'heat' ? 2 : 1;
  const slope1 = stats.slope * 10;
  const pVal1 = stats.mk?.p ?? 1;
  const isSig1 = stats.mk?.significant ?? false;
  const sigText1 = isSig1 ? `p = ${pVal1.toFixed(3)}` : `p = ${pVal1.toFixed(2)} (ns)`;
  const slopeSign1 = slope1 > 0 ? '+' : '';

  const slope2 = compareStats ? compareStats.slope * 10 : 0;
  const pVal2 = compareStats?.mk?.p ?? 1;
  const isSig2 = compareStats?.mk?.significant ?? false;
  const sigText2 = isSig2 ? `p = ${pVal2.toFixed(3)}` : `p = ${pVal2.toFixed(2)} (ns)`;
  const slopeSign2 = slope2 > 0 ? '+' : '';

  return (
    <div className="year-chart-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div className="trend-stat-badge">
        {isCompare ? (
          <div className="trend-compare-group">
            <span className="trend-item" style={{ color: d1Color }}>
              <i style={{ background: d1Color }} />
              <b>{districtName}:</b> {slopeSign1}
              {slope1.toFixed(slopeDigits)} {unit}/dec ({sigText1})
            </span>
            <span className="trend-item" style={{ color: d2Color }}>
              <i style={{ background: d2Color }} />
              <b>{compareName}:</b> {slopeSign2}
              {slope2.toFixed(slopeDigits)} {unit}/dec ({sigText2})
            </span>
          </div>
        ) : (
          <div className="trend-single-group">
            <span className="trend-slope">
              <b>
                {slopeSign1}
                {slope1.toFixed(slopeDigits)}
              </b>{' '}
              {unit}/decade
            </span>
            <span
              className={'trend-sig' + (isSig1 ? ' on' : '')}
              title={`Mann–Kendall trend test: p = ${pVal1.toFixed(4)}`}
            >
              {sigText1}
            </span>
            {hasCmip && (
              <span className="trend-cmip-tag" style={{ color: cmipData.info.color }}>
                <i style={{ background: cmipData.info.color }} />
                <b>{cmipData.info.name} (2040):</b> {cmipData.at2040.median} {unit}
              </span>
            )}
          </div>
        )}
      </div>
      <Line data={data as any} options={options} plugins={[shadePlugin, crosshairPlugin]} />
    </div>
  );
}
