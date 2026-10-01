import { describe, expect, it } from 'vitest';
import cmip6 from '../data/cmip6.json';
import { cmip6For, domainFor, valueAt, districts } from './metrics.js';
import { parseUrlState, buildUrlQuery } from './urlState.js';
import { FUTURE_YEAR } from './constants.js';

describe('CMIP6 Downscaled Projections Dataset', () => {
  it('contains valid metadata and scenario definitions', () => {
    expect(cmip6.models).toHaveLength(5);
    expect(cmip6.models).toContain('GFDL-ESM4');
    expect(cmip6.models).toContain('MPI-ESM1-2-HR');
    expect(cmip6.years).toHaveLength(30);
    expect(cmip6.years[0]).toBe(2021);
    expect(cmip6.years.at(-1)).toBe(2050);

    expect(cmip6.scenarios.ssp245).toBeDefined();
    expect(cmip6.scenarios.ssp585).toBeDefined();
    expect(cmip6.scenarios.ssp245.name).toBe('SSP2-4.5');
    expect(cmip6.scenarios.ssp585.name).toBe('SSP5-8.5');
  });

  it('contains all 64 districts with baseline and scenario projections', () => {
    const districtIds = Object.keys(cmip6.districts);
    expect(districtIds).toHaveLength(64);

    for (const d of districts) {
      expect(cmip6.districts[d.id]).toBeDefined();
      const distData = cmip6.districts[d.id];
      expect(distData.baseline).toBeDefined();
      expect(distData.baseline.heat).toBeGreaterThan(25);
      expect(distData.baseline.rain).toBeGreaterThan(500);

      for (const scen of ['ssp245', 'ssp585']) {
        expect(distData[scen]).toBeDefined();
        for (const metric of ['heat', 'rain', 'monsoon', 'wet']) {
          const series = distData[scen][metric];
          expect(series.median).toHaveLength(30);
          expect(series.low).toHaveLength(30);
          expect(series.high).toHaveLength(30);

          // Test mathematical bounds: low <= median <= high
          for (let i = 0; i < 30; i++) {
            expect(series.low[i]).toBeLessThanOrEqual(series.median[i]);
            expect(series.median[i]).toBeLessThanOrEqual(series.high[i]);
          }
        }
      }
    }
  });

  it('reflects higher temperatures and higher extreme monsoon rainfall under SSP5-8.5 than SSP2-4.5 by 2050', () => {
    // In physics models, high emissions drive greater warming and atmospheric moisture capacity
    const dhaka = cmip6.districts.dhaka;
    const temp245_2050 = dhaka.ssp245.heat.median.at(-1);
    const temp585_2050 = dhaka.ssp585.heat.median.at(-1);
    expect(temp585_2050).toBeGreaterThan(temp245_2050);

    const rain245_2050 = dhaka.ssp245.monsoon.median.at(-1);
    const rain585_2050 = dhaka.ssp585.monsoon.median.at(-1);
    expect(rain585_2050).toBeGreaterThan(rain245_2050);
  });
});

describe('cmip6For aggregation helper', () => {
  it('returns null for statistical scenario or invalid scenario', () => {
    expect(cmip6For(['dhaka'], 'heat', 'statistical')).toBeNull();
    expect(cmip6For(['dhaka'], 'heat', 'invalid')).toBeNull();
  });

  it('aggregates single district projections correctly', () => {
    const res = cmip6For(['dhaka'], 'heat', 'ssp245');
    expect(res).not.toBeNull();
    expect(res.scenario).toBe('ssp245');
    expect(res.years).toHaveLength(30);
    expect(res.median).toHaveLength(30);
    expect(res.low).toHaveLength(30);
    expect(res.high).toHaveLength(30);

    const idx2040 = cmip6.years.indexOf(FUTURE_YEAR);
    expect(res.at2040.median).toBe(res.median[idx2040]);
    expect(res.at2040.low).toBe(res.low[idx2040]);
    expect(res.at2040.high).toBe(res.high[idx2040]);
  });

  it('aggregates multi-district division means correctly', () => {
    const ids = ['dhaka', 'gazipur'];
    const res = cmip6For(ids, 'heat', 'ssp585');
    const d1 = cmip6.districts.dhaka.ssp585.heat.median[0];
    const d2 = cmip6.districts.gazipur.ssp585.heat.median[0];
    const expected = Math.round(((d1 + d2) / 2) * 10) / 10;
    expect(res.median[0]).toBeCloseTo(expected, 1);
  });
});

describe('valueAt scenario integration', () => {
  it('returns distinct values for statistical vs SSP2-4.5 vs SSP5-8.5 in future mode', () => {
    const statVal = valueAt('dhaka', 'heat', 'future', null, false, 'statistical');
    const ssp245Val = valueAt('dhaka', 'heat', 'future', null, false, 'ssp245');
    const ssp585Val = valueAt('dhaka', 'heat', 'future', null, false, 'ssp585');

    expect(statVal).toBeGreaterThan(0);
    expect(ssp245Val).toBeGreaterThan(0);
    expect(ssp585Val).toBeGreaterThan(0);

    const expected245 = cmip6.districts.dhaka.ssp245.heat.median[cmip6.years.indexOf(FUTURE_YEAR)];
    expect(ssp245Val).toBe(expected245);
  });

  it('correctly calculates future anomalies against baseline across scenarios', () => {
    const anomStat = valueAt('dhaka', 'heat', 'future', null, true, 'statistical');
    const anom245 = valueAt('dhaka', 'heat', 'future', null, true, 'ssp245');

    expect(typeof anomStat).toBe('number');
    expect(typeof anom245).toBe('number');
  });

  it('returns model values for specific projection years (e.g. 2035)', () => {
    const val2035 = valueAt('dhaka', 'heat', null, 2035, false, 'ssp245');
    const expected = cmip6.districts.dhaka.ssp245.heat.median[2035 - 2021];
    expect(val2035).toBe(expected);
  });
});

describe('domainFor with scenario support', () => {
  it('calculates valid domain scale encompassing scenario projections', () => {
    const domStat = domainFor(['dhaka'], 'heat', false, 'statistical');
    const dom245 = domainFor(['dhaka'], 'heat', false, 'ssp245');

    expect(domStat[0]).toBeLessThan(domStat[1]);
    expect(dom245[0]).toBeLessThan(dom245[1]);
  });
});

describe('urlState scenario synchronization', () => {
  it('parses scenario query parameter correctly', () => {
    expect(parseUrlState('?scenario=ssp245').scenario).toBe('ssp245');
    expect(parseUrlState('?scenario=ssp585').scenario).toBe('ssp585');
    expect(parseUrlState('?scenario=invalid').scenario).toBe('statistical');
    expect(parseUrlState('').scenario).toBe('statistical');
  });

  it('serializes scenario into URL query string only when non-default', () => {
    expect(buildUrlQuery({ scenario: 'statistical' })).not.toContain('scenario');
    expect(buildUrlQuery({ scenario: 'ssp245' })).toContain('scenario=ssp245');
    expect(buildUrlQuery({ scenario: 'ssp585' })).toContain('scenario=ssp585');
  });
});
