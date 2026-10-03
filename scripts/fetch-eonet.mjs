/**
 * NASA Earth Observatory Natural Event Tracker (EONET) v3 Fetcher.
 *
 * Conforms to:
 *   - /categories inspection to verify IDs: floods, severeStorms, wildfires, drought, tempExtremes, landslides
 *   - /events with bbox=87.5,27.0,93.0,20.0 (Bangladesh region)
 *   - Extraction of both currently open events and historical event counts per year and category
 *   - Caching with fallback preservation on network failure
 *   - Attribution & license metadata
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const RAW_DIR = path.join(ROOT, 'data-raw');
const OUT_DIR = path.join(ROOT, 'src/data/analysis');
const CACHE_FILE = path.join(RAW_DIR, 'eonet-cache.json');
const OUT_FILE = path.join(OUT_DIR, 'eonet-events.json');

const EONET_API = 'https://eonet.gsfc.nasa.gov/api/v3';
// Bounding box for Bangladesh region: minLon, maxLat, maxLon, minLat
const BD_BBOX = '87.5,27.0,93.0,20.0';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
      console.warn(`[EONET] HTTP ${res.status} on ${url}, retrying...`);
    } catch (e) {
      console.warn(`[EONET] Error: ${e.message} on ${url}, retrying...`);
    }
    await sleep(1500 * (i + 1));
  }
  throw new Error(`Failed to fetch from EONET: ${url}`);
}

export async function fetchEonetEvents(_options = {}) {
  await fs.mkdir(RAW_DIR, { recursive: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  let cachedRaw = null;
  try {
    cachedRaw = JSON.parse(await fs.readFile(CACHE_FILE, 'utf8'));
  } catch {
    // No previous cache
  }

  const result = {
    metadata: {
      source: 'NASA EONET v3 (Earth Observatory Natural Event Tracker)',
      sourceUrl: `${EONET_API}/events`,
      bbox: BD_BBOX,
      fetchedAt: new Date().toISOString(),
      license: 'NASA Open Data Policy (Public Domain)',
      citation: 'National Aeronautics and Space Administration (NASA) Earth Observatory Natural Event Tracker (EONET v3)',
      totalEvents: 0,
      openEventsCount: 0,
      historicalEventsCount: 0,
    },
    categories: [],
    eventsByYear: {},
    eventsByCategory: {},
    yearByCategory: {},
    openEvents: [],
    recentClosedEvents: [],
  };

  let fetchFailed = false;
  let failureReason = null;

  try {
    console.log('[EONET] Verifying official categories...');
    const categoriesData = await fetchJSON(`${EONET_API}/categories`);
    result.categories = (categoriesData.categories || []).map((c) => ({
      id: c.id,
      title: c.title,
      link: c.link,
      description: c.description,
    }));

    console.log(`[EONET] Fetching events for Bangladesh bbox: ${BD_BBOX}...`);
    const eventsData = await fetchJSON(`${EONET_API}/events?bbox=${BD_BBOX}&status=all&limit=500`);
    const allEvents = eventsData.events || [];
    result.metadata.totalEvents = allEvents.length;

    console.log(`[EONET] Fetched ${allEvents.length} events.`);

    const byYear = {};
    const byCategory = {};
    const yearByCat = {};
    const openList = [];
    const closedList = [];

    for (const ev of allEvents) {
      // Geometry array in v3: ev.geometry has date and coordinates
      const firstGeom = ev.geometry?.[0];
      const dateStr = firstGeom?.date || ev.closed || '';
      const year = dateStr ? dateStr.slice(0, 4) : 'unknown';
      const isOpen = !ev.closed;

      if (year !== 'unknown') {
        byYear[year] = (byYear[year] || 0) + 1;
      }

      for (const cat of ev.categories || []) {
        byCategory[cat.id] = (byCategory[cat.id] || 0) + 1;
        if (year !== 'unknown') {
          if (!yearByCat[year]) yearByCat[year] = {};
          yearByCat[year][cat.id] = (yearByCat[year][cat.id] || 0) + 1;
        }
      }

      const cleanEvent = {
        id: ev.id,
        title: ev.title,
        categories: (ev.categories || []).map((c) => c.id),
        date: dateStr,
        closed: ev.closed || null,
        sources: (ev.sources || []).map((s) => ({ id: s.id, url: s.url })),
        coordinates: firstGeom?.coordinates || null,
      };

      if (isOpen) {
        openList.push(cleanEvent);
      } else {
        closedList.push(cleanEvent);
      }
    }

    result.metadata.openEventsCount = openList.length;
    result.metadata.historicalEventsCount = closedList.length;
    result.eventsByYear = byYear;
    result.eventsByCategory = byCategory;
    result.yearByCategory = yearByCat;
    result.openEvents = openList;
    result.recentClosedEvents = closedList.slice(-25); // Top 25 latest historical events

    // Cache raw response
    await fs.writeFile(CACHE_FILE, JSON.stringify(result, null, 2));
  } catch (err) {
    fetchFailed = true;
    failureReason = err.message;
    console.error('[EONET] Fetch failed:', err.message);

    if (cachedRaw) {
      console.warn('[EONET] Falling back to cached EONET dataset.');
      Object.assign(result, cachedRaw);
      result.metadata.fallbackCached = true;
      result.metadata.fetchError = failureReason;
    } else {
      throw err;
    }
  }

  await fs.writeFile(OUT_FILE, JSON.stringify(result, null, 2));
  console.log(`[EONET] Wrote output to ${OUT_FILE} (${result.metadata.totalEvents} total events).`);

  return {
    success: !fetchFailed,
    error: failureReason,
    totalEvents: result.metadata.totalEvents,
    openEvents: result.metadata.openEventsCount,
  };
}

if (process.argv[1] && process.argv[1].endsWith('fetch-eonet.mjs')) {
  fetchEonetEvents().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
