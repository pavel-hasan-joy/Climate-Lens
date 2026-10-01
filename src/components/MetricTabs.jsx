import { METRICS } from '../lib/constants.js';

const ICON = {
  monsoon: <path d="M12 3c-3 4.2-5 7.2-5 9.5a5 5 0 0 0 10 0C17 10.2 15 7.2 12 3Z" />,
  rain: <><path d="M7 15a4 4 0 1 1 .8-7.9A5 5 0 0 1 17.6 9 3.5 3.5 0 0 1 17 16H7" /><path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2" /></>,
  heat: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  wet: <><path d="M3 17c2 0 2-1.5 4.5-1.5S10 17 12 17s2.5-1.5 4.5-1.5S19 17 21 17" /><path d="M3 12c2 0 2-1.5 4.5-1.5S10 12 12 12s2.5-1.5 4.5-1.5S19 12 21 12" /><path d="M8 7h8" /></>,
};

export default function MetricTabs({ value, onChange }) {
  return (
    <nav className="metrics">
      {METRICS.map((m) => (
        <button key={m.id} className={m.id === value ? 'on' : ''} onClick={() => onChange(m.id)} title={m.about}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{ICON[m.id]}</svg>
          <span>{m.label}</span>
        </button>
      ))}
    </nav>
  );
}
