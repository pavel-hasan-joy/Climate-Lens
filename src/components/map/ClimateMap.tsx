import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { METRIC, TIMES } from '../../lib/constants';
import {
  ALL_YEARS,
  districts,
  districtsGeo,
  divisions,
  divisionsGeo,
  idsOf,
  statsFor,
  valueAt,
} from '../../lib/metrics';
import { hexToRgb, rampColor } from '../../lib/format';
import { buildStyle } from './mapStyle';
import Animator from './animator';
import MapNav from './MapNav';
import useIsMobile from '../../hooks/useIsMobile';
import { useTranslation } from '../../lib/i18n';
import type { DomainRange, MetricId, ScenarioId, TimeId } from '../../lib/types';

const BG = hexToRgb('#0b1220');
const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

// [minLng, minLat, maxLng, maxLat] of any GeoJSON geometry
function bbox(features: Array<{ geometry: any }>): [[number, number], [number, number]] {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  const walk = (c: any) =>
    typeof c[0] === 'number'
      ? ((b[0] = Math.min(b[0], c[0])),
        (b[1] = Math.min(b[1], c[1])),
        (b[2] = Math.max(b[2], c[0])),
        (b[3] = Math.max(b[3], c[1])))
      : c.forEach(walk);
  features.forEach((f) => walk(f.geometry.coordinates));
  return [
    [b[0], b[1]],
    [b[2], b[3]],
  ];
}

const COUNTRY_BOUNDS = bbox(divisionsGeo.features);
const divisionBounds: Record<string, [[number, number], [number, number]]> = Object.fromEntries(
  divisionsGeo.features.map((f) => [f.properties.id, bbox([f])]),
);
const byId: Record<string, any> = Object.fromEntries(districtsGeo.features.map((f) => [f.properties.id, f]));
const divisionCenter: Record<string, [number, number]> = Object.fromEntries(
  divisions.map((d) => {
    const pts = districts.filter((x) => x.division === d.id).map((x) => x.anchor);
    return [d.id, [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length]];
  }),
);

interface ClimateMapProps {
  divisionId?: string | null;
  districtId?: string | null;
  compareId?: string | null;
  metric: MetricId;
  time: TimeId;
  year?: number | null;
  playing: boolean;
  domain: DomainRange;
  basemap: string;
  showRain: boolean;
  isAnomaly?: boolean;
  scenario?: ScenarioId;
  onSelectDistrict: (id: string) => void;
}

interface LabelItem {
  key: string;
  name: string;
  at: [number, number];
  district?: boolean;
  el: HTMLDivElement;
  marker: maplibregl.Marker;
  value?: number | null;
}

