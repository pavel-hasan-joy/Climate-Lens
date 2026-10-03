import { useState, useMemo } from 'react';
import gbifData from '../data/analysis/gbif-occurrences.json';
import { useTranslation } from '../lib/i18n';

interface SpeciesRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GbifRecord {
  gbifId: number;
  year: number | null;
  month: number | null;
  lat: number | null;
  lon: number | null;
  district: string;
  basisOfRecord: string;
  datasetKey: string;
}

interface GbifSpecies {
  id: string;
  commonName: string;
  bn: string;
  scientificName: string;
  gbifUsageKey: number;
  totalRecords: number;
  byYear: Record<string, number>;
  byDistrict: Record<string, number>;
  earliestRecord: number;
  latestRecord: number;
  sampleRecords: GbifRecord[];
}

export default function SpeciesRecordsModal({ isOpen, onClose }: SpeciesRecordsModalProps) {
  const { lang, toDigits, getDistrictName } = useTranslation();
  const speciesList: GbifSpecies[] = Object.values(gbifData.species as Record<string, GbifSpecies>);
  const [selectedKey, setSelectedKey] = useState<string>('bengal_tiger');

  const selected = useMemo(() => {
    return speciesList.find((s) => s.id === selectedKey) || speciesList[0];
  }, [speciesList, selectedKey]);

  if (!isOpen || !selected) return null;

  // Yearly record bar chart layout (safely sorted)
  const yearEntries = selected.byYear
    ? Object.entries(selected.byYear).sort((a, b) => Number(a[0]) - Number(b[0]))
    : [];
  const maxYearCount = yearEntries.length > 0 ? Math.max(...yearEntries.map((e) => e[1]), 1) : 1;
  const sampleRecords = selected.sampleRecords || [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content species-records-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="species-modal-title"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="species-modal-badge">GBIF Biological Records</span>
            <h2 id="species-modal-title" className="modal-title">
              {lang === 'bn' ? 'প্রজাতির উপস্থিতি রেকর্ড ও মানচিত্র' : 'Species Occurrence Records (GBIF)'}
            </h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Species Selector Chips */}
        <div className="species-tabs-bar">
          {speciesList.map((sp) => {
            const isSelected = sp.id === selected.id;
            return (
              <button
                key={sp.id}
                type="button"
                className={`species-tab-btn ${isSelected ? 'on' : ''}`}
                onClick={() => setSelectedKey(sp.id)}
              >
                <span className="species-btn-icon">
                  {sp.id === 'bengal_tiger'
                    ? '🐅'
                    : sp.id.includes('dolphin')
                      ? '🐬'
                      : sp.id === 'hilsa'
                        ? '🐟'
                        : sp.id === 'asian_elephant'
                          ? '🐘'
                          : '🐱'}
                </span>
                <span className="species-btn-name">{lang === 'bn' ? sp.bn : sp.commonName}</span>
                <span className="species-btn-count">({toDigits(sp.totalRecords ?? 0)})</span>
              </button>
            );
          })}
        </div>

        {/* Selected Species Overview Card */}
        <div className="species-detail-hero">
          <div className="species-hero-left">
            <h3 className="species-hero-common">{lang === 'bn' ? selected.bn : selected.commonName}</h3>
            <span className="species-hero-sci">
              <em>{selected.scientificName}</em>
            </span>
            <span className="species-hero-gbif-key">GBIF Key: {selected.gbifUsageKey}</span>
          </div>
          <div className="species-hero-stats">
            <div className="species-hero-stat">
              <span className="hero-stat-label">{lang === 'bn' ? 'মোট রেকর্ড:' : 'Total Records:'}</span>
              <strong className="hero-stat-val">{toDigits(selected.totalRecords ?? 0)}</strong>
            </div>
            <div className="species-hero-stat">
              <span className="hero-stat-label">{lang === 'bn' ? 'রেকর্ডকাল:' : 'Time Range:'}</span>
              <strong className="hero-stat-val">
                {selected.earliestRecord && selected.latestRecord
                  ? `${toDigits(selected.earliestRecord)}–${toDigits(selected.latestRecord)}`
                  : '—'}
              </strong>
            </div>
          </div>
        </div>

        {/* Observer Effort Notice Warning (Strict requirement) */}
        <div className="observer-effort-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div className="observer-banner-text">
            <strong>
              {lang === 'bn' ? 'পর্যবেক্ষক প্রচেষ্টা সতর্কতা (Observer Effort Notice):' : 'Observer Effort Disclosure:'}
            </strong>{' '}
            {lang === 'bn'
              ? 'এই রেকর্ডগুলো দেখায় পর্যবেক্ষকেরা কোথায় এই প্রজাতিটিকে দেখেছেন, মোট কতটি প্রাণী বেঁচে রয়েছে তা নয়। রেকর্ডের সংখ্যা মানুষের পর্যবেক্ষণ তৎপরতা প্রকাশ করে, প্রাকৃতিক জনসংখ্যার সঠিক সংখ্যা নয়।'
              : 'Records show where and when observers saw this species, not how many exist. Occurrence counts reflect observer effort and reporting activity, not biological abundance or true population trends.'}
          </div>
        </div>

        {/* Content Split: Yearly Bar Chart + Location Records List */}
        <div className="species-body-grid">
          {/* Yearly Record Count Bar Chart */}
          <div className="species-chart-box">
            <h4 className="species-box-title">
              {lang === 'bn' ? 'বছরওয়ারী রেকর্ড সংখ্যা' : 'Annual Occurrence Records (GBIF)'}
            </h4>
            <div className="species-bars-container">
              {yearEntries.map(([yr, count]) => {
                const pct = Math.round((count / maxYearCount) * 100);
                return (
                  <div
                    key={yr}
                    className="species-bar-col"
                    title={`${yr}: ${count} ${lang === 'bn' ? 'টি রেকর্ড' : 'records'}`}
                  >
                    <span className="species-bar-count">{toDigits(count)}</span>
                    <div className="species-bar-track">
                      <div className="species-bar-fill" style={{ height: `${Math.max(8, pct)}%` }} />
                    </div>
                    <span className="species-bar-year">{toDigits(yr)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Location Records List */}
          <div className="species-records-box">
            <h4 className="species-box-title">
              {lang === 'bn' ? 'নমুনা অবস্থান ও স্থানাঙ্ক' : 'Sample Observation Locations'}
            </h4>
            <div className="species-records-scroll">
              {sampleRecords.length > 0 ? (
                sampleRecords.map((rec) => {
                  const coordsText =
                    rec.lat != null && rec.lon != null
                      ? `${rec.lat.toFixed(4)}°N, ${rec.lon.toFixed(4)}°E`
                      : lang === 'bn'
                        ? 'স্থানাঙ্ক অপ্রাপ্য (সংরক্ষিত নমুনা)'
                        : 'Coords unrecorded (Specimen)';
                  const yearText = rec.year ? toDigits(rec.year) : '—';
                  const districtText =
                    rec.district && rec.district !== 'unknown'
                      ? getDistrictName(rec.district) || rec.district.replace(/_/g, ' ')
                      : lang === 'bn'
                        ? 'অনির্দিষ্ট অঞ্চল'
                        : 'Unspecified locality';
                  const basisText = (rec.basisOfRecord || 'Observation').replace(/_/g, ' ').toLowerCase();

                  return (
                    <div key={rec.gbifId} className="species-record-item">
                      <div className="record-item-top">
                        <strong className="record-dist">📍 {districtText}</strong>
                        <span className="record-year">{yearText}</span>
                      </div>
                      <div className="record-item-meta">
                        <span className="record-coords">{coordsText}</span>
                        <span className="record-basis">{basisText}</span>
                      </div>
                      <a
                        href={`https://www.gbif.org/occurrence/${rec.gbifId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="record-gbif-link"
                      >
                        GBIF #{rec.gbifId} &rarr;
                      </a>
                    </div>
                  );
                })
              ) : (
                <p className="species-empty-note">
                  {lang === 'bn' ? 'কোনো স্থানাঙ্ক রেকর্ড সংরক্ষিত নেই।' : 'No location records available.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer & Direct Source Link */}
        <div
          className="modal-footer"
          style={{
            borderTop: '1px solid var(--line)',
            marginTop: '16px',
            paddingTop: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
            Data source: Global Biodiversity Information Facility (GBIF Occurrence API v1) · License: CC-BY 4.0
          </span>
          <a
            href="https://www.gbif.org"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none' }}
          >
            GBIF.org Secretariat &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
