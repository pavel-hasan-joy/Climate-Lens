import React, { useMemo } from 'react';
import { analyzeCropClimate, checkUnusualNow, CROPS, generateDistrictStory } from '../lib/agriculture';
import { useTranslation } from '../lib/i18n';
import NdviVigorCard from './NdviVigorCard';
import YieldClimateCard from './YieldClimateCard';
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
  const { lang, t, toDigits, getDistrictName } = useTranslation();

  const districtName = getDistrictName(districtId);
  const currentCalendarMonth = new Date().getMonth(); // 0..11
  const monthLabels = lang === 'bn' ? MONTH_NAMES_BN : MONTH_NAMES_EN;

  const unusual = useMemo(() => checkUnusualNow(districtId), [districtId]);
  const story = useMemo(() => generateDistrictStory(districtId, lang), [districtId, lang]);

  const cropAnalyses = useMemo(() => {
    return (Object.keys(CROPS) as CropId[])
      .map((cropId) => analyzeCropClimate(districtId, cropId))
      .filter((analysis): analysis is NonNullable<typeof analysis> => analysis != null);
  }, [districtId]);

  return (
    <div className="agriculture-panel fade">
      {/* Indicative Disclaimer Notice */}
      <div className="agri-disclaimer-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <div className="disclaimer-text-group">
          <strong>{lang === 'bn' ? 'দিকনির্দেশনামূলক সিদ্ধান্ত গ্রহণ সহায়তা' : 'Indicative Decision Support'}</strong>
          <span> · {t('agriculture.disclaimer')}</span>
        </div>
      </div>

      {/* Auto-Generated District Story Card (3 Plain-Language Sentences) */}
      <section className="district-story-card card">
        <div className="story-card-header">
          <div className="story-card-title-group">
            <span className="story-card-icon">📖</span>
            <div>
              <h4 className="story-card-title">{t('agriculture.storyTitle')}</h4>
              <span className="story-card-sub">{t('agriculture.storySubtitle', { district: districtName })}</span>
            </div>
          </div>
          <span className="story-badge">2001–2040</span>
        </div>

        <div className="story-sentences-list">
          {/* Sentence 1: What changed in 20+ years */}
          <div className="story-sentence-item">
            <div className="sentence-tag-row">
              <span className="sentence-tag tag-past">{t('agriculture.sentence1Tag')}</span>
            </div>
            <p className="sentence-body">{story.sentence1}</p>
          </div>

          {/* Sentence 2: What is expected by 2040 */}
          <div className="story-sentence-item">
            <div className="sentence-tag-row">
              <span className="sentence-tag tag-future">{t('agriculture.sentence2Tag')}</span>
            </div>
            <p className="sentence-body">{story.sentence2}</p>
          </div>

          {/* Sentence 3: Who is most affected */}
          <div className="story-sentence-item">
            <div className="sentence-tag-row">
              <span className="sentence-tag tag-people">{t('agriculture.sentence3Tag')}</span>
            </div>
            <p className="sentence-body">{story.sentence3}</p>
          </div>
        </div>
      </section>

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
              {toDigits(unusual.pRain)}%ile · {lang === 'bn' ? 'স্বাভাবিক' : 'Norm'}: {toDigits(unusual.p10Rain)}–
              {toDigits(unusual.p90Rain)}
            </span>
          </div>
          <div className="unusual-metric-chip">
            <span className="chip-label">{t('agriculture.recentTemp')}</span>
            <b className="chip-val">
              {toDigits(unusual.curTmax)} {t('metrics.heat.unit')}
            </b>
            <span className="chip-sub">
              {toDigits(unusual.pTmax)}%ile · {lang === 'bn' ? 'স্বাভাবিক' : 'Norm'}: {toDigits(unusual.p10Tmax)}–
              {toDigits(unusual.p90Tmax)}
            </span>
          </div>
          <div className="unusual-metric-chip">
            <span className="chip-label">{t('agriculture.recentWet')}</span>
            <b className="chip-val">
              {toDigits(unusual.curWet)} {t('metrics.wet.unit')}
            </b>
            <span className="chip-sub">
              {toDigits(unusual.pWet)}%ile · {lang === 'bn' ? 'স্বাভাবিক' : 'Norm'}: {toDigits(unusual.p10Wet)}–
              {toDigits(unusual.p90Wet)}
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
          const { crop, baseline, now, projected, changes, risk, ruleCriteriaEn, ruleCriteriaBn, reasonEn, reasonBn } =
            analysis;
          const isCropActive = crop.months.includes(currentCalendarMonth);
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
                      {isCropActive && <span className="active-season-badge">{t('agriculture.inSeason')}</span>}
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

              {/* Plain-Language Visible Reasoning with Numbers */}
              <div className="crop-reasoning-box">
                <span className="reasoning-label">
                  {lang === 'bn' ? 'পর্যবেক্ষণ ও প্রভাব বিশ্লেষণ' : 'Observed Impact & Reasoning'}
                </span>
                <p className="crop-reasoning-text">{lang === 'bn' ? reasonBn : reasonEn}</p>
              </div>

              {/* Transparent Non-Black-Box Decision Rule Criteria */}
              <div className="crop-rule-criteria-box">
                <div className="rule-criteria-header">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <span>{t('agriculture.decisionRule')}</span>
                </div>
                <p className="crop-rule-text">{lang === 'bn' ? ruleCriteriaBn : ruleCriteriaEn}</p>
              </div>

              {/* Climate Growing-Season Comparison Grid (Rain, Max Temp, Soil Wetness) */}
              <div className="crop-metrics-grid">
                {/* 1. Growing Season Rainfall */}
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

                {/* 2. Growing Season Max Temperature */}
                <div className="crop-metric-box">
                  <div className="metric-box-title">
                    <span>{t('agriculture.seasonTmax')}</span>
                    <span className={'change-tag ' + (changes.tmaxDiff <= 0 ? 'tag-pos' : 'tag-neg')}>
                      {changes.tmaxDiff >= 0 ? '+' : ''}
                      {toDigits(changes.tmaxDiff)}°C
                    </span>
                  </div>
                  <div className="metric-comparison-row">
                    <div className="comparison-col">
                      <span className="sub-label">{t('times.past')}</span>
                      <span className="val-text">{toDigits(baseline.tmax)}°C</span>
                    </div>
                    <div className="comparison-col highlight">
                      <span className="sub-label">{t('times.now')}</span>
                      <span className="val-text">{toDigits(now.tmax)}°C</span>
                    </div>
                    <div className="comparison-col">
                      <span className="sub-label">{toDigits(2040)}</span>
                      <span className="val-text">{toDigits(projected.tmax)}°C</span>
                    </div>
                  </div>
                </div>

                {/* 3. Growing Season Soil Wetness */}
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

      {/* NASA MODIS NDVI Vegetation Health & Drought Stress */}
      <NdviVigorCard districtId={districtId} />

      {/* Climate vs Rice Yield Analysis (Phase 9A / 9C) */}
      <YieldClimateCard />

      {/* Sources & Citations Section */}
      <section className="crop-sources-card card">
        <div className="sources-header">
          <span className="sources-icon">📚</span>
          <h4 className="sources-title">{t('agriculture.sourcesTitle')}</h4>
        </div>
        <p className="sources-body">{t('agriculture.sourcesBody')}</p>
        <div className="sources-tags">
          <span className="source-tag">BRRI</span>
          <span className="source-tag">DAE</span>
          <span className="source-tag">FAO GIEWS</span>
          <span className="source-tag">NASA POWER</span>
          <span className="source-tag">NASA MODIS</span>
        </div>
      </section>
    </div>
  );
}
