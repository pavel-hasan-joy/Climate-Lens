import { useMemo, useState } from 'react';
import { calculatePopulationExposure, population, statsFor } from '../lib/metrics';
import { useTranslation } from '../lib/i18n';
import type { MetricId } from '../lib/types';

interface PopulationImpactCardProps {
  districtId: string;
  metric?: MetricId;
}

export default function PopulationImpactCard({ districtId }: PopulationImpactCardProps) {
  const { lang, t, toDigits, getDistrictName } = useTranslation();
  const [showFormula, setShowFormula] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'wetting' | 'warming' | 'drying'>('all');

  const exposure = useMemo(() => calculatePopulationExposure(), []);
  const districtName = getDistrictName(districtId);
  const districtPop = population.districts[districtId];

  // Specific district trend status
  const dStatsHeat = statsFor([districtId], 'heat');
  const dStatsRain = statsFor([districtId], 'rain');
  const dStatsWet = statsFor([districtId], 'wet');

  const isDistWarming = Boolean(dStatsHeat?.mk?.significant && dStatsHeat.slope > 0);
  const isDistDrying = Boolean(
    (dStatsRain?.mk?.significant && dStatsRain.slope < 0) || (dStatsWet?.mk?.significant && dStatsWet.slope < 0),
  );
  const isDistWetting = Boolean(
    (dStatsRain?.mk?.significant && dStatsRain.slope > 0) || (dStatsWet?.mk?.significant && dStatsWet.slope > 0),
  );

  // Format millions
  const formatMillions = (num: number) => {
    const m = (num / 1000000).toFixed(1);
    return lang === 'bn' ? `${toDigits(m)} মিলিয়ন` : `${m}M`;
  };

  return (
    <section className="population-impact-card card">
      <div className="card-head">
        <div className="card-head-title-wrap">
          <div className="impact-badge-icon">👥</div>
          <div>
            <h3 className="impact-card-title">{t('impact.title')}</h3>
            <span className="impact-card-sub">{t('impact.subtitle')}</span>
          </div>
        </div>
      </div>

      {/* Main KPI Highlight Hero */}
      <div className="impact-hero-banner">
        <div className="impact-hero-stat">
          <span className="impact-hero-num">{formatMillions(exposure.exposedPopTotal)}</span>
          <span className="impact-hero-label">
            {t('impact.exposedTotal')} ({toDigits(exposure.exposedPctTotal)}% {t('impact.ofNational')})
          </span>
        </div>
        <div className="impact-hero-meta">
          <span className="impact-stat-pill">
            🏛️{' '}
            {t('impact.districtsConfirmed', {
              count: toDigits(exposure.exposedDistrictsCount),
              total: toDigits(exposure.totalDistrictsCount),
            })}
          </span>
        </div>
      </div>

      {/* Breakdown Categorization Buttons */}
      <div className="impact-breakdown-grid">
        {/* Monsoon Surge / Wetting (Dominant in Bangladesh) */}
        <button
          type="button"
          className={'impact-pill-card' + (activeFilter === 'wetting' ? ' active' : '')}
          onClick={() => setActiveFilter(activeFilter === 'wetting' ? 'all' : 'wetting')}
        >
          <div className="impact-pill-header">
            <span className="impact-pill-tag tag-wetting">🌧️ {t('impact.wettingOnly')}</span>
            <span className="impact-pill-count">
              {toDigits(exposure.exposedWettingCount)} {lang === 'bn' ? 'টি জেলা' : 'districts'}
            </span>
          </div>
          <div className="impact-pill-val">{formatMillions(exposure.exposedWettingPop)}</div>
          <div className="impact-pill-desc">{t('impact.wettingDesc')}</div>
        </button>

        {/* Significant Warming */}
        <button
          type="button"
          className={'impact-pill-card' + (activeFilter === 'warming' ? ' active' : '')}
          onClick={() => setActiveFilter(activeFilter === 'warming' ? 'all' : 'warming')}
        >
          <div className="impact-pill-header">
            <span className="impact-pill-tag tag-warming">🔥 {t('impact.warmingOnly')}</span>
            <span className="impact-pill-count">
              {toDigits(exposure.exposedWarmingPop > 0 ? 1 : 0)} {lang === 'bn' ? 'টি জেলা' : 'districts'}
            </span>
          </div>
          <div className="impact-pill-val">
            {exposure.exposedWarmingPop > 0 ? formatMillions(exposure.exposedWarmingPop) : '0'}
          </div>
          <div className="impact-pill-desc">{t('impact.warmingDesc')}</div>
        </button>

        {/* Significant Drying */}
        <button
          type="button"
          className={'impact-pill-card' + (activeFilter === 'drying' ? ' active' : '')}
          onClick={() => setActiveFilter(activeFilter === 'drying' ? 'all' : 'drying')}
        >
          <div className="impact-pill-header">
            <span className="impact-pill-tag tag-drying">🍂 {t('impact.dryingOnly')}</span>
            <span className="impact-pill-count">
              {toDigits(exposure.exposedDryingPop > 0 ? 1 : 0)} {lang === 'bn' ? 'টি জেলা' : 'districts'}
            </span>
          </div>
          <div className="impact-pill-val">
            {exposure.exposedDryingPop > 0 ? formatMillions(exposure.exposedDryingPop) : '0'}
          </div>
          <div className="impact-pill-desc">{t('impact.dryingDesc')}</div>
        </button>
      </div>

      {/* Selected District Status Box */}
      {districtPop && (
        <div className="selected-district-impact-box">
          <div className="selected-district-header">
            <div className="selected-district-name-row">
              <span className="district-icon">📍</span>
              <strong>{t('impact.districtExposureStatus', { district: districtName })}</strong>
            </div>
            <span className="district-density-badge">
              {t('impact.districtPopInfo', {
                pop: toDigits(districtPop.population.toLocaleString()),
                density: toDigits(districtPop.density),
              })}
            </span>
          </div>

          <div className="district-trend-status-pills">
            {isDistWetting && (
              <span className="status-pill status-wetting">
                🌧️{' '}
                {t('impact.statusWetting', {
                  val: toDigits(Math.round(dStatsRain.slope * 10)),
                })}
              </span>
            )}
            {isDistWarming && (
              <span className="status-pill status-warming">
                🔥{' '}
                {t('impact.statusWarming', {
                  val: toDigits((dStatsHeat.slope * 10).toFixed(2)),
                })}
              </span>
            )}
            {isDistDrying && (
              <span className="status-pill status-drying">
                🍂{' '}
                {t('impact.statusDrying', {
                  val: toDigits(Math.round(dStatsRain.slope * 10)),
                })}
              </span>
            )}
            {!isDistWetting && !isDistWarming && !isDistDrying && (
              <span className="status-pill status-stable">⚖️ {t('impact.statusStable')}</span>
            )}
          </div>
        </div>
      )}

      {/* Collapsible Scientific Methodology & Formula Explainer */}
      <div className="impact-formula-accordion">
        <button
          type="button"
          className="impact-formula-toggle"
          onClick={() => setShowFormula((s) => !s)}
          aria-expanded={showFormula}
        >
          <span>📐 {t('impact.howCalculated')}</span>
          <span className="toggle-chevron">{showFormula ? '▲' : '▼'}</span>
        </button>

        {showFormula && (
          <div className="impact-formula-content fade">
            <div className="formula-math-box">
              <code>{t('impact.calculationFormula')}</code>
            </div>
            <p className="impact-finding-text">{t('impact.scientificFinding')}</p>
            <div className="impact-sources-tag-row">
              <span className="source-tag">NASA SEDAC (GPWv4.11)</span>
              <span className="source-tag">BBS Census 2022</span>
              <span className="source-tag">Mann–Kendall (p &lt; 0.05)</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
