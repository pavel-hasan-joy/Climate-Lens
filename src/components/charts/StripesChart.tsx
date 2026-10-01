import { useMemo, useState } from 'react';
import { METRIC } from '../../lib/constants';
import { formatAnomaly, formatValue, rampColor, rgb } from '../../lib/format';
import { YEARS } from '../../lib/metrics';
import type { DistrictStats, MetricId } from '../../lib/types';

interface StripesChartProps {
  stats: DistrictStats;
  metric: MetricId;
  isAnomaly?: boolean;
}

interface StripeItem {
  year: number;
  raw: number;
  val: number;
  color: string;
}

export default function StripesChart({ stats, metric, isAnomaly = false }: StripesChartProps) {
  const [hovered, setHovered] = useState<StripeItem | null>(null);
  const m = METRIC[metric];
  const ramp = isAnomaly ? m.divergingRamp : m.ramp;

  const { items, minVal, maxVal } = useMemo(() => {
    const rawValues = stats.annual;
    const pastVal = stats.past;
    const vals = isAnomaly ? rawValues.map((v) => v - pastVal) : rawValues;

    let min = Math.min(...vals);
    let max = Math.max(...vals);

    if (isAnomaly) {
      const maxAbs = Math.max(Math.abs(min), Math.abs(max)) || 1;
      min = -maxAbs;
      max = maxAbs;
    }

    const span = max - min || 1;
    const computed: StripeItem[] = YEARS.map((yr, i) => {
      const v = vals[i];
      const t = Math.max(0, Math.min(1, (v - min) / span));
      const col = rgb(rampColor(ramp, t));
      return {
        year: yr,
        raw: rawValues[i],
        val: v,
        color: col,
      };
    });

    return { items: computed, minVal: min, maxVal: max };
  }, [stats, isAnomaly, ramp]);

  return (
    <div className="stripes-wrap">
      <div className="stripes-bar" role="img" aria-label="Warming and climate stripes chart">
        {items.map((item) => (
          <div
            key={item.year}
            className={'stripe-cell' + (hovered?.year === item.year ? ' on' : '')}
            style={{ backgroundColor: item.color }}
            onMouseEnter={() => setHovered(item)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </div>
      <div className="stripes-meta">
        <span className="stripes-label">{YEARS[0]}</span>
        <span className="stripes-info">
          {hovered ? (
            <b>
              {hovered.year}: {isAnomaly ? formatAnomaly(metric, hovered.val) : formatValue(metric, hovered.val)}
            </b>
          ) : (
            <small>
              {isAnomaly
                ? `Range: ${formatAnomaly(metric, minVal)} to ${formatAnomaly(metric, maxVal)}`
                : `${YEARS[0]} → ${YEARS.at(-1)} climate stripes`}
            </small>
          )}
        </span>
        <span className="stripes-label">{YEARS.at(-1)}</span>
      </div>
    </div>
  );
}
