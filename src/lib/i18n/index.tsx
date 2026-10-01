import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { en } from './en';
import { bn } from './bn';
import { METRIC, FUTURE_YEAR } from '../constants';
import type { Cmip6Result, DistrictStats, Language, MetricId, ScenarioId } from '../types';

export interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  toDigits: (val: string | number | null | undefined) => string;
  getDistrictName: (id: string) => string;
  getDivisionName: (id: string) => string;
  formatNum: (n: number | null | undefined, digits?: number) => string;
  formatVal: (metricId: MetricId, v: number | null | undefined) => string;
  formatAnom: (metricId: MetricId, diff: number | null | undefined) => string;
  formatSummary: (options: {
    name: string;
    metric: MetricId;
    stats: DistrictStats;
    isAnomaly: boolean;
    scenario?: ScenarioId;
    cmipData?: Cmip6Result | null;
  }) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaDigits(strOrNum: string | number | null | undefined): string {
  if (strOrNum == null) return '';
  return String(strOrNum).replace(/[0-9]/g, (d) => BN_DIGITS[+d]);
}

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('climate_lens_lang');
      if (saved === 'bn' || saved === 'en') return saved as Language;
    }
    return 'en';
  });

  const setLang = (nextLang: Language) => {
    setLangState(nextLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('climate_lens_lang', nextLang);
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      if (lang === 'bn') {
        document.body.classList.add('lang-bn');
      } else {
        document.body.classList.remove('lang-bn');
      }
    }
  }, [lang]);

  const dictionary = lang === 'bn' ? bn : en;

  const t = useMemo(() => {
    return (key: string, params: Record<string, string | number> = {}): string => {
      const parts = key.split('.');
      let val: unknown = dictionary;
      for (const p of parts) {
        val = (val as Record<string, unknown>)?.[p];
        if (val === undefined) break;
      }

      // Fallback to English if missing in target
      if (val === undefined) {
        let fallback: unknown = en;
        for (const p of parts) {
          fallback = (fallback as Record<string, unknown>)?.[p];
          if (fallback === undefined) break;
        }
        val = fallback;
      }

      if (typeof val !== 'string') return String(val ?? key);

      return val.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? String(params[k]) : `{${k}}`));
    };
  }, [dictionary]);

  const toDigits = useMemo(() => {
    return (val: string | number | null | undefined): string =>
      lang === 'bn' ? toBanglaDigits(val) : String(val ?? '');
  }, [lang]);

  const getDistrictName = useMemo(() => {
    return (id: string): string => {
      const dictVal = (dictionary.districts as Record<string, string>)?.[id];
      const enVal = (en.districts as Record<string, string>)?.[id];
      return dictVal || enVal || id;
    };
  }, [dictionary]);

  const getDivisionName = useMemo(() => {
    return (id: string): string => {
      const dictVal = (dictionary.divisions as Record<string, string>)?.[id];
      const enVal = (en.divisions as Record<string, string>)?.[id];
      return dictVal || enVal || id;
    };
  }, [dictionary]);

  const formatNum = useMemo(() => {
    return (n: number | null | undefined, digits: number = 0): string => {
      if (n == null || Number.isNaN(n)) return '–';
      const enFormatted = n.toLocaleString('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
      return lang === 'bn' ? toBanglaDigits(enFormatted) : enFormatted;
    };
  }, [lang]);

  const formatVal = useMemo(() => {
    return (metricId: MetricId, v: number | null | undefined): string => {
      const m = METRIC[metricId];
      if (!m) return '';
      const num = formatNum(v, m.digits);
      const unit =
        lang === 'bn'
          ? m.unit === '°C'
            ? '°সে'
            : m.unit === '%'
              ? '%'
              : ' মিমি'
          : m.unit === '%'
            ? '%'
            : ' ' + m.unit;
      return `${num}${unit.startsWith(' ') || unit === '%' ? unit : ' ' + unit}`;
    };
  }, [formatNum, lang]);

  const formatAnom = useMemo(() => {
    return (metricId: MetricId, diff: number | null | undefined): string => {
      if (diff == null || Number.isNaN(diff)) return '–';
      const m = METRIC[metricId];
      if (!m) return '';
      const sign = diff > 0 ? '+' : diff < 0 ? '−' : '±';
      const num = formatNum(Math.abs(diff), m.digits);
      const unit =
        lang === 'bn'
          ? m.unit === '°C'
            ? '°সে'
            : m.unit === '%'
              ? '%'
              : ' মিমি'
          : m.unit === '%'
            ? '%'
            : ' ' + m.unit;
      return `${sign}${num}${unit.startsWith(' ') || unit === '%' ? unit : ' ' + unit}`;
    };
  }, [formatNum, lang]);

  // Generates plain-language automated summaries (e.g., "Over the last 20 years the average max temperature in Rajshahi rose by 0.8°C")
  const formatSummary = useMemo(() => {
    return ({
      name,
      metric,
      stats,
      isAnomaly,
      scenario = 'statistical',
      cmipData = null,
    }: {
      name: string;
      metric: MetricId;
      stats: DistrictStats;
      isAnomaly: boolean;
      scenario?: ScenarioId;
      cmipData?: Cmip6Result | null;
    }): string => {
      const m = METRIC[metric];
      const annual = stats.annual;
      const firstVal = annual[0];
      const lastVal = annual[annual.length - 1];
      const diffHistorical = lastVal - firstVal;
      const yearsCount = annual.length;
      const rose = diffHistorical >= 0;
      const absDiff = Math.abs(diffHistorical).toFixed(m.digits);

      const decadal = Math.abs(stats.slope * 10).toFixed(metric === 'heat' ? 2 : 1);
      const slopeSign = stats.slope >= 0 ? '+' : '−';

      const diffNow = stats.now - stats.past;
      const diffFut = stats.future - stats.past;
      const up = stats.now >= stats.past;
      const trendUp = stats.future >= stats.past;

      const isCmip = scenario && scenario !== 'statistical' && cmipData?.at2040;
      const cmipMed = isCmip ? cmipData.at2040.median : stats.future;
      const cmipLow = isCmip ? cmipData.at2040.low : stats.future - stats.band;
      const cmipHigh = isCmip ? cmipData.at2040.high : stats.future + stats.band;
      const cmipDiffFut = isCmip ? cmipMed - stats.past : diffFut;

      if (lang === 'bn') {
        const mLabelBn = (bn.metrics as any)[metric]?.label || m.label;
        const unitBn = (bn.metrics as any)[metric]?.unit || m.unit;
        const diffHistoricalBn = toBanglaDigits(absDiff);
        const yearsCountBn = toBanglaDigits(yearsCount);
        const decadalBn = toBanglaDigits(decadal);
        const futValBn = toBanglaDigits(cmipMed.toFixed(m.digits));
        const lowBn = toBanglaDigits(cmipLow.toFixed(m.digits));
        const highBn = toBanglaDigits(cmipHigh.toFixed(m.digits));

        if (isCmip) {
          const scName = cmipData.info?.name || scenario;
          if (isAnomaly) {
            const anomBn = formatAnom(metric, diffNow);
            const futAnomBn = formatAnom(metric, cmipDiffFut);
            return (
              `গত ${yearsCountBn} বছরে ${name}-এ গড় ${mLabelBn} ${diffHistoricalBn} ${unitBn} ${rose ? 'বৃদ্ধি পেয়েছে' : 'হ্রাস পেয়েছে'} (${slopeSign}${decadalBn} ${unitBn}/দশক)। ` +
              `বর্তমানে বিচ্যুতি ${anomBn}। সিএমআইপি৬ (${scName}) বহু-মডেল প্রক্ষেপণে ২০৪০ সাল নাগাদ এই বিচ্যুতি ${futAnomBn} দাঁড়াতে পারে (১০ম–৯০তম শতক পরিসীমা: ${lowBn}–${highBn} ${unitBn})।`
            );
          }
          return (
            `গত ${yearsCountBn} বছরে ${name}-এ গড় ${mLabelBn} ${diffHistoricalBn} ${unitBn} ${rose ? 'বৃদ্ধি পেয়েছে' : 'হ্রাস পেয়েছে'} (${slopeSign}${decadalBn} ${unitBn}/দশক)। ` +
            `সিএমআইপি৬ (${scName}) বহু-মডেল পূর্বাভাস অনুযায়ী ২০৪০ নাগাদ ${name}-এ ${mLabelBn} প্রায় ${futValBn} ${unitBn}-এ পৌঁছাবে (১০ম–৯০তম শতক পরিসীমা: ${lowBn} থেকে ${highBn} ${unitBn})।`
          );
        }

        if (isAnomaly) {
          const anomBn = formatAnom(metric, diffNow);
          const futAnomBn = formatAnom(metric, diffFut);
          return (
            `গত ${yearsCountBn} বছরে ${name}-এ গড় ${mLabelBn} ${diffHistoricalBn} ${unitBn} ${rose ? 'বৃদ্ধি পেয়েছে' : 'হ্রাস পেয়েছে'} (${slopeSign}${decadalBn} ${unitBn}/দশক)। ` +
            `বর্তমানে তা ভিত্তি বছরের তুলনায় ${anomBn} বিচ্যুতিতে চলছে এবং ২০৪০ সাল নাগাদ এই ধারা ${futAnomBn} পরিবর্তন হতে পারে।`
          );
        }

        return (
          `গত ${yearsCountBn} বছরে ${name}-এ গড় ${mLabelBn} ${diffHistoricalBn} ${unitBn} ${rose ? 'বৃদ্ধি পেয়েছে' : 'হ্রাস পেয়েছে'} (${slopeSign}${decadalBn} ${unitBn}/দশক)। ` +
          `বর্তমানে ${name}-এ ${mLabelBn} ২০০১–২০১০ ভিত্তি বছরের তুলনায় ${up ? 'উচ্চতর' : 'নিম্নতর'} এবং বর্তমান ধারা বজায় থাকলে ২০৪০ সালের মধ্যে তা প্রায় ${futValBn} ${unitBn}-এ ${trendUp ? 'পৌঁছাবে' : 'নেমে আসবে'}।`
        );
      }

      // English
      if (isCmip) {
        const scName = cmipData.info?.name || scenario;
        if (isAnomaly) {
          return (
            `Over the last ${yearsCount} years, average ${m.label.toLowerCase()} in ${name} ${rose ? 'rose' : 'fell'} by ${absDiff} ${m.unit} (${slopeSign}${decadal} ${m.unit}/decade). ` +
            `Current anomaly is ${formatAnom(metric, diffNow)}. Under CMIP6 ${scName}, physics models project an anomaly of ${formatAnom(metric, cmipDiffFut)} by ${FUTURE_YEAR} (10th–90th percentile model spread: ${cmipLow.toFixed(m.digits)} to ${cmipHigh.toFixed(m.digits)} ${m.unit}).`
          );
        }
        return (
          `Over the last ${yearsCount} years, average ${m.label.toLowerCase()} in ${name} ${rose ? 'rose' : 'fell'} by ${absDiff} ${m.unit} (${slopeSign}${decadal} ${m.unit}/decade). ` +
          `Under CMIP6 ${scName}, physics-based downscaled models project ${cmipMed.toFixed(m.digits)} ${m.unit} by ${FUTURE_YEAR} (10th–90th percentile model spread: ${cmipLow.toFixed(m.digits)} to ${cmipHigh.toFixed(m.digits)} ${m.unit}).`
        );
      }

      if (isAnomaly) {
        return (
          `Over the last ${yearsCount} years, the average ${m.label.toLowerCase()} in ${name} ${rose ? 'rose' : 'fell'} by ${absDiff} ${m.unit} (${slopeSign}${decadal} ${m.unit}/decade). ` +
          `Current readings reflect an anomaly of ${formatAnom(metric, diffNow)} against the 2001–2010 baseline, projected to reach ${formatAnom(metric, diffFut)} by ${FUTURE_YEAR}.`
        );
      }

      return (
        `Over the last ${yearsCount} years, the average ${m.label.toLowerCase()} in ${name} ${rose ? 'rose' : 'fell'} by ${absDiff} ${m.unit} (${slopeSign}${decadal} ${m.unit}/decade). ` +
        `Current ${m.label.toLowerCase()} is running ${up ? 'higher' : 'lower'} than the 2001–2010 baseline, and the trend points towards ${stats.future.toFixed(m.digits)} ${m.unit} by ${FUTURE_YEAR}.`
      );
    };
  }, [formatAnom, lang]);

  const value: I18nContextValue = {
    lang,
    setLang,
    t,
    toDigits,
    getDistrictName,
    getDivisionName,
    formatNum,
    formatVal,
    formatAnom,
    formatSummary,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return ctx;
}
