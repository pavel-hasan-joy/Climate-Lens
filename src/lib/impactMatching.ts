import impactsRaw from '../data/impacts.json';
import { districts, valueAt } from './metrics';
import type { ImpactCategory, ImpactDataset, ImpactEntry, ImpactMetricId, MetricId, ScenarioId, TimeId } from './types';

export const impactsData = impactsRaw as unknown as ImpactDataset;

export interface ThresholdEvaluationResult {
  hasThreshold: boolean;
  source: string;
  condition: string;
  thresholdValue: number;
  unit: string;
  districtValue: number;
  isAbove: boolean;
  crossed: boolean;
  messageEn: string;
  messageBn: string;
}

export interface HowSureDetails {
  evidenceTypeLabelEn: string;
  evidenceTypeLabelBn: string;
  evidenceDescriptionEn: string;
  evidenceDescriptionBn: string;
  climateLinkLabelEn: string;
  climateLinkLabelBn: string;
  climateLinkDescriptionEn: string;
  climateLinkDescriptionBn: string;
  consensusLabelEn: string;
  consensusLabelBn: string;
  consensusDescriptionEn: string;
  consensusDescriptionBn: string;
  confidenceLabelEn: string;
  confidenceLabelBn: string;
  mixedDivergenceEn?: string;
  mixedDivergenceBn?: string;
}

export interface EvaluatedImpact {
  entry: ImpactEntry;
  thresholdResult: ThresholdEvaluationResult | null;
  timeContext: {
    badgeEn: string;
    badgeBn: string;
    phraseEn: string;
    phraseBn: string;
  };
  howSure: HowSureDetails;
}

export interface ImpactFilterOptions {
  districtId?: string | null;
  divisionId?: string | null;
  metric?: MetricId;
  time?: TimeId;
  year?: number | null;
  scenario?: ScenarioId;
  categoryFilter?: 'all' | ImpactCategory;
  metricScope?: 'current' | 'all';
}

/**
 * Maps the app's MetricId to Impact metric types.
 * App: 'heat' | 'rain' | 'wet' | 'monsoon'
 * Impact: 'temp' | 'rain' | 'soil' | 'multi'
 */
export function matchesMetric(entryMetric: ImpactMetricId, appMetric: MetricId): boolean {
  if (entryMetric === 'multi') return true;
  if (entryMetric === 'temp' && appMetric === 'heat') return true;
  if (entryMetric === 'soil' && appMetric === 'wet') return true;
  if (entryMetric === 'rain' && (appMetric === 'rain' || appMetric === 'monsoon')) return true;
  return false;
}

/**
 * Evaluates whether an impact entry applies to the selected region.
 * Handles district IDs, division IDs, national 'all' tags, and empty region rules.
 */
export function matchesRegion(entry: ImpactEntry, districtId?: string | null, divisionId?: string | null): boolean {
  const regions = entry.regions.map((r) => r.toLowerCase().trim());

  // If entry explicitly targets 'all'
  if (regions.includes('all')) return true;

  // If entry has no regions specified, show at national level only
  if (regions.length === 0) {
    return !districtId && !divisionId;
  }

  // If national view (no district, no division)
  if (!districtId && !divisionId) {
    return true;
  }

  // If a district is selected
  if (districtId) {
    const dLower = districtId.toLowerCase();
    if (regions.includes(dLower)) return true;

    // Check alias normalization (e.g. bogra vs bogura, chapai-nawabganj vs chapainawabganj)
    const norm = (id: string) => id.replace(/[-_]/g, '');
    if (regions.some((r) => norm(r) === norm(dLower))) return true;

    // Check district's parent division
    const districtObj = districts.find((d) => d.id === districtId);
    if (districtObj && districtObj.division) {
      const divLower = districtObj.division.toLowerCase();
      if (regions.includes(divLower)) return true;
    }

    return false;
  }

  // If a division is selected (without single district)
  if (divisionId) {
    const divLower = divisionId.toLowerCase();
    if (regions.includes(divLower)) return true;

    // Check if any district within this division is explicitly in the entry's regions
    const divDistricts = districts.filter((d) => d.division === divisionId).map((d) => d.id.toLowerCase());
    if (regions.some((r) => divDistricts.includes(r))) return true;

    return false;
  }

  return false;
}

