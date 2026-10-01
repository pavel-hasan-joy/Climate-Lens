import React, { useMemo, useRef, useState } from 'react';
import './charts/setup';
import {
  EXTREME_INDICATORS,
  FUTURE_YEAR,
  HEATWAVE_THRESHOLD,
  HEAVY_RAIN_THRESHOLD,
  METRIC,
  PAST_YEARS,
  SCENARIOS,
  SOURCE,
  TIMES,
} from '../lib/constants';
import { cmip6For, dailyFor, districts, divisions, extremesFor, latestDaily, statsFor } from '../lib/metrics';
import { formatChange, yyyymmdd } from '../lib/format';
import { exportChartAsPNG, exportDistrictCSV, exportDistrictPDF } from '../lib/export';
import { useTranslation } from '../lib/i18n';
import { checkUnusualNow } from '../lib/agriculture';
import useLiveDaily from '../hooks/useLiveDaily';
import AnimatedNumber from './AnimatedNumber';
import YearChart from './charts/YearChart';
import SeasonChart from './charts/SeasonChart';
import DailyChart from './charts/DailyChart';
import StripesChart from './charts/StripesChart';
import HeatmapChart from './charts/HeatmapChart';
import AgriculturePanel from './AgriculturePanel';
import { PERIOD } from './Timeline';
import type { MetricId, ScenarioId, TimeId } from '../lib/types';

interface DetailPanelProps {
  ids: string[];
  districtId?: string | null;
  divisionId?: string | null;
  compareId?: string | null;
  metric: MetricId;
  time: TimeId;
  year?: number | null;
  isAnomaly?: boolean;
  scenario?: ScenarioId;
  onTime: (time: TimeId) => void;
  onScenario?: (scenario: ScenarioId) => void;
  onCompareDistrict?: (id: string | null) => void;
}

