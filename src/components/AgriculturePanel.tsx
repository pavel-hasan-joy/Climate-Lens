import React, { useMemo } from 'react';
import { analyzeCropClimate, checkUnusualNow, CROPS } from '../lib/agriculture';
import { useTranslation } from '../lib/i18n';
import type { CropId } from '../lib/types';

const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_BN = [
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

interface AgriculturePanelProps {
  districtId: string;
}

export default function AgriculturePanel({ districtId }: AgriculturePanelProps) {
  const { lang, t, toDigits } = useTranslation();

  const currentCalendarMonth = new Date().getMonth(); // 0..11
  const monthLabels = lang === 'bn' ? MONTH_NAMES_BN : MONTH_NAMES_EN;

  const unusual = useMemo(() => checkUnusualNow(districtId), [districtId]);

  const cropAnalyses = useMemo(() => {
    return (Object.keys(CROPS) as CropId[])
      .map((cropId) => analyzeCropClimate(districtId, cropId))
      .filter((analysis): analysis is NonNullable<typeof analysis> => analysis != null);
  }, [districtId]);

  return (
    <div className="agriculture-panel fade">
      {/* Indicative Disclaimer Notice */}
      <div className="agri-disclaimer-banner">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>{t('agriculture.disclaimer')}</span>
      </div>

      {/* "Unusual now" Alert Badge */}
      <div className={'unusual-now-card ' + (unusual.isUnusual ? 'is-alert' : 'is-normal')}>
        <div className="unusual-header">
          <div className="unusual-title-wrap">
            <span className={'status-dot ' + (unusual.isUnusual ? 'pulse-alert' : 'dot-normal')} />
            <h4 className="unusual-title">{lang === 'bn' ? unusual.titleBn : unusual.titleEn}</h4>
          </div>
          <span className="unusual-window-tag">
            {t('agriculture.last60DaysWindow', { days: toDigits(unusual.totalDays) })}
          </span>
        </div>
        <p className="unusual-detail">{lang === 'bn' ? unusual.detailBn : unusual.detailEn}</p>
        <div className="unusual-metrics-bar">
          <div className="unusual-metric-chip">
            <span className="chip-label">{t('agriculture.recentRain')}</span>
            <b className="chip-val">
              {toDigits(unusual.curRain)} {t('metrics.rain.unit')}
            </b>
            <span className="chip-sub">
              {t('agriculture.histMean')}: {toDigits(unusual.meanRain)}
            </span>
          </div>
          <div className="unusual-metric-chip">
            <span className="chip-label">{t('agriculture.recentTemp')}</span>
            <b className="chip-val">
              {toDigits(unusual.curTmax)} {t('metrics.heat.unit')}
            </b>
            <span className="chip-sub">
              {t('agriculture.histMean')}: {toDigits(unusual.meanTmax)}
            </span>
          </div>
          <div className="unusual-metric-chip">
            <span className="chip-label">{t('agriculture.recentWet')}</span>
            <b className="chip-val">
              {toDigits(unusual.curWet)} {t('metrics.wet.unit')}
            </b>
            <span className="chip-sub">
              {t('agriculture.histMean')}: {toDigits(unusual.meanWet)}
            </span>
          </div>
        </div>
      </div>

      {/* 12-Month Crop Calendars Visualizer */}
      <section className="crop-calendar-overview card">
        <div className="calendar-header">
          <div>
            <h3 className="section-title">{t('agriculture.calendarTitle')}</h3>
            <p className="calendar-subtitle">{t('agriculture.calendarSubtitle')}</p>
          </div>
        </div>

        {/* 12-Month Header Grid */}
        <div className="calendar-month-grid">
          {monthLabels.map((mName, idx) => (
            <div key={idx} className={'calendar-month-col' + (idx === currentCalendarMonth ? ' is-current-month' : '')}>
              <span className="month-name">{mName}</span>
              {idx === currentCalendarMonth && <span className="now-pin">{t('agriculture.nowPin')}</span>}
            </div>
          ))}
        </div>

        {/* Crop Timeline Rows */}
        <div className="crop-calendar-rows">
          {Object.values(CROPS).map((crop) => (
            <div key={crop.id} className="crop-timeline-row">
              <div className="crop-timeline-info">
                <span className="crop-name-label">{lang === 'bn' ? crop.nameBn : crop.nameEn}</span>
                <span className="crop-season-sub">{lang === 'bn' ? crop.seasonBn : crop.seasonEn}</span>
              </div>
              <div className="crop-timeline-bar-wrap">
                {monthLabels.map((_, mIdx) => {
                  const isActive = crop.months.includes(mIdx);
                  const isCurrent = mIdx === currentCalendarMonth && isActive;
                  return (
                    <div
                      key={mIdx}
                      className={
                        'timeline-cell' + (isActive ? ' active-cell' : '') + (isCurrent ? ' current-active' : '')
                      }
                      style={isActive ? ({ '--crop-c': crop.color } as React.CSSProperties) : {}}
                      title={`${lang === 'bn' ? crop.nameBn : crop.nameEn} · ${monthLabels[mIdx]}`}
                    >
                      {isActive && <div className="cell-bar" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Crop Cards with Growing-Season Comparisons & Risk Reasoning */}
      <section className="crops-cards-list">
        {cropAnalyses.map((analysis) => {
          const { crop, baseline, now, projected, changes, risk, reasonEn, reasonBn } = analysis;
          const isAmanActive = crop.months.includes(currentCalendarMonth);
          const riskKey = `risk.${risk}`;

          return (
            <article key={crop.id} className={'crop-card card risk-border-' + risk}>
              <div className="crop-card-top">
                <div className="crop-title-group">
                  <div className="crop-badge-icon" style={{ backgroundColor: `${crop.color}25`, color: crop.color }}>
                    🌾
                  </div>
                  <div>
                    <div className="crop-header-line">
                      <h4 className="crop-heading">{lang === 'bn' ? crop.nameBn : crop.nameEn}</h4>
                      {isAmanActive && <span className="active-season-badge">{t('agriculture.inSeason')}</span>}
                    </div>
                    <span className="crop-type-sub">{lang === 'bn' ? crop.typeBn : crop.typeEn}</span>
                  </div>
                </div>

                {/* Risk Level Badge */}
                <div className={'risk-badge risk-' + risk}>
                  <span className="risk-icon">{risk === 'low' ? '✓' : risk === 'medium' ? '▲' : '⚠'}</span>
                  <span className="risk-text">{t(riskKey)}</span>
                </div>
              </div>

              {/* Plain-Language Visible Reasoning */}
              <div className="crop-reasoning-box">
                <p className="crop-reasoning-text">{lang === 'bn' ? reasonBn : reasonEn}</p>
              </div>

              {/* Climate Growing-Season Comparison Grid */}
              <div className="crop-metrics-grid">
                {/* Growing Season Rainfall */}
                <div className="crop-metric-box">
                  <div className="metric-box-title">
                    <span>{t('agriculture.seasonRain')}</span>
                    <span className={'change-tag ' + (changes.rainDiffPct >= 0 ? 'tag-pos' : 'tag-neg')}>
                      {changes.rainDiffPct >= 0 ? '+' : ''}
                      {toDigits(changes.rainDiffPct)}%
                    </span>
                  </div>
                  <div className="metric-comparison-row">
                    <div className="comparison-col">
                      <span className="sub-label">{t('times.past')}</span>
                      <span className="val-text">
                        {toDigits(baseline.rain)} {t('metrics.rain.unit')}
                      </span>
                    </div>
                    <div className="comparison-col highlight">
                      <span className="sub-label">{t('times.now')}</span>
                      <span className="val-text">
                        {toDigits(now.rain)} {t('metrics.rain.unit')}
                      </span>
                    </div>
                    <div className="comparison-col">
                      <span className="sub-label">{toDigits(2040)}</span>
                      <span className="val-text">
                        {toDigits(projected.rain)} {t('metrics.rain.unit')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Growing Season Soil Wetness */}
                <div className="crop-metric-box">
                  <div className="metric-box-title">
                    <span>{t('agriculture.seasonWet')}</span>
                    <span className={'change-tag ' + (changes.wetDiffPts >= 0 ? 'tag-pos' : 'tag-neg')}>
                      {changes.wetDiffPts >= 0 ? '+' : ''}
                      {toDigits(changes.wetDiffPts)}%
                    </span>
                  </div>
                  <div className="metric-comparison-row">
                    <div className="comparison-col">
                      <span className="sub-label">{t('times.past')}</span>
                      <span className="val-text">{toDigits(baseline.wet)}%</span>
                    </div>
                    <div className="comparison-col highlight">
                      <span className="sub-label">{t('times.now')}</span>
                      <span className="val-text">{toDigits(now.wet)}%</span>
                    </div>
                    <div className="comparison-col">
                      <span className="sub-label">{toDigits(2040)}</span>
                      <span className="val-text">{toDigits(projected.wet)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
