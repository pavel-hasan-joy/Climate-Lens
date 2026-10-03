export type MetricId = 'monsoon' | 'rain' | 'heat' | 'wet';

export type TimeId = 'past' | 'now' | 'future';

export type ScenarioId = 'statistical' | 'ssp245' | 'ssp585';

export type Language = 'en' | 'bn';

export type DomainRange = [number, number];

export interface DistrictProperties {
  id: string;
  name: string;
  division: string;
  anchor: [number, number];
  [key: string]: unknown;
}

export interface DivisionProperties {
  id: string;
  name: string;
  anchor?: [number, number];
  [key: string]: unknown;
}

export interface MetricConfig {
  id: MetricId;
  label: string;
  short: string;
  unit: string;
  digits: number;
  ramp: string[];
  divergingRamp: string[];
  about: string;
}

export interface TimeConfig {
  id: TimeId;
  label: string;
  color: string;
}

export interface ScenarioConfig {
  id: ScenarioId;
  name: string;
  short: string;
  labelEn: string;
  labelBn: string;
  descEn: string;
  descBn: string;
  color: string;
}

export interface ExtremeIndicatorConfig {
  id: string;
  label: string;
  short: string;
  unit: string;
  about: string;
}

export interface ExtremeIndicatorsResult {
  heatwaveDays: number;
  longestDrySpell: number;
  heavyRainDays: number;
  totalDays: number;
}

export interface MannKendallResult {
  s: number;
  z: number;
  p: number;
  significant: boolean;
}

export interface TheilSenResult {
  slope: number;
  intercept: number;
  sd: number;
  at: (x: number) => number;
}

export type TrendResult = TheilSenResult;

export interface DistrictStats {
  past: number;
  now: number;
  future: number;
  anomaly: {
    now: number;
    future: number;
    byYear: (number | null)[];
  };
  band: number;
  slope: number;
  mk: MannKendallResult;
  annual: number[];
  byYear: (number | null)[];
  projected: (number | null)[];
  cycle: {
    past: number[];
    now: number[];
    future: number[];
  };
  monthlyMatrix: number[][];
}

export interface DailyData {
  dates: string[];
  rain: number[];
  tmax: number[];
  wet: number[];
}

export interface DistrictClimateRecord {
  monthly: {
    rain: number[][];
    tmax: number[][];
    wet: number[][];
  };
  recent: {
    months: string[];
    rain: number[];
    tmax: number[];
    wet: number[];
  };
  daily: DailyData;
}

export interface ClimateData {
  firstYear: number;
  lastFullYear: number;
  districts: Record<string, DistrictClimateRecord>;
}

export interface Cmip6Series {
  median: number[];
  low: number[];
  high: number[];
}

export interface Cmip6DistrictData {
  baseline: {
    rain: number;
    monsoon: number;
    heat: number;
    wet: number;
  };
  ssp245: Record<MetricId, Cmip6Series>;
  ssp585: Record<MetricId, Cmip6Series>;
}

export interface Cmip6Data {
  years: number[];
  scenarios: Record<'ssp245' | 'ssp585', ScenarioConfig>;
  districts: Record<string, Cmip6DistrictData>;
}

export interface Cmip6Result {
  scenario: string;
  info: ScenarioConfig;
  years: number[];
  median: number[];
  low: number[];
  high: number[];
  at2040: {
    median: number;
    low: number;
    high: number;
  };
}

export type CropId = 'aman' | 'aus' | 'boro';

export interface CropStage {
  nameEn: string;
  nameBn: string;
  months: number[];
}

export interface CropDefinition {
  id: CropId;
  nameEn: string;
  nameBn: string;
  seasonEn: string;
  seasonBn: string;
  typeEn: string;
  typeBn: string;
  months: number[];
  stages: CropStage[];
  color: string;
}

export interface CropRiskAssessment {
  crop: CropDefinition;
  baseline: { rain: number; wet: number; tmax: number };
  now: { rain: number; wet: number; tmax: number };
  projected: { rain: number; wet: number; tmax: number };
  changes: {
    rainDiffPct: number;
    wetDiffPts: number;
    tmaxDiff: number;
    projRainDiffPct: number;
    projWetDiffPts: number;
    projTmaxDiff: number;
  };
  risk: 'low' | 'medium' | 'high';
  ruleCriteriaEn: string;
  ruleCriteriaBn: string;
  reasonEn: string;
  reasonBn: string;
}