export default function ClimateMap({
  divisionId,
  districtId,
  compareId = null,
  metric,
  time,
  year,
  playing,
  domain,
  basemap,
  showRain,
  isAnomaly = false,
  scenario = 'statistical',
  onSelectDistrict,
}: ClimateMapProps) {
  const { lang, getDistrictName, getDivisionName, formatVal, formatAnom } = useTranslation();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const anim = useRef<Animator | null>(null);
  const labels = useRef<LabelItem[]>([]);
  const last = useRef<{
    divisionId?: string | null;
    first?: boolean;
    droneBase?: any;
    time?: TimeId;
  }>({ divisionId: undefined });
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const mobile = useIsMobile();

  const padding = mobile
    ? { top: 110, bottom: Math.round(window.innerHeight * 0.5), left: 20, right: 20 }
    : { top: 110, bottom: 150, left: 390, right: 430 };

  // ---- create the map once ----
  useEffect(() => {
    if (!box.current) return;
    const m = new maplibregl.Map({
      container: box.current,
      style: buildStyle(),
      center: [90.3, 23.7],
      zoom: 3.2,
      pitch: 0,
      maxPitch: 75,
      attributionControl: { compact: true },
      fadeDuration: 300,
      keyboard: false, // arrow keys rotate instead (MapNav)
    });
    map.current = m;
    setMapInstance(m);
    anim.current = new Animator(m, 'districts');

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: 'map-tip', offset: 12 });
    let hovered: string | number | null = null;
    m.on('mousemove', 'districts-3d', (e) => {
      const f = e.features?.[0];
      if (!f) return;
      if (hovered !== null && hovered !== f.id)
        m.setFeatureState({ source: 'districts', id: hovered }, { hover: false });
      hovered = f.id ?? null;
      if (hovered != null) m.setFeatureState({ source: 'districts', id: hovered }, { hover: true });
      m.getCanvas().style.cursor = 'pointer';
      popup
        .setLngLat(e.lngLat)
        .setHTML((m as any).__tip?.(f.properties?.id) ?? f.properties?.name ?? '')
        .addTo(m);
    });
    m.on('mouseleave', 'districts-3d', () => {
      if (hovered !== null) m.setFeatureState({ source: 'districts', id: hovered }, { hover: false });
      hovered = null;
      m.getCanvas().style.cursor = '';
      popup.remove();
    });
    m.on('click', 'districts-3d', (e) => (m as any).__select?.(e.features?.[0]?.properties?.id));

    m.on('load', () => setReady(true));
    return () => {
      anim.current?.stop();
      m.remove();
    };
  }, []);

  // Latest callbacks for the map's event handlers
  useEffect(() => {
    const m = map.current as any;
    if (!m) return;
    m.__select = onSelectDistrict;
    m.__tip = (id: string) => {
      const name = getDistrictName(id);
      const v = valueAt(id, metric, time, year, isAnomaly, scenario);
      const formatted = isAnomaly ? formatAnom(metric, v) : formatVal(metric, v);
      return `<b>${name}</b><span>${formatted}</span>`;
    };
  }, [onSelectDistrict, metric, time, year, isAnomaly, scenario, getDistrictName, formatVal, formatAnom]);

  // ---- heights + colours ----
  useEffect(() => {
    if (!ready || !map.current || !anim.current) return;
    const m = map.current;
    const mObj = METRIC[metric];
    const ramp = isAnomaly ? mObj.divergingRamp : mObj.ramp;
    const [lo, hi] = domain;
    const scope = new Set(idsOf(divisionId));
    const divisionChanged = last.current.divisionId !== divisionId;
    const isPlaying = year != null;
    const center = divisionId ? divisionCenter[divisionId] : [90.3, 23.7];

    const targets = new Map<string | number, any>();
    districtsGeo.features.forEach((f: any) => {
      const { id, anchor } = f.properties;
      const val = valueAt(id, metric, time, year, isAnomaly, scenario);
      const t = Math.max(0, Math.min(1, ((val ?? 0) - lo) / (hi - lo || 1)));
      const inScope = scope.has(id);
      const c = rampColor(ramp, t);
      let delay = 0;
      if (divisionChanged)
        delay = Math.hypot(anchor[0] - center[0], anchor[1] - center[1]) * 260; // ripple outwards
      else if (!isPlaying) delay = (anchor[0] - 88) * 90; // sweep west → east

      // For anomaly mode, height reflects the absolute anomaly magnitude from baseline
      const hScale = isAnomaly ? Math.abs(val ?? 0) / (hi || 1) : t;
      const baseHeight = isAnomaly ? 600 : 1000;
      const maxHeight = divisionId ? 28000 : 42000;

      targets.set(f.id, {
        h: inScope ? baseHeight + hScale * maxHeight : 300 + (isAnomaly ? hScale * 2000 : t * 3000),
        c: inScope ? c : mix(c, BG, 0.72),
        delay,
      });
      m.setFeatureState(
        { source: 'districts', id: f.id },
        { inScope, selected: id === districtId, compared: id === compareId },
      );
    });
    anim.current.animate(targets, isPlaying ? 380 : divisionChanged ? 1400 : 1100);

    divisions.forEach((d) => m.setFeatureState({ source: 'divisions', id: d.id }, { active: d.id === divisionId }));
    last.current.divisionId = divisionId;
  }, [ready, divisionId, districtId, compareId, metric, time, year, domain, isAnomaly, scenario]);

  // ---- camera ----
  useEffect(() => {
    if (!ready || !map.current) return;
    const m = map.current;
    // District view keeps the division in frame and centres on the district
    const bounds = divisionId ? divisionBounds[divisionId] : COUNTRY_BOUNDS;
    const bearing = districtId ? -28 : divisionId ? -20 : -12;
    // Padding can exceed a small viewport; fall back to a lighter one
    const cam = m.cameraForBounds(bounds, { padding, bearing }) ?? m.cameraForBounds(bounds, { padding: 20, bearing });
    if (!cam) return;
    const focus = districtId ? byId[districtId]?.properties?.anchor : null;
    m.flyTo({
      ...cam,
      ...(focus && {
        center: focus,
        offset: [(padding.left - padding.right) / 2, (padding.top - padding.bottom) / 2 + 60],
      }),
      zoom: Math.min(cam.zoom! + (districtId ? 0.35 : -0.15), 9),
      pitch: districtId ? 60 : divisionId ? 55 : 48,
      bearing,
      duration: last.current.first ? 2200 : 3400,
      curve: 1.6,
      essential: true,
    });
    last.current.first = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, divisionId, districtId, mobile]);

  // Drone view: while the years play, the camera slowly orbits and bobs over the region
  useEffect(() => {
    if (!ready || !playing || !map.current) return;
    const m = map.current;
    const base = { center: m.getCenter(), bearing: m.getBearing(), pitch: m.getPitch(), zoom: m.getZoom() };
    const start = performance.now();
    const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, x), 3);
    let raf: number;

    // Close, low-angle orbit; centred on the selected district when there is one
    const target = districtId ? maplibregl.LngLat.convert(byId[districtId]?.properties?.anchor) : base.center;
    const fly = (now: number) => {
      const t = (now - start) / 1000;
      const k = ease(t / 2.5); // glide down to drone height over 2.5 s
      m.jumpTo({
        center: [
          base.center.lng + (target.lng - base.center.lng) * k,
          base.center.lat + (target.lat - base.center.lat) * k,
        ],
        bearing: base.bearing + t * 6,
        pitch: base.pitch + (70 - base.pitch) * k + 4 * Math.sin(t / 2.2) * k,
        zoom: base.zoom + (districtId ? 1.1 : 0.9) * k + 0.18 * Math.sin(t / 3.5) * k,
      });
      raf = requestAnimationFrame(fly);
    };
    raf = requestAnimationFrame(fly);

    // Hand control back as soon as the user grabs the map
    const stop = () => cancelAnimationFrame(raf);
    m.on('mousedown', stop);
    m.on('wheel', stop);
    m.on('touchstart', stop);

    const lastRef = last.current;
    return () => {
      cancelAnimationFrame(raf);
      m.off('mousedown', stop);
      m.off('wheel', stop);
      m.off('touchstart', stop);
      lastRef.droneBase = base;
      m.easeTo({ ...base, duration: 1800 });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, playing]);

  // Small camera sweep when switching Past / Now / Future
  useEffect(() => {
    const changed = last.current.time !== undefined && last.current.time !== time;
    last.current.time = time;
    if (!ready || !changed || !map.current) return;
    const m = map.current;
    const base = districtId ? -28 : divisionId ? -20 : -12;
    const i = TIMES.findIndex((t) => t.id === time);
    // After a drone flight, land back at the pre-flight height too
    const back = last.current.droneBase;
    last.current.droneBase = null;
    m.easeTo({
      ...(back && { center: back.center, pitch: back.pitch, zoom: back.zoom }),
      bearing: base + (i - 1) * 7,
      duration: back ? 2000 : 1600,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, time]);

  // ---- basemap & rain overlay ----
  useEffect(() => {
    if (!ready || !map.current) return;
    const m = map.current;
    ['night', 'relief', 'satellite'].forEach((id) =>
      m.setLayoutProperty(id, 'visibility', id === basemap ? 'visible' : 'none'),
    );
    m.setLayoutProperty('rainfall', 'visibility', showRain ? 'visible' : 'none');
  }, [ready, basemap, showRain]);

  // ---- floating labels: districts of the division, or divisions of the country ----
  useEffect(() => {
    if (!ready || !map.current) return;
    labels.current.forEach((l) => l.marker.remove());
    const items: Array<{ key: string; name: string; at: [number, number]; district?: boolean }> = divisionId
      ? districts
          .filter((d) => d.division === divisionId)
          .map((d) => ({ key: d.id, name: getDistrictName(d.id), at: d.anchor as [number, number], district: true }))
      : divisions.map((d) => ({ key: d.id, name: getDivisionName(d.id), at: divisionCenter[d.id], district: false }));

    labels.current = items.map((it, i) => {
      const el = document.createElement('div');
      el.className = `map-label${it.district ? '' : ' big'}`;
      el.style.animationDelay = `${500 + i * 45}ms`;
      el.innerHTML = `<b>${it.name}</b><span></span>`;
      if (it.district) el.onclick = () => (map.current as any)?.__select?.(it.key);
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(it.at).addTo(map.current!);
      return { ...it, el, marker };
    });
  }, [ready, divisionId, lang, getDistrictName, getDivisionName]);

  // Hide labels that would overlap a more important one (selected first, then higher values)
  useEffect(() => {
    if (!ready || !map.current) return;
    const m = map.current;
    let frame: number | null = null;
    const layout = () => {
      frame = null;
      const placed: Array<[number, number, number, number]> = [];
      [...labels.current]
        .sort(
          (a, b) =>
            (b.el.classList.contains('on') ? 1 : 0) - (a.el.classList.contains('on') ? 1 : 0) ||
            (b.value ?? 0) - (a.value ?? 0),
        )
        .forEach((l) => {
          const p = m.project(l.at);
          const w = l.el.offsetWidth + 6;
          const h = l.el.offsetHeight + 4;
          const b: [number, number, number, number] = [p.x - w / 2, p.y - h, p.x + w / 2, p.y];
          const hit = placed.some((box) => b[0] < box[2] && b[2] > box[0] && b[1] < box[3] && b[3] > box[1]);
          l.el.classList.toggle('hidden', hit);
          if (!hit) placed.push(b);
        });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(layout);
    };
    m.on('move', schedule);
    schedule();
    return () => {
      m.off('move', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ready, divisionId, districtId, metric, time, year]);

  // Label values follow the metric / time / year without re-creating the labels
  useEffect(() => {
    labels.current.forEach((l) => {
      let v: number | null = null;
      if (l.district) v = valueAt(l.key, metric, time, year, isAnomaly);
      else {
        const s = statsFor(idsOf(l.key), metric);
        if (isAnomaly) {
          v = year != null ? s.anomaly.byYear[year - ALL_YEARS[0]] : time === 'past' ? 0 : s.anomaly[time];
        } else {
          v = year != null ? s.byYear[year - ALL_YEARS[0]] : s[time];
        }
      }
      l.value = v;
      const span = l.el.querySelector('span');
      if (span) {
        span.textContent = isAnomaly ? formatAnom(metric, v) : formatVal(metric, v);
      }
      const b = l.el.querySelector('b');
      if (b) {
        b.textContent = l.district ? getDistrictName(l.key) : getDivisionName(l.key);
      }
      l.el.classList.toggle('on', l.key === districtId);
      l.el.classList.toggle('compared', l.key === compareId);
    });
  }, [
    ready,
    divisionId,
    districtId,
    compareId,
    metric,
    time,
    year,
    isAnomaly,
    lang,
    getDistrictName,
    getDivisionName,
    formatVal,
    formatAnom,
  ]);

  return (
    <>
      <div ref={box} className="map" />
      {ready && mapInstance && <MapNav map={mapInstance} ready={ready} playing={playing} />}
    </>
  );
}
