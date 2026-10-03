import { useState, useEffect, useCallback } from 'react';
import { apiCache, apiQueue, fetchWithBackoff } from '../lib/apiCache';
import prebuiltEonet from '../data/analysis/eonet-events.json';

export interface EonetHazardEvent {
  id: string;
  title: string;
  categories: string[];
  date: string;
  closed: string | null;
  sources: Array<{ id: string; url: string }>;
  coordinates: [number, number] | null; // [lon, lat]
  geometryType?: string;
}

export interface UseEonetFeedResult {
  events: EonetHazardEvent[];
  loading: boolean;
  error: string | null;
  isLive: boolean;
  isFallback: boolean;
  fetchedAt: string | null;
  source: string;
  refetch: () => Promise<void>;
}

const EONET_API = 'https://eonet.gsfc.nasa.gov/api/v3/events';
const BD_BBOX = '87.5,27.0,93.0,20.0';
const CACHE_KEY = 'eonet_open_events_bd_v2';
const TTL_MS = 60 * 60 * 1000; // 1 hour TTL for active hazard events

/**
 * Normalizes coordinates into MapLibre [longitude, latitude] format.
 * Prevents "Invalid LngLat latitude value: must be between -90 and 90" errors
 * caused by APIs returning [lat, lng] or inverted polygon vertex orders.
 */
function normalizeLngLat(x: unknown, y: unknown): [number, number] | null {
  if (typeof x !== 'number' || typeof y !== 'number' || Number.isNaN(x) || Number.isNaN(y)) return null;

  // If y > 90, y cannot be latitude! It is longitude. Flip if x is within valid latitude.
  if (Math.abs(y) > 90 || (x >= 15 && x <= 35 && y >= 75 && y <= 105)) {
    if (Math.abs(x) <= 90 && Math.abs(y) <= 180) {
      return [y, x];
    }
    return null;
  }

  if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
    return [x, y];
  }

  return null;
}

function extractCoords(raw: any): [number, number] | null {
  if (!raw) return null;
  if (Array.isArray(raw) && typeof raw[0] === 'number' && typeof raw[1] === 'number') {
    return normalizeLngLat(raw[0], raw[1]);
  }
  if (Array.isArray(raw) && Array.isArray(raw[0])) {
    const ring = Array.isArray(raw[0][0]) ? raw[0] : raw;
    let sumLng = 0;
    let sumLat = 0;
    let count = 0;
    for (const pt of ring) {
      if (Array.isArray(pt) && typeof pt[0] === 'number' && typeof pt[1] === 'number') {
        const norm = normalizeLngLat(pt[0], pt[1]);
        if (norm) {
          sumLng += norm[0];
          sumLat += norm[1];
          count++;
        }
      }
    }
    if (count > 0) {
      return [sumLng / count, sumLat / count];
    }
  }
  return null;
}

export function useEonetFeed(days = 30): UseEonetFeedResult {
  const [events, setEvents] = useState<EonetHazardEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [source, setSource] = useState('NASA EONET v3');

  const loadFallback = useCallback((reason?: string) => {
    const openPrebuilt = (prebuiltEonet.openEvents || []).map((ev: any) => ({
      id: ev.id,
      title: ev.title,
      categories: ev.categories || [],
      date: ev.date,
      closed: ev.closed,
      sources: ev.sources || [],
      coordinates: extractCoords(ev.coordinates),
    }));

    setEvents(openPrebuilt);
    setIsLive(false);
    setIsFallback(true);
    setFetchedAt(prebuiltEonet.metadata.fetchedAt);
    setSource('NASA EONET v3 (Pre-built snapshot)');
    if (reason) setError(reason);
  }, []);

  const fetchEvents = useCallback(
    async (forceLive = false) => {
      // 1. Check cache first
      if (!forceLive) {
        const cached = apiCache.get<EonetHazardEvent[]>(CACHE_KEY);
        if (cached) {
          setEvents(cached.data);
          setIsLive(false);
          setIsFallback(false);
          setFetchedAt(new Date(cached.fetchedAt).toLocaleTimeString());
          setSource(cached.source);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const liveEvents = await apiQueue.enqueue(async () => {
          const url = `${EONET_API}?bbox=${BD_BBOX}&status=all&days=${days}&limit=100`;
          const res = await fetchWithBackoff(url, {}, 2, 1000);
          const data = await res.json();
          const rawEvents = data.events || [];

          const processed: EonetHazardEvent[] = [];

          for (const ev of rawEvents) {
            // Include open events or recently closed (within window)
            const firstGeom = ev.geometry?.[0];
            const coords = extractCoords(firstGeom?.coordinates);

            processed.push({
              id: ev.id,
              title: ev.title,
              categories: (ev.categories || []).map((cat: any) => cat.id || cat),
              date: firstGeom?.date || ev.closed || '',
              closed: ev.closed || null,
              sources: (ev.sources || []).map((s: any) => ({ id: s.id, url: s.url })),
              coordinates: coords,
              geometryType: firstGeom?.type,
            });
          }

          return processed;
        });

        apiCache.set(CACHE_KEY, liveEvents, 'NASA EONET v3 (Live API)', TTL_MS);
        setEvents(liveEvents);
        setIsLive(true);
        setIsFallback(false);
        setFetchedAt(new Date().toLocaleTimeString());
        setSource('NASA EONET v3 (Live API)');
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn('[EONET Feed] Live query failed, falling back to snapshot:', errorMsg);
        loadFallback(`Live EONET fetch failed (${errorMsg}). Showing saved hazards from snapshot.`);
      } finally {
        setLoading(false);
      }
    },
    [days, loadFallback],
  );

  useEffect(() => {
    fetchEvents(false);
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    isLive,
    isFallback,
    fetchedAt,
    source,
    refetch: () => fetchEvents(true),
  };
}
