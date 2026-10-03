import { useState } from 'react';
import { useDistrictAnalysis } from '../hooks/useDistrictAnalysis';
import { useTranslation } from '../lib/i18n';
import { METRIC } from '../lib/constants';
import type { MetricId } from '../lib/types';

interface LiveDistrictAnalysisProps {
  districtId: string;
  metric: MetricId;
}

export default function LiveDistrictAnalysis({ districtId, metric }: LiveDistrictAnalysisProps) {
  const [startYear, setStartYear] = useState(2001);
  const [endYear, setEndYear] = useState(2025);
  const { t, toDigits, getDistrictName, lang } = useTranslation();

  const { loading, error, isLive, isCached, isFallback, fetchedAt, source, warnings, analysis, refetch } =
    useDistrictAnalysis({
      districtId,
      startYear,
      endYear,
      autoFetch: true,
    });

  const m = METRIC[metric];
  const unitLabel = lang === 'bn' ? (m.unit === '°C' ? '°সে' : m.unit === '%' ? '%' : 'মিমি') : m.unit;
  const metricStats = analysis?.metrics[metric];
  const extremes = analysis?.extremes;

  return (
    <div className="live-analysis-card card">
      {/* Header & Status Bar */}
      <div className="live-analysis-header">
        <div className="live-header-title">
          <div className="live-pulse-icon">
            <span className={`pulse-dot ${isLive ? 'live' : isCached ? 'cached' : 'fallback'}`} />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div>
            <h4 className="card-title" style={{ margin: 0 }}>
              {lang === 'bn' ? 'সরাসরি নাসার বিশ্লেষণ' : 'Live NASA POWER Analysis'}
            </h4>
            <span className="live-subtitle">
              {getDistrictName(districtId)} ({toDigits(startYear)}–{toDigits(endYear)})
            </span>
          </div>
        </div>

        {/* Source Badge */}
        <div className="live-badges">
          {isLive && (
            <span className="live-status-tag live">
              <span className="tag-dot" />
              {lang === 'bn' ? 'লাইভ এপিআই' : 'LIVE API'}
            </span>
          )}
          {isCached && (
            <span className="live-status-tag cached">
              <span className="tag-dot" />
              {lang === 'bn' ? 'ক্যাশড' : 'CACHED (6h)'}
            </span>
          )}
          {isFallback && (
            <span className="live-status-tag fallback">
              <span className="tag-dot" />
              {lang === 'bn' ? 'সংরক্ষিত স্ন্যাপশট' : 'SAVED SNAPSHOT'}
            </span>
          )}
          {fetchedAt && (
            <span className="live-timestamp" title={`Source: ${source}`}>
              {toDigits(fetchedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Year Range Controls & Live Refetch */}
      <div className="live-controls-row">
        <div className="live-year-inputs">
          <label className="live-input-group">
            <span className="input-label">{lang === 'bn' ? 'শুরু:' : 'From:'}</span>
            <select
              value={startYear}
              onChange={(e) => setStartYear(Math.min(Number(e.target.value), endYear - 3))}
              className="live-select"
            >
              {[2001, 2005, 2010, 2015].map((y) => (
                <option key={y} value={y}>
                  {toDigits(y)}
                </option>
              ))}
            </select>
          </label>
          <span className="range-sep">→</span>
          <label className="live-input-group">
            <span className="input-label">{lang === 'bn' ? 'শেষ:' : 'To:'}</span>
            <select
              value={endYear}
              onChange={(e) => setEndYear(Math.max(Number(e.target.value), startYear + 3))}
              className="live-select"
            >
              {[2020, 2023, 2024, 2025].map((y) => (
                <option key={y} value={y}>
                  {toDigits(y)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={loading}
          className="live-refresh-btn"
          title="Fetch live stream from NASA POWER API"
        >
          {loading ? (
            <>
              <span className="spinner-border" />
              <span>{lang === 'bn' ? 'হিসাব হচ্ছে...' : 'Computing in Worker...'}</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>{lang === 'bn' ? 'পুনরায় রিফ্রেশ' : 'Fetch Live'}</span>
            </>
          )}
        </button>
      </div>

      {/* Warnings & Data Quality Notification */}
      {warnings.length > 0 && (
        <div className="live-warning-banner">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>{warnings[0]}</span>
        </div>
      )}

      {error && !isFallback && (
        <div className="live-error-banner">
          <span>{error}</span>
        </div>
      )}

      {/* Computed Statistical Metrics */}
      {metricStats && (
        <div className="live-metrics-grid">
          <div className="live-metric-card">
            <span className="live-stat-title">{lang === 'bn' ? 'সেন-এর স্লোপ' : "Sen's Slope"}</span>
            <div className="live-stat-val">
              {metricStats.slopePerDecade > 0 ? '+' : ''}
              {toDigits(metricStats.slopePerDecade.toFixed(m.digits + 1))}
              <span className="live-stat-unit">
                {unitLabel}/{t('trends.decade')}
              </span>
            </div>
            <span className="live-stat-sub">
              {metricStats.slopePerYear > 0 ? '+' : ''}
              {toDigits(metricStats.slopePerYear.toFixed(m.digits + 2))} {unitLabel}/{t('trends.year')}
            </span>
          </div>

          <div className="live-metric-card">
            <span className="live-stat-title">{lang === 'bn' ? 'মান-কেন্ডাল তাৎপর্য' : 'Mann–Kendall p-value'}</span>
            <div className="live-stat-val">p = {toDigits(metricStats.mannKendall.p.toFixed(3))}</div>
            <div className={`live-trend-pill ${metricStats.mannKendall.trend}`}>
              {metricStats.mannKendall.trend === 'increasing' && '↗ '}
              {metricStats.mannKendall.trend === 'decreasing' && '↘ '}
              {metricStats.mannKendall.trend === 'no_trend' && '→ '}
              {metricStats.mannKendall.significant
                ? lang === 'bn'
                  ? 'তাৎপর্যপূর্ণ'
                  : 'Significant'
                : lang === 'bn'
                  ? 'তাৎপর্যহীন'
                  : 'Not Sig.'}
            </div>
          </div>

          <div className="live-metric-card">
            <span className="live-stat-title">{lang === 'bn' ? 'বেসলাইন ব্যবধান' : 'Baseline Anomaly'}</span>
            <div className="live-stat-val">
              {metricStats.latestAnomaly > 0 ? '+' : ''}
              {toDigits(metricStats.latestAnomaly.toFixed(m.digits))}
              <span className="live-stat-unit">{unitLabel}</span>
            </div>
            <span className="live-stat-sub">
              {metricStats.latestPctAnomaly > 0 ? '+' : ''}
              {toDigits(metricStats.latestPctAnomaly.toFixed(1))}% {lang === 'bn' ? 'পার্থক্য' : 'vs 2001–10'}
            </span>
          </div>

          <div className="live-metric-card">
            <span className="live-stat-title">{lang === 'bn' ? 'ঐতিহাসিক পার্সেন্টাইল' : 'Historical Percentile'}</span>
            <div className="live-stat-val">
              {toDigits(metricStats.latestPercentile)}
              <span className="live-stat-unit">%</span>
            </div>
            <span className="live-stat-sub">
              {metricStats.latestPercentile >= 90
                ? lang === 'bn'
                  ? 'চরম শীর্ষ'
                  : 'Extreme High'
                : metricStats.latestPercentile <= 10
                  ? lang === 'bn'
                    ? 'চরম নিম্ন'
                    : 'Extreme Low'
                  : lang === 'bn'
                    ? 'স্বাভাবিক মাত্রা'
                    : 'Normal Range'}
            </span>
          </div>
        </div>
      )}

      {/* Live Extreme Indicators */}
      {extremes && (
        <div className="live-extremes-section">
          <h5 className="extremes-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <span>{lang === 'bn' ? 'চরম আবহাওয়া সূচক (সাম্প্রতিক)' : 'Extreme Weather Indicators (Recent)'}</span>
          </h5>
          <div className="extremes-pills-row">
            <div className="extreme-chip" title="Days with T2M_MAX >= 36°C">
              <span className="chip-label">{lang === 'bn' ? 'তীব্র তাপপ্রবাহ (৩৬°সে+):' : 'Heatwave (≥36°C):'}</span>
              <strong className="chip-val">
                {toDigits(extremes.heatwaveDays36C)} {lang === 'bn' ? 'দিন' : 'days'}
              </strong>
            </div>
            <div className="extreme-chip" title="Days with Rain >= 50 mm">
              <span className="chip-label">{lang === 'bn' ? 'ভারী বৃষ্টি (৫০ মিমি+):' : 'Heavy Rain (≥50mm):'}</span>
              <strong className="chip-val">
                {toDigits(extremes.heavyRainDays50mm)} {lang === 'bn' ? 'দিন' : 'days'}
              </strong>
            </div>
            <div className="extreme-chip" title="Consecutive days with rain < 1 mm">
              <span className="chip-label">{lang === 'bn' ? 'টানা অনাবৃষ্টি:' : 'Longest Dry Spell:'}</span>
              <strong className="chip-val">
                {toDigits(extremes.longestDrySpellDays)} {lang === 'bn' ? 'দিন' : 'days'}
              </strong>
            </div>
            {extremes.maxRecordedTmaxC > 0 && (
              <div className="extreme-chip" title="Highest daily temperature in window">
                <span className="chip-label">{lang === 'bn' ? 'সর্বোচ্চ তাপমাত্রা:' : 'Peak Temp:'}</span>
                <strong className="chip-val">{toDigits(extremes.maxRecordedTmaxC)} °C</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
