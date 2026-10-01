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
import type { CropDefinition, CropId, CropRiskAssessment, UnusualNowResult } from './types';

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

  for (let y = 0; y < 10; y++) {
    const rainYear = months.reduce((sum: number, m: number) => sum + d.monthly.rain[y][m] * DAYS[m], 0);
    const wetYear = months.reduce((sum: number, m: number) => sum + d.monthly.wet[y][m] * 100, 0) / months.length;
    baseRainTotal += rainYear / 10;
    baseWetAvg += wetYear / 10;
  }

  // 2. Current "Now" Window
  const nowRainTotal = months.reduce((sum: number, m: number) => sum + (recent.rain[m] ?? 0) * DAYS[m], 0);
  const nowWetAvg = months.reduce((sum: number, m: number) => sum + (recent.wet[m] ?? 0), 0) / months.length;

  // 3. Projected 2040
  // Estimate projected trend using 25-year regression for crop's seasonal total
  const annualCropRain: number[] = [];
  const annualCropWet: number[] = [];

  for (let y = 0; y < d.monthly.rain.length; y++) {
    const rTot = months.reduce((sum: number, m: number) => sum + d.monthly.rain[y][m] * DAYS[m], 0);
    const wAvg = months.reduce((sum: number, m: number) => sum + d.monthly.wet[y][m] * 100, 0) / months.length;
    annualCropRain.push(rTot);
    annualCropWet.push(wAvg);
  }

  const rainTrend = linearTrend(annualCropRain);
  const wetTrend = linearTrend(annualCropWet);

  // Project to year 2040 (39 years after 2001, index 39)
  const projRainTotal = Math.max(0, rainTrend.at(39));
  const projWetAvg = Math.max(0, Math.min(100, wetTrend.at(39)));

  // 4. Differences
  const rainDiffPct = baseRainTotal > 0 ? ((nowRainTotal - baseRainTotal) / baseRainTotal) * 100 : 0;
  const wetDiffPts = nowWetAvg - baseWetAvg;

  const projRainDiffPct = baseRainTotal > 0 ? ((projRainTotal - baseRainTotal) / baseRainTotal) * 100 : 0;
  const projWetDiffPts = projWetAvg - baseWetAvg;

  // 5. Evaluate Risk Level and Reasoning
  let risk: 'low' | 'medium' | 'high' = 'low';
  let reasonEn = '';
  let reasonBn = '';

  const rPctFmt = (rainDiffPct >= 0 ? '+' : '') + rainDiffPct.toFixed(1) + '%';
  const wPtsFmt = (wetDiffPts >= 0 ? '+' : '') + wetDiffPts.toFixed(1) + '%';

  if (cropId === 'aman') {
    // Aman is rainfed, highly sensitive to monsoon deficit or early withdrawal
    if (rainDiffPct <= -18 || wetDiffPts <= -5.0) {
      risk = 'high';
      reasonEn = `Significant monsoon rainfall deficit (${rPctFmt}) and soil moisture depletion (${wPtsFmt}) present severe moisture stress during vegetative and grain-filling stages.`;
      reasonBn = `আমন মৌসুমে বৃষ্টিপাতের তীব্র ঘাটতি (${rPctFmt}) ও মাটির আর্দ্রতা হ্রাস (${wPtsFmt}) কুশি ও শীষ গঠনের সংবেদনশীল সময়ে উচ্চ পানির সংকট নির্দেশ করে।`;
    } else if (rainDiffPct <= -8 || wetDiffPts <= -2.0) {
      risk = 'medium';
      reasonEn = `Sub-optimal monsoon rainfall (${rPctFmt}) relative to baseline; supplemental irrigation may be required to safeguard panicle formation.`;
      reasonBn = `আমন মৌসুমে বৃষ্টিপাত গড়ের চেয়ে কিছুটা কম (${rPctFmt}); শীষ গঠনের সময় ফলন রক্ষার্থে সম্পূরক সেচ প্রয়োজন হতে পারে।`;
    } else if (rainDiffPct >= 40) {
      risk = 'medium';
      reasonEn = `Excessive monsoon rainfall (${rPctFmt}) elevates risk of prolonged seedling submergence and localized drainage congestion.`;
      reasonBn = `আমন মৌসুমে অতিরিক্ত বৃষ্টিপাত (${rPctFmt}) চারা নিমজ্জন ও দীর্ঘমেয়াদি জলাবদ্ধতার ঝুঁকি তৈরি করে।`;
    } else {
      risk = 'low';
      reasonEn = `Monsoon precipitation (${rPctFmt}) and root-zone wetness (${wPtsFmt}) remain stable and supportive of normal rainfed Aman yields.`;
      reasonBn = `মৌসুমি বৃষ্টিপাত (${rPctFmt}) এবং মাটির আর্দ্রতা (${wPtsFmt}) অনুকূল সীমার মধ্যে রয়েছে, যা আমনের স্বাভাবিক ফলনে সহায়ক।`;
    }
  } else if (cropId === 'aus') {
    // Aus depends on pre-monsoon showers; vulnerable to drought and pre-monsoon flash floods
    if (rainDiffPct <= -22 || wetDiffPts <= -5.0) {
      risk = 'high';
      reasonEn = `Severe pre-monsoon rainfall deficit (${rPctFmt}) restricts land preparation, germination, and early vegetative growth.`;
      reasonBn = `প্রাক-বর্ষা মৌসুমে তীব্র বৃষ্টিপাতের ঘাটতি (${rPctFmt}) জমি তৈরি ও চারা গজানোর প্রাথমিক পর্যায়ে গুরুতর প্রতিকূলতা তৈরি করছে।`;
    } else if (rainDiffPct <= -10 || wetDiffPts <= -2.5) {
      risk = 'medium';
      reasonEn = `Pre-monsoon precipitation is running below baseline (${rPctFmt}); supplementary shallow irrigation is advisable for seedling establishment.`;
      reasonBn = `প্রাক-বর্ষা বৃষ্টিপাত স্বাভাবিকের চেয়ে কম (${rPctFmt}); চারা শক্ত করার জন্য সম্পূরক অগভীর সেচ প্রয়োজন হতে পারে।`;
    } else if (rainDiffPct >= 35) {
      risk = 'medium';
      reasonEn = `Elevated early monsoon rains (${rPctFmt}) increase vulnerability to pre-harvest flash flooding in low-lying tracts.`;
      reasonBn = `মৌসুমের শুরুতে অতিরিক্ত বৃষ্টিপাত (${rPctFmt}) নিম্নাঞ্চলে আগাম আকস্মিক বন্যার ঝুঁকি বৃদ্ধি করে।`;
    } else {
      risk = 'low';
      reasonEn = `Adequate pre-monsoon showers (${rPctFmt}) and balanced soil wetness (${wPtsFmt}) provide favourable conditions for Aus establishment.`;
      reasonBn = `পর্যাপ্ত প্রাক-বর্ষা বৃষ্টিপাত (${rPctFmt}) ও মাটির ভারসাম্যপূর্ণ আর্দ্রতা (${wPtsFmt}) আউশ আবাদে অনুকূল পরিবেশ নিশ্চিত করছে।`;
    }
  } else {
    // Boro is irrigated rabi crop; sensitive to ground water availability, dry winter moisture, and late heat
    if (wetDiffPts <= -5.0 || rainDiffPct <= -35) {
      risk = 'high';
      reasonEn = `Depleted root-zone moisture (${wPtsFmt}) during dry rabi months sharply increases irrigation pumping demands and costs.`;
      reasonBn = `শীত ও বসন্ত মৌসুমে মাটির আর্দ্রতার তীব্র সংকট (${wPtsFmt}) সেচ খরচ বৃদ্ধি ও ভূগর্ভস্থ পানির ওপর অত্যধিক চাপ নির্দেশ করে।`;
    } else if (wetDiffPts <= -2.0 || rainDiffPct <= -15) {
      risk = 'medium';
      reasonEn = `Moderate soil moisture deficit (${wPtsFmt}) indicates declining shallow aquifer recharge; regulated irrigation scheduling is recommended.`;
      reasonBn = `মাটির আর্দ্রতায় কিছুটা ঘাটতি (${wPtsFmt}) রয়েছে; ভূগর্ভস্থ পানির অপচয় রোধে নিয়ন্ত্রিত সেচ ব্যবস্থাপনা পরামর্শযোগ্য।`;
    } else {
      risk = 'low';
      reasonEn = `Soil wetness levels (${wPtsFmt}) and winter precipitation align with baseline norms, sustaining standard Boro irrigation schedules.`;
      reasonBn = `মাটির আর্দ্রতার মাত্রা (${wPtsFmt}) স্বাভাবিক মানদণ্ডে রয়েছে, যা বোরো সেচ কার্যক্রম পরিচালনায় অনুকূল।`;
    }
  }

  return {
    crop,
    baseline: { rain: Math.round(baseRainTotal), wet: Math.round(baseWetAvg * 10) / 10 },
    now: { rain: Math.round(nowRainTotal), wet: Math.round(nowWetAvg * 10) / 10 },
    projected: { rain: Math.round(projRainTotal), wet: Math.round(projWetAvg * 10) / 10 },
    changes: {
      rainDiffPct: Math.round(rainDiffPct * 10) / 10,
      wetDiffPts: Math.round(wetDiffPts * 10) / 10,
      projRainDiffPct: Math.round(projRainDiffPct * 10) / 10,
      projWetDiffPts: Math.round(projWetDiffPts * 10) / 10,
    },
    risk,
    reasonEn,
    reasonBn,
  };
}

