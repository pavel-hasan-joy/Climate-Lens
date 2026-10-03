import { describe, expect, it } from 'vitest';
import { parseUrlState, buildUrlQuery } from './urlState.js';

describe('URL state synchronization', () => {
  it('parses empty query string to default state', () => {
    const state = parseUrlState('');
    expect(state).toEqual({
      divisionId: null,
      districtId: null,
      compareId: null,
      metric: 'monsoon',
      time: 'now',
      year: null,
      isAnomaly: false,
      scenario: 'statistical',
    });
  });

  it('parses valid query parameters correctly', () => {
    const search = '?dist=dhaka&comp=sylhet&m=heat&t=future&yr=2035&anom=1&scenario=ssp245';
    const state = parseUrlState(search);

    expect(state.districtId).toBe('dhaka');
    expect(state.divisionId).toBe('dhaka'); // inferred from district
    expect(state.compareId).toBe('sylhet');
    expect(state.metric).toBe('heat');
    expect(state.time).toBe('future');
    expect(state.year).toBe(2035);
    expect(state.isAnomaly).toBe(true);
    expect(state.scenario).toBe('ssp245');
  });

  it('rejects invalid parameters and falls back gracefully', () => {
    const search = '?dist=atlantis&comp=gondor&m=invalid_metric&t=never&yr=1800&anom=foo&scenario=bad';
    const state = parseUrlState(search);

    expect(state.districtId).toBeNull();
    expect(state.compareId).toBeNull();
    expect(state.metric).toBe('monsoon');
    expect(state.time).toBe('now');
    expect(state.year).toBeNull();
    expect(state.isAnomaly).toBe(false);
    expect(state.scenario).toBe('statistical');
  });

  it('ignores compareId if it matches districtId', () => {
    const search = '?dist=dhaka&comp=dhaka';
    const state = parseUrlState(search);

    expect(state.districtId).toBe('dhaka');
    expect(state.compareId).toBeNull();
  });

  it('builds clean query string omitting defaults', () => {
    const q1 = buildUrlQuery({
      divisionId: null,
      districtId: null,
      compareId: null,
      metric: 'monsoon',
      time: 'now',
      year: null,
      isAnomaly: false,
    });
    expect(q1).toBe('');

    const q2 = buildUrlQuery({
      divisionId: 'dhaka',
      districtId: 'dhaka',
      compareId: 'sylhet',
      metric: 'heat',
      time: 'past',
      year: 2015,
      isAnomaly: true,
      lang: 'bn',
    });
    expect(q2).toBe('?dist=dhaka&comp=sylhet&m=heat&t=past&yr=2015&anom=1&lang=bn');
  });

  it('parses and preserves language parameter', () => {
    const s1 = parseUrlState('?lang=bn&dist=khulna');
    expect(s1.lang).toBe('bn');
    expect(s1.districtId).toBe('khulna');

    const s2 = parseUrlState('?l=en&dist=barisal');
    expect(s2.lang).toBe('en');

    const s3 = parseUrlState('?lang=invalid');
    expect(s3.lang).toBeUndefined();
  });
});
