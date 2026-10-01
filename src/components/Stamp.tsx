import React from 'react';
import { TIME } from '../lib/constants';
import { useTranslation } from '../lib/i18n';
import type { ScenarioId, TimeId } from '../lib/types';

interface StampProps {
  time: TimeId;
  year?: number | null;
  isAnomaly?: boolean;
  scenario?: ScenarioId;
}

// Big "which moment am I looking at" label on the map
export default function Stamp({ time, year, isAnomaly = false, scenario = 'statistical' }: StampProps) {
  const { t, toDigits } = useTranslation();
  const playing = year != null;
  const timeKey = playing ? (year <= 2010 ? 'past' : year > 2025 ? 'future' : null) : time;
  const color = timeKey ? TIME[timeKey].color : '#b4bccd';

  const periodLabel =
    time === 'past' ? t('times.periodPast') : time === 'now' ? t('times.periodNow') : t('times.periodFuture');

  const scenarioTag = scenario && scenario !== 'statistical' ? (scenario === 'ssp245' ? 'SSP2-4.5' : 'SSP5-8.5') : null;

  const subLabel = isAnomaly
    ? t('metrics.anomaly') + (time === 'future' && scenarioTag ? ` · ${scenarioTag}` : '')
    : playing
      ? year > 2025
        ? t('detail.ourProjection') + (scenarioTag ? ` · ${scenarioTag}` : '')
        : t('detail.recorded')
      : periodLabel + (time === 'future' && scenarioTag ? ` · ${scenarioTag}` : '');

  return (
    <div className="stamp" key={(playing ? 'y' : time) + scenario} style={{ '--c': color } as React.CSSProperties}>
      <span className="stamp-dot" />
      <div>
        <div className="stamp-title">{playing ? toDigits(year) : t(`times.${time}`)}</div>
        <div className="stamp-sub">{subLabel}</div>
      </div>
    </div>
  );
}
