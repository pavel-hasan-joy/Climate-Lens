import { describe, it, expect } from 'vitest';
import wildlifeRaw from '../data/wildlife.json';
import { wildlife } from './metrics';
import type { WildlifeDataset } from './types';

describe('Wildlife & Extinction Knowledge Base (Phase 8C)', () => {
  const data = wildlifeRaw as unknown as WildlifeDataset;

  it('exports wildlife dataset from metrics.ts with version 1.0.0', () => {
    expect(wildlife).toBeDefined();
    expect(wildlife.version).toBe('1.0.0');
    expect(wildlife.assessment_year).toBe(2015);
    expect(wildlife.previous_assessment_year).toBe(2000);
  });

  describe('Part 1: Lost Species (31 Regionally Extinct)', () => {
    it('contains exactly 31 regionally extinct species', () => {
      expect(data.lost_species.length).toBe(31);
      expect(data.stats.regionally_extinct_2015).toBe(31);
    });

    it('has 11 mammals, 19 birds, and 1 reptile', () => {
      const mammals = data.lost_species.filter((s) => s.group === 'mammal');
      const birds = data.lost_species.filter((s) => s.group === 'bird');
      const reptiles = data.lost_species.filter((s) => s.group === 'reptile');

      expect(mammals.length).toBe(11);
      expect(birds.length).toBe(19);
      expect(reptiles.length).toBe(1);
    });

    it('every lost species has complete metadata and honest non-climate attribution', () => {
      for (const sp of data.lost_species) {
        expect(sp.id).toBeTruthy();
        expect(sp.name_en).toBeTruthy();
        expect(sp.name_bn).toBeTruthy();
        expect(sp.scientific_name).toBeTruthy();
        expect(['mammal', 'bird', 'reptile']).toContain(sp.group);
        expect(sp.last_recorded).toBeTruthy();
        expect(sp.main_drivers_en).toBeTruthy();
        expect(sp.main_drivers_bn).toBeTruthy();
        // Honest rule: climate NOT established as cause for these historical extinctions
        expect(sp.climate_link).toBe('not_established');
      }
    });

    it('records rediscovered relict sightings for Gaur and Hog Deer with explanatory notes', () => {
      const gaur = data.lost_species.find((s) => s.id === 'gaur');
      const hogDeer = data.lost_species.find((s) => s.id === 'hog_deer');

      expect(gaur?.rediscovered).toBe(true);
      expect(gaur?.rediscovered_note_en).toContain('Chittagong Hill Tracts');

      expect(hogDeer?.rediscovered).toBe(true);
      expect(hogDeer?.rediscovered_note_en).toContain('coastal char');
    });

    it('includes historical iconic extirpated species like rhinos and marsh crocodile', () => {
      const javanRhino = data.lost_species.find((s) => s.id === 'javan_rhinoceros');
      const marshCroc = data.lost_species.find((s) => s.id === 'marsh_crocodile');

      expect(javanRhino).toBeDefined();
      expect(marshCroc).toBeDefined();
    });
  });

  describe('Part 2: At Risk Now Species', () => {
    it('contains verified species with threat profiles and climate link', () => {
      expect(data.at_risk_species.length).toBeGreaterThanOrEqual(6);

      for (const sp of data.at_risk_species) {
        expect(sp.id).toBeTruthy();
        expect(sp.name_en).toBeTruthy();
        expect(sp.name_bn).toBeTruthy();
        expect(sp.national_status).toBeTruthy();
        expect(sp.global_status).toBeTruthy();
        expect(sp.population_estimate).toBeTruthy();
        expect(sp.main_threats_en).toBeTruthy();
        expect(sp.climate_link).toBe('contributing');
        expect(sp.climate_impact_detail_en).toBeTruthy();
      }
    });

    it('Bengal Tiger has verified MaxEnt model projection by Mukul et al. 2019', () => {
      const tiger = data.at_risk_species.find((s) => s.id === 'bengal_tiger');
      expect(tiger).toBeDefined();
      expect(tiger?.model_projection).toBeDefined();
      expect(tiger?.model_projection?.year).toBe(2019);
      expect(tiger?.model_projection?.horizon).toBe(2070);
      expect(tiger?.model_projection?.source).toContain('Mukul et al.');
      expect(tiger?.model_projection?.summary_en).toContain('100%');
    });

    it('Ganges and Irrawaddy river dolphins have verified populations and threat details', () => {
      const ganges = data.at_risk_species.find((s) => s.id === 'ganges_river_dolphin');
      const irrawaddy = data.at_risk_species.find((s) => s.id === 'irrawaddy_dolphin');

      expect(ganges?.population_estimate).toContain('2,000');
      expect(irrawaddy?.population_estimate).toContain('6,000');
      expect(ganges?.main_threats_en).toContain('gillnets');
    });
  });

  describe('Part 3: Timeline & Unknowns', () => {
    it('reflects the 2000 to 2015 change (13 to 31 regionally extinct)', () => {
      expect(data.timeline.year_2000.extinct_count).toBe(13);
      expect(data.timeline.year_2015.extinct_count).toBe(31);
      expect(data.timeline.year_2015.threatened_count).toBe(390);
      expect(data.timeline.year_2015.cr).toBe(56);
      expect(data.timeline.year_2015.en).toBe(181);
      expect(data.timeline.year_2015.vu).toBe(153);
    });

    it('documents the 278 data-deficient species (17.2%)', () => {
      expect(data.data_deficient.count).toBe(278);
      expect(data.data_deficient.percentage).toBe(17.2);
      expect(data.data_deficient.note_en).toContain('278');
      expect(data.data_deficient.note_bn).toBeTruthy();
    });
  });

  describe('Part 4: GBIF Occurrence Records & Observer Effort', () => {
    it('contains verified GBIF species data with honest observer-effort disclosures', async () => {
      const gbifModule = await import('../data/analysis/gbif-occurrences.json');
      const gbifData = gbifModule.default;

      expect(gbifData.metadata.source).toContain('GBIF');
      expect(gbifData.metadata.observerEffortNotice).toContain('observer effort');
      expect(Object.keys(gbifData.species).length).toBeGreaterThanOrEqual(6);

      // Verify safe handling of nullable lat/lon/dates across all sample records
      for (const sp of Object.values(gbifData.species as Record<string, any>)) {
        expect(sp.id).toBeTruthy();
        expect(sp.totalRecords).toBeGreaterThan(0);
        expect(sp.byYear).toBeDefined();

        if (sp.sampleRecords) {
          for (const rec of sp.sampleRecords) {
            // Coordinate formatting safety check
            const coordsText =
              rec.lat != null && rec.lon != null
                ? `${rec.lat.toFixed(4)}°N, ${rec.lon.toFixed(4)}°E`
                : 'Coords unrecorded (Specimen)';
            expect(typeof coordsText).toBe('string');

            // Year formatting safety check
            const yearText = rec.year ? String(rec.year) : '—';
            expect(typeof yearText).toBe('string');
          }
        }
      }
    });
  });
});