/**
 * Translates numbers to Bengali digits
 */
function toBnDigits(val: number | string): string {
  const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(val).replace(/\d/g, (d) => digits[parseInt(d, 10)]);
}

/**
 * Evaluates cited thresholds against live NASA / CMIP6 data for the district.
 * CRITICAL RULE: Never triggers on thresholds without a cited source.
 */
export function evaluateThreshold(
  entry: ImpactEntry,
  districtId?: string | null,
  divisionId?: string | null,
  _metric: MetricId = 'heat',
  time: TimeId = 'now',
  year?: number | null,
  scenario: ScenarioId = 'statistical',
): ThresholdEvaluationResult | null {
  const t = entry.threshold;
  if (!t || !t.source || typeof t.value !== 'number') {
    return null;
  }

  // Need a target district or fallback representative district from division
  let targetId = districtId;
  if (!targetId && divisionId) {
    const firstInDiv = districts.find((d) => d.division === divisionId);
    if (firstInDiv) targetId = firstInDiv.id;
  }
  if (!targetId) {
    targetId = 'dhaka'; // Default fallback for national evaluation
  }

  let districtVal: number | null = null;

  // Map threshold metric requirement
  if (t.unit === '°C' || entry.metric === 'temp') {
    districtVal = valueAt(targetId, 'heat', time, year, false, scenario);
  } else if (t.unit === '%' || entry.metric === 'soil') {
    // Soil wetness in % (0..100)
    districtVal = valueAt(targetId, 'wet', time, year, false, scenario);
  } else if (entry.metric === 'rain') {
    districtVal = valueAt(targetId, 'rain', time, year, false, scenario);
  } else {
    // Multi: check unit
    if (t.unit === '°C') {
      districtVal = valueAt(targetId, 'heat', time, year, false, scenario);
    }
  }

  if (districtVal == null || isNaN(districtVal)) {
    return null;
  }

  const roundedDist = Math.round(districtVal * 10) / 10;
  const isAbove = roundedDist >= t.value;
  const unit = t.unit;

  const messageEn = `This district's value (${roundedDist}${unit}) is ${isAbove ? 'above' : 'below'} the level reported in ${t.source} (${t.value}${unit}).`;
  const messageBn = `এই জেলার মান (${toBnDigits(roundedDist)}${unit}) ${t.source}-এ উল্লিখিত মাত্রার (${toBnDigits(t.value)}${unit}) ${isAbove ? 'উপরে' : 'নিচে'}।`;

  return {
    hasThreshold: true,
    source: t.source,
    condition: t.condition,
    thresholdValue: t.value,
    unit: t.unit,
    districtValue: roundedDist,
    isAbove,
    crossed: isAbove,
    messageEn,
    messageBn,
  };
}

/**
 * Returns plain-language explanatory text for evidence_type, climate_link, and consensus.
 */
