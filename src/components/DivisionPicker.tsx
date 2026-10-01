import { METRIC } from '../lib/constants';
import { divisions, divisionsGeo, domainFor, idsOf, statsFor } from '../lib/metrics';
import { rampColor, rgb } from '../lib/format';
import { useTranslation } from '../lib/i18n';
import type { MetricId, TimeId } from '../lib/types';

// Tiny equirectangular projection into a 100×120 box around Bangladesh
const W = 100,
  H = 120;
const [X0, X1, Y0, Y1] = [88.0, 92.7, 20.6, 26.7];
const px = ([lng, lat]: [number, number]): string =>
  `${(((lng - X0) / (X1 - X0)) * W).toFixed(1)},${(((Y1 - lat) / (Y1 - Y0)) * H).toFixed(1)}`;
const ring = (r: [number, number][]): string => 'M' + r.map(px).join('L') + 'Z';
const toPath = (g: any): string => (g.type === 'Polygon' ? g.coordinates : g.coordinates.flat()).map(ring).join('');

const PATHS: Record<string, string> = Object.fromEntries(
  divisionsGeo.features.map((f: any) => [f.properties.id, toPath(f.geometry)]),
);

function valueOf(
  ids: string[],
  metric: MetricId,
  time: TimeId,
  year: number | null | undefined,
  isAnomaly: boolean,
): number | null {
  const s = statsFor(ids, metric);
  if (isAnomaly) {
    if (year != null) return s.anomaly.byYear[year - 2001];
    if (time === 'past') return 0;
    return s.anomaly[time];
  }
  return year != null ? s.byYear[year - 2001] : s[time];
}

interface DivisionPickerProps {
  value?: string | null;
  metric: MetricId;
  time: TimeId;
  year?: number | null;
  isAnomaly?: boolean;
  onChange: (id: string | null) => void;
}

export default function DivisionPicker({
  value,
  metric,
  time,
  year,
  isAnomaly = false,
  onChange,
}: DivisionPickerProps) {
  const { getDivisionName, t } = useTranslation();
  const domain = domainFor(idsOf(null), metric, isAnomaly);
  const m = METRIC[metric];
  const ramp = isAnomaly ? m.divergingRamp : m.ramp;

  const color = (id: string) => {
    const v = valueOf(idsOf(id), metric, time, year, isAnomaly);
    const span = domain[1] - domain[0] || 1;
    const tVal = Math.max(0, Math.min(1, ((v ?? 0) - domain[0]) / span));
    return rgb(rampColor(ramp, tVal));
  };

  const tiles = [{ id: null, name: t('app.country') }, ...divisions];

  return (
    <div className="divisions">
      {tiles.map((tile, i) => (
        <button
          key={tile.id ?? 'all'}
          className={'division' + (tile.id === value ? ' on' : '')}
          style={{ animationDelay: `${i * 35}ms` }}
          onClick={() => onChange(tile.id)}
        >
          <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            {divisions.map((d) => (
              <path
                key={d.id}
                d={PATHS[d.id]}
                fill={tile.id === null || tile.id === d.id ? color(d.id) : 'rgba(255,255,255,.06)'}
                stroke="rgba(0,0,0,.5)"
                strokeWidth=".6"
              />
            ))}
          </svg>
          <span>{tile.id ? getDivisionName(tile.id) : t('app.country')}</span>
        </button>
      ))}
    </div>
  );
}
