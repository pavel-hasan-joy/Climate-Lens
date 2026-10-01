import { districtsGeo, divisionsGeo, latestDaily } from '../../lib/metrics.js';

// NASA GIBS — Global Imagery Browse Services (open, no login)
const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';
const gibs = (layer, date, matrix, ext) =>
  `${GIBS}/${layer}/default/${date}/${matrix}/{z}/{y}/{x}.${ext}`;

const isoDate = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
export const RAIN_DATE = isoDate(latestDaily);

export const BASEMAPS = [
  { id: 'night', label: 'Night lights', note: 'NASA Black Marble' },
  { id: 'relief', label: 'Terrain', note: 'NASA Blue Marble' },
  { id: 'satellite', label: 'Satellite', note: `NASA VIIRS · ${RAIN_DATE}` },
];

export function buildStyle() {
  return {
    version: 8,
    sources: {
      night: {
        type: 'raster', tileSize: 256, maxzoom: 8,
        tiles: [gibs('VIIRS_Black_Marble', '2016-01-01', 'GoogleMapsCompatible_Level8', 'png')],
        attribution: 'NASA GIBS · Black Marble',
      },
      relief: {
        type: 'raster', tileSize: 256, maxzoom: 8,
        tiles: [gibs('BlueMarble_ShadedRelief_Bathymetry', '2004-08-01', 'GoogleMapsCompatible_Level8', 'jpeg')],
        attribution: 'NASA GIBS · Blue Marble',
      },
      satellite: {
        type: 'raster', tileSize: 256, maxzoom: 9,
        tiles: [gibs('VIIRS_SNPP_CorrectedReflectance_TrueColor', RAIN_DATE, 'GoogleMapsCompatible_Level9', 'jpg')],
        attribution: 'NASA GIBS · VIIRS',
      },
      rainfall: {
        type: 'raster', tileSize: 256, maxzoom: 6,
        tiles: [gibs('IMERG_Precipitation_Rate', RAIN_DATE, 'GoogleMapsCompatible_Level6', 'png')],
        attribution: 'NASA GPM IMERG',
      },
      districts: { type: 'geojson', data: districtsGeo },
      divisions: { type: 'geojson', data: divisionsGeo, promoteId: 'id' },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#04060b' } },
      { id: 'night', type: 'raster', source: 'night', paint: { 'raster-opacity': 1, 'raster-fade-duration': 400 } },
      {
        id: 'relief', type: 'raster', source: 'relief', layout: { visibility: 'none' },
        paint: { 'raster-brightness-max': 0.7, 'raster-saturation': -0.2 },
      },
      {
        id: 'satellite', type: 'raster', source: 'satellite', layout: { visibility: 'none' },
        paint: { 'raster-brightness-max': 0.75 },
      },
      {
        id: 'rainfall', type: 'raster', source: 'rainfall', layout: { visibility: 'none' },
        paint: { 'raster-opacity': 0.5, 'raster-resampling': 'linear' },
      },

      // Soft ground glow under the selected district
      {
        id: 'district-glow', type: 'line', source: 'districts',
        paint: {
          'line-color': ['coalesce', ['feature-state', 'color'], '#fff'],
          'line-width': ['case', ['boolean', ['feature-state', 'selected'], false], 18, 0],
          'line-blur': 14,
          'line-opacity': 0.8,
        },
      },
      {
        id: 'districts-3d', type: 'fill-extrusion', source: 'districts',
        paint: {
          'fill-extrusion-color': ['coalesce', ['feature-state', 'color'], '#111827'],
          'fill-extrusion-height': ['coalesce', ['feature-state', 'h'], 0],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.94,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      {
        id: 'district-edges', type: 'line', source: 'districts',
        paint: {
          'line-color': '#ffffff',
          'line-width': ['case', ['boolean', ['feature-state', 'selected'], false], 2.5, 0.6],
          'line-opacity': ['case',
            ['boolean', ['feature-state', 'selected'], false], 1,
            ['boolean', ['feature-state', 'hover'], false], 0.9,
            ['boolean', ['feature-state', 'inScope'], false], 0.28,
            0.06],
        },
      },
      {
        id: 'division-edges', type: 'line', source: 'divisions',
        paint: {
          'line-color': '#ffffff',
          'line-width': ['case', ['boolean', ['feature-state', 'active'], false], 2, 1],
          'line-opacity': ['case', ['boolean', ['feature-state', 'active'], false], 0.9, 0.25],
          'line-dasharray': [2, 2],
        },
      },
    ],
  };
}