export function getHowSureExplanation(entry: ImpactEntry): HowSureDetails {
  // Evidence type explanation
  let evidenceTypeLabelEn = 'Observed Data';
  let evidenceTypeLabelBn = 'পর্যবেক্ষিত উপাত্ত';
  let evidenceDescriptionEn = 'Direct measurements from weather stations, field records, or government inventories.';
  let evidenceDescriptionBn = 'আবহাওয়া স্টেশন, মাঠপর্যায়ের রেকর্ড বা সরকারি ইনভেন্টরি থেকে সরাসরি সংগৃহীত উপাত্ত।';

  switch (entry.evidence_type) {
    case 'statistical_study':
      evidenceTypeLabelEn = 'Statistical Study';
      evidenceTypeLabelBn = 'পরিসংখ্যানগত গবেষণা';
      evidenceDescriptionEn = 'Empirical econometric regression or multi-decadal time-series statistical modeling.';
      evidenceDescriptionBn = 'দীর্ঘমেয়াদি টাইম-সিরিজ উপাত্তের ওপর ভিত্তি করে প্রণীত অর্থনীতি ও পরিসংখ্যানগত মডেল।';
      break;
    case 'model_projection':
      evidenceTypeLabelEn = 'Model Projection';
      evidenceTypeLabelBn = 'মডেল প্রক্ষেপণ';
      evidenceDescriptionEn =
        'Physics or machine-learning based future habitat/climate projection (e.g. MaxEnt, IPCC scenarios).';
      evidenceDescriptionBn =
        'ভবিষ্যতের জলবায়ু বা জীববৈচিত্র্য বিষয়ক কম্পিউটার মডেল প্রক্ষেপণ (যেমন ম্যাক্সএন্ট, আইপিসিসি দৃশ্যপট)।';
      break;
    case 'review':
      evidenceTypeLabelEn = 'Scientific Review';
      evidenceTypeLabelBn = 'বিজ্ঞানভিত্তিক পর্যালোচনা';
      evidenceDescriptionEn =
        'Comprehensive synthesis of multiple experimental trials and published agro-hydrological studies.';
      evidenceDescriptionBn =
        'একাধিক মাঠপরীক্ষা ও প্রকাশিত কৃষি-হাইড্রোলজিক্যাল গবেষণার সামগ্রিক মূল্যায়ন ও পর্যালোচনা।';
      break;
    case 'news_or_expert_estimate':
      evidenceTypeLabelEn = 'Expert / Agency Estimate';
      evidenceTypeLabelBn = 'বিশেষজ্ঞ / প্রাতিষ্ঠানিক প্রাক্কলন';
      evidenceDescriptionEn =
        'Estimates provided by state departments (BMD, DoF, DAE) or scientific specialists during extreme events.';
      evidenceDescriptionBn =
        'চরম আবহাওয়াকালীন সংশ্লিষ্ট সরকারি সংস্থা (বিএমডি, মৎস্য অধিদপ্তর, ডিএই) বা বিজ্ঞানীদের প্রাক্কলন।';
      break;
    case 'farmer_perception':
      evidenceTypeLabelEn = 'Farmer Perception';
      evidenceTypeLabelBn = 'কৃষকদের সরেজমিন অভিজ্ঞতা';
      evidenceDescriptionEn = 'Ground-level grower reports and agricultural extension officer surveys.';
      evidenceDescriptionBn = 'স্থানীয় চাষী ও কৃষি কর্মকর্তাদের পর্যবেক্ষণ এবং মাঠপর্যায়ের সমীক্ষা।';
      break;
  }

  // Climate link explanation
  let climateLinkLabelEn = 'Direct Driver';
  let climateLinkLabelBn = 'প্রত্যক্ষ চালিকাশক্তি';
  let climateLinkDescriptionEn =
    'The study identifies temperature, rainfall, or moisture variations as the direct primary driver.';
  let climateLinkDescriptionBn =
    'গবেষণায় তাপমাত্রা, বৃষ্টিপাত বা আর্দ্রতার পরিবর্তনকে মূল প্রত্যক্ষ কারণ হিসেবে নিশ্চিত করা হয়েছে।';

  switch (entry.climate_link) {
    case 'contributing':
      climateLinkLabelEn = 'Contributing Factor';
      climateLinkLabelBn = 'সহায়ক নিয়ামক';
      climateLinkDescriptionEn =
        'Climate acts as an aggravating factor alongside human stressors like siltation, gillnets, or habitat loss.';
      climateLinkDescriptionBn =
        'জলবায়ু একক কারণ নয়; নদী ভরাট, কারেন্ট জাল বা বন উজাড়ের মতো মানবসৃষ্ট চাপের সাথে যুক্ত হয়ে প্রভাব ফেলছে।';
      break;
    case 'not_established':
      climateLinkLabelEn = 'Not Established';
      climateLinkLabelBn = 'জলবায়ুজনিত কারণ প্রতিষ্ঠিত নয়';
      climateLinkDescriptionEn =
        'Official assessments attribute historical extinction to hunting and deforestation; climate causality is unproven.';
      climateLinkDescriptionBn =
        'ঐতিহাসিক বিলুপ্তির মূল কারণ বন উজাড় ও শিকার; জলবায়ু পরিবর্তনের প্রত্যক্ষ সংশ্লিষ্টতা প্রমাণিত নয়।';
      break;
    case 'unclear':
      climateLinkLabelEn = 'Unclear Causality';
      climateLinkLabelBn = 'অস্পষ্ট সংশ্লিষ্টতা';
      climateLinkDescriptionEn =
        'Correlations exist but mechanistic causality requires further longitudinal verification.';
      climateLinkDescriptionBn =
        'যোগসূত্র দেখা গেলেও সুনির্দিষ্ট কার্যকারণ নিশ্চিত করতে আরও দীর্ঘমেয়াদি গবেষণা প্রয়োজন।';
      break;
  }

  // Consensus explanation
  let consensusLabelEn = 'Scientific Consensus';
  let consensusLabelBn = 'ঐকমত্য প্রতিষ্ঠিত';
  let consensusDescriptionEn = 'Findings are broadly accepted across peer-reviewed literature.';
  let consensusDescriptionBn = 'পর্যালোচিত বৈজ্ঞানিক সাহিত্যে এই ফলাফলের সাথে ব্যাপক সম্মতি রয়েছে।';
  let mixedDivergenceEn: string | undefined;
  let mixedDivergenceBn: string | undefined;

  if (entry.consensus === 'mixed') {
    consensusLabelEn = 'Mixed / Disputed Consensus';
    consensusLabelBn = 'মিশ্র / বিতর্কিত ফলাফল';
    consensusDescriptionEn =
      'Different studies in Bangladesh report contrasting results depending on methodology and regional micro-climates.';
    consensusDescriptionBn =
      'পদ্ধতি ও আঞ্চলিক জলবায়ুর ভিন্নতার কারণে বাংলাদেশের বিভিন্ন গবেষণায় বিপরীতমুখী ফলাফল পাওয়া গেছে।';

    if (entry.id.includes('climatology') || entry.id.includes('northwest')) {
      mixedDivergenceEn =
        'Study contrast: 65-year BMD weather station regressions (PLOS One 2023) show rainfall boosting Aus, Aman & Boro with max heat reducing yields; while Northwest Barind models (Springer 2022) observe that winter minimums can mitigate irrigated Boro variance, contrasting with severe Aman drought sensitivity.';
      mixedDivergenceBn =
        'গবেষণার বৈসাদৃশ্য: ৬৫ বছরের আবহাওয়া স্টেশন ডেটায় (PLOS One 2023) দেখা যায় বৃষ্টিপাত তিনটি ধানেরই ফলন বাড়ায় এবং অতিরিক্ত তাপ ফলন কমায়; অপরদিকে বরেন্দ্র অঞ্চলের মডেলে (Springer 2022) দেখা গেছে শীতকালীন মৃদু তাপমাত্রা সেচভিত্তিক বোরো ধানের জন্য সহায়ক হতে পারে।';
    } else {
      mixedDivergenceEn =
        'Documented regional differences exist between coastal, north-western, and eastern agro-ecological zones.';
      mixedDivergenceBn =
        'উপকূলীয়, উত্তর-পশ্চিম এবং পূর্ব পূর্বাঞ্চলের মধ্যে লক্ষণীয় কৃষি-বাস্তুতান্ত্রিক বৈসাদৃশ্য বিদ্যমান।';
    }
  }

  const confidenceLabelEn =
    entry.confidence === 'high'
      ? 'High Confidence'
      : entry.confidence === 'medium'
        ? 'Medium Confidence'
        : 'Low Confidence (Local)';
  const confidenceLabelBn =
    entry.confidence === 'high'
      ? 'উচ্চ নির্ভরযোগ্যতা'
      : entry.confidence === 'medium'
        ? 'মাঝারি নির্ভরযোগ্যতা'
        : 'সীমিত নির্ভরযোগ্যতা (স্থানীয়)';

  return {
    evidenceTypeLabelEn,
    evidenceTypeLabelBn,
    evidenceDescriptionEn,
    evidenceDescriptionBn,
    climateLinkLabelEn,
    climateLinkLabelBn,
    climateLinkDescriptionEn,
    climateLinkDescriptionBn,
    consensusLabelEn,
    consensusLabelBn,
    consensusDescriptionEn,
    consensusDescriptionBn,
    confidenceLabelEn,
    confidenceLabelBn,
    mixedDivergenceEn,
    mixedDivergenceBn,
  };
}