/**
 * Checks if the last 30–60 days for a given district fall outside the historical normal range.
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

  // Calculate baseline normal distribution (first 10 years, 2001-2010) for this exact calendar window
  const histRain: number[] = [];
  const histTmax: number[] = [];
  const histWet: number[] = [];

  for (let y = 0; y < 10; y++) {
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

  const calcMean = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const calcSD = (arr: number[]) => {
    if (!arr.length) return 0;
    const m = calcMean(arr);
    return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length);
  };

  const meanRain = calcMean(histRain);
  const sdRain = calcSD(histRain) || 1;
  const zRain = (curRain - meanRain) / sdRain;

  const meanTmax = calcMean(histTmax);
  const sdTmax = calcSD(histTmax) || 0.5;
  const zTmax = (curTmax - meanTmax) / sdTmax;

  const meanWet = calcMean(histWet);
  const sdWet = calcSD(histWet) || 1;
  const zWet = (curWet - meanWet) / sdWet;

  // Statistical threshold: |z| >= 1.5 corresponds to outside the ~87% normal range
  const isRainUnusual = Math.abs(zRain) >= 1.5;
  const isTmaxUnusual = Math.abs(zTmax) >= 1.5;
  const isWetUnusual = Math.abs(zWet) >= 1.5;

  const isUnusual = isRainUnusual || isTmaxUnusual || isWetUnusual;

  let titleEn = 'Within Normal Range';
  let titleBn = 'স্বাভাবিক সীমার মধ্যে';
  let detailEn = 'Recent 60-day weather matches historical seasonal expectations.';
  let detailBn = 'গত ৬০ দিনের আবহাওয়া ঐতিহাসিক গড় সীমার অনুকূলে রয়েছে।';
  let badgeType: 'normal' | 'alert' = 'normal';

  if (isUnusual) {
    badgeType = 'alert';
    const driversEn: string[] = [];
    const driversBn: string[] = [];

    if (isRainUnusual) {
      const diffPct = Math.round(((curRain - meanRain) / meanRain) * 100);
      if (diffPct > 0) {
        driversEn.push(`Rainfall is +${diffPct}% above historical normal`);
        driversBn.push(`বৃষ্টিপাত গড়ের চেয়ে +${diffPct}% বেশি`);
      } else {
        driversEn.push(`Rainfall deficit of ${diffPct}% below normal`);
        driversBn.push(`বৃষ্টিপাতের ঘাটতি ${diffPct}%`);
      }
    }

    if (isTmaxUnusual) {
      const diffT = (curTmax - meanTmax).toFixed(1);
      if (curTmax > meanTmax) {
        driversEn.push(`Max temperature is running +${diffT}°C higher than normal`);
        driversBn.push(`সর্বোচ্চ তাপমাত্রা গড়ের চেয়ে +${diffT}°সে বেশি`);
      } else {
        driversEn.push(`Max temperature is ${diffT}°C below normal`);
        driversBn.push(`সর্বোচ্চ তাপমাত্রা গড়ের চেয়ে ${diffT}°সে কম`);
      }
    }

    if (isWetUnusual) {
      const diffW = (curWet - meanWet).toFixed(1);
      if (curWet > meanWet) {
        driversEn.push(`Soil wetness is +${diffW}% elevated`);
        driversBn.push(`মাটির আর্দ্রতা +${diffW}% বেশি`);
      } else {
        driversEn.push(`Soil wetness is ${diffW}% depleted`);
        driversBn.push(`মাটির আর্দ্রতা ${diffW}% কম`);
      }
    }

    titleEn = 'Unusual Now';
    titleBn = 'বর্তমানে অস্বাভাবিক আবহাওয়া';
    detailEn = driversEn.join('. ') + '.';
    detailBn = driversBn.join('। ') + '।';
  }

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
    curTmax: Math.round(curTmax * 10) / 10,
    meanTmax: Math.round(meanTmax * 10) / 10,
    zTmax: Math.round(zTmax * 10) / 10,
    curWet: Math.round(curWet * 10) / 10,
    meanWet: Math.round(meanWet * 10) / 10,
    zWet: Math.round(zWet * 10) / 10,
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