export default function DetailPanel({
  ids,
  districtId,
  divisionId,
  compareId = null,
  metric,
  time,
  year,
  isAnomaly = false,
  scenario = 'statistical',
  onTime,
  onScenario,
  onCompareDistrict,
}: DetailPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'climate' | 'agri'>('climate');
  const { t, toDigits, getDistrictName, getDivisionName, formatVal, formatAnom, formatSummary, lang } =
    useTranslation();

  const targetDistrictId = districtId || ids[0];
  const unusual = useMemo(() => checkUnusualNow(targetDistrictId), [targetDistrictId]);

  const m = METRIC[metric];
  const s = statsFor(ids, metric);
  const district = districts.find((d) => d.id === districtId);
  const compareDistrict = compareId ? districts.find((d) => d.id === compareId) : null;
  const compareStats = compareDistrict ? statsFor([compareDistrict.id], metric) : null;

  const cmipData = useMemo(() => cmip6For(ids, metric, scenario), [ids, metric, scenario]);
  const compareCmipData = useMemo(
    () => (compareId ? cmip6For([compareId], metric, scenario) : null),
    [compareId, metric, scenario],
  );

  const name = district ? getDistrictName(district.id) : divisionId ? getDivisionName(divisionId) : t('app.country');
  const compareName = compareDistrict ? getDistrictName(compareDistrict.id) : null;

  const kind = district
    ? t('detail.districtKind', { division: getDivisionName(district.division) })
    : divisionId
      ? t('detail.divisionKind', { count: toDigits(ids.length) })
      : t('detail.countryKind');

  const hasCmip = scenario !== 'statistical' && cmipData != null;
  const isFuture = time === 'future' && year == null;

  const absValue: number =
    isFuture && hasCmip
      ? cmipData.at2040.median
      : year != null && year >= 2021 && hasCmip
        ? cmipData.median[year - 2021]
        : year != null
          ? (s.byYear[year - 2001] ?? 0)
          : s[time];

  const anomalyValue: number =
    isFuture && hasCmip
      ? Math.round((cmipData.at2040.median - s.past) * 10) / 10
      : year != null && year >= 2021 && hasCmip
        ? Math.round((cmipData.median[year - 2021] - s.past) * 10) / 10
        : year != null
          ? (s.anomaly.byYear[year - 2001] ?? 0)
          : time === 'past'
            ? 0
            : s.anomaly[time];

  const shown = isAnomaly ? anomalyValue : absValue;

  const compareHasCmip = scenario !== 'statistical' && compareCmipData != null;
  const compareAbsValue: number | null = compareStats
    ? isFuture && compareHasCmip
      ? compareCmipData.at2040.median
      : year != null && year >= 2021 && compareHasCmip
        ? compareCmipData.median[year - 2021]
        : year != null
          ? (compareStats.byYear[year - 2001] ?? 0)
          : compareStats[time]
    : null;

  const compareAnomalyValue: number | null = compareStats
    ? isFuture && compareHasCmip
      ? Math.round((compareCmipData.at2040.median - compareStats.past) * 10) / 10
      : year != null && year >= 2021 && compareHasCmip
        ? Math.round((compareCmipData.median[year - 2021] - compareStats.past) * 10) / 10
        : year != null
          ? (compareStats.anomaly.byYear[year - 2001] ?? 0)
          : time === 'past'
            ? 0
            : compareStats.anomaly[time]
    : null;

  const compareShown = compareStats ? (isAnomaly ? compareAnomalyValue : compareAbsValue) : null;

  const daily = useLiveDaily(districtId, dailyFor(ids, metric));
  const extremes = extremesFor(ids, HEATWAVE_THRESHOLD, HEAVY_RAIN_THRESHOLD);
  const compareExtremes = compareDistrict
    ? extremesFor([compareDistrict.id], HEATWAVE_THRESHOLD, HEAVY_RAIN_THRESHOLD)
    : null;

  const unitLabel = lang === 'bn' ? (m.unit === '°C' ? '°সে' : m.unit === '%' ? '%' : 'মিমি') : m.unit;

  // Export handlers
  const handleExportPNG = () => {
    const canvas =
      panelRef.current?.querySelector('.year-chart-container canvas') || panelRef.current?.querySelector('canvas');
    if (canvas) {
      exportChartAsPNG(
        canvas as HTMLCanvasElement,
        `climate-lens-${districtId || divisionId || 'bangladesh'}-${metric}-chart.png`,
      );
    }
  };

  const handleExportCardPNG = (e: React.MouseEvent, chartName: string) => {
    e.stopPropagation();
    const card = (e.currentTarget as HTMLElement).closest('.card');
    const canvas = card?.querySelector('canvas');
    if (canvas) {
      exportChartAsPNG(canvas as HTMLCanvasElement, `climate-lens-${districtId || 'bangladesh'}-${chartName}.png`);
    }
  };

  const handleExportCSV = () => {
    const targetDistrict = district || {
      id: ids[0],
      name,
      division: divisionId || '',
      anchor: [0, 0] as [number, number],
    };
    exportDistrictCSV(targetDistrict);
  };

  const handleExportPDF = () => {
    if (district) {
      exportDistrictPDF(district, getDivisionName(district.division));
    }
  };

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <aside ref={panelRef} className="panel right">
      <header className="detail-head fade" key={name}>
        <div className="detail-head-top">
          <span className="kind">{kind}</span>
          <button
            type="button"
            className={'unusual-alert-badge ' + (unusual.isUnusual ? 'is-alert' : 'is-normal')}
            title={lang === 'bn' ? unusual.detailBn : unusual.detailEn}
            onClick={() => setActiveTab('agri')}
          >
            <span className={'status-dot ' + (unusual.isUnusual ? 'pulse-alert' : 'dot-normal')} />
            <span className="unusual-badge-text">
              {unusual.isUnusual ? t('agriculture.unusualBadge') : t('agriculture.normalBadge')}
            </span>
          </button>
        </div>
        <h2>{name}</h2>
      </header>

      {/* Main Tab Navigation: Climate Overview vs Agriculture */}
      <nav className="detail-tab-nav" role="tablist">
        <button
          className={'detail-nav-tab' + (activeTab === 'climate' ? ' on' : '')}
          onClick={() => setActiveTab('climate')}
          role="tab"
          aria-selected={activeTab === 'climate'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>{t('agriculture.overviewTab')}</span>
        </button>
        <button
          className={'detail-nav-tab' + (activeTab === 'agri' ? ' on' : '')}
          onClick={() => setActiveTab('agri')}
          role="tab"
          aria-selected={activeTab === 'agri'}
        >
          <span className="tab-icon-agri">🌾</span>
          <span>{t('agriculture.tab')}</span>
          {unusual.isUnusual && <span className="tab-alert-dot" />}
        </button>
      </nav>

      {activeTab === 'agri' ? (
        <AgriculturePanel districtId={targetDistrictId} />
      ) : (
        <>
          {/* Compare district selector */}
          {district && (
            <section className="compare-control-bar">
              <div className="compare-selector-wrap">
                <span className="compare-bar-label">{t('detail.compareWith')}</span>
                <select
                  className="compare-select"
                  value={compareId || ''}
                  onChange={(e) => onCompareDistrict?.(e.target.value || null)}
                >
                  <option value="">{t('detail.selectComparePrompt')}</option>
                  {divisions.map((div) => (
                    <optgroup key={div.id} label={getDivisionName(div.id)}>
                      {districts
                        .filter((d) => d.division === div.id && d.id !== districtId)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {getDistrictName(d.id)}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
                {compareDistrict && (
                  <button
                    className="compare-clear-btn"
                    onClick={() => onCompareDistrict?.(null)}
                    title={t('detail.clearCompare')}
                  >
                    ✕
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Export & Share toolbar */}
          <section className="export-actions-bar">
            <button
              className="export-btn"
              onClick={handleExportPNG}
              title="Download the currently visible chart as a PNG image"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>{t('detail.exportPNG')}</span>
            </button>
            <button
              className="export-btn"
              onClick={handleExportCSV}
              title="Download historical values and 2050 projections as CSV"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>{t('detail.exportCSV')}</span>
            </button>
            <button
              className="export-btn primary"
              onClick={handleExportPDF}
              disabled={!district}
              title={district ? 'Download 1-page PDF summary report' : 'Select a district to download PDF report'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="12" y2="12" />
                <line x1="15" y1="15" x2="12" y2="12" />
              </svg>
              <span>{t('detail.exportPDF')}</span>
            </button>
            <button
              className={'export-btn' + (copied ? ' on' : '')}
              onClick={handleCopyShareLink}
              title="Copy shareable link with current view state to clipboard"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span>{copied ? t('detail.copied') : t('detail.share')}</span>
            </button>
          </section>

          {/* Hero section: Single or Side-by-Side compare */}
          {compareDistrict && compareShown != null ? (
            <section className="hero compare-hero">
              <div className="hero-label">
                {t(`metrics.${metric}.label`)} · {isAnomaly ? `${t('metrics.anomaly')} · ` : ''}
                {year != null
                  ? year > 2025
                    ? t('timeline.projectedYear', { year: toDigits(year) })
                    : toDigits(year)
                  : PERIOD[time]}
              </div>

              <div className="compare-side-by-side">
                <div className="compare-col dist-a">
                  <span className="compare-tag dist-a-tag">{name}</span>
                  <div className="hero-value">
                    <AnimatedNumber value={shown} digits={m.digits} />
                    <span>{unitLabel}</span>
                  </div>
                </div>
                <div className="compare-vs">vs</div>
                <div className="compare-col dist-b">
                  <span className="compare-tag dist-b-tag">{compareName}</span>
                  <div className="hero-value">
                    <AnimatedNumber value={compareShown} digits={m.digits} />
                    <span>{unitLabel}</span>
                  </div>
                </div>
              </div>

              <div className="hero-change compare-delta-badge">
                {shown - compareShown > 0 ? (
                  <span>{t('detail.d1Higher', { name, diff: formatVal(metric, shown - compareShown) })}</span>
                ) : shown - compareShown < 0 ? (
                  <span>
                    {t('detail.d2Higher', { name: compareName ?? '', diff: formatVal(metric, compareShown - shown) })}
                  </span>
                ) : (
                  <span>{t('detail.bothEqual')}</span>
                )}
              </div>

              {/* Plain-Language Auto-Generated Summary */}
              <p className="story">{formatSummary({ name, metric, stats: s, isAnomaly, scenario, cmipData })}</p>
            </section>
          ) : (
            <section className="hero">
              <div className="hero-label">
                {t(`metrics.${metric}.label`)} · {isAnomaly ? `${t('metrics.anomaly')} · ` : ''}
                {year != null
                  ? year > 2025
                    ? t('timeline.projectedYear', { year: toDigits(year) })
                    : toDigits(year)
                  : PERIOD[time]}
              </div>
              <div className="hero-value">
                <AnimatedNumber value={shown} digits={m.digits} />
                <span>{unitLabel}</span>
              </div>
              {isAnomaly ? (
                <div className="hero-change anomaly-badge">
                  {shown > 0
                    ? t('detail.aboveBaseline', { val: formatVal(metric, shown) })
                    : shown < 0
                      ? t('detail.belowBaseline', { val: formatVal(metric, Math.abs(shown)) })
                      : t('detail.atBaseline')}
                </div>
              ) : (
                year == null &&
                time !== 'past' && <div className="hero-change">{formatChange(metric, s.past, shown, lang)}</div>
              )}
              {/* Plain-Language Auto-Generated Summary */}
              <p className="story">{formatSummary({ name, metric, stats: s, isAnomaly, scenario, cmipData })}</p>
            </section>
          )}

          {/* Scenario Selector when in Future mode */}
          {time === 'future' && (
            <section className="scenario-selector-card">
              <div className="scenario-selector-head">
                <div className="scenario-title-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{t('scenarios.title')}</span>
                </div>
                <span className="scenario-models-tag" title="GFDL-ESM4, MPI-ESM1-2-HR, MRI-ESM2-0, EC-Earth3, UKESM1">
                  NASA NEX-GDDP-CMIP6
                </span>
              </div>
              <div className="scenario-pills">
                {SCENARIOS.map((sc) => {
                  const isSelected = (scenario || 'statistical') === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      className={'scenario-pill' + (isSelected ? ' on' : '')}
                      style={{ '--sc-color': sc.color } as React.CSSProperties}
                      onClick={() => onScenario?.(sc.id)}
                    >
                      <i className="sc-dot" style={{ background: sc.color }} />
                      <span className="sc-name">{sc.short}</span>
                    </button>
                  );
                })}
              </div>
              <p className="scenario-desc">
                {scenario === 'statistical'
                  ? t('scenarios.statisticalDesc')
                  : scenario === 'ssp245'
                    ? t('scenarios.ssp245Desc')
                    : t('scenarios.ssp585Desc')}
              </p>
            </section>
          )}

          {/* Past / Now / Future toggle buttons (side-by-side values in compare mode) */}
          <section className="compare">
            {TIMES.map((tItem) => {
              const isFut = tItem.id === 'future';
              const valA = isAnomaly
                ? tItem.id === 'past'
                  ? 0
                  : isFut && hasCmip
                    ? Math.round((cmipData.at2040.median - s.past) * 10) / 10
                    : s.anomaly[tItem.id]
                : isFut && hasCmip
                  ? cmipData.at2040.median
                  : s[tItem.id];

              const valB = compareStats
                ? isAnomaly
                  ? tItem.id === 'past'
                    ? 0
                    : isFut && compareHasCmip
                      ? Math.round((compareCmipData.at2040.median - compareStats.past) * 10) / 10
                      : compareStats.anomaly[tItem.id]
                  : isFut && compareHasCmip
                    ? compareCmipData.at2040.median
                    : compareStats[tItem.id]
                : null;

              return (
                <button
                  key={tItem.id}
                  className={tItem.id === time && year == null ? 'on' : ''}
                  style={{ '--c': isFut && hasCmip ? cmipData.info.color : tItem.color } as React.CSSProperties}
                  onClick={() => onTime(tItem.id)}
                >
                  <span className="compare-top">
                    <i />
                    {t(`times.${tItem.id}`)}
                    {isFut && hasCmip && <small className="fut-scen-tag">{cmipData.info.name}</small>}
                  </span>
                  {compareDistrict ? (
                    <div className="compare-split-vals">
                      <b style={{ color: '#3987e5' }}>
                        {isAnomaly ? formatAnom(metric, valA) : formatVal(metric, valA)}
                      </b>
                      <span className="split-sep">/</span>
                      <b style={{ color: '#f59e0b' }}>
                        {isAnomaly ? formatAnom(metric, valB) : formatVal(metric, valB)}
                      </b>
                    </div>
                  ) : (
                    <b>{isAnomaly ? formatAnom(metric, valA) : formatVal(metric, valA)}</b>
                  )}
                  <small>
                    {compareDistrict
                      ? `${name.slice(0, 5)} / ${compareName?.slice(0, 5) ?? ''}`
                      : isFut
                        ? hasCmip
                          ? `10–90%: ${formatVal(metric, cmipData.at2040.low)}–${formatVal(metric, cmipData.at2040.high)}`
                          : `± ${formatVal(metric, s.band)}`
                        : isAnomaly
                          ? tItem.id === 'past'
                            ? t('times.zeroBaseline')
                            : t('times.vsBaseline')
                          : PERIOD[tItem.id]}
                  </small>
                </button>
              );
            })}
          </section>

          {/* Extreme Event Indicators */}
          <section className="card">
            <div className="card-head">
              <h3>{t('detail.extremesTitle')}</h3>
              <span className="live on">{t('detail.last60Days')}</span>
            </div>
            <div className="extremes-grid">
              {EXTREME_INDICATORS.map((ind) => {
                const countA =
                  ind.id === 'heatwave'
                    ? extremes.heatwaveDays
                    : ind.id === 'dry_spell'
                      ? extremes.longestDrySpell
                      : extremes.heavyRainDays;
                const countB = compareExtremes
                  ? ind.id === 'heatwave'
                    ? compareExtremes.heatwaveDays
                    : ind.id === 'dry_spell'
                      ? compareExtremes.longestDrySpell
                      : compareExtremes.heavyRainDays
                  : null;

                const indLabel =
                  ind.id === 'heatwave'
                    ? t('detail.heatwaves')
                    : ind.id === 'dry_spell'
                      ? t('detail.drySpells')
                      : t('detail.heavyRain');

                const indUnit = lang === 'bn' ? 'দিন' : 'days';

                const indAbout =
                  ind.id === 'heatwave'
                    ? t('detail.heatwavesAbout', { threshold: toDigits(HEATWAVE_THRESHOLD) })
                    : ind.id === 'dry_spell'
                      ? t('detail.drySpellsAbout')
                      : t('detail.heavyRainAbout', { threshold: toDigits(HEAVY_RAIN_THRESHOLD) });

                return (
                  <div key={ind.id} className="extreme-cell" title={indAbout}>
                    <span className="extreme-label">{indLabel}</span>
                    {compareDistrict ? (
                      <span className="extreme-num extreme-num-split">
                        <b style={{ color: '#3987e5' }}>{toDigits(countA)}</b>
                        <small className="extreme-sep">/</small>
                        <b style={{ color: '#f59e0b' }}>{toDigits(countB)}</b>
                        <small>{indUnit}</small>
                      </span>
                    ) : (
                      <span className="extreme-num">
                        <b>{toDigits(countA)}</b> <small>{indUnit}</small>
                      </span>
                    )}
                    <p className="extreme-desc">{indAbout}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Climate Stripes */}
          <section className="card">
            <div className="card-head">
              <h3>{t('detail.stripesTitle')}</h3>
              <div className="card-head-actions">
                <span className="keys">
                  <span>
                    {toDigits(2001)} → {toDigits(2025)}
                  </span>
                </span>
                <button
                  className="chart-download-icon-btn"
                  onClick={(e) => handleExportCardPNG(e, 'climate-stripes')}
                  title="Download Climate Stripes as PNG"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </div>
            </div>
            <StripesChart stats={s} metric={metric} isAnomaly={isAnomaly} />
          </section>

          {/* Year by Year with Trend & p-value (Overlaid when compare active) */}
          <section className="card">
            <div className="card-head">
              <div className="card-head-title-wrap">
                <h3>{t('detail.yearByYearTitle')}</h3>
              </div>
              <div className="card-head-actions">
                <div className="scenario-chart-toggle" title={t('scenarios.selectScenario')}>
                  {SCENARIOS.map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      className={'chart-scen-btn' + ((scenario || 'statistical') === sc.id ? ' on' : '')}
                      style={{ '--sc-color': sc.color } as React.CSSProperties}
                      onClick={() => onScenario?.(sc.id)}
                      title={lang === 'bn' ? sc.labelBn : sc.labelEn}
                    >
                      {sc.short}
                    </button>
                  ))}
                </div>
                <div className="keys">
                  {compareDistrict ? (
                    <>
                      <span>
                        <i style={{ background: '#3987e5' }} />
                        {name}
                      </span>
                      <span>
                        <i style={{ background: '#f59e0b' }} />
                        {compareName}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        <i style={{ background: '#b4bccd' }} />
                        {t('detail.recorded')}
                      </span>
                      <span>
                        <i className="dash" style={{ background: TIMES[2].color }} />
                        {t('scenarios.statistical')}
                      </span>
                      {hasCmip && (
                        <span>
                          <i style={{ background: cmipData.info.color }} />
                          {cmipData.info.name}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <button
                  className="chart-download-icon-btn"
                  onClick={(e) => handleExportCardPNG(e, 'year-by-year')}
                  title="Download Year by Year chart as PNG"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="chart tall">
              <YearChart
                stats={s}
                compareStats={compareStats}
                metric={metric}
                time={time}
                year={year}
                districtName={name}
                compareName={compareName ?? undefined}
                scenario={scenario}
                cmipData={cmipData}
                compareCmipData={compareCmipData}
              />
            </div>
          </section>

          {/* Year x Month Heatmap */}
          <section className="card">
            <div className="card-head">
              <h3>{t('detail.heatmapTitle')}</h3>
              <span className="keys">
                <span>{isAnomaly ? t('detail.monthlyAnomaly') : t('detail.monthlyMean')}</span>
              </span>
            </div>
            <HeatmapChart stats={s} metric={metric} isAnomaly={isAnomaly} />
          </section>

          {/* Through the year cycle (Overlaid when compare active) */}
          <section className="card">
            <div className="card-head">
              <h3>{t('detail.seasonalTitle')}</h3>
              <div className="card-head-actions">
                <div className="keys">
                  {compareDistrict ? (
                    <>
                      <span>
                        <i style={{ background: '#3987e5' }} />
                        {name} ({t(`times.${time}`)})
                      </span>
                      <span>
                        <i style={{ background: '#f59e0b' }} />
                        {compareName} ({t(`times.${time}`)})
                      </span>
                    </>
                  ) : (
                    TIMES.map((tItem) => (
                      <span key={tItem.id}>
                        <i style={{ background: tItem.color }} />
                        {t(`times.${tItem.id}`)}
                      </span>
                    ))
                  )}
                </div>
                <button
                  className="chart-download-icon-btn"
                  onClick={(e) => handleExportCardPNG(e, 'seasonal-cycle')}
                  title="Download Seasonal Cycle chart as PNG"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="chart">
              <SeasonChart
                stats={s}
                compareStats={compareStats}
                metric={metric}
                time={time}
                districtName={name}
                compareName={compareName ?? undefined}
              />
            </div>
          </section>

          {/* 60 days daily */}
          <section className="card">
            <div className="card-head">
              <h3>{t('detail.dailyTitle')}</h3>
              <span className={'live' + (daily.live ? ' on' : '')}>
                {daily.live ? t('detail.liveFromNasa') : t('detail.snapshotTo', { date: yyyymmdd(latestDaily, lang) })}
              </span>
            </div>
            <div className="chart">
              <DailyChart daily={daily} />
            </div>
          </section>
        </>
      )}

      <footer className="method">
        <p>
          <b>{t('detail.dataSource')}</b> —{' '}
          <a href={SOURCE.dataUrl} target="_blank" rel="noreferrer">
            {SOURCE.data}
          </a>{' '}
          (NASA Earth science), daily & monthly, sampled at each district. <b>{t('detail.bordersSource')}</b> —{' '}
          <a href={SOURCE.bordersUrl} target="_blank" rel="noreferrer">
            {SOURCE.borders}
          </a>
          . <b>{t('detail.mapSource')}</b> — NASA GIBS.
        </p>
        <p>
          <b>Past</b> is the {toDigits(PAST_YEARS[0])}–{toDigits(PAST_YEARS[1])} average baseline. <b>Now</b> is the
          latest 12 complete months.
          <b> Future</b> is our statistical projection: a robust Theil–Sen trend through 2001–2025, evaluated at{' '}
          {toDigits(FUTURE_YEAR)} with a ±95% range. <b>Anomaly mode</b> displays deviations from the{' '}
          {toDigits(PAST_YEARS[0])}–{toDigits(PAST_YEARS[1])} baseline using diverging palettes. <b>Compare mode</b>{' '}
          allows side-by-side evaluation of two districts.
        </p>
      </footer>
    </aside>
  );
}
