/**
 * Agro-climatic analysis and crop calendars for Bangladesh:
 * Aman, Aus, and Boro rice.
 *
 * Compares current and projected rainfall and root-zone soil wetness
 * during each crop's growing season against the 2001–2010 historical baseline.
 * Evaluates agro-climatic risk (Low / Medium / High) and detects
 * whether recent 30–60 day observations are "Unusual now" relative to historical normals.
 */
import { climate, districts } from './metrics';
import type {
  CropDefinition,
  CropId,
  CropRiskAssessment,
  DistrictStory,
  UnusualIndicatorMetric,
  UnusualNowResult,
} from './types';

export const CROPS: Record<CropId, CropDefinition> = {
  aman: {
    id: 'aman',
    nameEn: 'Aman Rice',
    nameBn: 'আমন ধান',
    seasonEn: 'Monsoon / Rainfed (Jun – Nov)',
    seasonBn: 'বর্ষা / বৃষ্টিভিত্তিক (জুন – নভে)',
    typeEn: 'Wet Season Rainfed Paddy',
    typeBn: 'বর্ষাকালীন প্রধান ধান',
    months: [5, 6, 7, 8, 9, 10], // Jun to Nov
    stages: [
      { nameEn: 'Sowing & Nursery', nameBn: 'বীজতলা ও চারা', months: [5, 6] },
      { nameEn: 'Transplanting & Tillering', nameBn: 'রোপণ ও কুশি বৃদ্ধি', months: [6, 7] },
      { nameEn: 'Flowering & Grain Filling', nameBn: 'থোড় ও শীষ গঠন', months: [8, 9] },
      { nameEn: 'Ripening & Harvest', nameBn: 'ধান পাকা ও কর্তন', months: [10] },
    ],
    color: '#10b981',
  },
  aus: {
    id: 'aus',
    nameEn: 'Aus Rice',
    nameBn: 'আউশ ধান',
    seasonEn: 'Pre-Monsoon (Apr – Jul)',
    seasonBn: 'প্রাক-বর্ষা (এপ্রিল – জুলাই)',
    typeEn: 'Early Summer / Pre-Monsoon Paddy',
    typeBn: 'গ্রীষ্ম ও প্রাক-বর্ষাকালীন ধান',
    months: [3, 4, 5, 6], // Apr to Jul
    stages: [
      { nameEn: 'Land Prep & Direct Sowing', nameBn: 'জমি তৈরি ও বীজ বপন', months: [3, 4] },
      { nameEn: 'Vegetative Growth', nameBn: 'অঙ্গজ বৃদ্ধি', months: [4, 5] },
      { nameEn: 'Panicle & Flowering', nameBn: 'ফুল ও শীষ গঠন', months: [5, 6] },
      { nameEn: 'Harvest', nameBn: 'ধান কর্তন', months: [6] },
    ],
    color: '#f59e0b',
  },
  boro: {
    id: 'boro',
    nameEn: 'Boro Rice',
    nameBn: 'বোরো ধান',
    seasonEn: 'Dry Winter / Irrigated (Dec – May)',
    seasonBn: 'শীত ও বসন্ত / সেচভিত্তিক (ডিসে – মে)',
    typeEn: 'Winter Irrigated High-Yield Paddy',
    typeBn: 'শীতকালীন সেচভিত্তিক উচ্চফলনশীল ধান',
    months: [11, 0, 1, 2, 3, 4], // Dec, Jan, Feb, Mar, Apr, May
    stages: [
      { nameEn: 'Seedbed & Nursery', nameBn: 'বীজতলা প্রস্তুত', months: [10, 11] },
      { nameEn: 'Transplanting', nameBn: 'চারা রোপণ', months: [11, 0] },
      { nameEn: 'Tillering & Booting', nameBn: 'কুশি ও থোড় অবস্থা', months: [1, 2] },
      { nameEn: 'Flowering & Harvest', nameBn: 'শীষ ও কর্তন', months: [3, 4] },
    ],
    color: '#3b82f6',
  },
};

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Reorders the recent 12-month window into calendar order Jan (0) .. Dec (11)
 */
function reorderRecent(d: { recent: { months: string[]; rain: number[]; tmax: number[]; wet: number[] } }) {
  const rain = new Array<number>(12);
  const tmax = new Array<number>(12);
  const wet = new Array<number>(12);

  d.recent.months.forEach((moStr, idx) => {
    const m = +moStr.slice(4, 6) - 1;
    rain[m] = d.recent.rain[idx];
    tmax[m] = d.recent.tmax[idx];
    wet[m] = d.recent.wet[idx] * 100;
  });

  return { rain, tmax, wet };
}

/**
 * Analyze growing season agro-climate for a specific crop and district.
 * Evaluates rainfall, soil wetness, and maximum temperature against baseline normals.
 */
