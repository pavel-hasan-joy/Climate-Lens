import React from 'react';
import { FUTURE_YEAR, LAST_PROJECTED_YEAR, PAST_YEARS, TIMES } from '../lib/constants';
import { nowWindow } from '../lib/metrics';
import { yyyymm } from '../lib/format';
import { useTranslation } from '../lib/i18n';
import type { TimeId } from '../lib/types';

const START = PAST_YEARS[0];
const pos = (y: number): number => ((y - START) / (LAST_PROJECTED_YEAR - START)) * 100;
const NOW_YEAR = +nowWindow[nowWindow.length - 1].slice(0, 4);

export const PERIOD: Record<TimeId, string> = {
  past: `${PAST_YEARS[0]}–${PAST_YEARS[1]} average`,
  now: `${yyyymm(nowWindow[0])} – ${yyyymm(nowWindow[nowWindow.length - 1])}`,
  future: `${FUTURE_YEAR} projection`,
};

const STOP: Record<TimeId, number> = {
  past: (PAST_YEARS[0] + PAST_YEARS[1]) / 2,
  now: NOW_YEAR,
  future: FUTURE_YEAR,
};

interface TimelineProps {
  time: TimeId;
  year?: number | null;
  playing: boolean;
  onTime: (time: TimeId) => void;
  onTogglePlay: () => void;
}

export default function Timeline({ time, year, playing, onTime, onTogglePlay }: TimelineProps) {
  const { t, toDigits, lang } = useTranslation();
  const at = year ?? STOP[time];

  return (
    <div className="timeline" role="region" aria-label="Climate Timeline Controls">
      <button
        type="button"
        className={'play' + (playing ? ' on' : '')}
        onClick={onTogglePlay}
        aria-label={playing ? t('timeline.pause') : t('timeline.play')}
      >
        <svg viewBox="0 0 24 24">
          {playing ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" /> : <path d="M7 4.5v15l12-7.5z" />}
        </svg>
      </button>

      <div className="track">
        <div className="rail">
          <span
            className="seg-past"
            style={{ left: `${pos(PAST_YEARS[0])}%`, width: `${pos(PAST_YEARS[1]) - pos(PAST_YEARS[0])}%` }}
          />
          <span className="seg-future" style={{ left: `${pos(NOW_YEAR)}%`, right: 0 }} />
          <span className="head" style={{ left: `${pos(at)}%` }} />
        </div>

        <div className="stops">
          {TIMES.map((stop) => (
            <button
              key={stop.id}
              type="button"
              className={'stop' + (year == null && stop.id === time ? ' on' : '')}
              aria-pressed={year == null && stop.id === time}
              style={{ left: `${pos(STOP[stop.id])}%`, '--c': stop.color } as React.CSSProperties}
              onClick={() => onTime(stop.id)}
            >
              <i />
              <b>{t(`times.${stop.id}`)}</b>
              <small>
                {stop.id === 'past'
                  ? `${toDigits(PAST_YEARS[0])}–${toDigits(PAST_YEARS[1])}`
                  : stop.id === 'now'
                    ? lang === 'bn'
                      ? 'গত ১২ মাস'
                      : 'Last 12 mo'
                    : toDigits(FUTURE_YEAR)}
              </small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
