import { useMemo, useState } from 'react';
import { useTranslation } from '../lib/i18n';
import { METRIC } from '../lib/constants';
import { getImpactsFor } from '../lib/impactMatching';
import ImpactCard from './ImpactCard';
import type { ImpactCategory, MetricId, ScenarioId, TimeId } from '../lib/types';

interface ImpactPanelProps {
  districtId?: string | null;
  divisionId?: string | null;
  metric: MetricId;
  time: TimeId;
  year?: number | null;
  scenario?: ScenarioId;
  onOpenWildlife?: () => void;
}

export default function ImpactPanel({
  districtId,
  divisionId,
  metric,
  time,
  year,
  scenario = 'statistical',
  onOpenWildlife,
}: ImpactPanelProps) {
  const { lang, t, getDistrictName, getDivisionName } = useTranslation();
  const [categoryFilter, setCategoryFilter] = useState<'all' | ImpactCategory>('all');
  const [metricScope, setMetricScope] = useState<'current' | 'all'>('current');

  const regionName = districtId
    ? getDistrictName(districtId)
    : divisionId
      ? getDivisionName(divisionId)
      : t('app.country');

  const isFuture = time === 'future';

  // Evaluate impacts dynamically for the current region and filters
  const evaluatedImpacts = useMemo(() => {
    return getImpactsFor({
      districtId,
      divisionId,
      metric,
      time,
      year,
      scenario,
      categoryFilter,
      metricScope,
    });
  }, [districtId, divisionId, metric, time, year, scenario, categoryFilter, metricScope]);

  // Counts for filter pills
  const countsByCategory = useMemo(() => {
    const allForRegion = getImpactsFor({
      districtId,
      divisionId,
      metric,
      time,
      year,
      scenario,
      categoryFilter: 'all',
      metricScope,
    });

    const counts: Record<string, number> = {
      all: allForRegion.length,
      crop: 0,
      fruit: 0,
      fish: 0,
      wildlife: 0,
      extinction: 0,
    };

    allForRegion.forEach((item) => {
      counts[item.entry.category] = (counts[item.entry.category] || 0) + 1;
    });

    return counts;
  }, [districtId, divisionId, metric, time, year, scenario, metricScope]);

  const currentMetricName = METRIC[metric]?.label || metric;

  return (
    <div className="impacts-panel fade">
      {/* Context Disclaimer Notice (Mandatory Rule) */}
      <div className="impact-disclaimer-banner">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <div className="disclaimer-text">
          <strong>{lang === 'bn' ? 'প্রাসঙ্গিক বৈজ্ঞানিক প্রেক্ষাপট' : 'Scientific Context'}</strong>
          <span> — {t('evidenceImpacts.disclaimer')}</span>
        </div>
      </div>

      {/* Header and Filter Controls */}
      <div className="impacts-control-card card">
        <div className="impacts-header-group">
          <div className="impacts-title-row">
            <span className="impacts-main-icon" aria-hidden="true">
              🔬
            </span>
            <div>
              <h3 className="impacts-title">{t('evidenceImpacts.sectionTitle')}</h3>
              <p className="impacts-sub">{t('evidenceImpacts.sectionSubtitle', { region: regionName })}</p>
            </div>
          </div>
          <span className="impacts-count-badge">
            {evaluatedImpacts.length} {lang === 'bn' ? 'টি প্রমাণ' : 'records'}
          </span>
        </div>

        {/* Metric Scope Switch */}
        <div className="metric-scope-row">
          <span className="scope-label">{lang === 'bn' ? 'সূচক ক্ষেত্র:' : 'Metric Scope:'}</span>
          <div className="scope-button-group">
            <button
              type="button"
              className={'scope-btn' + (metricScope === 'current' ? ' on' : '')}
              onClick={() => setMetricScope('current')}
            >
              {t('evidenceImpacts.scopeCurrentMetric', { metric: currentMetricName })}
            </button>
            <button
              type="button"
              className={'scope-btn' + (metricScope === 'all' ? ' on' : '')}
              onClick={() => setMetricScope('all')}
            >
              {t('evidenceImpacts.scopeAllMetrics')}
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="impact-category-filter-bar" role="tablist" aria-label="Impact categories">
          <button
            type="button"
            className={'cat-filter-btn' + (categoryFilter === 'all' ? ' on' : '')}
            onClick={() => setCategoryFilter('all')}
          >
            <span>{t('evidenceImpacts.filterAll')}</span>
            <span className="cat-count">({countsByCategory.all || 0})</span>
          </button>
          <button
            type="button"
            className={'cat-filter-btn' + (categoryFilter === 'crop' ? ' on' : '')}
            onClick={() => setCategoryFilter('crop')}
          >
            <span>{t('evidenceImpacts.filterCrop')}</span>
            <span className="cat-count">({countsByCategory.crop || 0})</span>
          </button>
          <button
            type="button"
            className={'cat-filter-btn' + (categoryFilter === 'fruit' ? ' on' : '')}
            onClick={() => setCategoryFilter('fruit')}
          >
            <span>{t('evidenceImpacts.filterFruit')}</span>
            <span className="cat-count">({countsByCategory.fruit || 0})</span>
          </button>
          <button
            type="button"
            className={'cat-filter-btn' + (categoryFilter === 'fish' ? ' on' : '')}
            onClick={() => setCategoryFilter('fish')}
          >
            <span>{t('evidenceImpacts.filterFish')}</span>
            <span className="cat-count">({countsByCategory.fish || 0})</span>
          </button>
          <button
            type="button"
            className={'cat-filter-btn' + (categoryFilter === 'wildlife' ? ' on' : '')}
            onClick={() => setCategoryFilter('wildlife')}
          >
            <span>{t('evidenceImpacts.filterWildlife')}</span>
            <span className="cat-count">({countsByCategory.wildlife || 0})</span>
          </button>
          <button
            type="button"
            className={'cat-filter-btn' + (categoryFilter === 'extinction' ? ' on' : '')}
            onClick={() => setCategoryFilter('extinction')}
          >
            <span>{t('evidenceImpacts.filterExtinction')}</span>
            <span className="cat-count">({countsByCategory.extinction || 0})</span>
          </button>
        </div>
      </div>

      {/* Direct Gateway to Wildlife & Extinction Gallery */}
      {onOpenWildlife &&
        (categoryFilter === 'all' || categoryFilter === 'wildlife' || categoryFilter === 'extinction') && (
          <div className="impacts-wildlife-cta card">
            <div className="wildlife-cta-content">
              <span className="wildlife-cta-icon" aria-hidden="true">
                🐅
              </span>
              <div className="wildlife-cta-text">
                <strong>{lang === 'bn' ? 'বন্যপ্রাণী ও বিলুপ্তি প্রদর্শনী' : 'Wildlife & Extinction Gallery'}</strong>
                <p>
                  {lang === 'bn'
                    ? 'রেড লিস্ট ২০১৫ অনুযায়ী ৩১টি বিলুপ্ত প্রজাতি, ৬টি বর্তমান সংকটাপন্ন প্রাণী ও ২৭৮টি তথ্যহীন প্রজাতির বিশদ বিশ্লেষণ।'
                    : 'Official Red List (2015): 31 regionally extinct species, 6 species at risk today, and 278 data gaps.'}
                </p>
              </div>
            </div>
            <button type="button" className="wildlife-cta-btn" onClick={onOpenWildlife}>
              {lang === 'bn' ? 'প্রদর্শনী দেখুন →' : 'Explore Gallery →'}
            </button>
          </div>
        )}

      {/* Cards List or Empty State */}
      <div className="impacts-card-list">
        {evaluatedImpacts.length > 0 ? (
          evaluatedImpacts.map((item) => <ImpactCard key={item.entry.id} evaluated={item} isFuture={isFuture} />)
        ) : (
          <div className="impact-empty-state card">
            <span className="empty-icon">🍃</span>
            <p>{t('evidenceImpacts.emptyFilterNotice')}</p>
            {metricScope === 'current' && (
              <button type="button" className="scope-reset-btn" onClick={() => setMetricScope('all')}>
                {t('evidenceImpacts.scopeAllMetrics')} ↗
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
