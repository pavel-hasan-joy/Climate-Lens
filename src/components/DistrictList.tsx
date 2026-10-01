import { METRIC } from '../lib/constants';
import { districts, valueAt } from '../lib/metrics';
import { rampColor, rgb } from '../lib/format';
import { useTranslation } from '../lib/i18n';
import type { DomainRange, MetricId, ScenarioId, TimeId } from '../lib/types';

interface DistrictListProps {
  divisionId?: string | null;
  districtId?: string | null;
  compareId?: string | null;
  metric: MetricId;
  time: TimeId;
  year?: number | null;
  domain: DomainRange;
  isAnomaly?: boolean;
  scenario?: ScenarioId;
  onSelect: (id: string) => void;
  onCompare?: (id: string | null) => void;
}

// Districts ranked by the selected metric (or anomaly) — the whole division, or the country's top 10
export default function DistrictList({
  divisionId,
  districtId,
  compareId = null,
  metric,
  time,
  year,
  domain,
  isAnomaly = false,
  scenario = 'statistical',
  onSelect,
  onCompare,
}: DistrictListProps) {
  const { getDistrictName, getDivisionName, toDigits, formatVal, formatAnom, lang } = useTranslation();
  const pool = districts.filter((d) => !divisionId || d.division === divisionId);
  const m = METRIC[metric];
  const ramp = isAnomaly ? m.divergingRamp : m.ramp;

  const rows = pool
    .map((d) => ({ ...d, v: valueAt(d.id, metric, time, year, isAnomaly, scenario) }))
    .sort((a, b) => (b.v ?? 0) - (a.v ?? 0))
    .slice(0, divisionId ? undefined : 10);

  const t = (v: number | null | undefined): number =>
    Math.max(0, Math.min(1, ((v ?? 0) - domain[0]) / (domain[1] - domain[0])));

  return (
    <div className="districts">
      {rows.map((d, i) => {
        const isSelected = d.id === districtId;
        const isCompared = d.id === compareId;

        return (
          <div
            key={d.id}
            className={'district-row-wrap' + (isSelected ? ' selected' : '') + (isCompared ? ' compared' : '')}
          >
            <button
              type="button"
              className={'district' + (isSelected ? ' on' : '') + (isCompared ? ' compared-on' : '')}
              style={{ animationDelay: `${i * 30}ms` }}
              onClick={() => onSelect(d.id)}
            >
              <span className="rank">{toDigits(i + 1)}</span>
              <span className="district-name">
                {getDistrictName(d.id)}
                {!divisionId && <small>{getDivisionName(d.division)}</small>}
              </span>
              <span className="district-bar">
                <i style={{ width: `${8 + t(d.v) * 92}%`, background: rgb(rampColor(ramp, t(d.v))) }} />
              </span>
              <span className="district-val">{isAnomaly ? formatAnom(metric, d.v) : formatVal(metric, d.v)}</span>
            </button>
            {districtId && !isSelected && (
              <button
                type="button"
                className={'compare-btn-badge' + (isCompared ? ' on' : '')}
                title={
                  isCompared
                    ? lang === 'bn'
                      ? 'তুলনা থেকে সরান'
                      : 'Remove from comparison'
                    : lang === 'bn'
                      ? `নির্বাচিত জেলার সাথে ${getDistrictName(d.id)} তুলনা করুন`
                      : `Compare ${d.name} with selected`
                }
                onClick={(e) => {
                  e.stopPropagation();
                  onCompare?.(isCompared ? null : d.id);
                }}
              >
                {isCompared ? (lang === 'bn' ? 'তুলনা' : 'VS') : lang === 'bn' ? '+তুলনা' : '+VS'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
