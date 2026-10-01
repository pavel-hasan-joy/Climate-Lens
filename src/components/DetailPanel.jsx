import './charts/setup.js';
import { FUTURE_YEAR, METRIC, PAST_YEARS, SOURCE, TIMES } from '../lib/constants.js';
import { dailyFor, districts, divisions, latestDaily, statsFor } from '../lib/metrics.js';
import { formatChange, formatValue, yyyymmdd } from '../lib/format.js';
import useLiveDaily from '../hooks/useLiveDaily.js';
import AnimatedNumber from './AnimatedNumber.jsx';
import YearChart from './charts/YearChart.jsx';
import SeasonChart from './charts/SeasonChart.jsx';
import DailyChart from './charts/DailyChart.jsx';
import { PERIOD } from './Timeline.jsx';

const divisionName = Object.fromEntries(divisions.map((d) => [d.id, d.name]));

// One plain sentence that says what changed
function story(name, metric, s) {
  const m = METRIC[metric];
  const nowVsPast = formatChange(metric, s.past, s.now).replace(' vs past', '');
  const up = s.now >= s.past;
  const trendUp = s.future >= s.past;
  return `${m.label} in ${name} is ${nowVsPast.slice(2)} ${up ? 'higher' : 'lower'} now than in ${PAST_YEARS[0]}–${PAST_YEARS[1]}. `
    + `If the ${2001}–2025 trend continues, it ${trendUp ? 'rises' : 'falls'} to about ${formatValue(metric, s.future)} by ${FUTURE_YEAR}.`;
}

export default function DetailPanel({ ids, districtId, divisionId, metric, time, year, onTime }) {
  const m = METRIC[metric];
  const s = statsFor(ids, metric);
  const district = districts.find((d) => d.id === districtId);
  const name = district?.name ?? (divisionId ? divisionName[divisionId] : 'Bangladesh');
  const kind = district ? `District · ${divisionName[district.division]} division` : divisionId ? `Division · ${ids.length} districts` : `Country · 64 districts`;
  const shown = year != null ? s.byYear[year - 2001] : s[time];
  const daily = useLiveDaily(districtId, dailyFor(ids, metric));

  return (
    <aside className="panel right">
      <header className="detail-head fade" key={name}>
        <span className="kind">{kind}</span>
        <h2>{name}</h2>
      </header>

      <section className="hero">
        <div className="hero-label">
          {m.label} · {year != null ? (year > 2025 ? `${year} (projected)` : year) : PERIOD[time]}
        </div>
        <div className="hero-value">
          <AnimatedNumber value={shown} digits={m.digits} />
          <span>{m.unit}</span>
        </div>
        {year == null && time !== 'past' && <div className="hero-change">{formatChange(metric, s.past, shown)}</div>}
        <p className="story">{story(name, metric, s)}</p>
      </section>

      <section className="compare">
        {TIMES.map((t) => (
          <button key={t.id} className={t.id === time && year == null ? 'on' : ''} style={{ '--c': t.color }} onClick={() => onTime(t.id)}>
            <span className="compare-top"><i />{t.label}</span>
            <b>{formatValue(metric, s[t.id])}</b>
            <small>{t.id === 'future' ? `± ${formatValue(metric, s.band)}` : PERIOD[t.id]}</small>
          </button>
        ))}
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Year by year</h3>
          <div className="keys">
            <span><i style={{ background: '#b4bccd' }} />Recorded</span>
            <span><i className="dash" style={{ background: TIMES[2].color }} />Our projection</span>
          </div>
        </div>
        <div className="chart tall"><YearChart stats={s} metric={metric} time={time} year={year} /></div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Through the year</h3>
          <div className="keys">
            {TIMES.map((t) => <span key={t.id}><i style={{ background: t.color }} />{t.label}</span>)}
          </div>
        </div>
        <div className="chart"><SeasonChart stats={s} metric={metric} time={time} /></div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Last 60 days</h3>
          <span className={'live' + (daily.live ? ' on' : '')}>
            {daily.live ? 'Live from NASA' : `Snapshot · to ${yyyymmdd(latestDaily)}`}
          </span>
        </div>
        <div className="chart"><DailyChart daily={daily} /></div>
      </section>

      <footer className="method">
        <p>
          <b>Data</b> — <a href={SOURCE.dataUrl} target="_blank" rel="noreferrer">{SOURCE.data}</a> (NASA Earth science),
          daily & monthly, sampled at each district. Borders — <a href={SOURCE.bordersUrl} target="_blank" rel="noreferrer">{SOURCE.borders}</a>.
          Map imagery — NASA GIBS.
        </p>
        <p>
          <b>Past</b> is the {PAST_YEARS[0]}–{PAST_YEARS[1]} average. <b>Now</b> is the latest 12 complete months.
          <b> Future</b> is our own projection: a robust (Theil–Sen) trend through 2001–2025, extended to {FUTURE_YEAR} with a 95% range.
          It is a statistical trend, not a climate model. Years before 2001 are left out because NASA POWER’s rainfall record changes source.
        </p>
      </footer>
    </aside>
  );
}
