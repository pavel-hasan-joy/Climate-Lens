import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { METRIC, TIMES } from '../../lib/constants.js';
import { ALL_YEARS, districts, districtsGeo, divisions, divisionsGeo, idsOf, statsFor, valueAt } from '../../lib/metrics.js';
import { formatValue, hexToRgb, rampColor } from '../../lib/format.js';
import { buildStyle } from './mapStyle.js';
import Animator from './animator.js';
import MapNav from './MapNav.jsx';
import useIsMobile from '../../hooks/useIsMobile.js';

const BG = hexToRgb('#0b1220');
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

// [minLng, minLat, maxLng, maxLat] of any GeoJSON geometry
function bbox(features) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  const walk = (c) => (typeof c[0] === 'number'
    ? (b[0] = Math.min(b[0], c[0]), b[1] = Math.min(b[1], c[1]), b[2] = Math.max(b[2], c[0]), b[3] = Math.max(b[3], c[1]))
    : c.forEach(walk));
  features.forEach((f) => walk(f.geometry.coordinates));
  return [[b[0], b[1]], [b[2], b[3]]];
}

const COUNTRY_BOUNDS = bbox(divisionsGeo.features);
const divisionBounds = Object.fromEntries(divisionsGeo.features.map((f) => [f.properties.id, bbox([f])]));
const byId = Object.fromEntries(districtsGeo.features.map((f) => [f.properties.id, f]));
const divisionCenter = Object.fromEntries(divisions.map((d) => {
  const pts = districts.filter((x) => x.division === d.id).map((x) => x.anchor);
  return [d.id, [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length]];
}));

