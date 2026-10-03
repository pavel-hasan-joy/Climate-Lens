import { METRIC } from '../lib/constants';
import { BASEMAPS, RAIN_DATE } from './map/mapStyle';
import { useTranslation } from '../lib/i18n';
import type { DomainRange, MetricId } from '../lib/types';

interface MapControlsProps {
  basemap: string;
  showRain: boolean;
  metric: MetricId;
  domain: DomainRange;
  isAnomaly: boolean;
  onToggleAnomaly: () => void;
  onBasemap: (id: string) => void;
  onRain: (show: boolean) => void;
}

export default function MapControls({
  basemap,
  showRain,
  metric,
  domain,
  isAnomaly,
  onToggleAnomaly,
  onBasemap,
  onRain,
}: MapControlsProps) {
  const { t, formatVal, formatAnom, lang } = useTranslation();
  const m = METRIC[metric];
  const ramp = isAnomaly ? m.divergingRamp : m.ramp;
  const metricLabel = t(`metrics.${metric}.label`);

  return (
    <div className="map-controls" role="region" aria-label="Map Visual Controls and Legend">
      <div className={'legend' + (isAnomaly ? ' anomaly-legend' : '')}>
        <div className="legend-header">
          <span className="legend-title">{isAnomaly ? `${metricLabel} (${t('metrics.anomaly')})` : metricLabel}</span>
          <button
            type="button"
            className={'anomaly-pill' + (isAnomaly ? ' on' : '')}
            aria-pressed={isAnomaly}
            onClick={onToggleAnomaly}
            title={
              isAnomaly
                ? lang === 'bn'
                  ? 'প্রকৃত মানে ফিরুন'
                  : 'Switch to absolute values'
                : lang === 'bn'
                  ? 'ভিত্তি বছরের বিচ্যুতি দেখুন (+/−)'
                  : 'Switch to baseline anomaly (+/−)'
            }
          >
            {isAnomaly
              ? lang === 'bn'
                ? 'বিচ্যুতি চালু'
                : 'Anomaly On'
              : lang === 'bn'
                ? 'বিচ্যুতি বন্ধ'
                : 'Anomaly Off'}
          </button>
        </div>
        <div className="legend-ramp" style={{ background: `linear-gradient(90deg, ${ramp.join(',')})` }} />
        <div className="legend-ends">
          <span>{isAnomaly ? formatAnom(metric, domain[0]) : formatVal(metric, domain[0])}</span>
          {isAnomaly && <span className="legend-mid">{lang === 'bn' ? '০ (ভিত্তি)' : '0 (baseline)'}</span>}
          <span>{isAnomaly ? formatAnom(metric, domain[1]) : formatVal(metric, domain[1])}</span>
        </div>
        <span className="legend-note">
          {isAnomaly
            ? lang === 'bn'
              ? 'রং ও উচ্চতা ২০০১–২০১০ ভিত্তি থেকে পার্থক্য নির্দেশ করে'
              : 'Diverging colour & height show deviation from 2001–2010'
            : lang === 'bn'
              ? 'উচ্চতা ও রং মান নির্দেশ করে'
              : 'Height and colour show the value'}
        </span>
      </div>

      <div className="layers" role="group" aria-label="Map Basemap and Layers">
        {BASEMAPS.map((b) => (
          <button
            key={b.id}
            type="button"
            className={b.id === basemap ? 'on' : ''}
            aria-pressed={b.id === basemap}
            onClick={() => onBasemap(b.id)}
            title={b.note}
          >
            {t(`controls.${b.id}`)}
          </button>
        ))}
        <button
          type="button"
          className={'rain' + (showRain ? ' on' : '')}
          aria-pressed={showRain}
          onClick={() => onRain(!showRain)}
          title={`NASA GPM IMERG · ${RAIN_DATE}`}
        >
          {t('controls.rainRadar')}
        </button>
      </div>
    </div>
  );
}
