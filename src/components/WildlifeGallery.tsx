import { useMemo, useState } from 'react';
import { useTranslation } from '../lib/i18n';
import { wildlife } from '../lib/metrics';
import type { LostSpecies } from '../lib/types';

interface WildlifeGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'lost' | 'atRisk' | 'timeline';
  onOpenSpeciesRecords?: () => void;
}

const GROUP_ICONS: Record<string, string> = {
  mammal: '🦏',
  bird: '🦅',
  reptile: '🐊',
};

export default function WildlifeGallery({
  isOpen,
  onClose,
  initialTab = 'lost',
  onOpenSpeciesRecords,
}: WildlifeGalleryProps) {
  const { lang, t, toDigits } = useTranslation();
  const [activeTab, setActiveTab] = useState<'lost' | 'atRisk' | 'timeline'>(initialTab);
  const [groupFilter, setGroupFilter] = useState<'all' | 'mammal' | 'bird' | 'reptile'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter lost species by group and search query
  const filteredLostSpecies = useMemo(() => {
    return wildlife.lost_species.filter((sp: LostSpecies) => {
      if (groupFilter !== 'all' && sp.group !== groupFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesEn = sp.name_en.toLowerCase().includes(q);
        const matchesBn = sp.name_bn.toLowerCase().includes(q);
        const matchesSci = sp.scientific_name.toLowerCase().includes(q);
        return matchesEn || matchesBn || matchesSci;
      }
      return true;
    });
  }, [groupFilter, searchQuery]);

  // Group counts
  const groupCounts = useMemo(() => {
    const counts = { all: wildlife.lost_species.length, mammal: 0, bird: 0, reptile: 0 };
    wildlife.lost_species.forEach((sp) => {
      counts[sp.group] += 1;
    });
    return counts;
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop fade"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wildlife-gallery-title"
      onClick={onClose}
    >
      <div className="wildlife-modal-card modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <header className="wildlife-modal-head">
          <div className="wildlife-modal-title-group">
            <span className="wildlife-hero-icon" aria-hidden="true">
              🐅
            </span>
            <div>
              <h2 id="wildlife-gallery-title" className="wildlife-modal-title">
                {t('wildlifeGallery.title')}
              </h2>
              <p className="wildlife-modal-sub">{t('wildlifeGallery.subtitle')}</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label={t('wildlifeGallery.close')}>
            ✕
          </button>
        </header>

        {/* Top View Selector Tabs */}
        <nav className="wildlife-tabs-nav" role="tablist">
          <button
            type="button"
            className={'wildlife-tab-btn' + (activeTab === 'lost' ? ' on' : '')}
            onClick={() => setActiveTab('lost')}
            role="tab"
            aria-selected={activeTab === 'lost'}
          >
            <span className="tab-icon">📜</span>
            <span>{t('wildlifeGallery.tabLost')}</span>
          </button>
          <button
            type="button"
            className={'wildlife-tab-btn' + (activeTab === 'atRisk' ? ' on' : '')}
            onClick={() => setActiveTab('atRisk')}
            role="tab"
            aria-selected={activeTab === 'atRisk'}
          >
            <span className="tab-icon">⚠️</span>
            <span>{t('wildlifeGallery.tabAtRisk')}</span>
          </button>
          <button
            type="button"
            className={'wildlife-tab-btn' + (activeTab === 'timeline' ? ' on' : '')}
            onClick={() => setActiveTab('timeline')}
            role="tab"
            aria-selected={activeTab === 'timeline'}
          >
            <span className="tab-icon">⏳</span>
            <span>{t('wildlifeGallery.tabTimeline')}</span>
          </button>
          {onOpenSpeciesRecords && (
            <button
              type="button"
              className="wildlife-tab-btn"
              onClick={() => {
                onClose();
                onOpenSpeciesRecords();
              }}
              title="View georeferenced GBIF observation records"
            >
              <span className="tab-icon">🐾</span>
              <span>{lang === 'bn' ? 'জিবিআইএফ রেকর্ড' : 'GBIF Records'}</span>
            </button>
          )}
        </nav>

        {/* Modal Scrollable Body */}
        <div className="wildlife-modal-body">
          {/* TAB 1: LOST SPECIES (31 Regionally Extinct) */}
          {activeTab === 'lost' && (
            <div className="wildlife-tab-content fade">
              {/* Mandatory Honest Causality Banner */}
              <div className="wildlife-honest-banner">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div className="banner-text">
                  <strong>{t('wildlifeGallery.lostHonestNotePrefix')}</strong>{' '}
                  <span>{t('wildlifeGallery.lostHonestNote')}</span>
                </div>
              </div>

              {/* Headline & Filter Controls */}
              <div className="lost-controls-bar">
                <div className="lost-headline-group">
                  <h3 className="lost-headline">{t('wildlifeGallery.lostHeadline')}</h3>
                  <span className="lost-badge">RE · Regionally Extinct</span>
                </div>

                <div className="lost-search-and-filters">
                  <div className="species-search-box">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      className="species-search-input"
                      placeholder={t('wildlifeGallery.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button type="button" className="clear-search-btn" onClick={() => setSearchQuery('')}>
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="group-filter-pills" role="tablist">
                    <button
                      type="button"
                      className={'group-pill' + (groupFilter === 'all' ? ' on' : '')}
                      onClick={() => setGroupFilter('all')}
                    >
                      {t('wildlifeGallery.groupAll', { count: toDigits(groupCounts.all) })}
                    </button>
                    <button
                      type="button"
                      className={'group-pill' + (groupFilter === 'mammal' ? ' on' : '')}
                      onClick={() => setGroupFilter('mammal')}
                    >
                      {t('wildlifeGallery.groupMammals', { count: toDigits(groupCounts.mammal) })}
                    </button>
                    <button
                      type="button"
                      className={'group-pill' + (groupFilter === 'bird' ? ' on' : '')}
                      onClick={() => setGroupFilter('bird')}
                    >
                      {t('wildlifeGallery.groupBirds', { count: toDigits(groupCounts.bird) })}
                    </button>
                    <button
                      type="button"
                      className={'group-pill' + (groupFilter === 'reptile' ? ' on' : '')}
                      onClick={() => setGroupFilter('reptile')}
                    >
                      {t('wildlifeGallery.groupReptiles', { count: toDigits(groupCounts.reptile) })}
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid of 31 Extinct Species Cards */}
              <div className="lost-species-grid">
                {filteredLostSpecies.length > 0 ? (
                  filteredLostSpecies.map((sp) => (
                    <article key={sp.id} className="lost-species-card card">
                      <div className="species-card-head">
                        <span className="species-group-icon" aria-hidden="true">
                          {GROUP_ICONS[sp.group] || '🐾'}
                        </span>
                        <div className="species-name-wrap">
                          <h4 className="species-name-primary">{lang === 'bn' ? sp.name_bn : sp.name_en}</h4>
                          <span className="species-name-secondary">{lang === 'bn' ? sp.name_en : sp.name_bn}</span>
                          <span className="species-scientific-name">{sp.scientific_name}</span>
                        </div>
                        <span className="re-status-pill">RE</span>
                      </div>

                      <div className="species-card-body">
                        {/* Last Recorded Timeframe */}
                        <div className="species-info-row">
                          <span className="info-key">{t('wildlifeGallery.lastRecordedLabel')}:</span>
                          <span className="info-val">{sp.last_recorded}</span>
                        </div>

                        {/* Main Drivers */}
                        <div className="species-drivers-box">
                          <strong className="drivers-title">{t('wildlifeGallery.driversLabel')}:</strong>
                          <p className="drivers-text">{lang === 'bn' ? sp.main_drivers_bn : sp.main_drivers_en}</p>
                        </div>

                        {/* Rediscovered / Relict Note if verified */}
                        {sp.rediscovered && (
                          <div className="rediscovered-callout">
                            <span className="rediscovered-badge">🌿 {t('wildlifeGallery.rediscoveredBadge')}</span>
                            <p className="rediscovered-text">
                              {lang === 'bn' ? sp.rediscovered_note_bn : sp.rediscovered_note_en}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="species-card-foot">
                        <span className="climate-not-est-tag">{t('wildlifeGallery.climateLinkNotEstablished')}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="no-species-found">
                    <p>
                      {lang === 'bn' ? 'কোনো প্রজাতি খুঁজে পাওয়া যায়নি।' : 'No species found matching your search.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AT RISK NOW (Current Threatened Species) */}
          {activeTab === 'atRisk' && (
            <div className="wildlife-tab-content fade">
              <div className="at-risk-header">
                <h3 className="at-risk-headline">{t('wildlifeGallery.atRiskHeadline')}</h3>
                <p className="at-risk-sub">
                  {lang === 'bn'
                    ? 'সুন্দরবনের বাঘ থেকে নদী অববাহিকার শুশুক—জলবায়ু চরমভাবাপন্নতা ও মানবসৃষ্ট চাপের মুখে থাকা প্রজাতিসমূহ'
                    : 'From Sundarbans tigers to river dolphins—species navigating habitat pressures and climate stressors'}
                </p>
              </div>

              <div className="at-risk-cards-list">
                {wildlife.at_risk_species.map((sp) => (
                  <article key={sp.id} className="at-risk-card card">
                    <div className="at-risk-head">
                      <div className="at-risk-title-group">
                        <span className="at-risk-icon">
                          {sp.id.includes('tiger')
                            ? '🐅'
                            : sp.id.includes('dolphin')
                              ? '🐬'
                              : sp.id.includes('hilsa')
                                ? '🐟'
                                : sp.id.includes('elephant')
                                  ? '🐘'
                                  : '🐆'}
                        </span>
                        <div>
                          <h4 className="at-risk-name">
                            {lang === 'bn' ? sp.name_bn : sp.name_en}
                            <span className="at-risk-alt-name"> · {lang === 'bn' ? sp.name_en : sp.name_bn}</span>
                          </h4>
                          <span className="at-risk-sci">{sp.scientific_name}</span>
                        </div>
                      </div>

                      <div className="status-badge-group">
                        <span className="status-pill national" title="IUCN National Status">
                          BD: {sp.national_status}
                        </span>
                        <span className="status-pill global" title="IUCN Global Status">
                          Global: {sp.global_status}
                        </span>
                      </div>
                    </div>

                    <div className="at-risk-meta-grid">
                      <div className="meta-item">
                        <span className="meta-key">{t('wildlifeGallery.populationLabel')}:</span>
                        <strong className="meta-val">{sp.population_estimate}</strong>
                      </div>
                      <div className="meta-item">
                        <span className="meta-key">{t('wildlifeGallery.habitatLabel')}:</span>
                        <strong className="meta-val">{sp.habitat}</strong>
                      </div>
                    </div>

                    {/* Primary Threats */}
                    <div className="at-risk-threats">
                      <strong className="section-mini-title">{t('wildlifeGallery.threatsLabel')}:</strong>
                      <p>{lang === 'bn' ? sp.main_threats_bn : sp.main_threats_en}</p>
                    </div>

                    {/* Separate Climate Link Line */}
                    <div className="at-risk-climate-link">
                      <div className="climate-link-row">
                        <span className="climate-link-pill">
                          ⚡ {t('wildlifeGallery.climateLinkLabel')}: Contributing Driver (সহায়ক নিয়ামক)
                        </span>
                      </div>
                      <p className="climate-link-desc">
                        {lang === 'bn' ? sp.climate_impact_detail_bn : sp.climate_impact_detail_en}
                      </p>
                    </div>

                    {/* Model Projection Callout (Tiger) */}
                    {sp.model_projection && (
                      <div className="model-projection-callout">
                        <div className="model-callout-head">
                          <span className="model-tag">📊 {t('wildlifeGallery.modelProjectionTag')}</span>
                          <span className="model-citation">
                            {sp.model_projection.source} ({sp.model_projection.year})
                          </span>
                        </div>
                        <p className="model-summary">
                          {lang === 'bn' ? sp.model_projection.summary_bn : sp.model_projection.summary_en}
                        </p>
                        <small className="model-note">*{t('wildlifeGallery.modelProjectionNotice')}</small>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TIMELINE & UNKNOWNS (2000 vs 2015 Red List & 278 DD Species) */}
          {activeTab === 'timeline' && (
            <div className="wildlife-tab-content fade">
              {/* Timeline Strip */}
              <section className="timeline-strip-section card">
                <h3 className="timeline-title">{t('wildlifeGallery.timelineTitle')}</h3>

                <div className="timeline-steps-wrap">
                  <div className="timeline-step">
                    <div className="timeline-step-header">
                      <span className="timeline-year">2000</span>
                      <span className="timeline-stat-pill">13 RE</span>
                    </div>
                    <h4 className="timeline-step-name">{t('wildlifeGallery.timeline2000Title')}</h4>
                    <p className="timeline-step-body">{t('wildlifeGallery.timeline2000Body')}</p>
                  </div>

                  <div className="timeline-arrow-connector">
                    <span className="arrow-line" />
                    <span className="arrow-text">+18 species documented</span>
                    <span className="arrow-line" />
                  </div>

                  <div className="timeline-step current">
                    <div className="timeline-step-header">
                      <span className="timeline-year highlight">2015</span>
                      <span className="timeline-stat-pill highlight">31 RE · 390 Threatened</span>
                    </div>
                    <h4 className="timeline-step-name">{t('wildlifeGallery.timeline2015Title')}</h4>
                    <p className="timeline-step-body">{t('wildlifeGallery.timeline2015Body')}</p>
                  </div>
                </div>

                {/* Breakdown of 390 Threatened Species */}
                <div className="threatened-breakdown-bar">
                  <div className="breakdown-header">
                    <strong>{t('wildlifeGallery.threatenedStat')}</strong>
                    <span>(390 / 1,619)</span>
                  </div>
                  <div className="breakdown-grid">
                    <div className="breakdown-cell cr">
                      <span className="badge-cr">CR</span>
                      <strong>56</strong>
                      <span>{t('wildlifeGallery.criticallyEndangeredStat')}</span>
                    </div>
                    <div className="breakdown-cell en">
                      <span className="badge-en">EN</span>
                      <strong>181</strong>
                      <span>{t('wildlifeGallery.endangeredStat')}</span>
                    </div>
                    <div className="breakdown-cell vu">
                      <span className="badge-vu">VU</span>
                      <strong>153</strong>
                      <span>{t('wildlifeGallery.vulnerableStat')}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* "What we don't know" Section: 278 Data-Deficient Species */}
              <section className="data-deficient-section card">
                <div className="dd-header">
                  <span className="dd-icon">❓</span>
                  <div>
                    <h3 className="dd-title">{t('wildlifeGallery.unknownTitle')}</h3>
                    <p className="dd-subtitle">{t('wildlifeGallery.unknownSubtitle')}</p>
                  </div>
                </div>

                <div className="dd-body">
                  <div className="dd-stat-circle">
                    <span className="dd-number">{toDigits(278)}</span>
                    <span className="dd-pct">17.2%</span>
                    <span className="dd-label">Data Deficient</span>
                  </div>
                  <div className="dd-text-content">
                    <p>{t('wildlifeGallery.unknownBody')}</p>
                    <div className="dd-notes-box">
                      <strong>{lang === 'bn' ? 'গবেষণার বর্তমান বাস্তবতা:' : 'Current Research Reality:'}</strong>
                      <ul>
                        <li>
                          {lang === 'bn'
                            ? '২০১৫ সালের পর জাতীয় পর্যায়ে আর কোনো পূর্ণাঙ্গ লাল তালিকা প্রকাশিত হয়নি; ২০১৫-এর উপাত্তই সরকারি আইন ও বন নীতিমালার ভিত্তি।'
                            : 'No full national Red List has been completed since 2015; the 2015 assessment remains the official regulatory standard.'}
                        </li>
                        <li>
                          {lang === 'bn'
                            ? 'বন অধিদপ্তরের সুফল (SUFAL) প্রকল্পের আওতায় নিয়মিত জীববৈচিত্র্য উপাত্ত হালনাগাদ ও জরিপ কার্যক্রম চলমান রয়েছে।'
                            : 'The Bangladesh Forest Department conducts ongoing field camera-trapping and monitoring under the SUFAL project.'}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Modal Footer with Official Citation */}
        <footer className="wildlife-modal-foot">
          <span className="official-citation">{t('wildlifeGallery.officialCitation')}</span>
          <button type="button" className="foot-close-btn" onClick={onClose}>
            {t('wildlifeGallery.close')}
          </button>
        </footer>
      </div>
    </div>
  );
}
