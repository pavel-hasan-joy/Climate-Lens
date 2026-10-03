import { METRIC } from './constants';
import type { MetricId, Language } from './types';

export interface NarrativeParams {
  districtName: string;
  metric: MetricId;
  lang: Language;
  slopePerDecade: number;
  slopePerYear: number;
  pValue: number;
  significant: boolean;
  trend: 'increasing' | 'decreasing' | 'no_trend';
  latestAnomaly: number;
  pctAnomaly: number;
  baselineMean: number;
  percentile: number;
  heatwaveDays36C?: number;
  heavyRainDays50mm?: number;
  longestDrySpellDays?: number;
}

export interface GeneratedNarrative {
  trendSentence: string;
  anomalySentence: string;
  extremeSentence: string;
  fullParagraph: string;
}

/**
 * Converts Western digits to Bengali numerals when lang is 'bn'.
 */
function toDigits(val: number | string, lang: Language): string {
  if (lang !== 'bn') return String(val);
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(val).replace(/\d/g, (d) => bnDigits[Number(d)]);
}

/**
 * Auto-generates 3 plain-language sentences from computed statistics
 * using deterministic templates (NOT an LLM), adhering to strict scientific honesty.
 *
 * Rule: If a trend is not statistically significant, the sentence MUST say so.
 */
export function generateDistrictNarrative(params: NarrativeParams): GeneratedNarrative {
  const {
    districtName,
    metric,
    lang,
    slopePerDecade,
    pValue,
    significant,
    latestAnomaly,
    pctAnomaly,
    percentile,
    heatwaveDays36C = 0,
    heavyRainDays50mm = 0,
    longestDrySpellDays = 0,
  } = params;

  const m = METRIC[metric];
  const absSlope = Math.abs(slopePerDecade).toFixed(m.digits + 1);
  const pFormatted = pValue < 0.001 ? '< 0.001' : pValue.toFixed(3);
  const absAnom = Math.abs(latestAnomaly).toFixed(m.digits);
  const absPct = Math.abs(pctAnomaly).toFixed(1);

  let trendSentence = '';
  let anomalySentence = '';
  let extremeSentence = '';

  if (lang === 'bn') {
    const unitBn = m.unit === '°C' ? '°সে' : m.unit === '%' ? '%' : 'মিমি';
    const metricNameBn =
      metric === 'monsoon'
        ? 'বর্ষার বৃষ্টিপাত'
        : metric === 'rain'
          ? 'বার্ষিক বৃষ্টিপাত'
          : metric === 'heat'
            ? 'সর্বোচ্চ তাপমাত্রা'
            : 'মাটির আর্দ্রতা';

    // 1. Long-term trend sentence
    if (significant) {
      const dirBn = slopePerDecade > 0 ? 'বৃদ্ধি পেয়েছে' : 'হ্রাস পেয়েছে';
      trendSentence = `${districtName}-এ ২০০১–২০২৫ সময়ে গড় ${metricNameBn} প্রতি দশকে ${toDigits(absSlope, lang)} ${unitBn} ${dirBn}, যা পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ (p = ${toDigits(pFormatted, lang)})।`;
    } else {
      const dirBn = slopePerDecade > 0 ? 'বৃদ্ধির' : slopePerDecade < 0 ? 'হ্রাসের' : 'অপরিবর্তিত থাকার';
      trendSentence = `${districtName}-এ ২০০১–২০২৫ সময়ে ${metricNameBn} প্রতি দশকে ${toDigits(absSlope, lang)} ${unitBn} ${dirBn} মৃদু প্রবণতা দেখা গেলেও এটি পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ নয় (p = ${toDigits(pFormatted, lang)}) এবং স্বাভাবিক জলবায়ুগত তারতম্যের আওতাভুক্ত।`;
    }

    // 2. Anomaly & Baseline sentence
    const anomDirBn = latestAnomaly >= 0 ? 'বেশি' : 'কম';
    anomalySentence = `সাম্প্রতিক ১২ মাসের গড় মান ২০০১–২০১০ ভিত্তি বছরের চেয়ে ${toDigits(absAnom, lang)} ${unitBn} ${anomDirBn} (${toDigits(absPct, lang)}% ব্যবধান), যা জেলাটিকে ঐতিহাসিক ${toDigits(percentile, lang)}তম পার্সেন্টাইলে স্থান দিয়েছে।`;

    // 3. Extremes sentence
    extremeSentence = `পর্যবেক্ষিত সময়ে জেলায় ${toDigits(heatwaveDays36C, lang)} দিন তীব্র তাপপ্রবাহ (৩৬°সে+), ${toDigits(heavyRainDays50mm, lang)} দিন অতিভারী বৃষ্টি (৫০ মিমি+) এবং একটানা সর্বোচ্চ ${toDigits(longestDrySpellDays, lang)} দিন অনাবৃষ্টি রেকর্ড করা হয়েছে।`;
  } else {
    // English
    const unitEn = m.unit;
    const metricNameEn =
      metric === 'monsoon'
        ? 'monsoon rainfall'
        : metric === 'rain'
          ? 'annual rainfall'
          : metric === 'heat'
            ? 'maximum temperature'
            : 'root-zone soil wetness';

    // 1. Long-term trend sentence
    if (significant) {
      const dirEn = slopePerDecade > 0 ? 'rose' : 'declined';
      trendSentence = `In ${districtName}, the average ${metricNameEn} ${dirEn} by ${absSlope} ${unitEn} per decade between 2001 and 2025 (statistically significant, p = ${pFormatted}).`;
    } else {
      const dirEn = slopePerDecade > 0 ? 'slight increase' : slopePerDecade < 0 ? 'slight decrease' : 'flat trend';
      trendSentence = `In ${districtName}, ${metricNameEn} showed a ${dirEn} of ${absSlope} ${unitEn} per decade, but this change is not statistically significant (p = ${pFormatted}) and remains within normal historical variability.`;
    }

    // 2. Anomaly & Baseline sentence
    const anomDirEn = latestAnomaly >= 0 ? 'above' : 'below';
    anomalySentence = `The latest 12 months were ${absAnom} ${unitEn} ${anomDirEn} the 2001–2010 baseline (${absPct}% deviation), ranking this district in the ${percentile}th historical percentile.`;

    // 3. Extremes sentence
    extremeSentence = `Across the full observation window, the district experienced ${heatwaveDays36C} heatwave days (≥36°C), ${heavyRainDays50mm} heavy rainfall days (≥50mm), and a maximum dry spell of ${longestDrySpellDays} consecutive days.`;
  }

  const fullParagraph = `${trendSentence} ${anomalySentence} ${extremeSentence}`;

  return {
    trendSentence,
    anomalySentence,
    extremeSentence,
    fullParagraph,
  };
}
