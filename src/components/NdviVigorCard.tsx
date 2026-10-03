import { useMemo, useState } from 'react';
import { getDistrictNdvi } from '../lib/metrics';
import { useTranslation } from '../lib/i18n';

interface NdviVigorCardProps {
  districtId: string;
}

const MONTH_LABELS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LABELS_BN = [
  'জানু',
  'ফেব্রু',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টে',
  'অক্টো',
  'নভে',
  'ডিসে',
];

export default function NdviVigorCard({ districtId }: NdviVigorCardProps) {
  const { lang, t, toDigits } = useTranslation();
  const [showExplainer, setShowExplainer] = useState(false);

  const districtNdvi = useMemo(() => getDistrictNdvi(districtId), [districtId]);
  const months = lang === 'bn' ? MONTH_LABELS_BN : MONTH_LABELS_EN;

  if (!districtNdvi) return null;

  // Status mapping
  const statusConfig = {
    robust: {
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
      label: t('ndvi.statusRobust'),
    },
    normal: {
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.15)',
      label: t('ndvi.statusNormal'),
    },
    'moderate-stress': {
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
      label: t('ndvi.statusModStress'),
    },
    'severe-stress': {
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.15)',
      label: t('ndvi.statusSevStress'),
    },
  }[districtNdvi.status];

  // Format ecological zone label
  const zoneLabel =
    {
      chittagong_hills: lang === 'bn' ? 'চট্টগ্রাম পার্বত্য বনাঞ্চল' : 'Chittagong Hill Tracts',
      coastal_mangrove: lang === 'bn' ? 'উপকূলীয় সুন্দরবন ও মোহনা' : 'Coastal Mangrove Zone',
      barind_tract: lang === 'bn' ? 'খরাপ্রবণ বরেন্দ্র অঞ্চল' : 'Barind Tract (Drought-Prone)',
      haor_wetland: lang === 'bn' ? 'হাওর অববাহিকা ও জলাভূমি' : 'Haor Wetland Basin',
      floodplain: lang === 'bn' ? 'পলল প্লাবনভূমি কৃষি অঞ্চল' : 'Alluvial Floodplain Plains',
    }[districtNdvi.zone] || districtNdvi.zone;

  return (
    <section className="ndvi-vigor-card card">
      <div className="card-head">
        <div className="card-head-title-wrap">
          <span className="ndvi-icon">🌱</span>
          <div>
            <h4 className="ndvi-title">{t('ndvi.title')}</h4>
            <span className="ndvi-sub">{t('ndvi.subtitle')}</span>
          </div>
        </div>
        <span className="zone-badge">{zoneLabel}</span>
      </div>

      {/* Main KPI Row */}
      <div className="ndvi-kpi-row">
        {/* Vigor Index */}
        <div className="ndvi-kpi-box">
          <span className="ndvi-kpi-label">{t('ndvi.vigorTitle')}</span>
          <div className="ndvi-kpi-value-wrap">
            <span className="ndvi-vigor-number" style={{ color: statusConfig.color }}>
              {toDigits(districtNdvi.vigorIndex)}%
            </span>
            <span className="ndvi-kpi-sub">{t('ndvi.baselineRef')}</span>
          </div>
        </div>

        {/* Status Pill Card */}
        <div className="ndvi-status-box" style={{ background: statusConfig.bg, borderColor: statusConfig.color }}>
          <span className="status-dot" style={{ background: statusConfig.color }} />
          <div className="ndvi-status-info">
            <strong style={{ color: statusConfig.color }}>{statusConfig.label}</strong>
            <span className="ndvi-anom-text">
              {t('ndvi.anomaly')}: {districtNdvi.anomaly >= 0 ? '+' : ''}
              {toDigits(districtNdvi.anomaly.toFixed(2))}
            </span>
          </div>
        </div>
      </div>

      {/* 12-Month NDVI Seasonal Cycle Bar / Curve Chart */}
      <div className="ndvi-seasonal-box">
        <div className="ndvi-seasonal-header">
          <span className="seasonal-title">📅 {t('ndvi.seasonalCycleTitle')}</span>
          <div className="seasonal-legend">
            <span>
              <i className="dot baseline" /> {t('ndvi.baselineCurve')}
            </span>
            <span>
              <i className="dot recent" /> {t('ndvi.recentCurve')}
            </span>
          </div>
        </div>

        <div className="ndvi-bar-chart">
          {districtNdvi.baselineMonthly.map((baseVal, mIdx) => {
            const recVal = districtNdvi.recentMonthly[mIdx];
            const maxVal = 0.95;
            const basePct = Math.round((baseVal / maxVal) * 100);
            const recPct = Math.round((recVal / maxVal) * 100);

            return (
              <div key={mIdx} className="ndvi-bar-col" title={`${months[mIdx]}: Recent ${recVal} vs Base ${baseVal}`}>
                <div className="ndvi-bars-track">
                  <div className="ndvi-bar base" style={{ height: `${basePct}%` }} />
                  <div
                    className="ndvi-bar rec"
                    style={{
                      height: `${recPct}%`,
                      background: recVal >= baseVal ? '#10b981' : '#f59e0b',
                    }}
                  />
                </div>
                <span className="ndvi-month-label">{months[mIdx]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rice Cropping Seasons Breakdown (Boro, Aus, Aman) */}
      <div className="rice-seasons-grid">
        {/* Boro */}
        <div className="rice-season-card">
          <div className="rice-season-name">🌾 {t('ndvi.boroCrop')}</div>
          <div className="rice-season-vals">
            <span className="season-val">{toDigits(districtNdvi.seasons.boro.recent.toFixed(2))}</span>
            <span className="season-base">
              ({t('ndvi.baselineMean', { val: toDigits(districtNdvi.seasons.boro.baseline.toFixed(2)) })})
            </span>
          </div>
        </div>

        {/* Aus */}
        <div className="rice-season-card">
          <div className="rice-season-name">🌾 {t('ndvi.ausCrop')}</div>
          <div className="rice-season-vals">
            <span className="season-val">{toDigits(districtNdvi.seasons.aus.recent.toFixed(2))}</span>
            <span className="season-base">
              ({t('ndvi.baselineMean', { val: toDigits(districtNdvi.seasons.aus.baseline.toFixed(2)) })})
            </span>
          </div>
        </div>

        {/* Aman */}
        <div className="rice-season-card">
          <div className="rice-season-name">🌾 {t('ndvi.amanCrop')}</div>
          <div className="rice-season-vals">
            <span className="season-val">{toDigits(districtNdvi.seasons.aman.recent.toFixed(2))}</span>
            <span className="season-base">
              ({t('ndvi.baselineMean', { val: toDigits(districtNdvi.seasons.aman.baseline.toFixed(2)) })})
            </span>
          </div>
        </div>
      </div>

      {/* Scientific Accordion */}
      <div className="ndvi-explainer-accordion">
        <button
          type="button"
          className="ndvi-toggle-btn"
          onClick={() => setShowExplainer((s) => !s)}
          aria-expanded={showExplainer}
        >
          <span>🛰️ {t('ndvi.howNdviWorks')}</span>
          <span>{showExplainer ? '▲' : '▼'}</span>
        </button>

        {showExplainer && (
          <div className="ndvi-explainer-content fade">
            <p>{t('ndvi.ndviExplanation')}</p>
            <div className="sources-tags">
              <span className="source-tag">NASA Terra/Aqua MODIS</span>
              <span className="source-tag">MOD13C2 Monthly CMG</span>
              <span className="source-tag">LP DAAC</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
