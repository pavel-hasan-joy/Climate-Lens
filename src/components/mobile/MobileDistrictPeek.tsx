import { districts, valueAt } from '../../lib/metrics';
import { useTranslation } from '../../lib/i18n';
import type { MetricId, ScenarioId, TimeId } from '../../lib/types';

interface MobileDistrictPeekProps {
  districtId: string;
  metric: MetricId;
  time: TimeId;
  year?: number | null;
  isAnomaly?: boolean;
  scenario?: ScenarioId;
  onOpenDetails: () => void;
  onClose: () => void;
}

export default function MobileDistrictPeek({
  districtId,
  metric,
  time,
  year,
  isAnomaly = false,
  scenario = 'statistical',
  onOpenDetails,
  onClose,
}: MobileDistrictPeekProps) {
  const { t, getDistrictName, getDivisionName, formatVal, formatAnom } = useTranslation();
  const district = districts.find((d) => d.id === districtId);
  if (!district) return null;

  const value = valueAt(districtId, metric, time, year, isAnomaly, scenario);
  const formattedValue = isAnomaly ? formatAnom(metric, value) : formatVal(metric, value);

  return (
    <div className="mobile-district-peek" role="region" aria-label="District Quick Summary">
      <div className="peek-content">
        <div className="peek-main">
          <div className="peek-header">
            <span className="peek-badge">{getDivisionName(district.division)}</span>
            <button type="button" className="peek-close-btn" onClick={onClose} aria-label={t('mobileNav.close')}>
              ✕
            </button>
          </div>
          <h3 className="peek-title">{getDistrictName(district.id)}</h3>
        </div>

        <div className="peek-stats-row">
          <div className="peek-stat">
            <span className="peek-stat-label">{t(`metrics.${metric}.label`)}</span>
            <span className="peek-stat-value">{formattedValue}</span>
          </div>
          <button type="button" className="peek-action-btn" onClick={onOpenDetails}>
            <span>{t('mobileNav.peekDetails')}</span>
            <span className="peek-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
