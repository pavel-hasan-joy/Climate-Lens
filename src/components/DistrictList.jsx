import { METRIC } from '../lib/constants.js';
import { districts, divisions, valueAt } from '../lib/metrics.js';
import { formatValue, rampColor, rgb } from '../lib/format.js';

const divisionName = Object.fromEntries(divisions.map((d) => [d.id, d.name]));

// Districts ranked by the selected metric — the whole division, or the country's top 10
export default function DistrictList({ divisionId, districtId, metric, time, year, domain, onSelect }) {
  const pool = districts.filter((d) => !divisionId || d.division === divisionId);
  const rows = pool
    .map((d) => ({ ...d, v: valueAt(d.id, metric, time, year) }))
    .sort((a, b) => b.v - a.v)
    .slice(0, divisionId ? undefined : 10);
  const t = (v) => Math.max(0, Math.min(1, (v - domain[0]) / (domain[1] - domain[0])));

  return (
    <div className="districts">
      {rows.map((d, i) => (
        <button
          key={d.id}
          className={'district' + (d.id === districtId ? ' on' : '')}
          style={{ animationDelay: `${i * 30}ms` }}
          onClick={() => onSelect(d.id)}
        >
          <span className="rank">{i + 1}</span>
          <span className="district-name">
            {d.name}
            {!divisionId && <small>{divisionName[d.division]}</small>}
          </span>
          <span className="district-bar">
            <i style={{ width: `${8 + t(d.v) * 92}%`, background: rgb(rampColor(METRIC[metric].ramp, t(d.v))) }} />
          </span>
          <span className="district-val">{formatValue(metric, d.v)}</span>
        </button>
      ))}
    </div>
  );
}
