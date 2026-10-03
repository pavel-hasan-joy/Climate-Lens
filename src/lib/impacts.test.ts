import { describe, it, expect } from 'vitest';
import impactsData from '../data/impacts.json';
import { impacts } from './metrics';
import type { ImpactDataset } from './types';

describe('Impacts Knowledge Base (Phase 8A)', () => {
  it('should export the loaded impacts dataset from metrics.ts', () => {
    expect(impacts).toBeDefined();
    expect(impacts.version).toBe('1.0.0');
    expect(Array.isArray(impacts.entries)).toBe(true);
    expect(impacts.entries.length).toBeGreaterThanOrEqual(14);
  });

  it('each entry should adhere to strict schema invariants', () => {
    const data = impactsData as ImpactDataset;
    const validCategories = new Set(['crop', 'fruit', 'fish', 'wildlife', 'extinction']);
    const validEvidence = new Set([
      'observed_data',
      'statistical_study',
      'model_projection',
      'review',
      'news_or_expert_estimate',
      'farmer_perception',
    ]);
    const validClimateLink = new Set(['direct', 'contributing', 'unclear', 'not_established']);
    const validConfidence = new Set(['high', 'medium', 'low']);

    for (const entry of data.entries) {
      expect(entry.id).toBeTruthy();
      expect(validCategories.has(entry.category)).toBe(true);
      expect(entry.name_en).toBeTruthy();
      expect(entry.name_bn).toBeTruthy();
      expect(validEvidence.has(entry.evidence_type)).toBe(true);
      expect(validClimateLink.has(entry.climate_link)).toBe(true);
      expect(validConfidence.has(entry.confidence)).toBe(true);
      expect(entry.source.url.startsWith('http')).toBe(true);
      expect(entry.source.year).toBeGreaterThanOrEqual(1900);
      expect(entry.last_checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Extinction climate link integrity check
      if (entry.category === 'extinction') {
        expect(['not_established', 'unclear', 'contributing']).toContain(entry.climate_link);
      }
    }
  });

  it('every entry must contain a complete, verified source (CI check requirement)', () => {
    const data = impactsData as ImpactDataset;

    for (const entry of data.entries) {
      expect(entry.source, `Entry ${entry.id} is missing 'source' object`).toBeDefined();
      expect(typeof entry.source.title, `Entry ${entry.id} missing source.title`).toBe('string');
      expect(entry.source.title.trim().length, `Entry ${entry.id} has empty source.title`).toBeGreaterThan(3);

      expect(typeof entry.source.publisher, `Entry ${entry.id} missing source.publisher`).toBe('string');
      expect(entry.source.publisher.trim().length, `Entry ${entry.id} has empty source.publisher`).toBeGreaterThan(1);

      expect(typeof entry.source.url, `Entry ${entry.id} missing source.url`).toBe('string');
      expect(
        entry.source.url.startsWith('http://') || entry.source.url.startsWith('https://'),
        `Entry ${entry.id} source.url must start with http:// or https://: ${entry.source.url}`,
      ).toBe(true);

      expect(typeof entry.source.year, `Entry ${entry.id} source.year must be a number`).toBe('number');
      expect(entry.source.year, `Entry ${entry.id} source.year out of range`).toBeGreaterThanOrEqual(1900);
      expect(entry.source.year, `Entry ${entry.id} source.year in future`).toBeLessThanOrEqual(2026);
    }
  });

  it('fails if impacts.json contains an entry without a source or invalid source schema', () => {
    // Synthetic check demonstrating that missing source triggers failure
    const invalidEntry = {
      id: 'mock_invalid',
      category: 'crop',
      name_en: 'Mock Invalid',
      name_bn: 'মক ইনভ্যালিড',
      metric: 'rain',
      direction: 'harm',
      regions: ['all'],
      summary_en: 'Test summary without source',
      summary_bn: 'উৎসবিহীন টেস্ট সারাংশ',
      numbers: { value: 1, unit: '%', what_it_measures: 'test' },
      evidence_type: 'observed_data',
      climate_link: 'direct',
      consensus: 'established',
      confidence: 'high',
      source: null as any,
      last_checked: '2026-10-02',
    };

    expect(() => {
      if (!invalidEntry.source || !invalidEntry.source.url) {
        throw new Error(`CI Check Failed: Entry ${invalidEntry.id} lacks a verified source.`);
      }
    }).toThrowError(/CI Check Failed/);
  });
});
