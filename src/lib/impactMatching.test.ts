import { describe, it, expect } from 'vitest';
import {
  evaluateThreshold,
  getHowSureExplanation,
  getImpactsFor,
  getTimeModeContext,
  matchesMetric,
  matchesRegion,
} from './impactMatching';
import impactsRaw from '../data/impacts.json';
import type { ImpactDataset } from './types';

const data = impactsRaw as unknown as ImpactDataset;

describe('Impact Matching & Threshold Evaluation (Phase 8B)', () => {
  const litchiEntry = data.entries.find((e) => e.id === 'fruit_litchi_dinajpur_heat_drought')!;
  const mangoThresholdEntry = data.entries.find((e) => e.id === 'fruit_mango_temperature_threshold')!;
  const tigerEntry = data.entries.find((e) => e.id === 'wildlife_bengal_tiger_sundarbans_habitat')!;
  const boroMoistureEntry = data.entries.find((e) => e.id === 'crop_boro_moisture_stress')!;
  const redListEntry = data.entries.find((e) => e.id === 'extinction_red_list_bangladesh_2015')!;
  const mixedRiceEntry = data.entries.find((e) => e.id === 'crop_rice_climatology_national')!;

  describe('matchesRegion', () => {
    it('matches Dinajpur specifically for Dinajpur litchi', () => {
      expect(matchesRegion(litchiEntry, 'dinajpur', 'rangpur')).toBe(true);
      expect(matchesRegion(litchiEntry, 'chittagong', 'chittagong')).toBe(false);
    });

    it('matches Chapainawabganj and Rajshahi for mango thermal bounds', () => {
      expect(matchesRegion(mangoThresholdEntry, 'chapai-nawabganj', 'rajshahi')).toBe(true);
      expect(matchesRegion(mangoThresholdEntry, 'rajshahi', 'rajshahi')).toBe(true);
      expect(matchesRegion(mangoThresholdEntry, 'sylhet', 'sylhet')).toBe(false);
    });

    it('matches Sundarbans districts (Bagerhat, Khulna, Satkhira) for Bengal Tiger', () => {
      expect(matchesRegion(tigerEntry, 'bagerhat', 'khulna')).toBe(true);
      expect(matchesRegion(tigerEntry, 'satkhira', 'khulna')).toBe(true);
      expect(matchesRegion(tigerEntry, 'khulna', 'khulna')).toBe(true);
      expect(matchesRegion(tigerEntry, 'dhaka', 'dhaka')).toBe(false);
    });

    it('matches national level entries for any district or country-wide view', () => {
      expect(matchesRegion(redListEntry, 'dhaka', 'dhaka')).toBe(true);
      expect(matchesRegion(redListEntry, null, null)).toBe(true);
    });
  });

  describe('matchesMetric', () => {
    it('matches temp to heat', () => {
      expect(matchesMetric('temp', 'heat')).toBe(true);
      expect(matchesMetric('temp', 'rain')).toBe(false);
    });

    it('matches soil to wet', () => {
      expect(matchesMetric('soil', 'wet')).toBe(true);
      expect(matchesMetric('soil', 'heat')).toBe(false);
    });

    it('matches rain to rain and monsoon', () => {
      expect(matchesMetric('rain', 'rain')).toBe(true);
      expect(matchesMetric('rain', 'monsoon')).toBe(true);
      expect(matchesMetric('rain', 'heat')).toBe(false);
    });

    it('matches multi to all metrics', () => {
      expect(matchesMetric('multi', 'heat')).toBe(true);
      expect(matchesMetric('multi', 'rain')).toBe(true);
      expect(matchesMetric('multi', 'wet')).toBe(true);
      expect(matchesMetric('multi', 'monsoon')).toBe(true);
    });
  });

  describe('evaluateThreshold', () => {
    it('returns null if entry has no cited threshold', () => {
      expect(evaluateThreshold(litchiEntry, 'dinajpur')).toBeNull();
      expect(evaluateThreshold(redListEntry, 'dhaka')).toBeNull();
    });

    it('evaluates boro rice moisture deficit entry threshold correctly', () => {
      expect(boroMoistureEntry.metric).toBe('soil');
      expect(boroMoistureEntry.threshold?.value).toBe(60);
      const res = evaluateThreshold(boroMoistureEntry, 'bogra', 'rajshahi', 'wet', 'now');
      expect(res).not.toBeNull();
      expect(res?.thresholdValue).toBe(60);
      expect(res?.unit).toBe('%');
    });

    it('evaluates mango 35°C threshold against live district heat data', () => {
      const result = evaluateThreshold(mangoThresholdEntry, 'chapai-nawabganj', 'rajshahi', 'heat', 'now');
      expect(result).not.toBeNull();
      expect(result?.hasThreshold).toBe(true);
      expect(result?.thresholdValue).toBe(35);
      expect(result?.unit).toBe('°C');
      expect(result?.source).toContain('Chapainawabganj');
      expect(typeof result?.districtValue).toBe('number');
      expect(result?.messageEn).toContain("This district's value");
      expect(result?.messageBn).toContain('এই জেলার মান');
    });

    it('never evaluates a threshold without a verifiable source', () => {
      const mockEntry = {
        ...mangoThresholdEntry,
        threshold: {
          value: 35,
          unit: '°C',
          condition: 'test without source',
          source: '',
        },
      };
      expect(evaluateThreshold(mockEntry, 'dinajpur')).toBeNull();
    });
  });

  describe('getTimeModeContext', () => {
    it('provides past/now phrasing as reported observation', () => {
      const ctx = getTimeModeContext('now', 'statistical');
      expect(ctx.phraseEn).toContain('has been documented');
      expect(ctx.phraseBn).toContain('নথিবদ্ধ করা হয়েছে');
    });

    it('provides future phrasing as projected risk with model or trend label', () => {
      const statCtx = getTimeModeContext('future', 'statistical');
      expect(statCtx.phraseEn).toContain('may be affected if the statistical Theil–Sen trend continues');

      const cmipCtx = getTimeModeContext('future', 'ssp245');
      expect(cmipCtx.phraseEn).toContain('may be affected if the CMIP6 multi-model projection continues');
    });
  });

  describe('getHowSureExplanation & mixed consensus', () => {
    it('properly generates explanations for all evidence types and confidence levels', () => {
      const tigerHowSure = getHowSureExplanation(tigerEntry);
      expect(tigerHowSure.evidenceTypeLabelEn).toBe('Model Projection');
      expect(tigerHowSure.climateLinkLabelEn).toBe('Contributing Factor');
      expect(tigerHowSure.confidenceLabelEn).toBe('High Confidence');
    });

    it('explains both sides when consensus is mixed', () => {
      expect(mixedRiceEntry.consensus).toBe('mixed');
      const mixedHowSure = getHowSureExplanation(mixedRiceEntry);
      expect(mixedHowSure.consensusLabelEn).toContain('Mixed');
      expect(mixedHowSure.mixedDivergenceEn).toBeDefined();
      expect(mixedHowSure.mixedDivergenceEn).toContain('65-year BMD weather station');
      expect(mixedHowSure.mixedDivergenceEn).toContain('Northwest Barind');
    });

    it('marks extinction as not established climate driver', () => {
      const extHowSure = getHowSureExplanation(redListEntry);
      expect(extHowSure.climateLinkLabelEn).toBe('Not Established');
      expect(extHowSure.climateLinkDescriptionEn).toContain('hunting and deforestation');
    });
  });

  describe('getImpactsFor filter query', () => {
    it('returns filtered impacts for Dinajpur under soil wetness', () => {
      const results = getImpactsFor({
        districtId: 'dinajpur',
        divisionId: 'rangpur',
        metric: 'wet',
        time: 'now',
        metricScope: 'current',
      });

      expect(results.length).toBeGreaterThan(0);
      const ids = results.map((r) => r.entry.id);
      expect(ids).toContain('crop_boro_moisture_stress');
      expect(ids).toContain('fruit_litchi_dinajpur_heat_drought');
    });

    it('returns all categories when categoryFilter is all or matches requested category', () => {
      const wildlifeResults = getImpactsFor({
        districtId: 'bagerhat',
        divisionId: 'khulna',
        categoryFilter: 'wildlife',
        metricScope: 'all',
      });
      expect(wildlifeResults.length).toBeGreaterThan(0);
      expect(wildlifeResults.every((r) => r.entry.category === 'wildlife')).toBe(true);
    });
  });
});