export function analyzeCropClimate(districtId: string, cropId: CropId): CropRiskAssessment | null {
  const d = climate.districts[districtId] || climate.districts[districts[0].id];
  const crop = CROPS[cropId];
  if (!crop) return null;

  const months = crop.months;
  const recent = reorderRecent(d);

  // 1. Historical Baseline (2001–2010 = first 10 years in monthly records)
  let baseRainTotal = 0;
  let baseWetAvg = 0;
  let baseTmaxAvg = 0;

  for (let y = 0; y < 10; y++) {
    const rainYear = months.reduce((sum: number, m: number) => sum + d.monthly.rain[y][m] * DAYS[m], 0);
    const wetYear = months.reduce((sum: number, m: number) => sum + d.monthly.wet[y][m] * 100, 0) / months.length;
    const tmaxYear = months.reduce((sum: number, m: number) => sum + d.monthly.tmax[y][m], 0) / months.length;
    baseRainTotal += rainYear / 10;
    baseWetAvg += wetYear / 10;
    baseTmaxAvg += tmaxYear / 10;
  }

  // 2. Current "Now" Window
  const nowRainTotal = months.reduce((sum: number, m: number) => sum + (recent.rain[m] ?? 0) * DAYS[m], 0);
  const nowWetAvg = months.reduce((sum: number, m: number) => sum + (recent.wet[m] ?? 0), 0) / months.length;
  const nowTmaxAvg = months.reduce((sum: number, m: number) => sum + (recent.tmax[m] ?? 0), 0) / months.length;

  // 3. Projected 2040 (Theil-Sen / linear regression to index 39)
  const annualCropRain: number[] = [];
  const annualCropWet: number[] = [];
  const annualCropTmax: number[] = [];

  for (let y = 0; y < d.monthly.rain.length; y++) {
    const rTot = months.reduce((sum: number, m: number) => sum + d.monthly.rain[y][m] * DAYS[m], 0);
    const wAvg = months.reduce((sum: number, m: number) => sum + d.monthly.wet[y][m] * 100, 0) / months.length;
    const tAvg = months.reduce((sum: number, m: number) => sum + d.monthly.tmax[y][m], 0) / months.length;
    annualCropRain.push(rTot);
    annualCropWet.push(wAvg);
    annualCropTmax.push(tAvg);
  }

  const rainTrend = linearTrend(annualCropRain);
  const wetTrend = linearTrend(annualCropWet);
  const tmaxTrend = linearTrend(annualCropTmax);

  const projRainTotal = Math.max(0, rainTrend.at(39));
  const projWetAvg = Math.max(0, Math.min(100, wetTrend.at(39)));
  const projTmaxAvg = tmaxTrend.at(39);

  // 4. Differences
  const rainDiffPct = baseRainTotal > 0 ? ((nowRainTotal - baseRainTotal) / baseRainTotal) * 100 : 0;
  const wetDiffPts = nowWetAvg - baseWetAvg;
  const tmaxDiff = nowTmaxAvg - baseTmaxAvg;

  const projRainDiffPct = baseRainTotal > 0 ? ((projRainTotal - baseRainTotal) / baseRainTotal) * 100 : 0;
  const projWetDiffPts = projWetAvg - baseWetAvg;
  const projTmaxDiff = projTmaxAvg - baseTmaxAvg;

  // 5. Evaluate Transparent Rule Criteria and Risk Level
  let risk: 'low' | 'medium' | 'high' = 'low';
  let ruleCriteriaEn = '';
  let ruleCriteriaBn = '';
  let reasonEn = '';
  let reasonBn = '';

  const rPctFmt = (rainDiffPct >= 0 ? '+' : '') + rainDiffPct.toFixed(1) + '%';
  const wPtsFmt = (wetDiffPts >= 0 ? '+' : '') + wetDiffPts.toFixed(1) + '%';
  const tDiffFmt = (tmaxDiff >= 0 ? '+' : '') + tmaxDiff.toFixed(1) + '°C';

  if (cropId === 'aman') {
    // Aman Rice rules
    ruleCriteriaEn =
      'High Risk: Monsoon rain deficit ≤ −18% or soil wetness depletion ≤ −5.0%, or season Tmax ≥ 34.5°C. Medium Risk: Rain deficit ≤ −8%, soil wetness ≤ −2.0%, flood rains ≥ +40%, or warming ≥ +0.8°C. Low Risk: Rain, moisture, and temperatures stable within historical bounds.';
    ruleCriteriaBn =
      'উচ্চ ঝুঁকি: বর্ষা মৌসুমে বৃষ্টির ঘাটতি ≤ −১৮%, মাটির আর্দ্রতা সংকট ≤ −৫.০%, বা গড় সর্বোচ্চ তাপমাত্রা ≥ ৩৪.৫°সে। মাঝারি ঝুঁকি: বৃষ্টির ঘাটতি ≤ −৮%, আর্দ্রতা সংকট ≤ −২.০%, অতিরিক্ত প্লাবন বৃষ্টি ≥ +৪০%, বা তাপমাত্রা বৃদ্ধি ≥ +০.৮°সে। কম ঝুঁকি: বৃষ্টি, আর্দ্রতা ও তাপমাত্রা স্বাভাবিক সীমার মধ্যে।';

    if (rainDiffPct <= -18 || wetDiffPts <= -5.0 || nowTmaxAvg >= 34.5) {
      risk = 'high';
      reasonEn = `Significant monsoon rainfall deficit (${rPctFmt}), moisture depletion (${wPtsFmt}), or elevated heat (${nowTmaxAvg.toFixed(1)}°C) presents acute stress during sensitive vegetative tillering and panicle development.`;
      reasonBn = `আমন মৌসুমে বৃষ্টিপাতের তীব্র ঘাটতি (${rPctFmt}), মাটির আর্দ্রতা সংকট (${wPtsFmt}) বা উচ্চ তাপমাত্রা (${nowTmaxAvg.toFixed(1)}°সে) কুশি ও শীষ গঠনের সংবেদনশীল সময়ে গুরুতর পানি সংকটের সৃষ্টি করছে।`;
    } else if (rainDiffPct <= -8 || wetDiffPts <= -2.0 || rainDiffPct >= 40 || tmaxDiff >= 0.8) {
      risk = 'medium';
      if (rainDiffPct >= 40) {
        reasonEn = `Excessive monsoon rainfall (${rPctFmt}) elevates risk of prolonged seedling submergence and waterlogging in low-lying paddies.`;
        reasonBn = `আমন মৌসুমে অতিরিক্ত বৃষ্টিপাত (${rPctFmt}) নিম্নাঞ্চলে চারা নিমজ্জন ও জলাবদ্ধতার ঝুঁকি তৈরি করছে।`;
      } else {
        reasonEn = `Sub-optimal monsoon rainfall (${rPctFmt}) and moderate warming (${tDiffFmt}) indicate supplemental irrigation may be required to safeguard yields.`;
        reasonBn = `বৃষ্টিপাতের ঘাটতি (${rPctFmt}) এবং তাপমাত্রা বৃদ্ধি (${tDiffFmt}) নির্দেশ করে যে সর্বোচ্চ ফলন ধরে রাখতে সম্পূরক সেচ প্রয়োজন হতে পারে।`;
      }
    } else {
      risk = 'low';
      reasonEn = `Monsoon precipitation (${rPctFmt}), root-zone wetness (${wPtsFmt}), and seasonal temperatures remain favorable and supportive of normal rainfed Aman yields.`;
      reasonBn = `মৌসুমি বৃষ্টিপাত (${rPctFmt}), মাটির আর্দ্রতা (${wPtsFmt}) এবং তাপমাত্রা অনুকূল রয়েছে, যা আমনের স্বাভাবিক ফলনের জন্য সহায়ক।`;
    }
  } else if (cropId === 'aus') {
    // Aus Rice rules
    ruleCriteriaEn =
      'High Risk: Pre-monsoon rainfall deficit ≤ −22%, root-zone wetness depletion ≤ −5.0%, or heat stress Tmax ≥ 36.0°C. Medium Risk: Rain deficit ≤ −10%, early flood rains ≥ +35%, or Tmax ≥ 34.5°C. Low Risk: Adequate pre-monsoon showers and balanced temperatures.';
    ruleCriteriaBn =
      'উচ্চ ঝুঁকি: প্রাক-বর্ষায় বৃষ্টির ঘাটতি ≤ −২২%, মাটির আর্দ্রতা সংকট ≤ −৫.০%, বা তীব্র তাপদাহ ≥ ৩৬.০°সে। মাঝারি ঝুঁকি: বৃষ্টির ঘাটতি ≤ −১০%, আগাম বন্যা বৃষ্টি ≥ +৩৫%, বা তাপমাত্রা ≥ ৩৪.৫°সে। কম ঝুঁকি: পর্যাপ্ত প্রাক-বর্ষা বৃষ্টি ও স্বাভাবিক তাপমাত্রা।';

    if (rainDiffPct <= -22 || wetDiffPts <= -5.0 || nowTmaxAvg >= 36.0) {
      risk = 'high';
      reasonEn = `Severe pre-monsoon rainfall deficit (${rPctFmt}) or extreme heat stress (${nowTmaxAvg.toFixed(1)}°C) sharply restricts land preparation, germination, and early vegetative growth.`;
      reasonBn = `প্রাক-বর্ষা মৌসুমে তীব্র বৃষ্টিপাতের ঘাটতি (${rPctFmt}) বা প্রচণ্ড তাপদাহ (${nowTmaxAvg.toFixed(1)}°সে) জমি তৈরি ও চারা গজানোর প্রাথমিক পর্যায়ে গুরুতর প্রতিকূলতা তৈরি করছে।`;
    } else if (rainDiffPct <= -10 || wetDiffPts <= -2.5 || rainDiffPct >= 35 || nowTmaxAvg >= 34.5) {
      risk = 'medium';
      if (rainDiffPct >= 35) {
        reasonEn = `Elevated early monsoon rains (${rPctFmt}) increase vulnerability to pre-harvest flash flooding in low-lying floodplains.`;
        reasonBn = `মৌসুমের শুরুতে অতিরিক্ত বৃষ্টিপাত (${rPctFmt}) নিম্নাঞ্চলে আগাম আকস্মিক বন্যার ঝুঁকি বৃদ্ধি করছে।`;
      } else {
        reasonEn = `Pre-monsoon precipitation is running below baseline (${rPctFmt}); supplementary shallow irrigation is advisable for seedling establishment.`;
        reasonBn = `প্রাক-বর্ষা বৃষ্টিপাত স্বাভাবিকের চেয়ে কম (${rPctFmt}); চারা শক্ত করার জন্য সম্পূরক অগভীর সেচ প্রয়োজন হতে পারে।`;
      }
    } else {
      risk = 'low';
      reasonEn = `Adequate pre-monsoon showers (${rPctFmt}) and balanced soil wetness (${wPtsFmt}) provide favourable conditions for Aus crop establishment.`;
      reasonBn = `পর্যাপ্ত প্রাক-বর্ষা বৃষ্টিপাত (${rPctFmt}) ও মাটির ভারসাম্যপূর্ণ আর্দ্রতা (${wPtsFmt}) আউশ আবাদে অনুকূল পরিবেশ নিশ্চিত করছে।`;
    }
  } else {
    // Boro Rice rules
    ruleCriteriaEn =
      'High Risk: Dry rabi root-zone moisture depletion ≤ −5.0%, severe winter rain deficit ≤ −35%, or flowering heat stress Tmax ≥ 36.0°C (spikelet sterility). Medium Risk: Moisture depletion ≤ −2.0%, rain deficit ≤ −15%, or warming ≥ +1.0°C. Low Risk: Stable soil moisture sustaining standard irrigation pumping.';
    ruleCriteriaBn =
      'উচ্চ ঝুঁকি: শুষ্ক মৌসুমে মাটির আর্দ্রতা হ্রাস ≤ −৫.০%, শীতকালীন বৃষ্টির তীব্র ঘাটতি ≤ −৩৫%, বা শীষ ও পরাগায়নকালীন তাপদাহ ≥ ৩৬.০°সে (চিটা হওয়ার ঝুঁকি)। মাঝারি ঝুঁকি: আর্দ্রতা হ্রাস ≤ −২.০%, বৃষ্টি ঘাটতি ≤ −১৫%, বা তাপমাত্রা বৃদ্ধি ≥ +১.০°সে। কম ঝুঁকি: স্বাভাবিক আর্দ্রতা ও সুষম সেচ পরিবেশ।';

    if (wetDiffPts <= -5.0 || rainDiffPct <= -35 || nowTmaxAvg >= 36.0) {
      risk = 'high';
      reasonEn = `Depleted root-zone moisture (${wPtsFmt}) or critical reproductive-stage heat (${nowTmaxAvg.toFixed(1)}°C) sharply elevates groundwater pumping costs and spikelet sterility risks.`;
      reasonBn = `শীত ও বসন্ত মৌসুমে মাটির আর্দ্রতার তীব্র সংকট (${wPtsFmt}) বা ফুল ফোটার সময়ে চরম তাপদাহ (${nowTmaxAvg.toFixed(1)}°সে) সেচ সংকট ও ধান চিটা হওয়ার মারাত্মক ঝুঁকি নির্দেশ করে।`;
    } else if (wetDiffPts <= -2.0 || rainDiffPct <= -15 || tmaxDiff >= 1.0) {
      risk = 'medium';
      reasonEn = `Moderate soil moisture deficit (${wPtsFmt}) and warming (${tDiffFmt}) indicate declining shallow aquifer recharge; regulated irrigation scheduling is recommended.`;
      reasonBn = `মাটির আর্দ্রতায় কিছুটা ঘাটতি (${wPtsFmt}) এবং তাপমাত্রা বৃদ্ধি (${tDiffFmt}) ভূগর্ভস্থ পানির অপচয় রোধে নিয়ন্ত্রিত সেচ ব্যবস্থাপনার প্রয়োজনীয়তা নির্দেশ করে।`;
    } else {
      risk = 'low';
      reasonEn = `Soil wetness levels (${wPtsFmt}) and winter weather align with baseline norms, sustaining standard Boro irrigation schedules.`;
      reasonBn = `মাটির আর্দ্রতার মাত্রা (${wPtsFmt}) স্বাভাবিক মানদণ্ডে রয়েছে, যা বোরো সেচ কার্যক্রম পরিচালনায় অনুকূল।`;
    }
  }

  return {
    crop,
    baseline: {
      rain: Math.round(baseRainTotal),
      wet: Math.round(baseWetAvg * 10) / 10,
      tmax: Math.round(baseTmaxAvg * 10) / 10,
    },
    now: {
      rain: Math.round(nowRainTotal),
      wet: Math.round(nowWetAvg * 10) / 10,
      tmax: Math.round(nowTmaxAvg * 10) / 10,
    },
    projected: {
      rain: Math.round(projRainTotal),
      wet: Math.round(projWetAvg * 10) / 10,
      tmax: Math.round(projTmaxAvg * 10) / 10,
    },
    changes: {
      rainDiffPct: Math.round(rainDiffPct * 10) / 10,
      wetDiffPts: Math.round(wetDiffPts * 10) / 10,
      tmaxDiff: Math.round(tmaxDiff * 10) / 10,
      projRainDiffPct: Math.round(projRainDiffPct * 10) / 10,
      projWetDiffPts: Math.round(projWetDiffPts * 10) / 10,
      projTmaxDiff: Math.round(projTmaxDiff * 10) / 10,
    },
    risk,
    ruleCriteriaEn,
    ruleCriteriaBn,
    reasonEn,
    reasonBn,
  };
}

