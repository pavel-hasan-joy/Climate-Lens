import { METRIC } from '../../lib/constants';
import { BASEMAPS, RAIN_DATE } from '../map/mapStyle';
import { useTranslation } from '../../lib/i18n';
import type { DomainRange, MetricId } from '../../lib/types';

interface MobileLayersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  basemap: string;
  showRain: boolean;
  metric: MetricId;
  domain: DomainRange;
  isAnomaly: boolean;
  onToggleAnomaly: () => void;
  onBasemap: (id: string) => void;
  onRain: (show: boolean) => void;
}

export default function MobileLayersSheet({
  isOpen,
  onClose,
  basemap,
  showRain,
  metric,
  domain,
  isAnomaly,
  onToggleAnomaly,
  onBasemap,
  onRain,
}: MobileLayersSheetProps) {
  const { t, formatVal, formatAnom, lang } = useTranslation();

  if (!isOpen) return null;

  const m = METRIC[metric];
  const ramp = isAnomaly ? m.divergingRamp : m.ramp;
  const metricLabel = t(`metrics.${metric}.label`);

  return (
    <div className="mobile-sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="mobile-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-sheet-handle" onClick={onClose} />

        <header className="mobile-sheet-header">
          <h3>{t('mobileNav.layers')}</h3>
          <button type="button" className="mobile-sheet-close" onClick={onClose} aria-label={t('mobileNav.close')}>
            ✕
          </button>
        </header>

        <div className="mobile-sheet-body">
          {/* Legend Section */}
          <section className="mobile-sheet-section">
            <div className="mobile-sheet-legend-header">
              <span className="mobile-sheet-title">
                {isAnomaly ? `${metricLabel} (${t('metrics.anomaly')})` : metricLabel}
              </span>
              <button type="button" className={'anomaly-pill' + (isAnomaly ? ' on' : '')} onClick={onToggleAnomaly}>
                {isAnomaly
                  ? lang === 'bn'
                    ? 'বিচ্যুতি চালু'
                    : 'Anomaly On'
                  : lang === 'bn'
                    ? 'বিচ্যুতি বন্ধ'
                    : 'Anomaly Off'}
              </button>
            </div>

            <div
              className="legend-ramp"
              style={{ background: `linear-gradient(90deg, ${ramp.join(',')})`, height: '14px', borderRadius: '7px' }}
            />

            <div className="legend-ends">
              <span>{isAnomaly ? formatAnom(metric, domain[0]) : formatVal(metric, domain[0])}</span>
              {isAnomaly && <span className="legend-mid">{lang === 'bn' ? '০ (ভিত্তি)' : '0 (baseline)'}</span>}
              <span>{isAnomaly ? formatAnom(metric, domain[1]) : formatVal(metric, domain[1])}</span>
            </div>

            <p className="mobile-sheet-note">
              {isAnomaly
                ? lang === 'bn'
                  ? 'রং ও উচ্চতা ২০০১–২০১০ ভিত্তি থেকে পার্থক্য নির্দেশ করে'
                  : 'Diverging colour & height show deviation from 2001–2010'
                : lang === 'bn'
                  ? 'উচ্চতা ও রং মান নির্দেশ করে'
                  : 'Height and colour show the value'}
            </p>
          </section>

          {/* Basemaps Section */}
          <section className="mobile-sheet-section">
            <h4 className="mobile-sheet-subtitle">{lang === 'bn' ? 'বেসম্যাপ নির্বাচন' : 'Basemap Selection'}</h4>
            <div className="mobile-basemap-grid">
              {BASEMAPS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={'mobile-basemap-btn' + (b.id === basemap ? ' active' : '')}
                  onClick={() => onBasemap(b.id)}
                >
                  <span className="mobile-basemap-name">{t(`controls.${b.id}`)}</span>
                  <span className="mobile-basemap-note">{b.note}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Rain Radar Section */}
          <section className="mobile-sheet-section">
            <h4 className="mobile-sheet-subtitle">{lang === 'bn' ? 'লাইভ ওয়েদার ওভারলে' : 'Live Weather Overlay'}</h4>
            <button
              type="button"
              className={'mobile-rain-toggle' + (showRain ? ' active' : '')}
              onClick={() => onRain(!showRain)}
            >
              <div className="mobile-rain-info">
                <span className="mobile-rain-title">{t('controls.rainRadar')}</span>
                <span className="mobile-rain-date">NASA GPM IMERG · {RAIN_DATE}</span>
              </div>
              <span className="mobile-toggle-switch">
                <span className="switch-knob" />
              </span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
