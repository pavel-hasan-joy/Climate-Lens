import divisionsGeoRaw from '../data/divisions.geo.json';

const divisions = divisionsGeoRaw as {
  type: string;
  features: Array<{
    type: string;
    properties: { id: string; name: string };
    geometry: {
      type: 'Polygon' | 'MultiPolygon';
      coordinates: number[][][] | number[][][][];
    };
  }>;
};

/**
 * Standard ray-casting point-in-polygon algorithm.
 */
function pointInPolygon(point: [number, number], vs: number[][]): boolean {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0];
    const yi = vs[i][1];
    const xj = vs[j][0];
    const yj = vs[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Determines whether a [longitude, latitude] coordinate is strictly inside Bangladesh territory.
 */
export function isInsideBangladesh(lng: number, lat: number): boolean {
  if (typeof lng !== 'number' || typeof lat !== 'number' || Number.isNaN(lng) || Number.isNaN(lat)) return false;

  // National bounding box pre-filter: Bangladesh is roughly [88.0, 20.5] to [92.7, 26.65]
  if (lng < 88.0 || lng > 92.7 || lat < 20.5 || lat > 26.65) return false;

  for (const feature of divisions.features) {
    const geom = feature.geometry;
    if (geom.type === 'Polygon') {
      if (pointInPolygon([lng, lat], geom.coordinates[0] as number[][])) return true;
    } else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates) {
        if (pointInPolygon([lng, lat], poly[0] as number[][])) return true;
      }
    }
  }
  return false;
}

/**
 * Checks if an event title explicitly refers to a neighboring foreign territory.
 */
export function isForeignHazardEvent(title: string): boolean {
  const lower = title.toLowerCase();

  // If it contains Bangladesh or Bengal delta, it is local
  if (lower.includes('bangladesh') || (lower.includes('bengal') && !lower.includes('west bengal'))) {
    return false;
  }

  // Explicit foreign country flags
  if (
    lower.includes('india') ||
    lower.includes('myanmar') ||
    lower.includes('burma') ||
    lower.includes('nepal') ||
    lower.includes('bhutan') ||
    lower.includes('tibet')
  ) {
    return true;
  }

  return false;
}
