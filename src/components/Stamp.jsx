import { TIME } from '../lib/constants.js';
import { PERIOD } from './Timeline.jsx';

// Big "which moment am I looking at" label on the map
export default function Stamp({ time, year }) {
  const playing = year != null;
  const t = playing ? (year <= 2010 ? 'past' : year > 2025 ? 'future' : null) : time;
  const color = t ? TIME[t].color : '#b4bccd';
  return (
    <div className="stamp" key={playing ? 'y' : time} style={{ '--c': color }}>
      <span className="stamp-dot" />
      <div>
        <div className="stamp-title">{playing ? year : TIME[time].label}</div>
        <div className="stamp-sub">{playing ? (year > 2025 ? 'Projected' : 'Recorded') : PERIOD[time]}</div>
      </div>
    </div>
  );
}
