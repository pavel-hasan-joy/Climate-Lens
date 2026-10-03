import { useCallback, useEffect, useState } from 'react';
import ClimateMap from './components/map/ClimateMap';
import DivisionPicker from './components/DivisionPicker';
import DistrictList from './components/DistrictList';
import MetricTabs from './components/MetricTabs';
import Timeline from './components/Timeline';
import DetailPanel from './components/DetailPanel';
import MapControls from './components/MapControls';
import Stamp from './components/Stamp';
import AboutModal from './components/AboutModal';
import ValidationModal from './components/ValidationModal';
import WildlifeGallery from './components/WildlifeGallery';
import DataMethodsModal from './components/DataMethodsModal';
import SpeciesRecordsModal from './components/SpeciesRecordsModal';
import ErrorBoundary from './components/ErrorBoundary';
import { LAST_PROJECTED_YEAR, PAST_YEARS } from './lib/constants';
import { districts, domainFor, idsOf, latestDaily } from './lib/metrics';
import { yyyymmdd } from './lib/format';
import { parseUrlState, syncUrlState } from './lib/urlState';
import { useTranslation } from './lib/i18n';
import type { MetricId, ScenarioId, TimeId } from './lib/types';

export default function App() {
  const { lang, setLang, t } = useTranslation();
  const initial = parseUrlState();
  const [divisionId, setDivisionId] = useState<string | null>(initial.divisionId);
  const [districtId, setDistrictId] = useState<string | null>(initial.districtId);
  const [compareId, setCompareId] = useState<string | null>(initial.compareId);
  const [metric, setMetric] = useState<MetricId>(initial.metric);
  const [time, setTime] = useState<TimeId>(initial.time);
  const [year, setYear] = useState<number | null>(initial.year);
  const [playing, setPlaying] = useState(false);
  const [basemap, setBasemap] = useState<string>('night');
  const [showRain, setShowRain] = useState(false);
  const [isAnomaly, setIsAnomaly] = useState(initial.isAnomaly);
  const [scenario, setScenario] = useState<ScenarioId>(initial.scenario);
  const [showAbout, setShowAbout] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('climate-lens-about-seen');
  });
  const [showValidation, setShowValidation] = useState(false);
  const [showWildlife, setShowWildlife] = useState(false);
  const [showDataMethods, setShowDataMethods] = useState(false);
  const [showSpeciesRecords, setShowSpeciesRecords] = useState(false);
  const [selectedHazardCoords, setSelectedHazardCoords] = useState<[number, number] | null>(null);

  // Restore language from URL if explicitly present in query params
  useEffect(() => {
    if (initial.lang && initial.lang !== lang) {
      setLang(initial.lang);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync state to URL query string whenever state changes
  useEffect(() => {
    syncUrlState({ divisionId, districtId, compareId, metric, time, year, isAnomaly, scenario, lang });
  }, [divisionId, districtId, compareId, metric, time, year, isAnomaly, scenario, lang]);

  // Support browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const s = parseUrlState();
      setDivisionId(s.divisionId);
      setDistrictId(s.districtId);
      setCompareId(s.compareId);
      setMetric(s.metric);
      setTime(s.time);
      setYear(s.year);
      setIsAnomaly(s.isAnomaly);
      setScenario(s.scenario);
      if (s.lang && s.lang !== lang) {
        setLang(s.lang);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [lang, setLang]);

  const selectDivision = (id: string | null) => {
    setDivisionId(id);
    setDistrictId(null);
    setCompareId(null);
  };

  const selectDistrict = useCallback((id: string) => {
    setDistrictId(id);
    const d = districts.find((x) => x.id === id);
    if (d) setDivisionId(d.division);
    setCompareId((cur) => (cur === id ? null : cur));
  }, []);

  const selectTime = (tVal: TimeId) => {
    setPlaying(false);
    setYear(null);
    setTime(tVal);
  };

  const toggleAnomaly = () => {
    setIsAnomaly((a) => !a);
  };

  // Play: walk year by year from the past into the projection
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setYear((y) => {
        if (y == null) return PAST_YEARS[0];
        if (y >= LAST_PROJECTED_YEAR) {
          setPlaying(false);
          setTime('future');
          return null;
        }
        return y + 1;
      });
    }, 420);
    return () => clearInterval(id);
  }, [playing]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    setYear(PAST_YEARS[0]);
    setPlaying(true);
  };

  const ids = districtId ? [districtId] : idsOf(divisionId);
  const domain = domainFor(idsOf(divisionId), metric, isAnomaly, scenario);
  const shared = { metric, time, year, domain, isAnomaly, scenario };

  return (
    <div
      className={
        'app' + (playing ? ' playing' : '') + (isAnomaly ? ' anomaly-active' : '') + (lang === 'bn' ? ' lang-bn' : '')
      }
    >
      <ErrorBoundary fallbackTitle="Map Rendering Error">
        <ClimateMap
          divisionId={divisionId}
          districtId={districtId}
          compareId={compareId}
          metric={metric}
          time={time}
          year={year}
          playing={playing}
          domain={domain}
          basemap={basemap}
          showRain={showRain}
          isAnomaly={isAnomaly}
          scenario={scenario}
          selectedHazardCoords={selectedHazardCoords}
          onSelectDistrict={selectDistrict}
        />
      </ErrorBoundary>
      <div className="map-shade" />

      <aside className="panel left">
        <header className="brand">
          <div className="brand-top-row">
            <div className="brand-main">
              <div className="logo">
                <span />
              </div>
              <div className="brand-titles">
                <h1>{t('app.title')}</h1>
                <p>{t('app.subtitle', { date: yyyymmdd(latestDaily, lang) })}</p>
              </div>
            </div>
            <div className="lang-switcher" title={t('app.switchLang')}>
              <button type="button" className={'lang-btn' + (lang === 'en' ? ' on' : '')} onClick={() => setLang('en')}>
                EN
              </button>
              <button type="button" className={'lang-btn' + (lang === 'bn' ? ' on' : '')} onClick={() => setLang('bn')}>
                বাং
              </button>
            </div>
          </div>
          <div className="brand-actions">
            <button
              type="button"
              className="help-btn"
              title={lang === 'bn' ? 'প্রজাতি পর্যবেক্ষণ রেকর্ড (GBIF)' : 'Species Occurrence Records (GBIF)'}
              aria-label={lang === 'bn' ? 'প্রজাতি রেকর্ড' : 'Species Records'}
              onClick={() => setShowSpeciesRecords(true)}
            >
              🐾
            </button>
            <button
              type="button"
              className="help-btn"
              title={lang === 'bn' ? 'তথ্য ও গবেষণা পদ্ধতি (Data & Methods)' : 'Data & Analytical Methods'}
              aria-label={lang === 'bn' ? 'তথ্য ও পদ্ধতি' : 'Data & Methods'}
              onClick={() => setShowDataMethods(true)}
            >
              📊
            </button>
            <button
              type="button"
              className="help-btn"
              title={t('wildlifeGallery.btnTitle')}
              aria-label={t('wildlifeGallery.btnTitle')}
              onClick={() => setShowWildlife(true)}
            >
              🐅
            </button>
            <button
              type="button"
              className="help-btn"
              title={t('validationModal.btnTitle')}
              aria-label={t('validationModal.btnTitle')}
              onClick={() => setShowValidation(true)}
            >
              🔬
            </button>
            <button
              type="button"
              className="help-btn"
              title={t('aboutModal.btnTitle')}
              aria-label={t('aboutModal.btnTitle')}
              onClick={() => setShowAbout(true)}
            >
              ?
            </button>
          </div>
        </header>

        <section>
          <h3 className="label">{t('nav.region')}</h3>
          <DivisionPicker value={divisionId} onChange={selectDivision} {...shared} />
        </section>

        <section>
          <h3 className="label">
            {divisionId
              ? isAnomaly
                ? t('nav.anomalyDistricts')
                : t('nav.rankedDistricts')
              : isAnomaly
                ? t('nav.topAnomalies')
                : t('nav.topDistricts')}
          </h3>
          <DistrictList
            divisionId={divisionId}
            districtId={districtId}
            compareId={compareId}
            onSelect={selectDistrict}
            onCompare={setCompareId}
            {...shared}
          />
        </section>
      </aside>

      <MetricTabs value={metric} onChange={setMetric} isAnomaly={isAnomaly} onToggleAnomaly={toggleAnomaly} />
      <Stamp time={time} year={year} isAnomaly={isAnomaly} scenario={scenario} />

      <ErrorBoundary fallbackTitle="District Detail Error">
        <DetailPanel
          ids={ids}
          districtId={districtId}
          divisionId={divisionId}
          compareId={compareId}
          metric={metric}
          time={time}
          year={year}
          isAnomaly={isAnomaly}
          scenario={scenario}
          onTime={selectTime}
          onScenario={setScenario}
          onCompareDistrict={setCompareId}
          onOpenValidation={() => setShowValidation(true)}
          onOpenWildlife={() => setShowWildlife(true)}
          onSelectHazardEvent={(ev) => ev?.coordinates && setSelectedHazardCoords(ev.coordinates)}
        />
      </ErrorBoundary>

      <Timeline time={time} year={year} playing={playing} onTime={selectTime} onTogglePlay={togglePlay} />
      <MapControls
        basemap={basemap}
        showRain={showRain}
        metric={metric}
        domain={domain}
        isAnomaly={isAnomaly}
        onToggleAnomaly={toggleAnomaly}
        onBasemap={setBasemap}
        onRain={setShowRain}
      />
      <AboutModal
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
        onExploreDistrict={(distId) => {
          selectDistrict(distId);
          setMetric('heat');
        }}
      />
      <ValidationModal
        isOpen={showValidation}
        onClose={() => setShowValidation(false)}
        initialDistrictId={districtId}
      />
      <WildlifeGallery
        isOpen={showWildlife}
        onClose={() => setShowWildlife(false)}
        onOpenSpeciesRecords={() => setShowSpeciesRecords(true)}
      />
      <ErrorBoundary fallbackTitle="Data & Methods Error">
        <DataMethodsModal isOpen={showDataMethods} onClose={() => setShowDataMethods(false)} />
      </ErrorBoundary>
      <ErrorBoundary fallbackTitle="Species Records Error">
        <SpeciesRecordsModal isOpen={showSpeciesRecords} onClose={() => setShowSpeciesRecords(false)} />
      </ErrorBoundary>
    </div>
  );
}