export default function ClimateMap({ divisionId, districtId, metric, time, year, playing, domain, basemap, showRain, onSelectDistrict }) {
  const box = useRef(null);
  const map = useRef(null);
  const anim = useRef(null);
  const labels = useRef([]);
  const last = useRef({ divisionId: undefined });
  const [ready, setReady] = useState(false);
  const mobile = useIsMobile();

  const padding = mobile
    ? { top: 110, bottom: Math.round(innerHeight * 0.5), left: 20, right: 20 }
    : { top: 110, bottom: 150, left: 390, right: 430 };

  // ---- create the map once ----
  useEffect(() => {
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
    anim.current = new Animator(m, 'districts');

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: 'map-tip', offset: 12 });
    let hovered = null;
    m.on('mousemove', 'districts-3d', (e) => {
      const f = e.features[0];
      if (hovered !== null && hovered !== f.id) m.setFeatureState({ source: 'districts', id: hovered }, { hover: false });
      hovered = f.id;
      m.setFeatureState({ source: 'districts', id: hovered }, { hover: true });
      m.getCanvas().style.cursor = 'pointer';
      popup.setLngLat(e.lngLat).setHTML(m.__tip?.(f.properties.id) ?? f.properties.name).addTo(m);
    });
    m.on('mouseleave', 'districts-3d', () => {
      if (hovered !== null) m.setFeatureState({ source: 'districts', id: hovered }, { hover: false });
      hovered = null;
      m.getCanvas().style.cursor = '';
      popup.remove();
    });
    m.on('click', 'districts-3d', (e) => m.__select?.(e.features[0].properties.id));

    m.on('load', () => setReady(true));
    return () => { anim.current.stop(); m.remove(); };
  }, []);

  // Latest callbacks for the map's event handlers
  useEffect(() => {
    const m = map.current;
    m.__select = onSelectDistrict;
    m.__tip = (id) => {
      const d = byId[id].properties;
      const v = valueAt(id, metric, time, year);
      return `<b>${d.name}</b><span>${formatValue(metric, v)}</span>`;
    };
  }, [onSelectDistrict, metric, time, year]);

  // ---- heights + colours ----
  useEffect(() => {
    if (!ready) return;
    const m = map.current;
    const { ramp } = METRIC[metric];
    const [lo, hi] = domain;
    const scope = new Set(idsOf(divisionId));
    const divisionChanged = last.current.divisionId !== divisionId;
    const playing = year != null;
    const center = divisionId ? divisionCenter[divisionId] : [90.3, 23.7];

    const targets = new Map();
    districtsGeo.features.forEach((f) => {
      const { id, anchor } = f.properties;
      const t = Math.max(0, Math.min(1, (valueAt(id, metric, time, year) - lo) / (hi - lo)));
      const inScope = scope.has(id);
      const c = rampColor(ramp, t);
      let delay = 0;
      if (divisionChanged) delay = Math.hypot(anchor[0] - center[0], anchor[1] - center[1]) * 260; // ripple outwards
      else if (!playing) delay = (anchor[0] - 88) * 90; // sweep west → east
      targets.set(f.id, {
        h: inScope ? 1000 + t * (divisionId ? 28000 : 42000) : 300 + t * 3000,
        c: inScope ? c : mix(c, BG, 0.72),
        delay,
      });
      m.setFeatureState({ source: 'districts', id: f.id }, { inScope, selected: id === districtId });
    });
    anim.current.animate(targets, playing ? 380 : divisionChanged ? 1400 : 1100);

    divisions.forEach((d) => m.setFeatureState({ source: 'divisions', id: d.id }, { active: d.id === divisionId }));
    last.current.divisionId = divisionId;
  }, [ready, divisionId, districtId, metric, time, year, domain]);

  // ---- camera ----
  useEffect(() => {
    if (!ready) return;
    const m = map.current;
    // District view keeps the division in frame and centres on the district
    const bounds = divisionId ? divisionBounds[divisionId] : COUNTRY_BOUNDS;
    const bearing = districtId ? -28 : divisionId ? -20 : -12;
    // Padding can exceed a small viewport; fall back to a lighter one
    const cam = m.cameraForBounds(bounds, { padding, bearing })
      ?? m.cameraForBounds(bounds, { padding: 20, bearing });
    if (!cam) return;
    const focus = districtId ? byId[districtId].properties.anchor : null;
    m.flyTo({
      ...cam,
      ...(focus && { center: focus, offset: [(padding.left - padding.right) / 2, (padding.top - padding.bottom) / 2 + 60] }),
      zoom: Math.min(cam.zoom + (districtId ? 0.35 : -0.15), 9),
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
    if (!ready || !playing) return;
    const m = map.current;
    const base = { center: m.getCenter(), bearing: m.getBearing(), pitch: m.getPitch(), zoom: m.getZoom() };
    const start = performance.now();
    const ease = (x) => 1 - Math.pow(1 - Math.min(1, x), 3);
    let raf;

    // Close, low-angle orbit; centred on the selected district when there is one
    const target = districtId ? maplibregl.LngLat.convert(byId[districtId].properties.anchor) : base.center;
    const fly = (now) => {
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

    return () => {
      cancelAnimationFrame(raf);
      m.off('mousedown', stop);
      m.off('wheel', stop);
      m.off('touchstart', stop);
      last.current.droneBase = base;
      m.easeTo({ ...base, duration: 1800 });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, playing]);

  // Small camera sweep when switching Past / Now / Future
  useEffect(() => {
    const changed = last.current.time !== undefined && last.current.time !== time;
    last.current.time = time;
    if (!ready || !changed) return;
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
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, time]);

  // ---- basemap & rain overlay ----
  useEffect(() => {
    if (!ready) return;
    const m = map.current;
    ['night', 'relief', 'satellite'].forEach((id) => m.setLayoutProperty(id, 'visibility', id === basemap ? 'visible' : 'none'));
    m.setLayoutProperty('rainfall', 'visibility', showRain ? 'visible' : 'none');
  }, [ready, basemap, showRain]);

  // ---- floating labels: districts of the division, or divisions of the country ----
  useEffect(() => {
    if (!ready) return;
    labels.current.forEach((l) => l.marker.remove());
    const items = divisionId
      ? districts.filter((d) => d.division === divisionId)
        .map((d) => ({ key: d.id, name: d.name, at: d.anchor, district: true }))
      : divisions.map((d) => ({ key: d.id, name: d.name, at: divisionCenter[d.id] }));

    labels.current = items.map((it, i) => {
      const el = document.createElement('div');
      el.className = `map-label${it.district ? '' : ' big'}`;
      el.style.animationDelay = `${500 + i * 45}ms`;
      el.innerHTML = `<b>${it.name}</b><span></span>`;
      if (it.district) el.onclick = () => map.current.__select?.(it.key);
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(it.at).addTo(map.current);
      return { ...it, el, marker };
    });
  }, [ready, divisionId]);

  // Hide labels that would overlap a more important one (selected first, then higher values)
  useEffect(() => {
    if (!ready) return;
    const m = map.current;
    let frame = null;
    const layout = () => {
      frame = null;
      const placed = [];
      [...labels.current]
        .sort((a, b) => (b.el.classList.contains('on') - a.el.classList.contains('on')) || (b.value ?? 0) - (a.value ?? 0))
        .forEach((l) => {
          const p = m.project(l.at);
          const w = l.el.offsetWidth + 6;
          const h = l.el.offsetHeight + 4;
          const box = [p.x - w / 2, p.y - h, p.x + w / 2, p.y];
          const hit = placed.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]);
          l.el.classList.toggle('hidden', hit);
          if (!hit) placed.push(box);
        });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(layout); };
    m.on('move', schedule);
    schedule();
    return () => { m.off('move', schedule); cancelAnimationFrame(frame); };
  }, [ready, divisionId, districtId, metric, time, year]);

  // Label values follow the metric / time / year without re-creating the labels
  useEffect(() => {
    labels.current.forEach((l) => {
      let v;
      if (l.district) v = valueAt(l.key, metric, time, year);
      else {
        const s = statsFor(idsOf(l.key), metric);
        v = year != null ? s.byYear[year - ALL_YEARS[0]] : s[time];
      }
      l.value = v;
      l.el.querySelector('span').textContent = formatValue(metric, v);
      l.el.classList.toggle('on', l.key === districtId);
    });
  }, [ready, divisionId, districtId, metric, time, year]);

  return (
    <>
      <div ref={box} className="map" />
      {ready && <MapNav map={map.current} ready={ready} playing={playing} />}
    </>
  );
}
