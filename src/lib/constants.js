// Past / Now / Future — validated categorical slots on the dark surface
export const TIMES = [
  { id: 'past', label: 'Past', color: '#199e70' },
  { id: 'now', label: 'Now', color: '#3987e5' },
  { id: 'future', label: 'Future', color: '#d95926' },
];
export const TIME = Object.fromEntries(TIMES.map((t) => [t.id, t]));

export const PAST_YEARS = [2001, 2010];
export const FUTURE_YEAR = 2040;
export const LAST_PROJECTED_YEAR = 2050;

// Sequential ramps for the dark map: low values recede (dark), high values glow (light)
const BLUE = ['#0d366b', '#184f95', '#256abf', '#3987e5', '#6da7ec', '#9ec5f4', '#cde2fb'];
const ORANGE = ['#4a1503', '#7a2507', '#b0390c', '#d95926', '#ec835a', '#f5b08e', '#fcdcc8'];
const AQUA = ['#063d2b', '#0a5a40', '#0f7a56', '#199e70', '#3fc393', '#86dfbd', '#c9f3e2'];

export const METRICS = [
  {
    id: 'monsoon', label: 'Monsoon rain', short: 'Rain Jun–Sep', unit: 'mm', digits: 0, ramp: BLUE,
    about: 'Total rainfall in June–September, when most floods happen.',
  },
  {
    id: 'rain', label: 'Yearly rain', short: 'Rain / year', unit: 'mm', digits: 0, ramp: BLUE,
    about: 'Total rainfall across the whole year.',
  },
  {
    id: 'heat', label: 'Peak heat', short: 'Hottest day, Mar–May', unit: '°C', digits: 1, ramp: ORANGE,
    about: 'The hottest temperature reached each month in March–May, averaged.',
  },
  {
    id: 'wet', label: 'Soil wetness', short: 'Root-zone wetness', unit: '%', digits: 0, ramp: AQUA,
    about: 'How saturated the soil is, averaged over the year. Wet soil can’t absorb more rain.',
  },
];
export const METRIC = Object.fromEntries(METRICS.map((m) => [m.id, m]));

export const SOURCE = {
  data: 'NASA POWER',
  dataUrl: 'https://power.larc.nasa.gov/',
  borders: 'geoBoundaries',
  bordersUrl: 'https://www.geoboundaries.org/',
};
