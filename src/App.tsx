import { useCallback, useEffect, useState } from 'react';
import ClimateMap from './components/map/ClimateMap';
import DivisionPicker from './components/DivisionPicker';
import DistrictList from './components/DistrictList';
import MetricTabs from './components/MetricTabs';
import Timeline from './components/Timeline';
import DetailPanel from './components/DetailPanel';
import MapControls from './components/MapControls';
import Stamp from './components/Stamp';
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

  // Sync state to URL query string whenever state changes
  useEffect(() => {
    syncUrlState({ divisionId, districtId, compareId, metric, time, year, isAnomaly, scenario });
  }, [divisionId, districtId, compareId, metric, time, year, isAnomaly, scenario]);

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
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
        onSelectDistrict={selectDistrict}
      />
      <div className="map-shade" />

      <aside className="panel left">
        <header className="brand">
          <div className="brand-main">
            <div className="logo">
              <span />
            </div>
            <div>
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
      />

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
    </div>
  );
}
