import type {
  ExtremeIndicatorConfig,
  MetricConfig,
  MetricId,
  ScenarioConfig,
  ScenarioId,
  TimeConfig,
  TimeId,
} from './types.ts';

// Past / Now / Future — validated categorical slots on the dark surface
export const TIMES: TimeConfig[] = [
  { id: 'past', label: 'Past', color: '#199e70' },
  { id: 'now', label: 'Now', color: '#3987e5' },
  { id: 'future', label: 'Future', color: '#d95926' },
];
export const TIME: Record<TimeId, TimeConfig> = Object.fromEntries(TIMES.map((t) => [t.id, t])) as Record<
  TimeId,
  TimeConfig
>;

export const PAST_YEARS: [number, number] = [2001, 2010];
export const FUTURE_YEAR = 2040;
export const LAST_PROJECTED_YEAR = 2050;

// Configurable extreme-event thresholds
export const HEATWAVE_THRESHOLD = 36.0; // °C daily max temperature
export const HEAVY_RAIN_THRESHOLD = 50.0; // mm/day heavy precipitation threshold (IMD/BMD standard)

// Sequential ramps for the dark map: low values recede (dark), high values glow (light)
const BLUE = ['#0d366b', '#184f95', '#256abf', '#3987e5', '#6da7ec', '#9ec5f4', '#cde2fb'];
const ORANGE = ['#4a1503', '#7a2507', '#b0390c', '#d95926', '#ec835a', '#f5b08e', '#fcdcc8'];
const AQUA = ['#063d2b', '#0a5a40', '#0f7a56', '#199e70', '#3fc393', '#86dfbd', '#c9f3e2'];

// Diverging ramps for Anomaly mode:
// Temperature: Blue (cooler than baseline) ↔ Neutral Dark (#141926) ↔ Red/Coral (hotter than baseline)
export const DIVERGING_TEMP = [
  '#1d4ed8',
  '#3b82f6',
  '#60a5fa',
  '#93c5fd',
  '#1c2438',
  '#fca5a5',
  '#ef4444',
  '#dc2626',
  '#b91c1c',
];

// Precipitation & Soil wetness: Brown (drier than baseline) ↔ Neutral Dark (#141926) ↔ Green/Teal (wetter than baseline)
export const DIVERGING_HYDRO = [
  '#78350f',
  '#b45309',
  '#d97706',
  '#f59e0b',
  '#1c2438',
  '#6ee7b7',
  '#10b981',
  '#059669',
  '#047857',
];

export const METRICS: MetricConfig[] = [
  {
    id: 'monsoon',
    label: 'Monsoon rain',
    short: 'Rain Jun–Sep',
    unit: 'mm',
    digits: 0,
    ramp: BLUE,
    divergingRamp: DIVERGING_HYDRO,
    about: 'Total rainfall in June–September, when most floods happen.',
  },
  {
    id: 'rain',
    label: 'Yearly rain',
    short: 'Rain / year',
    unit: 'mm',
    digits: 0,
    ramp: BLUE,
    divergingRamp: DIVERGING_HYDRO,
    about: 'Total rainfall across the whole year.',
  },
  {
    id: 'heat',
    label: 'Peak heat',
    short: 'Hottest day, Mar–May',
    unit: '°C',
    digits: 1,
    ramp: ORANGE,
    divergingRamp: DIVERGING_TEMP,
    about: 'The hottest temperature reached each month in March–May, averaged.',
  },
  {
    id: 'wet',
    label: 'Soil wetness',
    short: 'Root-zone wetness',
    unit: '%',
    digits: 0,
    ramp: AQUA,
    divergingRamp: DIVERGING_HYDRO,
    about: 'How saturated the soil is, averaged over the year. Wet soil can’t absorb more rain.',
  },
];
export const METRIC: Record<MetricId, MetricConfig> = Object.fromEntries(METRICS.map((m) => [m.id, m])) as Record<
  MetricId,
  MetricConfig
>;

export const EXTREME_INDICATORS: ExtremeIndicatorConfig[] = [
  {
    id: 'heatwave',
    label: 'Heatwave days',
    short: `Days ≥ ${HEATWAVE_THRESHOLD}°C`,
    unit: 'days',
    about: `Count of days where peak temperature reached or exceeded ${HEATWAVE_THRESHOLD}°C (severe heat stress).`,
  },
  {
    id: 'dry_spell',
    label: 'Longest dry spell',
    short: 'Dry streak',
    unit: 'days',
    about: 'Maximum consecutive days with under 1 mm of rain, heightening drought and crop risk.',
  },
  {
    id: 'heavy_rain',
    label: 'Heavy rain days',
    short: `Days ≥ ${HEAVY_RAIN_THRESHOLD} mm`,
    unit: 'days',
    about: `Count of days with rainfall reaching or exceeding ${HEAVY_RAIN_THRESHOLD} mm (inundation threshold).`,
  },
];

export const SOURCE = {
  data: 'NASA POWER',
  dataUrl: 'https://power.larc.nasa.gov/',
  borders: 'geoBoundaries',
  bordersUrl: 'https://www.geoboundaries.org/',
};

export const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'statistical',
    name: 'Theil–Sen Trend',
    short: 'Statistical',
    labelEn: 'Statistical Trend (2001–2025 Extrapolation)',
    labelBn: 'পরিসংখ্যানগত ধারা (২০০১–২০২৫ বহির্পাতন)',
    descEn: 'Robust non-parametric trend line extending historical 2001–2025 trajectories.',
    descBn: 'ঐতিহাসিক ২০০১–২০২৫ উপাত্তের ওপর ভিত্তি করে লিনিয়ার প্রবণতা পূর্বাভাস।',
    color: '#d95926',
  },
  {
    id: 'ssp245',
    name: 'SSP2-4.5',
    short: 'SSP2-4.5',
    labelEn: 'CMIP6 SSP2-4.5 (Middle of the Road)',
    labelBn: 'সিএমআইপি৬ এসএসপি২-৪.৫ (মধ্যম নিঃসরণ)',
    descEn: 'NASA NEX-GDDP-CMIP6 downscaled ensemble with moderate global mitigation (~2.7°C by 2100).',
    descBn: 'নাসা ডাউনস্কেল্ড বহু-মডেল গড়: পরিমিত বৈশ্বিক নিঃসরণ নিয়ন্ত্রণ (~২.৭°সে ২১০০ নাগাদ)।',
    color: '#10b981',
  },
  {
    id: 'ssp585',
    name: 'SSP5-8.5',
    short: 'SSP5-8.5',
    labelEn: 'CMIP6 SSP5-8.5 (High Emissions)',
    labelBn: 'সিএমআইপি৬ এসএসপি৫-৮.৫ (উচ্চ নিঃসরণ)',
    descEn: 'NASA NEX-GDDP-CMIP6 downscaled ensemble under unconstrained fossil-fuel growth (~4.4°C by 2100).',
    descBn: 'নাসা ডাউনস্কেল্ড বহু-মডেল গড়: লাগামহীন জীবাশ্ম জ্বালানি বৃদ্ধি (~৪.৪°সে ২১০০ নাগাদ)।',
    color: '#ef4444',
  },
];
export const SCENARIO: Record<ScenarioId, ScenarioConfig> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s]),
) as Record<ScenarioId, ScenarioConfig>;
