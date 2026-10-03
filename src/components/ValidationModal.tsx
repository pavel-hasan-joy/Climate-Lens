import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { METRIC, METRICS } from '../lib/constants';
import { districts, validation } from '../lib/metrics';
import { useTranslation } from '../lib/i18n';
import type { MetricId } from '../lib/types';
import { baseOptions, INK } from './charts/setup';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDistrictId?: string | null;
}

export default function ValidationModal({ isOpen, onClose, initialDistrictId }: ValidationModalProps) {
  const { t, toDigits, getDistrictName, getDivisionName, lang } = useTranslation();
  const [activeTab, setActiveTab] = useState<'backtest' | 'methods' | 'divisions' | 'evidenceLimits' | 'limitations'>(
    'backtest',
  );
  const [selectedMetric, setSelectedMetric] = useState<MetricId>('heat');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(initialDistrictId || 'all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const metricConfig = METRIC[selectedMetric];
  const unitLabel =
    lang === 'bn' ? (metricConfig.unit === '°C' ? '°সে' : metricConfig.unit === '%' ? '%' : 'মিমি') : metricConfig.unit;

  // Test years: 2016–2025
  const testYears = useMemo(() => {
    const [start, end] = validation.metadata.testYears;
    return Array.from({ length: end - start + 1 }, (_, i) => String(start + i));
  }, []);

  // Compute chart datasets for selected district or national average
  const chartData = useMemo(() => {
    let predicted: number[] = [];
    let actual: number[] = [];
    let band = 0;
    let title = '';

    if (selectedDistrictId === 'all') {
      title = t('validationModal.nationalMean');
      // Average across all 64 districts
      const allD = Object.values(validation.districts);
      const n = testYears.length;
      predicted = Array.from({ length: n }, (_, i) => {
        const sum = allD.reduce((acc, d) => acc + d.metrics[selectedMetric].predicted[i], 0);
        return Math.round((sum / allD.length) * 100) / 100;
      });
      actual = Array.from({ length: n }, (_, i) => {
        const sum = allD.reduce((acc, d) => acc + d.metrics[selectedMetric].actual[i], 0);
        return Math.round((sum / allD.length) * 100) / 100;
      });
      band = Math.round((allD.reduce((acc, d) => acc + d.metrics[selectedMetric].band, 0) / allD.length) * 100) / 100;
    } else {
      const d = validation.districts[selectedDistrictId];
      if (d) {
        title = getDistrictName(d.id);
        const m = d.metrics[selectedMetric];
        predicted = m.predicted;
        actual = m.actual;
        band = m.band;
      }
    }

    const upper = predicted.map((p) => Math.round((p + band) * 100) / 100);
    const lower = predicted.map((p) =>
      Math.max(selectedMetric === 'heat' ? -Infinity : 0, Math.round((p - band) * 100) / 100),
    );

    return {
      title,
      labels: testYears.map((y) => toDigits(y)),
      datasets: [
        {
          label: `${t('validationModal.actSeries')} (${unitLabel})`,
          data: actual,
          borderColor: '#3987e5',
          backgroundColor: '#3987e5',
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#3987e5',
          tension: 0.15,
          order: 1,
        },
        {
          label: `${t('validationModal.predSeries')} (${unitLabel})`,
          data: predicted,
          borderColor: '#d95926',
          backgroundColor: '#d95926',
          borderWidth: 2,
          borderDash: [5, 4],
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.15,
          order: 2,
        },
        {
          label: `+95% (${unitLabel})`,
          data: upper,
          borderColor: 'rgba(217, 89, 38, 0.35)',
          borderWidth: 1,
          borderDash: [2, 2],
          pointRadius: 0,
          fill: '+1',
          backgroundColor: 'rgba(217, 89, 38, 0.08)',
          order: 3,
        },
        {
          label: `-95% (${unitLabel})`,
          data: lower,
          borderColor: 'rgba(217, 89, 38, 0.35)',
          borderWidth: 1,
          borderDash: [2, 2],
          pointRadius: 0,
          fill: false,
          order: 4,
        },
      ],
    };
  }, [selectedDistrictId, selectedMetric, testYears, unitLabel, t, toDigits, getDistrictName]);

  const chartOptions = useMemo(() => {
    return {
      ...baseOptions(unitLabel),
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          labels: {
            color: INK.secondary,
            font: { family: 'inherit', size: 11 },
            boxWidth: 12,
            boxHeight: 3,
            filter: (item: any) => !item.text.startsWith('-95%') && !item.text.startsWith('+95%'),
          },
        },
        tooltip: {
          backgroundColor: 'rgba(12, 17, 26, 0.95)',
          titleColor: '#f1f5f9',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255, 255, 255, 0.12)',
          borderWidth: 1,
          padding: 10,
        },
      },
      scales: {
        x: {
          grid: { color: INK.grid },
          ticks: { color: INK.secondary, font: { size: 11 } },
        },
        y: {
          grid: { color: INK.grid },
          ticks: {
            color: INK.secondary,
            font: { size: 11 },
            callback: (v: any) => `${toDigits(v)}`,
          },
        },
      },
    };
  }, [unitLabel, toDigits]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card validation-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="validation-modal-header">
          <div className="validation-title-group">
            <div className="validation-badge-icon">🔬</div>
            <div>
              <h2>{t('validationModal.title')}</h2>
              <p className="validation-modal-subtitle">{t('validationModal.subtitle')}</p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label={t('validationModal.close')}>
            ✕
          </button>
        </header>

        {/* Tab Navigation */}
        <nav className="validation-nav-tabs">
          <button
            type="button"
            className={'val-tab' + (activeTab === 'backtest' ? ' on' : '')}
            onClick={() => setActiveTab('backtest')}
          >
            📊 {t('validationModal.tabBacktest')}
          </button>
          <button
            type="button"
            className={'val-tab' + (activeTab === 'divisions' ? ' on' : '')}
            onClick={() => setActiveTab('divisions')}
          >
            🗺️ {t('validationModal.tabDivisions')}
          </button>
          <button
            type="button"
            className={'val-tab' + (activeTab === 'methods' ? ' on' : '')}
            onClick={() => setActiveTab('methods')}
          >
            📐 {t('validationModal.tabMethods')}
          </button>
          <button
            type="button"
            className={'val-tab' + (activeTab === 'evidenceLimits' ? ' on' : '')}
            onClick={() => setActiveTab('evidenceLimits')}
          >
            🔬 {t('validationModal.tabEvidenceLimits')}
          </button>
          <button
            type="button"
            className={'val-tab' + (activeTab === 'limitations' ? ' on' : '')}
            onClick={() => setActiveTab('limitations')}
          >
            ⚠️ {t('validationModal.tabLimitations')}
          </button>
        </nav>

        {/* Modal Body */}
        <div className="validation-modal-body">
          {/* TAB 1: BACKTESTING */}
          {activeTab === 'backtest' && (
            <div className="val-section">
              <div className="val-callout-box">
                <h4>{t('validationModal.backtestTitle')}</h4>
                <p>{t('validationModal.backtestDesc')}</p>
              </div>

              {/* National KPI Summary Cards */}
              <h4 className="val-section-title">{t('validationModal.nationalAverages')}</h4>
              <div className="val-kpi-grid">
                {METRICS.map((m) => {
                  const o = validation.overall[m.id];
                  const u = lang === 'bn' ? (m.unit === '°C' ? '°সে' : m.unit === '%' ? '%' : 'মিমি') : m.unit;
                  const isSelected = selectedMetric === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={'val-kpi-card' + (isSelected ? ' active' : '')}
                      onClick={() => setSelectedMetric(m.id)}
                    >
                      <span className="val-kpi-name">{t(`metrics.${m.id}.label`)}</span>
                      <div className="val-kpi-stats">
                        <div className="val-kpi-row">
                          <span className="val-kpi-lbl">{t('validationModal.maeLabel')}:</span>
                          <b>
                            {toDigits(o.mae)} {u}
                          </b>
                        </div>
                        <div className="val-kpi-row">
                          <span className="val-kpi-lbl">{t('validationModal.rmseLabel')}:</span>
                          <b>
                            {toDigits(o.rmse)} {u}
                          </b>
                        </div>
                        <div className="val-kpi-row">
                          <span className="val-kpi-lbl">{t('validationModal.coverageLabel')}:</span>
                          <span
                            className="coverage-pill"
                            style={{
                              background: o.coverage >= 50 ? 'rgba(25, 158, 112, 0.2)' : 'rgba(217, 89, 38, 0.2)',
                              color: o.coverage >= 50 ? '#3fc393' : '#ec835a',
                            }}
                          >
                            {toDigits(o.coverage)}%
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Backtest Validation Chart */}
              <div className="val-chart-wrapper">
                <div className="val-chart-header">
                  <div className="val-chart-title">
                    <h5>{t('validationModal.predVsActualTitle')}</h5>
                    <span className="val-chart-sub">
                      {chartData.title} · {t(`metrics.${selectedMetric}.label`)} ({unitLabel})
                    </span>
                  </div>
                  <div className="val-controls">
                    <label>
                      <span>{t('validationModal.selectDistrictForChart')}</span>
                      <select
                        value={selectedDistrictId}
                        onChange={(e) => setSelectedDistrictId(e.target.value)}
                        className="val-district-select"
                      >
                        <option value="all">{t('validationModal.nationalMean')}</option>
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {getDistrictName(d.id)} ({getDivisionName(d.division)})
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="val-chart-canvas-area" style={{ height: 280, width: '100%', position: 'relative' }}>
                  <Line data={chartData as any} options={chartOptions} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIVISION TABLE */}
          {activeTab === 'divisions' && (
            <div className="val-section">
              <div className="val-table-header">
                <h4>{t('validationModal.divisionTableTitle')}</h4>
                <p>{t('validationModal.divisionTableDesc')}</p>
                <div className="val-metric-toggle-group">
                  {METRICS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={'val-metric-btn' + (selectedMetric === m.id ? ' on' : '')}
                      onClick={() => setSelectedMetric(m.id)}
                    >
                      {t(`metrics.${m.id}.label`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="val-table-wrap">
                <table className="val-division-table">
                  <thead>
                    <tr>
                      <th>{t('validationModal.divisionCol')}</th>
                      <th>{t('validationModal.districtsCol')}</th>
                      <th>
                        {t('validationModal.maeCol')} ({unitLabel})
                      </th>
                      <th>
                        {t('validationModal.rmseCol')} ({unitLabel})
                      </th>
                      <th>{t('validationModal.coverageCol')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(validation.byDivision).map((div) => {
                      const st = div.metrics[selectedMetric];
                      return (
                        <tr key={div.id}>
                          <td>
                            <b>{getDivisionName(div.id)}</b>
                          </td>
                          <td>{toDigits(div.districtCount)}</td>
                          <td>{toDigits(st.mae)}</td>
                          <td>{toDigits(st.rmse)}</td>
                          <td>
                            <span
                              className="coverage-pill"
                              style={{
                                background: st.coverage >= 50 ? 'rgba(25, 158, 112, 0.2)' : 'rgba(217, 89, 38, 0.2)',
                                color: st.coverage >= 50 ? '#3fc393' : '#ec835a',
                              }}
                            >
                              {toDigits(st.coverage)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: METHODS */}
          {activeTab === 'methods' && (
            <div className="val-section val-methods-grid">
              <div className="val-card">
                <div className="val-card-header">
                  <div className="val-card-icon">🛰️</div>
                  <h4>{t('validationModal.sourcesTitle')}</h4>
                </div>
                <p>{t('validationModal.sourcesDesc')}</p>
              </div>

              <div className="val-card">
                <div className="val-card-header">
                  <div className="val-card-icon">👥</div>
                  <h4>{t('validationModal.sourceSedacTitle')}</h4>
                </div>
                <p>{t('validationModal.sourceSedacDesc')}</p>
              </div>

              <div className="val-card">
                <div className="val-card-header">
                  <div className="val-card-icon">🌱</div>
                  <h4>{t('validationModal.sourceModisTitle')}</h4>
                </div>
                <p>{t('validationModal.sourceModisDesc')}</p>
              </div>

              <div className="val-card">
                <div className="val-card-header">
                  <div className="val-card-icon">📈</div>
                  <h4>{t('validationModal.methodTheilSen')}</h4>
                </div>
                <p>{t('validationModal.methodTheilSenDesc')}</p>
              </div>

              <div className="val-card">
                <div className="val-card-header">
                  <div className="val-card-icon">🔍</div>
                  <h4>{t('validationModal.methodMK')}</h4>
                </div>
                <p>{t('validationModal.methodMKDesc')}</p>
              </div>

              <div className="val-card">
                <div className="val-card-header">
                  <div className="val-card-icon">🎯</div>
                  <h4>{t('validationModal.method95Band')}</h4>
                </div>
                <p>{t('validationModal.method95BandDesc')}</p>
              </div>

              <div className="val-card">
                <div className="val-card-header">
                  <div className="val-card-icon">🌍</div>
                  <h4>{t('validationModal.methodCmip6')}</h4>
                </div>
                <p>{t('validationModal.methodCmip6Desc')}</p>
              </div>
            </div>
          )}

          {/* TAB: CLIMATE IMPACTS EVIDENCE & LIMITS */}
          {activeTab === 'evidenceLimits' && (
            <div className="val-section val-methods-grid">
              <div className="val-callout-box" style={{ gridColumn: '1 / -1' }}>
                <h4>{t('validationModal.evidenceLimitsTitle')}</h4>
                <p>{t('validationModal.evidenceLimitsSubtitle')}</p>
              </div>

              <div className="val-card">
                <div className="val-card-header">
                  <div className="val-card-icon">📚</div>
                  <h4>{t('validationModal.selectionProtocolTitle')}</h4>
                </div>
                <p>{t('validationModal.selectionProtocolDesc')}</p>
              </div>

              <div className="val-card">
                <div className="val-card-header">
                  <div className="val-card-icon">🏷️</div>
                  <h4>{t('validationModal.evidenceTaxonomyTitle')}</h4>
                </div>
                <p>{t('validationModal.evidenceTaxonomyDesc')}</p>
              </div>

              <div className="val-card">
                <div className="val-card-header">
                  <div className="val-card-icon">⚖️</div>
                  <h4>{t('validationModal.correlationCausationTitle')}</h4>
                </div>
                <p>{t('validationModal.correlationCausationDesc')}</p>
              </div>

              <div className="val-card">
                <div className="val-card-header">
                  <div className="val-card-icon">🔄</div>
                  <h4>{t('validationModal.conflictingStudiesTitle')}</h4>
                </div>
                <p>{t('validationModal.conflictingStudiesDesc')}</p>
              </div>

              <div className="val-card" style={{ gridColumn: '1 / -1' }}>
                <div className="val-card-header">
                  <div className="val-card-icon">⚠️</div>
                  <h4>{t('validationModal.uncoveredGapsTitle')}</h4>
                </div>
                <p>{t('validationModal.uncoveredGapsDesc')}</p>
                <div style={{ marginTop: '10px', fontSize: '11.5px', color: '#94a3b8' }}>
                  📋 <em>{t('validationModal.sourcesRegistryNotice')}</em>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIMITATIONS */}
          {activeTab === 'limitations' && (
            <div className="val-section val-limitations-list">
              <div className="val-limit-card">
                <h4>1. {t('validationModal.limitation1Title')}</h4>
                <p>{t('validationModal.limitation1Desc')}</p>
              </div>
              <div className="val-limit-card">
                <h4>2. {t('validationModal.limitation2Title')}</h4>
                <p>{t('validationModal.limitation2Desc')}</p>
              </div>
              <div className="val-limit-card">
                <h4>3. {t('validationModal.limitation3Title')}</h4>
                <p>{t('validationModal.limitation3Desc')}</p>
              </div>
              <div className="val-limit-card">
                <h4>4. {t('validationModal.limitation4Title')}</h4>
                <p>{t('validationModal.limitation4Desc')}</p>
              </div>
              <div className="val-notice-box">
                <b>📌 {t('validationModal.indicativeNotice')}</b>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="validation-modal-footer">
          <span className="validation-footer-meta">
            NASA POWER 2001–2025 · NASA NEX-GDDP-CMIP6 · geoBoundaries ADM1/ADM2
          </span>
          <button type="button" className="btn-primary" onClick={onClose}>
            {t('validationModal.close')}
          </button>
        </footer>
      </div>
    </div>
  );
}
