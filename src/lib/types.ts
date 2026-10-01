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
  baseline: { rain: number; wet: number };
  now: { rain: number; wet: number };
  projected: { rain: number; wet: number };
  changes: {
    rainDiffPct: number;
    wetDiffPts: number;
    projRainDiffPct: number;
    projWetDiffPts: number;
  };
  risk: 'low' | 'medium' | 'high';
  reasonEn: string;
  reasonBn: string;
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
  curTmax: number;
  meanTmax: number;
  zTmax: number;
  curWet: number;
  meanWet: number;
  zWet: number;
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
}

export type AppUrlState = AppState;
