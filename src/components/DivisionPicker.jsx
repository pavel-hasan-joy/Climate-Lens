import { METRIC } from '../lib/constants.js';
import { divisions, divisionsGeo, domainFor, idsOf, statsFor } from '../lib/metrics.js';
import { rampColor, rgb } from '../lib/format.js';

// Tiny equirectangular projection into a 100×120 box around Bangladesh
const W = 100, H = 120;
const [X0, X1, Y0, Y1] = [88.0, 92.7, 20.6, 26.7];
const px = ([lng, lat]) => `${(((lng - X0) / (X1 - X0)) * W).toFixed(1)},${(((Y1 - lat) / (Y1 - Y0)) * H).toFixed(1)}`;
const ring = (r) => 'M' + r.map(px).join('L') + 'Z';
const toPath = (g) => (g.type === 'Polygon' ? g.coordinates : g.coordinates.flat()).map(ring).join('');

const PATHS = Object.fromEntries(divisionsGeo.features.map((f) => [f.properties.id, toPath(f.geometry)]));

function valueOf(ids, metric, time, year) {
  const s = statsFor(ids, metric);
  return year != null ? s.byYear[year - 2001] : s[time];
}

export default function DivisionPicker({ value, metric, time, year, onChange }) {
  const domain = domainFor(idsOf(null), metric);
  const color = (id) => {
    const v = valueOf(idsOf(id), metric, time, year);
    return rgb(rampColor(METRIC[metric].ramp, (v - domain[0]) / (domain[1] - domain[0])));
  };

  const tiles = [{ id: null, name: 'All Bangladesh' }, ...divisions];

  return (
    <div className="divisions">
      {tiles.map((t, i) => (
        <button
          key={t.id ?? 'all'}
          className={'division' + (t.id === value ? ' on' : '')}
          style={{ animationDelay: `${i * 35}ms` }}
          onClick={() => onChange(t.id)}
        >
          <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            {divisions.map((d) => (
              <path
                key={d.id}
                d={PATHS[d.id]}
                fill={t.id === null || t.id === d.id ? color(d.id) : 'rgba(255,255,255,.06)'}
                stroke="rgba(0,0,0,.5)"
                strokeWidth=".6"
              />
            ))}
          </svg>
          <span>{t.name}</span>
        </button>
      ))}
    </div>
  );
}
