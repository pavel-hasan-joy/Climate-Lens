import { METRIC } from '../lib/constants.js';
import { formatValue } from '../lib/format.js';
import { BASEMAPS, RAIN_DATE } from './map/mapStyle.js';

export default function MapControls({ basemap, showRain, metric, domain, onBasemap, onRain }) {
  const { ramp } = METRIC[metric];
  return (
    <div className="map-controls">
      <div className="legend">
        <span className="legend-title">{METRIC[metric].short}</span>
        <div className="legend-ramp" style={{ background: `linear-gradient(90deg, ${ramp.join(',')})` }} />
        <div className="legend-ends">
          <span>{formatValue(metric, domain[0])}</span>
          <span>{formatValue(metric, domain[1])}</span>
        </div>
        <span className="legend-note">Height and colour show the value</span>
      </div>

      <div className="layers">
        {BASEMAPS.map((b) => (
          <button key={b.id} className={b.id === basemap ? 'on' : ''} onClick={() => onBasemap(b.id)} title={b.note}>
            {b.label}
          </button>
        ))}
        <button className={'rain' + (showRain ? ' on' : '')} onClick={() => onRain(!showRain)} title={`NASA GPM IMERG · ${RAIN_DATE}`}>
          Rain radar
        </button>
      </div>
    </div>
  );
}
