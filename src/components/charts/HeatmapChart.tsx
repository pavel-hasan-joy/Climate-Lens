import { useMemo, useState } from 'react';
import { METRIC } from '../../lib/constants';
import { formatAnomaly, formatValue, monthName, rampColor, rgb } from '../../lib/format';
import { YEARS } from '../../lib/metrics';
import type { DistrictStats, MetricId } from '../../lib/types';

const MONTH_INDICES = [...Array(12).keys()];

interface HeatmapChartProps {
  stats: DistrictStats;
  metric: MetricId;
  isAnomaly?: boolean;
}

interface HeatmapCell {
  yr: number;
  mi: number;
  raw: number;
  val: number;
  color?: string;
}

export default function HeatmapChart({ stats, metric, isAnomaly = false }: HeatmapChartProps) {
  const [hovered, setHovered] = useState<HeatmapCell | null>(null);
  const m = METRIC[metric];
  const ramp = isAnomaly ? m.divergingRamp : m.ramp;

  const { matrix, minVal, maxVal } = useMemo(() => {
    const rawMatrix = stats.monthlyMatrix; // 25 years x 12 months
    const baselineCycle = stats.cycle.past; // 12 months past average baseline

    const data: HeatmapCell[][] = rawMatrix.map((row, yi) => {
      const yr = YEARS[yi];
      return row.map((rawVal, mi) => {
        const val = isAnomaly ? rawVal - baselineCycle[mi] : rawVal;
        return { yr, mi, raw: rawVal, val };
      });
    });

    const allValues = data.flatMap((row) => row.map((cell) => cell.val));
    let min = Math.min(...allValues);
    let max = Math.max(...allValues);

    if (isAnomaly) {
      const maxAbs = Math.max(Math.abs(min), Math.abs(max)) || 1;
      min = -maxAbs;
      max = maxAbs;
    }

    const span = max - min || 1;
    const coloredMatrix = data.map((row) =>
      row.map((cell) => {
        const t = Math.max(0, Math.min(1, (cell.val - min) / span));
        const color = rgb(rampColor(ramp, t));
        return { ...cell, color };
      }),
    );

    return { matrix: coloredMatrix, minVal: min, maxVal: max };
  }, [stats, isAnomaly, ramp]);

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-head-months">
        <div className="heatmap-corner" />
        {MONTH_INDICES.map((mi) => (
          <span key={mi} className="heatmap-col-label">
            {monthName(mi)[0]}
          </span>
        ))}
      </div>

      <div className="heatmap-body">
        {matrix.map((row, yi) => {
          const yr = YEARS[yi];
          const isDecade = yr % 5 === 0;
          return (
            <div key={yr} className="heatmap-row">
              <span className={'heatmap-row-label' + (isDecade ? ' bold' : '')}>{isDecade ? yr : ''}</span>
              <div className="heatmap-row-cells">
                {row.map((cell) => (
                  <div
                    key={cell.mi}
                    className={'heatmap-cell' + (hovered?.yr === cell.yr && hovered?.mi === cell.mi ? ' on' : '')}
                    style={{ backgroundColor: cell.color }}
                    onMouseEnter={() => setHovered(cell)}
                    onMouseLeave={() => setHovered(null)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="heatmap-footer">
        {hovered ? (
          <div className="heatmap-tooltip-bar">
            <b>
              {monthName(hovered.mi)} {hovered.yr}
            </b>
            : {isAnomaly ? formatAnomaly(metric, hovered.val) : formatValue(metric, hovered.val)}
            {isAnomaly && <small> (recorded: {formatValue(metric, hovered.raw)})</small>}
          </div>
        ) : (
          <div className="heatmap-legend-bar">
            <span>{isAnomaly ? formatAnomaly(metric, minVal) : formatValue(metric, minVal)}</span>
            <div className="heatmap-ramp-bar" style={{ background: `linear-gradient(90deg, ${ramp.join(',')})` }} />
            <span>{isAnomaly ? formatAnomaly(metric, maxVal) : formatValue(metric, maxVal)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