export interface DistrictStory {
  sentence1: string; // What changed in 20 years
  sentence2: string; // What is expected
  sentence3: string; // Who is most affected
  fullText: string;
}

export interface UnusualIndicatorMetric {
  id: 'heat' | 'rain' | 'wet';
  labelEn: string;
  labelBn: string;
  unit: string;
  current: number;
  mean: number;
  p10: number;
  p90: number;
  percentile: number;
  zScore: number;
  isUnusual: boolean;
  direction: 'high' | 'low' | 'normal';
}

export interface UnusualNowResult {
  isUnusual: boolean;
  badgeType: 'normal' | 'alert';
  titleEn: string;
  titleBn: string;
  detailEn: string;
  detailBn: string;
  totalDays: number;
  curRain: number;
  meanRain: number;
  zRain: number;
  pRain?: number;
  p10Rain?: number;
  p90Rain?: number;
  curTmax: number;
  meanTmax: number;
  zTmax: number;
  pTmax?: number;
  p10Tmax?: number;
  p90Tmax?: number;
  curWet: number;
  meanWet: number;
  zWet: number;
  pWet?: number;
  p10Wet?: number;
  p90Wet?: number;
  metrics?: UnusualIndicatorMetric[];
}

export interface AppState {
  divisionId: string | null;
  districtId: string | null;
  compareId: string | null;
  metric: MetricId;
  time: TimeId;
  year: number | null;
  isAnomaly: boolean;
  scenario: ScenarioId;
  lang?: Language;
}

export type AppUrlState = AppState;

export interface MetricValidationStats {
  mae: number;
  rmse: number;
  coverage: number;
}

export interface ValidationDistrictDetail {
  id: string;
  name: string;
  division: string;
  metrics: Record<
    MetricId,
    {
      mae: number;
      rmse: number;
      coverage: number;
      predicted: number[];
      actual: number[];
      band: number;
      slopePerDecade: number;
    }
  >;
}

export interface ValidationData {
  metadata: {
    trainYears: [number, number];
    testYears: [number, number];
    testYearCount: number;
    totalDistricts: number;
    method: string;
    generatedAt: string;
  };
  overall: Record<MetricId, MetricValidationStats>;
  byDivision: Record<
    string,
    {
      id: string;
      name: string;
      districtCount: number;
      metrics: Record<MetricId, MetricValidationStats>;
    }
  >;
  districts: Record<string, ValidationDistrictDetail>;
}

export interface DistrictPopulation {
  id: string;
  name: string;
  division: string;
  population: number;
  areaSqKm: number;
  density: number;
  pctNational: number;
  urbanPct: number;
}

export interface PopulationDataset {
  source: string;
  citation: string;
  censusYear: number;
  totalPopulation: number;
  totalAreaSqKm: number;
  nationalDensity: number;
  districts: Record<string, DistrictPopulation>;
}

export interface ExposedDistrictInfo {
  id: string;
  name: string;
  division: string;
  population: number;
  pctNational: number;
  warming: boolean;
  drying: boolean;
  wetting: boolean;
  hasSignificantTrend: boolean;
  tempSlopePerDecade?: number;
  rainSlopePerDecade?: number;
  wetSlopePerDecade?: number;
}

export interface PopulationExposureSummary {
  totalNationalPop: number;
  exposedWarmingOrDryingPop: number;
  exposedWarmingOrDryingPct: number;
  exposedWarmingOrDryingCount: number;
  exposedWarmingPop: number;
  exposedWarmingPct: number;
  exposedDryingPop: number;
  exposedDryingPct: number;
  exposedWettingPop: number;
  exposedWettingPct: number;
  exposedWettingCount: number;
  exposedPopTotal: number;
  exposedPctTotal: number;
  exposedDistrictsCount: number;
  totalDistrictsCount: number;
  exposedDistricts: ExposedDistrictInfo[];
}

export interface DistrictNdviSeason {
  baseline: number;
  recent: number;
}