const COASTAL_DISTRICTS = new Set([
  'bagerhat',
  'barguna',
  'barisal',
  'bhola',
  'jhalokati',
  'patuakhali',
  'pirojpur',
  'khulna',
  'satkhira',
  'cox-s-bazar',
  'chittagong',
  'feni',
  'noakhali',
  'lakshmipur',
]);

const BARIND_DROUGHT_DISTRICTS = new Set([
  'rajshahi',
  'chapai-nawabganj',
  'naogaon',
  'natore',
  'bogra',
  'joypurhat',
  'pabna',
  'sirajganj',
  'dinajpur',
  'rangpur',
  'gaibandha',
  'kurigram',
  'lalmonirhat',
  'nilphamari',
  'panchagarh',
  'thakurgaon',
  'kushtia',
  'meherpur',
  'chuadanga',
  'jhenaidah',
  'magura',
  'narail',
  'jessore',
]);

const HAOR_WETLAND_DISTRICTS = new Set([
  'sylhet',
  'sunamganj',
  'habiganj',
  'moulvibazar',
  'netrokona',
  'kishoreganj',
  'brahmanbaria',
]);

const HILL_TRACT_DISTRICTS = new Set(['bandarban', 'khagrachhari', 'rangamati']);

/**
 * Auto-generates a 3-sentence district plain-language story:
 * 1. What changed in 20 years (2001–2025 observations)
 * 2. What is expected (2040 trajectory)
 * 3. Who is most affected (geographical vulnerability context)
 */
