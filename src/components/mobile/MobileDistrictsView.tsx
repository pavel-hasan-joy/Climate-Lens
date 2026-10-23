import { useMemo, useState } from 'react';
import { METRIC } from '../../lib/constants';
import { districts, divisions, valueAt } from '../../lib/metrics';
import { rampColor, rgb } from '../../lib/format';
import { useTranslation } from '../../lib/i18n';
import type { DomainRange, MetricId, ScenarioId, TimeId } from '../../lib/types';

interface MobileDistrictsViewProps {
  divisionId?: string | null;
  districtId?: string | null;
  metric: MetricId;
  time: TimeId;
  year?: number | null;
  domain: DomainRange;
  isAnomaly?: boolean;
  scenario?: ScenarioId;
  onSelectDivision: (id: string | null) => void;
  onSelectDistrict: (id: string) => void;
  onViewOnMap: () => void;
  onViewDetails: () => void;
}

export default function MobileDistrictsView({
  divisionId,
  districtId,
  metric,
  time,
  year,
  domain,
  isAnomaly = false,
  scenario = 'statistical',
  onSelectDivision,
  onSelectDistrict,
  onViewOnMap,
  onViewDetails,
}: MobileDistrictsViewProps) {
  const { t, getDistrictName, getDivisionName, toDigits, formatVal, formatAnom, lang } = useTranslation();
  const [search, setSearch] = useState('');

  const m = METRIC[metric];
  const ramp = isAnomaly ? m.divergingRamp : m.ramp;

  const scale = (v: number | null | undefined): number =>
    Math.max(0, Math.min(1, ((v ?? 0) - domain[0]) / (domain[1] - domain[0])));

  // Calculate and sort all districts
  const allRanked = useMemo(() => {
    return districts
      .map((d) => ({
        ...d,
        v: valueAt(d.id, metric, time, year, isAnomaly, scenario),
        nameBn: getDistrictName(d.id),
        nameEn: d.name,
      }))
      .sort((a, b) => (b.v ?? 0) - (a.v ?? 0));
  }, [metric, time, year, isAnomaly, scenario, getDistrictName]);

  // Filter by division and search query
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRanked.filter((d) => {
      const matchDiv = !divisionId || d.division === divisionId;
      if (!matchDiv) return false;
      if (!q) return true;
      return (
        d.nameEn.toLowerCase().includes(q) ||
        d.nameBn.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        getDivisionName(d.division).toLowerCase().includes(q)
      );
    });
  }, [allRanked, divisionId, search, getDivisionName]);

  const selectedDist = districts.find((d) => d.id === districtId);

  return (
    <div className="mobile-districts-view" role="region" aria-label="District Explorer">
      {/* Search Header */}
      <div className="mobile-districts-search-wrap">
        <div className="mobile-search-input-box">
          <span className="search-icon">🔍</span>
          <input
            type="search"
            className="mobile-search-input"
            placeholder={t('mobileNav.searchDistricts')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>

        {/* Division Chips */}
        <div className="mobile-division-chips" role="group" aria-label="Filter by division">
          <button
            type="button"
            className={'division-chip' + (!divisionId ? ' active' : '')}
            onClick={() => onSelectDivision(null)}
          >
            {t('mobileNav.allDivisions')} ({toDigits(64)})
          </button>
          {divisions.map((div) => (
            <button
              key={div.id}
              type="button"
              className={'division-chip' + (divisionId === div.id ? ' active' : '')}
              onClick={() => onSelectDivision(div.id)}
            >
              {getDivisionName(div.id)}
            </button>
          ))}
        </div>
      </div>

      {/* Selected District Quick Banner */}
      {selectedDist && (
        <div className="mobile-selected-banner">
          <div className="selected-banner-info">
            <span className="selected-tag">{t('mobileNav.selectedDistrict')}</span>
            <h4>{getDistrictName(selectedDist.id)}</h4>
            <small>{getDivisionName(selectedDist.division)}</small>
          </div>
          <div className="selected-banner-actions">
            <button type="button" className="banner-action-btn map-btn" onClick={onViewOnMap}>
              🗺️ {lang === 'bn' ? 'ম্যাপ' : 'Map'}
            </button>
            <button type="button" className="banner-action-btn details-btn" onClick={onViewDetails}>
              📊 {lang === 'bn' ? 'বিশ্লেষণ' : 'Details'}
            </button>
          </div>
        </div>
      )}

      {/* Districts List */}
      <div className="mobile-districts-list" role="list">
        {filtered.length === 0 ? (
          <div className="no-districts-match">
            <p>{lang === 'bn' ? 'কোনো জেলা পাওয়া যায়নি' : 'No matching districts found'}</p>
          </div>
        ) : (
          filtered.map((d, index) => {
            const isSelected = d.id === districtId;
            const distLabel = getDistrictName(d.id);
            const valFormatted = isAnomaly ? formatAnom(metric, d.v) : formatVal(metric, d.v);
            const barPct = 8 + scale(d.v) * 92;

            return (
              <div
                key={d.id}
                role="listitem"
                className={'mobile-district-card' + (isSelected ? ' selected' : '')}
                onClick={() => onSelectDistrict(d.id)}
              >
                <div className="district-card-left">
                  <span className="district-rank-badge">{toDigits(index + 1)}</span>
                  <div className="district-card-names">
                    <span className="district-main-name">{distLabel}</span>
                    <span className="district-sub-name">{getDivisionName(d.division)}</span>
                  </div>
                </div>

                <div className="district-card-right">
                  <span className="district-card-val">{valFormatted}</span>
                  <div className="district-bar-wrap">
                    <div
                      className="district-bar-fill"
                      style={{
                        width: `${barPct}%`,
                        background: rgb(rampColor(ramp, scale(d.v))),
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
