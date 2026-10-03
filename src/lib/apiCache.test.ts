import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { apiCache, apiQueue, fetchWithBackoff, validatePowerPayload } from './apiCache';

describe('apiCache & Validation', () => {
  beforeEach(() => {
    apiCache.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('validatePowerPayload', () => {
    it('validates and sanitizes standard NASA POWER payload', () => {
      const raw = {
        T2M_MAX: {
          '20240101': 24.5,
          '20240102': 25.1,
          '20240103': -999, // missing sentinel
        },
        PRECTOTCORR: {
          '20240101': 0.0,
          '20240102': 12.4,
          '20240103': 1500, // outlier > 1200 mm
        },
      };

      const result = validatePowerPayload(raw);

      expect(result.valid).toBe(true);
      expect(result.sanitizedData?.T2M_MAX['20240101']).toBe(24.5);
      expect(result.sanitizedData?.T2M_MAX['20240102']).toBe(25.1);
      // Sentinel -999 removed
      expect(result.sanitizedData?.T2M_MAX['20240103']).toBeUndefined();
      // Outlier 1500 mm removed
      expect(result.sanitizedData?.PRECTOTCORR['20240103']).toBeUndefined();

      expect(result.warnings.some((w) => w.includes('missing/sentinel'))).toBe(true);
      expect(result.warnings.some((w) => w.includes('Extreme rainfall outlier'))).toBe(true);
      expect(result.recordsCount).toBe(4);
    });

    it('rejects empty or null payloads', () => {
      const resNull = validatePowerPayload(null as any);
      expect(resNull.valid).toBe(false);
      expect(resNull.sanitizedData).toBeNull();

      const resEmpty = validatePowerPayload({});
      expect(resEmpty.valid).toBe(false);
    });

    it('flags temperature outliers', () => {
      const raw = {
        T2M_MAX: {
          '20240501': 62.0, // outlier > 55
          '20240502': -5.0, // outlier < 0
          '20240503': 38.2, // valid heatwave
        },
      };

      const result = validatePowerPayload(raw);
      expect(result.valid).toBe(true);
      expect(result.sanitizedData?.T2M_MAX['20240501']).toBeUndefined();
      expect(result.sanitizedData?.T2M_MAX['20240502']).toBeUndefined();
      expect(result.sanitizedData?.T2M_MAX['20240503']).toBe(38.2);
      expect(result.warnings.some((w) => w.includes('Extreme temperature outlier'))).toBe(true);
    });
  });

  describe('apiCache storage & TTL', () => {
    it('stores and retrieves data with source and warnings within TTL', () => {
      const data = { temp: 31.5, rain: 42.0 };
      const warnings = ['Warning 1'];

      apiCache.set('test_district', data, 'NASA POWER', 1000 * 60, warnings);

      const cached = apiCache.get<typeof data>('test_district');
      expect(cached).not.toBeNull();
      expect(cached?.source).toBe('NASA POWER');
      expect(cached?.data.temp).toBe(31.5);
      expect(cached?.warnings).toEqual(warnings);
    });

    it('expires data after TTL has elapsed', () => {
      const data = { hello: 'world' };
      apiCache.set('test_exp', data, 'NASA POWER', 500); // 500ms TTL

      // Immediately present
      expect(apiCache.get('test_exp')).not.toBeNull();

      // Advance mock timer
      vi.useFakeTimers();
      vi.advanceTimersByTime(600);

      // Now expired
      expect(apiCache.get('test_exp')).toBeNull();
    });

    it('removes and clears cached keys', () => {
      apiCache.set('k1', 1, 'src');
      apiCache.set('k2', 2, 'src');

      expect(apiCache.get('k1')).not.toBeNull();
      apiCache.remove('k1');
      expect(apiCache.get('k1')).toBeNull();

      expect(apiCache.get('k2')).not.toBeNull();
      apiCache.clear();
      expect(apiCache.get('k2')).toBeNull();
    });
  });

  describe('apiQueue', () => {
    it('queues and executes tasks sequentially', async () => {
      const order: number[] = [];
      const t1 = apiQueue.enqueue(async () => {
        order.push(1);
        return 'first';
      });
      const t2 = apiQueue.enqueue(async () => {
        order.push(2);
        return 'second';
      });

      const [r1, r2] = await Promise.all([t1, t2]);
      expect(r1).toBe('first');
      expect(r2).toBe('second');
      expect(order).toEqual([1, 2]);
    });
  });

  describe('fetchWithBackoff', () => {
    it('returns response on successful fetch', async () => {
      const mockRes = new Response(JSON.stringify({ ok: true }), { status: 200 });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockRes);

      const res = await fetchWithBackoff('https://example.com/api', {}, 2, 10);
      expect(res.status).toBe(200);
    });

    it('retries on 429 and succeeds on subsequent try', async () => {
      const mock429 = new Response('Too many requests', { status: 429, statusText: 'Too Many Requests' });
      const mock200 = new Response(JSON.stringify({ success: true }), { status: 200 });

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mock429).mockResolvedValueOnce(mock200);

      const res = await fetchWithBackoff('https://power.larc.nasa.gov/api', {}, 2, 10);
      expect(res.status).toBe(200);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('throws error after exhausting retries on 500 error', async () => {
      const mock500 = new Response('Server Error', { status: 500, statusText: 'Internal Server Error' });
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mock500);

      await expect(fetchWithBackoff('https://example.com/api', {}, 1, 10)).rejects.toThrow('HTTP 500');
    });
  });
});
