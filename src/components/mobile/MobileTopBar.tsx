import React from 'react';
import { METRICS } from '../../lib/constants';
import { useTranslation } from '../../lib/i18n';
import type { MetricId } from '../../lib/types';

const ICON: Record<MetricId, React.ReactNode> = {
  monsoon: <path d="M12 3c-3 4.2-5 7.2-5 9.5a5 5 0 0 0 10 0C17 10.2 15 7.2 12 3Z" />,
  rain: (
    <>
      <path d="M7 15a4 4 0 1 1 .8-7.9A5 5 0 0 1 17.6 9 3.5 3.5 0 0 1 17 16H7" />
      <path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2" />
    </>
  ),
  heat: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  wet: (
    <>
      <path d="M3 17c2 0 2-1.5 4.5-1.5S10 17 12 17s2.5-1.5 4.5-1.5S19 17 21 17" />
      <path d="M3 12c2 0 2-1.5 4.5-1.5S10 12 12 12s2.5-1.5 4.5-1.5S19 12 21 12" />
      <path d="M8 7h8" />
    </>
  ),
};

interface MobileTopBarProps {
  metric: MetricId;
  onChangeMetric: (metric: MetricId) => void;
  isAnomaly: boolean;
  onToggleAnomaly: () => void;
  canInstall?: boolean;
  onInstall?: () => void;
  onOpenAbout: () => void;
}

export default function MobileTopBar({
  metric,
  onChangeMetric,
  isAnomaly,
  onToggleAnomaly,
  canInstall,
  onInstall,
  onOpenAbout,
}: MobileTopBarProps) {
  const { lang, setLang, t } = useTranslation();

  return (
    <header className="mobile-topbar" role="banner">
      <div className="mobile-topbar-main">
        <div className="mobile-topbar-brand">
          <div className="mobile-topbar-logo">
            <span />
          </div>
          <div className="mobile-topbar-titles">
            <h1>{t('app.title')}</h1>
            <span className="mobile-live-badge">
              <span className="live-dot" />
              {lang === 'bn' ? 'নাসা লাইভ' : 'NASA Live'}
            </span>
          </div>
        </div>

        <div className="mobile-topbar-actions">
          {canInstall && (
            <button
              type="button"
              className="mobile-install-btn"
              onClick={onInstall}
              title={t('mobileNav.installApp')}
              aria-label={t('mobileNav.installApp')}
            >
              <span className="mobile-install-icon">📲</span>
              <span className="mobile-install-text">{lang === 'bn' ? 'অ্যাপ' : 'App'}</span>
            </button>
          )}

          <button
            type="button"
            className="mobile-icon-btn"
            onClick={onOpenAbout}
            title={t('aboutModal.btnTitle')}
            aria-label={t('aboutModal.btnTitle')}
          >
            ?
          </button>

          <div className="mobile-lang-pill">
            <button type="button" className={'lang-btn' + (lang === 'en' ? ' on' : '')} onClick={() => setLang('en')}>
              EN
            </button>
            <button type="button" className={'lang-btn' + (lang === 'bn' ? ' on' : '')} onClick={() => setLang('bn')}>
              বাং
            </button>
          </div>
        </div>
      </div>

      <div className="mobile-metric-scroller" role="tablist" aria-label="Select Climate Metric">
        <div className="mobile-metric-pills">
          {METRICS.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={m.id === metric}
              className={'mobile-metric-pill' + (m.id === metric ? ' active' : '')}
              onClick={() => onChangeMetric(m.id)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {ICON[m.id]}
              </svg>
              <span>{t(`metrics.${m.id}.label`)}</span>
            </button>
          ))}
          <button
            type="button"
            className={'mobile-metric-pill anomaly-pill' + (isAnomaly ? ' active' : '')}
            onClick={onToggleAnomaly}
            aria-pressed={isAnomaly}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v18M3 12h18" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>{t('metrics.anomaly')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
