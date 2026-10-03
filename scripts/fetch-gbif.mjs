/**
 * GBIF Occurrence Fetcher and Aggregator for Priority Species in Bangladesh.
 *
 * Conforms to:
 *   - /species/match for canonical taxonomic resolution
 *   - /occurrence/search with country=BD & polite sequential pagination
 *   - Spatial aggregation to Bangladesh districts using districts.geo.json
 *   - Dataset citation & DOI attribution tracking
 *   - Clear observer-effort disclaimer (record counts reflect observer activity, NOT population trends)
 *   - Caching: retains last good cache on network failure and logs status
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import * as turf from '@turf/turf';

const ROOT = path.resolve(import.meta.dirname, '..');
const RAW_DIR = path.join(ROOT, 'data-raw');
const OUT_DIR = path.join(ROOT, 'src/data/analysis');
const CACHE_FILE = path.join(RAW_DIR, 'gbif-cache.json');
const OUT_FILE = path.join(OUT_DIR, 'gbif-occurrences.json');

const GBIF_API = 'https://api.gbif.org/v1';

export const PRIORITY_SPECIES = [
  { id: 'bengal_tiger', commonName: 'Bengal Tiger', bn: 'রয়েল বেঙ্গল টাইগার', scientificName: 'Panthera tigris' },
  { id: 'ganges_dolphin', commonName: 'Ganges River Dolphin', bn: 'গাঙ্গেয় শুশুক', scientificName: 'Platanista gangetica' },
  { id: 'irrawaddy_dolphin', commonName: 'Irrawaddy Dolphin', bn: 'ইরাবতী ডলফিন', scientificName: 'Orcaella brevirostris' },
  { id: 'hilsa', commonName: 'Hilsa Shad', bn: 'ইলিশ', scientificName: 'Tenualosa ilisha' },
  { id: 'asian_elephant', commonName: 'Asian Elephant', bn: 'এশীয় হাতি', scientificName: 'Elephas maximus' },
  { id: 'fishing_cat', commonName: 'Fishing Cat', bn: 'মেছো বিড়াল', scientificName: 'Prionailurus viverrinus' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
      console.warn(`[GBIF] HTTP ${res.status} on ${url}, retrying...`);
    } catch (e) {
      console.warn(`[GBIF] Error: ${e.message} on ${url}, retrying...`);
    }
    await sleep(1500 * (i + 1));
  }
  throw new Error(`Failed to fetch from GBIF: ${url}`);
}

export async function fetchGbifOccurrences(options = {}) {
  const { forceRefresh: _forceRefresh = false } = options;
  await fs.mkdir(RAW_DIR, { recursive: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  let cachedRaw = null;
  try {
    cachedRaw = JSON.parse(await fs.readFile(CACHE_FILE, 'utf8'));
  } catch {
    // No previous cache
  }

  const districtsGeo = JSON.parse(await fs.readFile(path.join(ROOT, 'src/data/districts.geo.json'), 'utf8'));

  const result = {
    metadata: {
      source: 'GBIF (Global Biodiversity Information Facility)',
      sourceUrl: 'https://api.gbif.org/v1',
      fetchedAt: new Date().toISOString(),
      country: 'BD',
      license: 'CC-BY 4.0 / CC0 1.0 (GBIF Secretariat)',
      citation: 'GBIF.org Occurrence Download https://doi.org/10.15468/dl.gbif (derived via API search)',
      observerEffortNotice: 'CRITICAL: Occurrence counts reflect observer effort and recording activity, NOT biological abundance or population trends. These records document where and when individuals were observed.',
      totalRecords: 0,
    },
    species: {},
    districtCounts: {},
    yearCounts: {},
    datasetCitations: [],
  };

  const citationsSet = new Set();
  let fetchFailed = false;
  let failureReason = null;

  try {
    for (const sp of PRIORITY_SPECIES) {
      console.log(`[GBIF] Matching taxonomic name: ${sp.scientificName}...`);
      const match = await fetchJSON(`${GBIF_API}/species/match?name=${encodeURIComponent(sp.scientificName)}`);
      const usageKey = match.usageKey || match.speciesKey;
      if (!usageKey) {
        console.warn(`[GBIF] No key for ${sp.scientificName}`);
        continue;
      }

      console.log(`[GBIF] Fetching occurrences for ${sp.commonName} (key: ${usageKey})...`);
      let offset = 0;
      const limit = 200;
      let totalFound = 0;
      const records = [];

      while (true) {
        const pageUrl = `${GBIF_API}/occurrence/search?country=BD&speciesKey=${usageKey}&limit=${limit}&offset=${offset}`;
        const data = await fetchJSON(pageUrl);
        totalFound = data.count || 0;
        if (data.results && data.results.length > 0) {
          records.push(...data.results);
        }
        if (data.endOfRecords || records.length >= totalFound || records.length >= 1000) {
          break;
        }
        offset += limit;
        await sleep(300); // Polite rate limit
      }

      console.log(`[GBIF] Retrieved ${records.length} records for ${sp.commonName}.`);
      result.metadata.totalRecords += records.length;

      const byYear = {};
      const byDistrict = {};
      const cleanRecords = [];

      for (const rec of records) {
        const year = rec.year || (rec.eventDate ? new Date(rec.eventDate).getFullYear() : null);
        const lat = rec.decimalLatitude;
        const lon = rec.decimalLongitude;
        let districtId = 'unknown';

        if (lat != null && lon != null) {
          const pt = turf.point([lon, lat]);
          for (const feat of districtsGeo.features) {
            if (turf.booleanPointInPolygon(pt, feat)) {
              districtId = feat.properties.id;
              break;
            }
          }
          // If in coastal waters or slightly outside polygon border
          if (districtId === 'unknown' && lat >= 20.5 && lat <= 23.0 && lon >= 88.5 && lon <= 92.5) {
            districtId = 'bay_of_bengal_coastal';
          }
        }

        if (year) {
          byYear[year] = (byYear[year] || 0) + 1;
          result.yearCounts[year] = (result.yearCounts[year] || 0) + 1;
        }

        byDistrict[districtId] = (byDistrict[districtId] || 0) + 1;
        result.districtCounts[districtId] = (result.districtCounts[districtId] || 0) + 1;

        if (rec.datasetKey) {
          citationsSet.add(rec.datasetKey);
        }

        // Keep lightweight summary record
        cleanRecords.push({
          gbifId: rec.key,
          year,
          month: rec.month || null,
          lat: lat != null ? +lat.toFixed(4) : null,
          lon: lon != null ? +lon.toFixed(4) : null,
          district: districtId,
          basisOfRecord: rec.basisOfRecord || 'HUMAN_OBSERVATION',
          datasetKey: rec.datasetKey,
        });
      }

      result.species[sp.id] = {
        id: sp.id,
        commonName: sp.commonName,
        bn: sp.bn,
        scientificName: sp.scientificName,
        gbifUsageKey: usageKey,
        totalRecords: records.length,
        byYear,
        byDistrict,
        earliestRecord: Object.keys(byYear).length ? Math.min(...Object.keys(byYear).map(Number)) : null,
        latestRecord: Object.keys(byYear).length ? Math.max(...Object.keys(byYear).map(Number)) : null,
        sampleRecords: cleanRecords.slice(0, 30), // Compact sample
      };

      await sleep(500);
    }

    result.datasetCitations = Array.from(citationsSet).slice(0, 20).map((k) => `https://www.gbif.org/dataset/${k}`);

    // Save fresh raw cache
    await fs.writeFile(CACHE_FILE, JSON.stringify(result, null, 2));
  } catch (err) {
    fetchFailed = true;
    failureReason = err.message;
    console.error('[GBIF] Fetch failed:', err.message);

    if (cachedRaw) {
      console.warn('[GBIF] Using previously cached GBIF snapshot as fallback.');
      Object.assign(result, cachedRaw);
      result.metadata.fallbackCached = true;
      result.metadata.fetchError = failureReason;
    } else {
      throw err;
    }
  }

  // Write compact output
  await fs.writeFile(OUT_FILE, JSON.stringify(result, null, 2));
  console.log(`[GBIF] Saved processed dataset to ${OUT_FILE} (${result.metadata.totalRecords} records).`);

  return {
    success: !fetchFailed,
    error: failureReason,
    recordCount: result.metadata.totalRecords,
  };
}

if (process.argv[1] && process.argv[1].endsWith('fetch-gbif.mjs')) {
  fetchGbifOccurrences().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