export interface DistrictNdvi {
  id: string;
  name: string;
  division: string;
  zone: string;
  baselineMonthly: number[];
  recentMonthly: number[];
  baselineAnnual: number;
  recentAnnual: number;
  anomaly: number;
  vigorIndex: number;
  status: 'robust' | 'normal' | 'moderate-stress' | 'severe-stress';
  seasons: {
    boro: DistrictNdviSeason;
    aus: DistrictNdviSeason;
    aman: DistrictNdviSeason;
  };
}

export interface NdviDataset {
  source: string;
  citation: string;
  metric: string;
  range: [number, number];
  baselinePeriod: string;
  recentPeriod: string;
  districts: Record<string, DistrictNdvi>;
}

export type ImpactCategory = 'crop' | 'fruit' | 'fish' | 'wildlife' | 'extinction';
export type ImpactDirection = 'harm' | 'benefit' | 'mixed';
export type ImpactEvidenceType =
  | 'observed_data'
  | 'statistical_study'
  | 'model_projection'
  | 'review'
  | 'news_or_expert_estimate'
  | 'farmer_perception';
export type ImpactClimateLink = 'direct' | 'contributing' | 'unclear' | 'not_established';
export type ImpactConsensus = 'established' | 'mixed' | 'emerging' | 'contested';
export type ImpactConfidence = 'high' | 'medium' | 'low';

export interface ImpactNumber {
  value: number | string;
  unit: string;
  what_it_measures: string;
}

export interface ImpactThreshold {
  value: number | string;
  unit: string;
  condition: string;
  source: string;
}

export interface ImpactSource {
  title: string;
  url: string;
  publisher: string;
  year: number;
}

export type ImpactMetricId = 'rain' | 'temp' | 'soil' | 'multi';

export interface ImpactEntry {
  id: string;
  category: ImpactCategory;
  name_en: string;
  name_bn: string;
  metric: ImpactMetricId;
  direction: ImpactDirection;
  season: string | null;
  regions: string[];
  summary_en: string;
  summary_bn: string;
  numbers: ImpactNumber;
  threshold: ImpactThreshold | null;
  evidence_type: ImpactEvidenceType;
  climate_link: ImpactClimateLink;
  consensus: ImpactConsensus;
  confidence: ImpactConfidence;
  source: ImpactSource;
  last_checked: string;
}

export interface ImpactDataset {
  version: string;
  last_updated: string;
  total_entries: number;
  entries: ImpactEntry[];
}

export interface LostSpecies {
  id: string;
  name_en: string;
  name_bn: string;
  scientific_name: string;
  group: 'mammal' | 'bird' | 'reptile';
  last_recorded: string;
  main_drivers_en: string;
  main_drivers_bn: string;
  climate_link: ImpactClimateLink;
  rediscovered: boolean;
  rediscovered_note_en?: string;
  rediscovered_note_bn?: string;
}

export interface AtRiskSpecies {
  id: string;
  name_en: string;
  name_bn: string;
  scientific_name: string;
  national_status: string;
  global_status: string;
  population_estimate: string;
  habitat: string;
  main_threats_en: string;
  main_threats_bn: string;
  climate_link: ImpactClimateLink;
  climate_impact_detail_en: string;
  climate_impact_detail_bn: string;
  model_projection?: {
    source: string;
    year: number;
    horizon: number;
    summary_en: string;
    summary_bn: string;
  };
}

export interface WildlifeDataset {
  version: string;
  official_source: string;
  assessment_year: number;
  previous_assessment_year: number;
  stats: {
    total_assessed_2015: number;
    regionally_extinct_2015: number;
    regionally_extinct_2000: number;
    threatened_total_2015: number;
    critically_endangered_2015: number;
    endangered_2015: number;
    vulnerable_2015: number;
    data_deficient_2015: number;
    least_concern_2015: number;
    near_threatened_2015: number;
  };
  lost_species: LostSpecies[];
  at_risk_species: AtRiskSpecies[];
  timeline: {
    year_2000: {
      extinct_count: number;
      note_en: string;
      note_bn: string;
    };
    year_2015: {
      extinct_count: number;
      threatened_count: number;
      cr: number;
      en: number;
      vu: number;
      note_en: string;
      note_bn: string;
    };
  };
  data_deficient: {
    count: number;
    percentage: number;
    note_en: string;
    note_bn: string;
  };
}
