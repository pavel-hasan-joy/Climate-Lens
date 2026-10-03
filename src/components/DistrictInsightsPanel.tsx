import { useMemo } from 'react';
import { METRIC } from '../lib/constants';
import { statsFor, extremesFor, districts, YEARS } from '../lib/metrics';
import { useTranslation } from '../lib/i18n';
import { generateDistrictNarrative } from '../lib/narrative';
import type { MetricId } from '../lib/types';

interface DistrictInsightsPanelProps {
  districtId: string;
  metric: MetricId;
}

export default function DistrictInsightsPanel({ districtId, metric }: DistrictInsightsPanelProps) {
  const { lang, toDigits, getDistrictName, t } = useTranslation();
  const district = districts.find((d) => d.id === districtId);
  const districtName = district ? getDistrictName(district.id) : districtId;

  // Retrieve computed stats and extremes
  const stats = useMemo(() => statsFor([districtId], metric), [districtId, metric]);
  const extremes = useMemo(() => extremesFor([districtId]), [districtId]);

  const m = METRIC[metric];
  const unitLabel = lang === 'bn' ? (m.unit === '°C' ? '°সে' : m.unit === '%' ? '%' : 'মিমি') : m.unit;

  // Slope and Mann-Kendall
  const slopePerYear = stats.slope;
  const slopePerDecade = stats.slope * 10;
  const pValue = stats.mk.p;
  const significant = stats.mk.significant;
  const trend: 'increasing' | 'decreasing' | 'no_trend' =
    slopePerYear > 0.0001 ? 'increasing' : slopePerYear < -0.0001 ? 'decreasing' : 'no_trend';

  // Baseline 2001-2010 anomaly
  const baselineMean = stats.past;
  const latestVal = stats.now;
  const latestAnomaly = stats.anomaly.now;
  const pctAnomaly = baselineMean !== 0 ? ((latestVal - baselineMean) / baselineMean) * 100 : 0;

  // Percentile ranking within 2001-2025 series
  const series = stats.annual;
  const percentile = useMemo(() => {
    let lower = 0;
    let equal = 0;
    series.forEach((v) => {
      if (v < latestVal) lower++;
      else if (v === latestVal) equal++;
    });
    return Math.round(((lower + 0.5 * equal) / series.length) * 100);
  }, [series, latestVal]);

  const heatwaveDays36C = extremes?.heatwaveDays ?? 0;
  const heavyRainDays50mm = extremes?.heavyRainDays ?? 0;
  const longestDrySpellDays = extremes?.longestDrySpell ?? 0;

  // Plain-Language Narrative generated via deterministic templates
  const narrative = useMemo(() => {
    return generateDistrictNarrative({
      districtName,
      metric,
      lang,
      slopePerDecade,
      slopePerYear,
      pValue,
      significant,
      trend,
      latestAnomaly,
      pctAnomaly,
      baselineMean,
      percentile,
      heatwaveDays36C,
      heavyRainDays50mm,
      longestDrySpellDays,
    });
  }, [
    districtName,
    metric,
    lang,
    slopePerDecade,
    slopePerYear,
    pValue,
    significant,
    trend,
    latestAnomaly,
    pctAnomaly,
    baselineMean,
    percentile,
    heatwaveDays36C,
    heavyRainDays50mm,
    longestDrySpellDays,
  ]);

  // Mini Sparkline coordinates for annual series
  const sparklineData = useMemo(() => {
    const minVal = Math.min(...series);
    const maxVal = Math.max(...series);
    const range = maxVal - minVal || 1;
    const w = 180;
    const h = 40;
    const padding = 4;

    const points = series.map((val, idx) => {
      const x = padding + (idx / (series.length - 1)) * (w - 2 * padding);
      const y = h - padding - ((val - minVal) / range) * (h - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    // Trendline endpoints via Theil-Sen slope
    const n = series.length;
    const meanYear = (YEARS[0] + YEARS[n - 1]) / 2;
    const meanVal = series.reduce((acc, v) => acc + v, 0) / n;
    const yStartVal = meanVal + stats.slope * (YEARS[0] - meanYear);
    const yEndVal = meanVal + stats.slope * (YEARS[n - 1] - meanYear);

    const tY1 = h - padding - ((yStartVal - minVal) / range) * (h - 2 * padding);
    const tY2 = h - padding - ((yEndVal - minVal) / range) * (h - 2 * padding);

    return {
      pointsStr: points.join(' '),
      trendLine: {
        x1: padding,
        y1: Math.max(padding, Math.min(h - padding, tY1)),
        x2: w - padding,
        y2: Math.max(padding, Math.min(h - padding, tY2)),
      },
    };
  }, [series, stats.slope]);

  // Mini Anomaly stripes data (2001..2025)
  const historicalAnomalies = useMemo(() => {
    return series.map((v) => v - baselineMean);
  }, [series, baselineMean]);

  const stripeColors = useMemo(() => {
    const maxAbs = Math.max(...historicalAnomalies.map(Math.abs), 0.1);
    return historicalAnomalies.map((a) => {
      const norm = Math.max(-1, Math.min(1, a / maxAbs));
      if (metric === 'heat') {
        // Red for hotter, Blue for cooler
        return norm > 0
          ? `rgba(239, 68, 68, ${0.25 + 0.75 * norm})`
          : `rgba(59, 130, 246, ${0.25 + 0.75 * Math.abs(norm)})`;
      }
      // Blue for wetter, Amber for drier
      return norm > 0
        ? `rgba(56, 189, 248, ${0.25 + 0.75 * norm})`
        : `rgba(245, 158, 11, ${0.25 + 0.75 * Math.abs(norm)})`;
    });
  }, [historicalAnomalies, metric]);

  return (
    <div className="district-insights-panel fade">
      {/* Panel Subhead & District Overview */}
      <div className="insights-header-banner">
        <div className="insights-headline-group">
          <span className="insights-tag">{lang === 'bn' ? 'গাণিতিক বিশ্লেষণ' : 'Mathematical Synthesis'}</span>
          <h3 className="insights-title">
            {lang === 'bn' ? `${districtName} জেলার পরিসংখ্যানগত পর্যবেক্ষণ` : `${districtName} Statistical Insights`}
          </h3>
        </div>
        <div className="freshness-pill" title="Computed from real NASA POWER daily records (2001–2025)">
          <span className="freshness-dot live" />
          <span>{lang === 'bn' ? 'সরাসরি গণনাকৃত' : 'Directly Computed'}</span>
        </div>
      </div>

      {/* Auto-Generated 3 Plain-Language Sentences */}
      <section className="narrative-synthesized-card card">
        <div className="narrative-head">
          <span className="narrative-icon">📜</span>
          <h4 className="narrative-title">
            {lang === 'bn' ? 'স্বয়ংক্রিয় সারসংক্ষেপ (অ্যালগরিদমিক)' : 'Deterministic Plain-Language Summary'}
          </h4>
          <span className="narrative-badge">No LLM / Rule-Based</span>
        </div>
        <div className="narrative-sentences-list">
          <p className="narrative-sentence">
            <span className="sentence-num">1.</span> {narrative.trendSentence}
          </p>
          <p className="narrative-sentence">
            <span className="sentence-num">2.</span> {narrative.anomalySentence}
          </p>
          <p className="narrative-sentence">
            <span className="sentence-num">3.</span> {narrative.extremeSentence}
          </p>
        </div>
      </section>

      {/* 4 Computed Metrics Grid */}
      <div className="insight-metrics-grid">
        {/* Metric 1: Decadal Trend with Theil-Sen Sparkline */}
        <div className="insight-metric-box">
          <div className="insight-metric-top">
            <span className="metric-box-title">{lang === 'bn' ? 'প্রতি দশকে পরিবর্তন' : 'Trend per Decade'}</span>
            <span className={`significance-tag ${significant ? 'is-sig' : 'is-not-sig'}`}>
              {significant
                ? lang === 'bn'
                  ? 'তাৎপর্যপূর্ণ'
                  : 'Significant'
                : lang === 'bn'
                  ? 'তাৎপর্যহীন'
                  : 'Not Sig.'}{' '}
              (p = {toDigits(pValue.toFixed(3))})
            </span>
          </div>
          <div className="metric-box-value">
            {slopePerDecade > 0 ? '+' : ''}
            {toDigits(slopePerDecade.toFixed(m.digits + 1))}
            <span className="metric-box-unit">
              {unitLabel}/{t('trends.decade')}
            </span>
          </div>
          <div
            className="mini-chart-wrap"
            title={`Annual trend: ${slopePerDecade > 0 ? '+' : ''}${slopePerDecade.toFixed(2)} ${unitLabel}/decade`}
          >
            <svg viewBox="0 0 180 40" className="mini-sparkline" preserveAspectRatio="none">
              {/* Historical annual curve */}
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparklineData.pointsStr}
              />
              {/* Theil-Sen regression trendline */}
              <line
                x1={sparklineData.trendLine.x1}
                y1={sparklineData.trendLine.y1}
                x2={sparklineData.trendLine.x2}
                y2={sparklineData.trendLine.y2}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            </svg>
            <div className="mini-chart-labels">
              <span>{toDigits(YEARS[0])}</span>
              <span style={{ color: '#f59e0b' }}>--- Sen's slope</span>
              <span>{toDigits(YEARS[YEARS.length - 1])}</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Baseline Anomaly */}
        <div className="insight-metric-box">
          <div className="insight-metric-top">
            <span className="metric-box-title">{lang === 'bn' ? 'ভিত্তি বছর ব্যবধান' : 'Baseline Anomaly'}</span>
            <span className="baseline-ref-tag">vs 2001–2010</span>
          </div>
          <div className="metric-box-value">
            {latestAnomaly > 0 ? '+' : ''}
            {toDigits(latestAnomaly.toFixed(m.digits))}
            <span className="metric-box-unit">{unitLabel}</span>
            <small className="pct-anom">
              ({pctAnomaly > 0 ? '+' : ''}
              {toDigits(pctAnomaly.toFixed(1))}%)
            </small>
          </div>
          {/* Mini climate stripes visual */}
          <div className="mini-stripes-wrap" title="Climate stripes (2001–2025) showing yearly anomalies">
            <div className="mini-stripes-bars">
              {stripeColors.map((col, idx) => (
                <div
                  key={idx}
                  className="mini-stripe-col"
                  style={{ background: col }}
                  title={`${YEARS[idx]}: ${historicalAnomalies[idx] > 0 ? '+' : ''}${historicalAnomalies[idx].toFixed(1)} ${m.unit}`}
                />
              ))}
            </div>
            <div className="mini-chart-labels">
              <span>{toDigits(YEARS[0])}</span>
              <span>{lang === 'bn' ? 'বার্ষিক স্ট্রাইপস' : 'Stripes'}</span>
              <span>{toDigits(YEARS[YEARS.length - 1])}</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Extreme Weather Events */}
        <div className="insight-metric-box">
          <div className="insight-metric-top">
            <span className="metric-box-title">{lang === 'bn' ? 'চরম আবহাওয়া দিন' : 'Extreme Weather Days'}</span>
            <span className="extreme-window-tag">2001–2025</span>
          </div>
          <div className="extreme-counts-row">
            <div className="extreme-indicator-item">
              <span className="extreme-number heat">{toDigits(heatwaveDays36C)}</span>
              <span className="extreme-label">{lang === 'bn' ? 'তীব্র তাপপ্রবাহ (≥৩৬°)' : 'Heatwaves (≥36°C)'}</span>
            </div>
            <div className="extreme-indicator-item">
              <span className="extreme-number rain">{toDigits(heavyRainDays50mm)}</span>
              <span className="extreme-label">{lang === 'bn' ? 'ভারী বৃষ্টি (≥৫০ মিমি)' : 'Heavy Rain (≥50mm)'}</span>
            </div>
            <div className="extreme-indicator-item">
              <span className="extreme-number dry">{toDigits(longestDrySpellDays)}</span>
              <span className="extreme-label">{lang === 'bn' ? 'টানা অনাবৃষ্টি (দিন)' : 'Max Dry Spell (days)'}</span>
            </div>
          </div>
          <div className="extreme-source-note">
            <span>{lang === 'bn' ? 'দৈনিক রেকর্ড থেকে সরাসরি সংকলিত' : 'Compiled directly from daily series'}</span>
          </div>
        </div>

        {/* Metric 4: Latest 12-Months Historical Percentile */}
        <div className="insight-metric-box">
          <div className="insight-metric-top">
            <span className="metric-box-title">
              {lang === 'bn' ? 'ঐতিহাসিক পার্সেন্টাইল' : 'Latest-12M Percentile'}
            </span>
            <span className="percentile-tag">{toDigits(percentile)}th</span>
          </div>
          <div className="metric-box-value">
            {toDigits(percentile)}
            <span className="metric-box-unit">%</span>
            <small className="percentile-desc">
              {percentile >= 75
                ? lang === 'bn'
                  ? '(উচ্চতম চতুর্থাংশ)'
                  : '(Upper quartile)'
                : percentile <= 25
                  ? lang === 'bn'
                    ? '(নিম্নতম চতুর্থাংশ)'
                    : '(Lower quartile)'
                  : lang === 'bn'
                    ? '(মধ্যবর্তী স্তর)'
                    : '(Normal range)'}
            </small>
          </div>
          {/* Percentile distribution slider bar */}
          <div
            className="percentile-bar-container"
            title={`Ranked ${percentile}th percentile among 2001–2025 observations`}
          >
            <div className="percentile-track">
              <div className="percentile-fill" style={{ width: `${Math.max(4, Math.min(100, percentile))}%` }} />
              <div className="percentile-marker" style={{ left: `${Math.max(2, Math.min(98, percentile))}%` }} />
            </div>
            <div className="mini-chart-labels">
              <span>0% ({lang === 'bn' ? 'সর্বনিম্ন' : 'Min'})</span>
              <span>50%</span>
              <span>100% ({lang === 'bn' ? 'সর্বোচ্চ' : 'Max'})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Honest Scientific Disclosure & Method Provenance */}
      <footer className="insights-footer-note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p>
          {lang === 'bn' ? (
            <>
              <strong>উৎস ও পদ্ধতি:</strong> নাসা পাওয়ার (NASA POWER v2.4.1) গ্রিডেড অবজারভেশন। সেন্স স্লোপ এবং
              দ্বি-পার্শ্বীয় ম্যান-কেন্ডাল ট্রেন্ড টেস্ট (p &lt; 0.05 মানদণ্ড)। কোনো মান কৃত্রিমভাবে তৈরি বা এলএলএম
              দিয়ে অনুমিত নয়।
            </>
          ) : (
            <>
              <strong>Source & Method:</strong> NASA POWER v2.4.1 gridded daily data. Trend tested via robust Theil–Sen
              estimator and two-tailed Mann–Kendall test (p &lt; 0.05). All statistics are calculated deterministically
              in-browser.
            </>
          )}
        </p>
      </footer>
    </div>
  );
}