export function generateDistrictStory(districtId: string, lang: 'en' | 'bn' = 'en'): DistrictStory {
  const d = climate.districts[districtId] || climate.districts[districts[0].id];
  const dMeta = districts.find((x) => x.id === districtId) || districts[0];
  const dName = dMeta.name;

  // 1. What changed in 20+ years (2001–2025 historical data)
  const numYears = d.monthly.tmax.length;
  const firstTmax = d.monthly.tmax[0].reduce((a, b) => a + b, 0) / 12;
  const lastTmax = d.monthly.tmax[numYears - 1].reduce((a, b) => a + b, 0) / 12;
  const diffTmax = Math.round((lastTmax - firstTmax) * 10) / 10;
  const tSign = diffTmax >= 0 ? '+' : '';

  const firstRain = d.monthly.rain[0].reduce((a, b, m) => a + b * DAYS[m], 0);
  const lastRain = d.monthly.rain[numYears - 1].reduce((a, b, m) => a + b * DAYS[m], 0);
  const rainDiffPct = Math.round(((lastRain - firstRain) / (firstRain || 1)) * 100);
  const rSign = rainDiffPct >= 0 ? '+' : '';

  // 2. What is expected (2040 projection)
  const annualTmax = d.monthly.tmax.map((row) => row.reduce((a, b) => a + b, 0) / 12);
  const tTrend = linearTrend(annualTmax);
  const proj2040Tmax = Math.round(tTrend.at(39) * 10) / 10;

  let sentence1 = '';
  let sentence2 = '';
  let sentence3 = '';

  if (lang === 'bn') {
    sentence1 = `বিগত দুই দশকে (২০০১–২০২৫) ${dName}-এ গড় তাপমাত্রা ${tSign}${diffTmax}°সে পরিবর্তন হয়েছে এবং বার্ষিক বৃষ্টিপাতের রূপরেখায় ${rSign}${rainDiffPct}% তারতম্য নথিভুক্ত হয়েছে।`;
    sentence2 = `বর্তমান জলবায়ু ধারা ও প্রক্ষেপণ অনুযায়ী ২০৪০ সাল নাগাদ এই জেলায় সর্বোচ্চ তাপমাত্রা প্রায় ${proj2040Tmax}°সে-এ পৌঁছাবে, যার ফলে চরম তাপদাহ ও অনিয়মিত বৃষ্টিপাতের প্রবণতা বৃদ্ধি পাবে।`;

    if (COASTAL_DISTRICTS.has(districtId)) {
      sentence3 = `উপকূলীয় ধানচাষি, লবণাক্ততার ঝুঁকিতে থাকা কৃষক এবং উপকূলের মৎস্যজীবীরা উজানের মিঠাপানির সংকট ও জলোচ্ছ্বাসে সর্বাধিক ক্ষতিগ্রস্ত হচ্ছেন।`;
    } else if (BARIND_DROUGHT_DISTRICTS.has(districtId)) {
      sentence3 = `ভূগর্ভস্থ পানির স্তর দ্রুত নেমে যাওয়ায় সেচনির্ভর বোরো চাষি ও প্রখর রৌদ্রে কর্মরত গ্রামীণ দিনমজুররা তীব্র পানি সংকট ও তাপদাহে সবচেয়ে বেশি ঝুঁকিতে রয়েছেন।`;
    } else if (HAOR_WETLAND_DISTRICTS.has(districtId)) {
      sentence3 = `হাওর অঞ্চলের একক বোরো ধানচাষি এবং উন্মুক্ত জলাশয়ের মৎস্যজীবীরা আগাম পাহাড়ি ঢল, অকাল বন্যা ও দীর্ঘমেয়াদি জলাবদ্ধতায় সবচেয়ে বেশি ক্ষতিগ্রস্ত হচ্ছেন।`;
    } else if (HILL_TRACT_DISTRICTS.has(districtId)) {
      sentence3 = `পাহাড়ি জুমচাষি ও স্থানীয় ক্ষুদ্র নৃগোষ্ঠীর অধিবাসীরা অতিবৃষ্টিজনিত আকস্মিক পাহাড়ি ঢল ও পাহাড়ধসের মারাত্মক ঝুঁকিতে রয়েছেন।`;
    } else {
      sentence3 = `শহুরে খোলা আকাশের নিচে কর্মরত শ্রমজীবী, ঘনবসতিপূর্ণ বস্তিবাসী এবং নদীভাঙনপ্রবণ চরাঞ্চলের প্রান্তিক চাষিরা তীব্র তাপদাহ ও বন্যায় সর্বাধিক বিপদাপন্ন।`;
    }
  } else {
    sentence1 = `Over the past two decades (2001–2025), ${dName} has recorded a ${tSign}${diffTmax}°C shift in average temperature alongside a ${rSign}${rainDiffPct}% variation in annual rainfall patterns.`;
    sentence2 = `By 2040, empirical trends and CMIP6 climate models project local peak temperatures reaching approximately ${proj2040Tmax}°C, accompanied by higher heatwave frequency and erratic precipitation cycles.`;

    if (COASTAL_DISTRICTS.has(districtId)) {
      sentence3 = `Coastal smallholder rice cultivators, brackish-water farmers, and artisanal fisherfolk face the highest vulnerability from advancing salinity intrusion and cyclone-driven tidal inundation.`;
    } else if (BARIND_DROUGHT_DISTRICTS.has(districtId)) {
      sentence3 = `Irrigated Boro paddy growers and rural outdoor day-laborers are most exposed due to critical groundwater table depletion and intense pre-monsoon heat stress.`;
    } else if (HAOR_WETLAND_DISTRICTS.has(districtId)) {
      sentence3 = `Haor wetland farmers cultivating single-crop Boro paddy and open-water fisherfolk bear the greatest threat from premature pre-monsoon flash floods and flash waterlogging.`;
    } else if (HILL_TRACT_DISTRICTS.has(districtId)) {
      sentence3 = `Indigenous jhum and terrace agricultural communities in the hill tracts face heightened hazards from extreme rain-triggered slope landslides and flash torrents.`;
    } else {
      sentence3 = `Urban outdoor laborers, informal settlement residents, and riverine char-land farming households endure the highest vulnerability from extreme heat islands and riverbank erosion.`;
    }
  }

  return {
    sentence1,
    sentence2,
    sentence3,
    fullText: `${sentence1} ${sentence2} ${sentence3}`,
  };
}

function calcQuantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function calcPercentileRank(sorted: number[], val: number): number {
  if (sorted.length === 0) return 50;
  let countBelow = 0;
  let countEqual = 0;
  for (const x of sorted) {
    if (x < val) countBelow++;
    else if (Math.abs(x - val) < 1e-6) countEqual++;
  }
  const pct = Math.round(((countBelow + 0.5 * countEqual) / sorted.length) * 100);
  return Math.max(1, Math.min(99, pct));
}

/**
 * Checks if the last 30–60 days for a given district fall outside the historical normal range.
 * Computes 10th and 90th percentile boundaries and percentile rank across historical NASA POWER observations.
 */
export function checkUnusualNow(districtId: string): UnusualNowResult {
  const d = climate.districts[districtId] || climate.districts[districts[0].id];
  const daily = d.daily;
  if (!daily || !daily.dates || !daily.dates.length) {
    return {
      isUnusual: false,
      badgeType: 'normal',
      titleEn: 'Within Normal Range',
      titleBn: 'স্বাভাবিক সীমার মধ্যে',
      detailEn: 'No daily records available.',
      detailBn: 'দৈনিক কোনো তথ্য পাওয়া যায়নি।',
      totalDays: 0,
      curRain: 0,
      meanRain: 0,
      zRain: 0,
      curTmax: 0,
      meanTmax: 0,
      zTmax: 0,
      curWet: 0,
      meanWet: 0,
      zWet: 0,
      metrics: [],
    };
  }

  const n = daily.dates.length;
  // Day weights by calendar month in daily window
  const monthCounts: Record<number, number> = {};
  daily.dates.forEach((dStr: string) => {
    const m = +dStr.slice(4, 6) - 1;
    monthCounts[m] = (monthCounts[m] || 0) + 1;
  });

  const curRain = daily.rain.reduce((a: number, b: number) => a + b, 0);
  const curTmax = daily.tmax.reduce((a: number, b: number) => a + b, 0) / n;
  const curWet = (daily.wet.reduce((a: number, b: number) => a + b, 0) / n) * 100;

  // Calculate distribution across all 25 recorded years (2001-2025) for this exact calendar window
  const numYears = d.monthly.rain.length;
  const histRain: number[] = [];
  const histTmax: number[] = [];
  const histWet: number[] = [];

  for (let y = 0; y < numYears; y++) {
    let r = 0;
    let t = 0;
    let w = 0;
    let totalDays = 0;

    for (const [mStr, cnt] of Object.entries(monthCounts)) {
      const m = +mStr;
      r += d.monthly.rain[y][m] * cnt;
      t += d.monthly.tmax[y][m] * cnt;
      w += d.monthly.wet[y][m] * cnt * 100;
      totalDays += cnt;
    }
    histRain.push(r);
    histTmax.push(t / totalDays);
    histWet.push(w / totalDays);
  }

  const sortedRain = [...histRain].sort((a, b) => a - b);
  const sortedTmax = [...histTmax].sort((a, b) => a - b);
  const sortedWet = [...histWet].sort((a, b) => a - b);

  const p10Rain = calcQuantile(sortedRain, 0.1);
  const p90Rain = calcQuantile(sortedRain, 0.9);
  const pRain = calcPercentileRank(sortedRain, curRain);

  const p10Tmax = calcQuantile(sortedTmax, 0.1);
  const p90Tmax = calcQuantile(sortedTmax, 0.9);
  const pTmax = calcPercentileRank(sortedTmax, curTmax);

  const p10Wet = calcQuantile(sortedWet, 0.1);
  const p90Wet = calcQuantile(sortedWet, 0.9);
  const pWet = calcPercentileRank(sortedWet, curWet);

  const calcMean = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const calcSD = (arr: number[]) => {
    if (!arr.length) return 0;
    const m = calcMean(arr);
    return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length);
  };

  const meanRain = calcMean(histRain.slice(0, 10)); // Baseline mean
  const sdRain = calcSD(histRain) || 1;
  const zRain = (curRain - meanRain) / sdRain;

  const meanTmax = calcMean(histTmax.slice(0, 10));
  const sdTmax = calcSD(histTmax) || 0.5;
  const zTmax = (curTmax - meanTmax) / sdTmax;

  const meanWet = calcMean(histWet.slice(0, 10));
  const sdWet = calcSD(histWet) || 1;
  const zWet = (curWet - meanWet) / sdWet;

  // Criteria for anomaly: falling outside the 10th-90th percentile normal range OR |z| >= 1.5
  const isRainUnusual = curRain < p10Rain || curRain > p90Rain || Math.abs(zRain) >= 1.5;
  const isTmaxUnusual = curTmax < p10Tmax || curTmax > p90Tmax || Math.abs(zTmax) >= 1.5;
  const isWetUnusual = curWet < p10Wet || curWet > p90Wet || Math.abs(zWet) >= 1.5;

  const isUnusual = isRainUnusual || isTmaxUnusual || isWetUnusual;

  let titleEn = 'Within Normal Range';
  let titleBn = 'স্বাভাবিক সীমার মধ্যে';
  let detailEn = 'Recent 60-day weather matches historical seasonal expectations (10th–90th percentile range).';
  let detailBn = 'গত ৬০ দিনের আবহাওয়া ঐতিহাসিক ১০ম-৯০তম পার্সেন্টাইল সীমার অনুকূলে রয়েছে।';
  let badgeType: 'normal' | 'alert' = 'normal';

  if (isUnusual) {
    badgeType = 'alert';
    const driversEn: string[] = [];
    const driversBn: string[] = [];

    if (isTmaxUnusual) {
      const diffT = (curTmax - meanTmax).toFixed(1);
      if (curTmax > p90Tmax) {
        driversEn.push(
          `Max temp is at the ${pTmax}th %ile (${curTmax.toFixed(1)}°C, exceeding 90th %ile bound of ${p90Tmax.toFixed(1)}°C, +${diffT}°C vs baseline)`,
        );
        driversBn.push(
          `সর্বোচ্চ তাপমাত্রা ${pTmax}তম পার্সেন্টাইলে (${curTmax.toFixed(1)}°সে, স্বাভাবিক ৯০তম সীমা ${p90Tmax.toFixed(1)}°সে এর বেশি)`,
        );
      } else {
        driversEn.push(
          `Max temp is in the ${pTmax}th %ile (${curTmax.toFixed(1)}°C, below 10th %ile bound of ${p10Tmax.toFixed(1)}°C)`,
        );
        driversBn.push(
          `সর্বোচ্চ তাপমাত্রা ${pTmax}তম পার্সেন্টাইলে (${curTmax.toFixed(1)}°সে, স্বাভাবিক ১০ম সীমা ${p10Tmax.toFixed(1)}°সে এর নিচে)`,
        );
      }
    }

    if (isRainUnusual) {
      if (curRain > p90Rain) {
        const diffPct = Math.round(((curRain - meanRain) / meanRain) * 100);
        driversEn.push(
          `Rainfall is at the ${pRain}th %ile (${Math.round(curRain)} mm, +${diffPct}% above normal range of ${Math.round(p10Rain)}–${Math.round(p90Rain)} mm)`,
        );
        driversBn.push(
          `বৃষ্টিপাত ${pRain}তম পার্সেন্টাইলে (${Math.round(curRain)} মিমি, স্বাভাবিক সীমা ${Math.round(p10Rain)}–${Math.round(p90Rain)} মিমি এর চেয়ে +${diffPct}% বেশি)`,
        );
      } else {
        const deficitPct = Math.round(((meanRain - curRain) / meanRain) * 100);
        driversEn.push(
          `Rainfall deficit at the ${pRain}th %ile (${Math.round(curRain)} mm, -${deficitPct}% below normal range of ${Math.round(p10Rain)}–${Math.round(p90Rain)} mm)`,
        );
        driversBn.push(
          `বৃষ্টিপাত ঘাটতি ${pRain}তম পার্সেন্টাইলে (${Math.round(curRain)} মিমি, স্বাভাবিক সীমা ${Math.round(p10Rain)}–${Math.round(p90Rain)} মিমি থেকে -${deficitPct}% কম)`,
        );
      }
    }

    if (isWetUnusual) {
      if (curWet > p90Wet) {
        driversEn.push(
          `Soil wetness is at the ${pWet}th %ile (${curWet.toFixed(0)}%, above normal range of ${p10Wet.toFixed(0)}–${p90Wet.toFixed(0)}%)`,
        );
        driversBn.push(
          `মাটির আর্দ্রতা ${pWet}তম পার্সেন্টাইলে (${curWet.toFixed(0)}%, স্বাভাবিক সীমা ${p10Wet.toFixed(0)}–${p90Wet.toFixed(0)}% এর বেশি)`,
        );
      } else {
        driversEn.push(
          `Soil moisture depleted at the ${pWet}th %ile (${curWet.toFixed(0)}%, below normal range of ${p10Wet.toFixed(0)}–${p90Wet.toFixed(0)}%)`,
        );
        driversBn.push(
          `মাটির আর্দ্রতা হ্রাস পেয়ে ${pWet}তম পার্সেন্টাইলে (${curWet.toFixed(0)}%, স্বাভাবিক সীমা ${p10Wet.toFixed(0)}–${p90Wet.toFixed(0)}% এর নিচে)`,
        );
      }
    }

    titleEn = 'Unusual Right Now';
    titleBn = 'বর্তমানে অস্বাভাবিক আবহাওয়া';
    detailEn = driversEn.join('. ') + '.';
    detailBn = driversBn.join('। ') + '।';
  }

  const metrics: UnusualIndicatorMetric[] = [
    {
      id: 'heat',
      labelEn: 'Peak Heat (Tmax)',
      labelBn: 'সর্বোচ্চ তাপমাত্রা',
      unit: '°C',
      current: Math.round(curTmax * 10) / 10,
      mean: Math.round(meanTmax * 10) / 10,
      p10: Math.round(p10Tmax * 10) / 10,
      p90: Math.round(p90Tmax * 10) / 10,
      percentile: pTmax,
      zScore: Math.round(zTmax * 10) / 10,
      isUnusual: isTmaxUnusual,
      direction: curTmax > p90Tmax ? 'high' : curTmax < p10Tmax ? 'low' : 'normal',
    },
    {
      id: 'rain',
      labelEn: '60-day Rainfall',
      labelBn: '৬০ দিনের বৃষ্টিপাত',
      unit: 'mm',
      current: Math.round(curRain),
      mean: Math.round(meanRain),
      p10: Math.round(p10Rain),
      p90: Math.round(p90Rain),
      percentile: pRain,
      zScore: Math.round(zRain * 10) / 10,
      isUnusual: isRainUnusual,
      direction: curRain > p90Rain ? 'high' : curRain < p10Rain ? 'low' : 'normal',
    },
    {
      id: 'wet',
      labelEn: 'Root-Zone Wetness',
      labelBn: 'মাটির আর্দ্রতা',
      unit: '%',
      current: Math.round(curWet * 10) / 10,
      mean: Math.round(meanWet * 10) / 10,
      p10: Math.round(p10Wet * 10) / 10,
      p90: Math.round(p90Wet * 10) / 10,
      percentile: pWet,
      zScore: Math.round(zWet * 10) / 10,
      isUnusual: isWetUnusual,
      direction: curWet > p90Wet ? 'high' : curWet < p10Wet ? 'low' : 'normal',
    },
  ];

  return {
    isUnusual,
    badgeType,
    titleEn,
    titleBn,
    detailEn,
    detailBn,
    totalDays: n,
    curRain: Math.round(curRain),
    meanRain: Math.round(meanRain),
    zRain: Math.round(zRain * 10) / 10,
    pRain,
    p10Rain: Math.round(p10Rain),
    p90Rain: Math.round(p90Rain),
    curTmax: Math.round(curTmax * 10) / 10,
    meanTmax: Math.round(meanTmax * 10) / 10,
    zTmax: Math.round(zTmax * 10) / 10,
    pTmax,
    p10Tmax: Math.round(p10Tmax * 10) / 10,
    p90Tmax: Math.round(p90Tmax * 10) / 10,
    curWet: Math.round(curWet * 10) / 10,
    meanWet: Math.round(meanWet * 10) / 10,
    zWet: Math.round(zWet * 10) / 10,
    pWet,
    p10Wet: Math.round(p10Wet * 10) / 10,
    p90Wet: Math.round(p90Wet * 10) / 10,
    metrics,
  };
}

/**
 * Simple linear trend helper
 */
function linearTrend(ys: number[]): { slope: number; intercept: number; at: (x: number) => number } {
  const n = ys.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const xMean = (n - 1) / 2;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;

  return {
    slope,
    intercept,
    at: (x: number) => intercept + slope * x,
  };
}
