import { useState } from 'react';
import { useTranslation } from '../lib/i18n';
import type { EvaluatedImpact } from '../lib/impactMatching';

const CATEGORY_ICONS: Record<string, string> = {
  crop: '🌾',
  fruit: '🥭',
  fish: '🐟',
  wildlife: '🐅',
  extinction: '📜',
};

interface ImpactCardProps {
  evaluated: EvaluatedImpact;
  isFuture?: boolean;
}

export default function ImpactCard({ evaluated, isFuture = false }: ImpactCardProps) {
  const { lang, t } = useTranslation();
  const [showHowSure, setShowHowSure] = useState(false);
  const { entry, thresholdResult, timeContext, howSure } = evaluated;

  const categoryIcon = CATEGORY_ICONS[entry.category] || '🌱';
  const title = lang === 'bn' ? entry.name_bn : entry.name_en;
  const summary = lang === 'bn' ? entry.summary_bn : entry.summary_en;

  const evidenceLabel = lang === 'bn' ? howSure.evidenceTypeLabelBn : howSure.evidenceTypeLabelEn;
  const climateLinkLabel = lang === 'bn' ? howSure.climateLinkLabelBn : howSure.climateLinkLabelEn;
  const consensusLabel = lang === 'bn' ? howSure.consensusLabelBn : howSure.consensusLabelEn;
  const confidenceLabel = lang === 'bn' ? howSure.confidenceLabelBn : howSure.confidenceLabelEn;

  const directionClass =
    entry.direction === 'harm' ? 'dir-harm' : entry.direction === 'benefit' ? 'dir-benefit' : 'dir-mixed';
  const directionText =
    entry.direction === 'harm'
      ? lang === 'bn'
        ? 'ক্ষতিকর'
        : 'Harm'
      : entry.direction === 'benefit'
        ? lang === 'bn'
          ? 'ইতিবাচক'
          : 'Benefit'
        : lang === 'bn'
          ? 'মিশ্র'
          : 'Mixed';

  const confidenceDots = entry.confidence === 'high' ? '●●●' : entry.confidence === 'medium' ? '●●○' : '●○○';

  return (
    <article className={'impact-card card ' + directionClass}>
      {/* Top Header Row: Category Icon, Direction, Evidence & Time Mode */}
      <div className="impact-card-top">
        <div className="impact-card-title-group">
          <span className="impact-category-icon" aria-hidden="true">
            {categoryIcon}
          </span>
          <div>
            <h4 className="impact-card-title">{title}</h4>
            <div className="impact-card-meta-row">
              <span className={'impact-direction-badge ' + directionClass}>
                {entry.direction === 'harm' ? '▼ ' : entry.direction === 'benefit' ? '▲ ' : '◆ '}
                {directionText}
              </span>
              <span className="impact-evidence-badge">{evidenceLabel}</span>
              <span
                className={'impact-confidence-badge conf-' + entry.confidence}
                title={`${t('evidenceImpacts.confidenceLabel')}: ${confidenceLabel}`}
              >
                <span className="conf-dots">{confidenceDots}</span>
                <span className="conf-text">{entry.confidence.toUpperCase()}</span>
              </span>
              <span className="impact-time-badge">
                {isFuture
                  ? lang === 'bn'
                    ? timeContext.badgeBn
                    : timeContext.badgeEn
                  : lang === 'bn'
                    ? timeContext.badgeBn
                    : timeContext.badgeEn}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Narrative */}
      <p className="impact-card-summary">{summary}</p>

      {/* Future Phrasing Callout if in Future mode */}
      {isFuture && (
        <div className="impact-future-notice">
          <span className="future-clock-icon">⏳</span>
          <span>
            {lang === 'bn' ? `ভবিষ্যৎ রূপরেখা: ${timeContext.phraseBn}।` : `Future Outlook: ${timeContext.phraseEn}.`}
          </span>
        </div>
      )}

      {/* Cited Numbers Chip */}
      {entry.numbers && (
        <div className="impact-numbers-chip">
          <span className="numbers-val">
            {entry.numbers.value} {entry.numbers.unit}
          </span>
          <span className="numbers-sep">·</span>
          <span className="numbers-desc">{entry.numbers.what_it_measures}</span>
        </div>
      )}

      {/* Live Data Threshold Banner (Never shown without verified source) */}
      {thresholdResult && (
        <div className={'impact-threshold-banner ' + (thresholdResult.crossed ? 'is-crossed' : 'is-safe')}>
          <div className="threshold-banner-header">
            <span className="threshold-pulse-icon">⚡</span>
            <strong>{t('evidenceImpacts.liveDataThreshold')}</strong>
            <span className={'threshold-status-badge ' + (thresholdResult.isAbove ? 'above' : 'below')}>
              {thresholdResult.isAbove
                ? t('evidenceImpacts.aboveThresholdBadge')
                : t('evidenceImpacts.belowThresholdBadge')}
            </span>
          </div>
          <p className="threshold-message">{lang === 'bn' ? thresholdResult.messageBn : thresholdResult.messageEn}</p>
          <div className="threshold-condition-note">
            <small>
              <em>{thresholdResult.condition}</em>
            </small>
          </div>
        </div>
      )}

      {/* Footer: Source Link + "How sure are we?" Accordion / Tooltip */}
      <div className="impact-card-footer">
        <a
          href={entry.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="impact-source-link"
          title={`${entry.source.title} (${entry.source.publisher}, ${entry.source.year})`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <span>
            {t('evidenceImpacts.sourceLabel')}: {entry.source.publisher} ({entry.source.year})
          </span>
        </a>

        <button
          type="button"
          className={'how-sure-toggle-btn ' + (showHowSure ? 'open' : '')}
          onClick={() => setShowHowSure((prev) => !prev)}
          aria-expanded={showHowSure}
        >
          <span className="how-sure-icon">ℹ️</span>
          <span>{t('evidenceImpacts.howSureBtn')}</span>
          <span className="how-sure-arrow">{showHowSure ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* "How sure are we?" Expandable Details Drawer */}
      {showHowSure && (
        <div className="how-sure-drawer fade">
          <div className="how-sure-title-bar">
            <strong>{t('evidenceImpacts.howSureTitle')}</strong>
          </div>

          <div className="how-sure-grid">
            <div className="how-sure-item">
              <span className="how-sure-key">{t('evidenceImpacts.evidenceTypeLabel')}:</span>
              <strong className="how-sure-val">{evidenceLabel}</strong>
              <p className="how-sure-desc">
                {lang === 'bn' ? howSure.evidenceDescriptionBn : howSure.evidenceDescriptionEn}
              </p>
            </div>

            <div className="how-sure-item">
              <span className="how-sure-key">{t('evidenceImpacts.climateLinkLabel')}:</span>
              <strong className="how-sure-val">{climateLinkLabel}</strong>
              <p className="how-sure-desc">
                {lang === 'bn' ? howSure.climateLinkDescriptionBn : howSure.climateLinkDescriptionEn}
              </p>
            </div>

            <div className="how-sure-item">
              <span className="how-sure-key">{t('evidenceImpacts.consensusLabel')}:</span>
              <strong className={'how-sure-val ' + (entry.consensus === 'mixed' ? 'consensus-mixed' : '')}>
                {consensusLabel}
              </strong>
              <p className="how-sure-desc">
                {lang === 'bn' ? howSure.consensusDescriptionBn : howSure.consensusDescriptionEn}
              </p>
            </div>
          </div>

          {/* Mixed Consensus: MUST show both sides honestly */}
          {entry.consensus === 'mixed' && (howSure.mixedDivergenceEn || howSure.mixedDivergenceBn) && (
            <div className="mixed-consensus-callout">
              <strong>{t('evidenceImpacts.mixedSidesTitle')}</strong>
              <p>{lang === 'bn' ? howSure.mixedDivergenceBn : howSure.mixedDivergenceEn}</p>
            </div>
          )}

          <div className="how-sure-source-full">
            <div className="source-citation-line">
              <strong>{entry.source.title}</strong>
              <span>
                {' '}
                — {entry.source.publisher} ({entry.source.year})
              </span>
            </div>
            <a href={entry.source.url} target="_blank" rel="noopener noreferrer" className="source-direct-btn">
              {t('evidenceImpacts.openSource')} ↗
            </a>
          </div>
        </div>
      )}
    </article>
  );
}
