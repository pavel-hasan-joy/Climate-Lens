import { METRIC, TIMES, PAST_YEARS, LAST_PROJECTED_YEAR, SCENARIOS } from './constants';
import { divisions, districts } from './metrics';
import type { AppUrlState, MetricId, ScenarioId, TimeId } from './types';

const VALID_METRICS = new Set<string>(Object.keys(METRIC));
const VALID_TIMES = new Set<string>(TIMES.map((t) => t.id));
const VALID_SCENARIOS = new Set<string>(SCENARIOS.map((s) => s.id));
const DIVISION_IDS = new Set<string>(divisions.map((d) => d.id));
const DISTRICT_IDS = new Set<string>(districts.map((d) => d.id));

/**
 * Parses query params into validated app state.
 */
export function parseUrlState(
  search: string = typeof window !== 'undefined' ? window.location.search : '',
): AppUrlState {
  const params = new URLSearchParams(search);

  // district: dist or district
  const distParam = params.get('dist') || params.get('district');
  const districtId = distParam && DISTRICT_IDS.has(distParam) ? distParam : null;

  // division: div or division (inferred from district if district is present)
  let divisionId: string | null = null;
  if (districtId) {
    const d = districts.find((x) => x.id === districtId);
    if (d) divisionId = d.division;
  } else {
    const divParam = params.get('div') || params.get('division');
    divisionId = divParam && DIVISION_IDS.has(divParam) ? divParam : null;
  }

  // compare: comp or compare
  const compParam = params.get('comp') || params.get('compare');
  const compareId = compParam && DISTRICT_IDS.has(compParam) && compParam !== districtId ? compParam : null;

  // metric: m or metric
  const mParam = params.get('m') || params.get('metric');
  const metric: MetricId = mParam && VALID_METRICS.has(mParam) ? (mParam as MetricId) : 'monsoon';

  // time: t or time
  const tParam = params.get('t') || params.get('time');
  const time: TimeId = tParam && VALID_TIMES.has(tParam) ? (tParam as TimeId) : 'now';

  // year: yr or year
  const yrParam = params.get('yr') || params.get('year');
  const parsedYr = yrParam ? parseInt(yrParam, 10) : null;
  const year = parsedYr && parsedYr >= PAST_YEARS[0] && parsedYr <= LAST_PROJECTED_YEAR ? parsedYr : null;

  // anomaly: anom or anomaly
  const anomParam = params.get('anom') || params.get('anomaly');
  const isAnomaly = anomParam === '1' || anomParam === 'true';

  // scenario: scenario or scen
  const scenParam = params.get('scenario') || params.get('scen');
  const scenario: ScenarioId = scenParam && VALID_SCENARIOS.has(scenParam) ? (scenParam as ScenarioId) : 'statistical';

  // language: lang or l
  const langParam = params.get('lang') || params.get('l');
  const lang = langParam === 'bn' || langParam === 'en' ? langParam : undefined;

  return {
    divisionId,
    districtId,
    compareId,
    metric,
    time,
    year,
    isAnomaly,
    scenario,
    ...(lang ? { lang } : {}),
  };
}

/**
 * Serializes state into clean URL search string.
 */
export function buildUrlQuery({
  divisionId,
  districtId,
  compareId,
  metric,
  time,
  year,
  isAnomaly,
  scenario,
  lang,
}: Partial<AppUrlState>): string {
  const params = new URLSearchParams();

  if (districtId) {
    params.set('dist', districtId);
  } else if (divisionId) {
    params.set('div', divisionId);
  }

  if (compareId && compareId !== districtId) {
    params.set('comp', compareId);
  }

  if (metric && metric !== 'monsoon') {
    params.set('m', metric);
  }

  if (time && time !== 'now') {
    params.set('t', time);
  }

  if (year != null) {
    params.set('yr', String(year));
  }

  if (isAnomaly) {
    params.set('anom', '1');
  }

  if (scenario && scenario !== 'statistical') {
    params.set('scenario', scenario);
  }

  if (lang && lang === 'bn') {
    params.set('lang', 'bn');
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Synchronizes the URL query string with current app state without page reloads.
 */
export function syncUrlState(state: Partial<AppUrlState>): void {
  if (typeof window === 'undefined' || !window.history) return;
  const query = buildUrlQuery(state);
  const currentSearch = window.location.search || '';
  if (currentSearch !== (query || '')) {
    const newUrl = window.location.pathname + query + window.location.hash;
    window.history.replaceState(null, '', newUrl);
  }
}