/**
 * Returns time-mode aware badges and plain language phrasings.
 */
export function getTimeModeContext(time: TimeId, scenario: ScenarioId = 'statistical') {
  if (time === 'future') {
    const isModel = scenario !== 'statistical';
    const methodEn = isModel ? 'CMIP6 multi-model projection' : 'statistical Theil–Sen trend';
    const methodBn = isModel ? 'সিএমআইপি৬ মডেল প্রক্ষেপণ' : 'পরিসংখ্যানগত থিয়েল–সেন ধারা';

    return {
      badgeEn: `Future Risk · ${isModel ? 'CMIP6 Model' : 'Trend'}`,
      badgeBn: `ভবিষ্যৎ ঝুঁকি · ${isModel ? 'সিএমআইপি৬' : 'ধারা'}`,
      phraseEn: `may be affected if the ${methodEn} continues toward 2040`,
      phraseBn: `২০৪০ সাল নাগাদ ${methodBn} অব্যাহত থাকলে সরাসরি ক্ষতিগ্রস্ত হতে পারে`,
    };
  }

  return {
    badgeEn: 'Documented Observation',
    badgeBn: 'নথিবদ্ধ পর্যবেক্ষণ',
    phraseEn: 'has been documented in peer-reviewed observations and records',
    phraseBn: 'গবেষণা ও মাঠপর্যায়ের রেকর্ডে নথিবদ্ধ করা হয়েছে',
  };
}

/**
 * Filters and enriches impacts based on user context.
 */
export function getImpactsFor(options: ImpactFilterOptions): EvaluatedImpact[] {
  const {
    districtId,
    divisionId,
    metric = 'heat',
    time = 'now',
    year,
    scenario = 'statistical',
    categoryFilter = 'all',
    metricScope = 'current',
  } = options;

  const dataset = impactsData.entries;

  return dataset
    .filter((entry) => {
      // 1. Region match
      if (!matchesRegion(entry, districtId, divisionId)) {
        return false;
      }

      // 2. Category filter
      if (categoryFilter !== 'all' && entry.category !== categoryFilter) {
        return false;
      }

      // 3. Metric scope
      if (metricScope === 'current') {
        if (!matchesMetric(entry.metric, metric)) {
          return false;
        }
      }

      return true;
    })
    .map((entry) => {
      const thresholdResult = evaluateThreshold(entry, districtId, divisionId, metric, time, year, scenario);
      const timeContext = getTimeModeContext(time, scenario);
      const howSure = getHowSureExplanation(entry);

      return {
        entry,
        thresholdResult,
        timeContext,
        howSure,
      };
    });
}
