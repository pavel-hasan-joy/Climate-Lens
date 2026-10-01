import { FUTURE_YEAR, LAST_PROJECTED_YEAR, PAST_YEARS, TIMES } from '../lib/constants.js';
import { nowWindow } from '../lib/metrics.js';
import { yyyymm } from '../lib/format.js';

const START = PAST_YEARS[0];
const pos = (y) => ((y - START) / (LAST_PROJECTED_YEAR - START)) * 100;
const NOW_YEAR = +nowWindow.at(-1).slice(0, 4);

export const PERIOD = {
  past: `${PAST_YEARS[0]}–${PAST_YEARS[1]} average`,
  now: `${yyyymm(nowWindow[0])} – ${yyyymm(nowWindow.at(-1))}`,
  future: `${FUTURE_YEAR} projection`,
};

const STOP = { past: (PAST_YEARS[0] + PAST_YEARS[1]) / 2, now: NOW_YEAR, future: FUTURE_YEAR };

export default function Timeline({ time, year, playing, onTime, onTogglePlay }) {
  const at = year ?? STOP[time];

  return (
    <div className="timeline">
      <button className={'play' + (playing ? ' on' : '')} onClick={onTogglePlay} aria-label={playing ? 'Pause' : 'Play years'}>
        <svg viewBox="0 0 24 24">{playing ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" /> : <path d="M7 4.5v15l12-7.5z" />}</svg>
      </button>

      <div className="track">
        <div className="rail">
          <span className="seg-past" style={{ left: `${pos(PAST_YEARS[0])}%`, width: `${pos(PAST_YEARS[1]) - pos(PAST_YEARS[0])}%` }} />
          <span className="seg-future" style={{ left: `${pos(NOW_YEAR)}%`, right: 0 }} />
          <span className="head" style={{ left: `${pos(at)}%` }} />
        </div>

        <div className="stops">
          {TIMES.map((t) => (
            <button
              key={t.id}
              className={'stop' + (year == null && t.id === time ? ' on' : '')}
              style={{ left: `${pos(STOP[t.id])}%`, '--c': t.color }}
              onClick={() => onTime(t.id)}
            >
              <i />
              <b>{t.label}</b>
              <small>{t.id === 'past' ? `${PAST_YEARS[0]}–${PAST_YEARS[1]}` : t.id === 'now' ? 'Last 12 mo' : FUTURE_YEAR}</small>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
