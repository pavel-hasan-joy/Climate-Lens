import { useCallback, useEffect, useState } from 'react';
import ClimateMap from './components/map/ClimateMap.jsx';
import DivisionPicker from './components/DivisionPicker.jsx';
import DistrictList from './components/DistrictList.jsx';
import MetricTabs from './components/MetricTabs.jsx';
import Timeline from './components/Timeline.jsx';
import DetailPanel from './components/DetailPanel.jsx';
import MapControls from './components/MapControls.jsx';
import Stamp from './components/Stamp.jsx';
import { LAST_PROJECTED_YEAR, PAST_YEARS } from './lib/constants.js';
import { districts, domainFor, idsOf, latestDaily } from './lib/metrics.js';
import { yyyymmdd } from './lib/format.js';

export default function App() {
  const [divisionId, setDivisionId] = useState(null);
  const [districtId, setDistrictId] = useState(null);
  const [metric, setMetric] = useState('monsoon');
  const [time, setTime] = useState('now');
  const [year, setYear] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [basemap, setBasemap] = useState('night');
  const [showRain, setShowRain] = useState(false);

  const selectDivision = (id) => {
    setDivisionId(id);
    setDistrictId(null);
  };

  const selectDistrict = useCallback((id) => {
    setDistrictId(id);
    setDivisionId(districts.find((d) => d.id === id).division);
  }, []);

  const selectTime = (t) => {
    setPlaying(false);
    setYear(null);
    setTime(t);
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
    if (playing) { setPlaying(false); return; }
    setYear(PAST_YEARS[0]);
    setPlaying(true);
  };

  const ids = districtId ? [districtId] : idsOf(divisionId);
  const domain = domainFor(idsOf(divisionId), metric);
  const shared = { metric, time, year, domain };

  return (
    <div className={'app' + (playing ? ' playing' : '')}>
      <ClimateMap
        divisionId={divisionId}
        districtId={districtId}
        metric={metric}
        time={time}
        year={year}
        playing={playing}
        domain={domain}
        basemap={basemap}
        showRain={showRain}
        onSelectDistrict={selectDistrict}
      />
      <div className="map-shade" />

      <aside className="panel left">
        <header className="brand">
          <div className="logo"><span /></div>
          <div>
            <h1>Climate Lens</h1>
            <p>Bangladesh · NASA Earth data · to {yyyymmdd(latestDaily)}</p>
          </div>
        </header>

        <section>
          <h3 className="label">Region</h3>
          <DivisionPicker value={divisionId} onChange={selectDivision} {...shared} />
        </section>

        <section>
          <h3 className="label">{divisionId ? 'Districts, ranked' : 'Top 10 districts'}</h3>
          <DistrictList divisionId={divisionId} districtId={districtId} onSelect={selectDistrict} {...shared} />
        </section>
      </aside>

      <MetricTabs value={metric} onChange={setMetric} />
      <Stamp time={time} year={year} />

      <DetailPanel
        ids={ids}
        districtId={districtId}
        divisionId={divisionId}
        metric={metric}
        time={time}
        year={year}
        onTime={selectTime}
      />

      <Timeline time={time} year={year} playing={playing} onTime={selectTime} onTogglePlay={togglePlay} />
      <MapControls basemap={basemap} showRain={showRain} metric={metric} domain={domain} onBasemap={setBasemap} onRain={setShowRain} />
    </div>
  );
}
