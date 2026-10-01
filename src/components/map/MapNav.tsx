import { useEffect, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { useTranslation } from '../../lib/i18n';

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

interface MapNavProps {
  map: MapLibreMap | null;
  ready: boolean;
  playing: boolean;
}

/**
 * Map navigation: zoom, 360° rotation (drag mode, auto-spin, arrow keys) and a compass.
 * MapLibre only rotates on right-drag / Ctrl-drag by default, which few people find.
 */
export default function MapNav({ map, ready, playing }: MapNavProps) {
  const { t, toDigits } = useTranslation();
  const [mode, setMode] = useState<'move' | 'rotate'>('move'); // left-drag: 'move' pans, 'rotate' orbits
  const [spinning, setSpinning] = useState(false);
  const [bearing, setBearing] = useState(0);

  // Keep the compass needle in sync
  useEffect(() => {
    if (!ready || !map) return;
    let frame: number | null = null;
    const sync = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        setBearing(map.getBearing());
      });
    };
    map.on('rotate', sync);
    sync();
    return () => {
      map.off('rotate', sync);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [map, ready]);

  // Rotate mode: left-drag sideways spins 360°, up/down tilts
  useEffect(() => {
    if (!ready || !map) return;
    const el = map.getCanvasContainer();
    if (mode !== 'rotate') {
      map.dragPan.enable();
      el.classList.remove('rotate-mode');
      return;
    }
    map.dragPan.disable();
    el.classList.add('rotate-mode');
    let last: [number, number] | null = null;

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      last = [e.clientX, e.clientY];
      el.classList.add('dragging');
      setSpinning(false);
    };
    const move = (e: PointerEvent) => {
      if (!last) return;
      const dx = e.clientX - last[0];
      const dy = e.clientY - last[1];
      last = [e.clientX, e.clientY];
      map.jumpTo({
        bearing: map.getBearing() - dx * 0.4,
        pitch: clamp(map.getPitch() - dy * 0.25, 0, map.getMaxPitch()),
      });
    };
    const up = () => {
      last = null;
      el.classList.remove('dragging');
    };

    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      el.classList.remove('rotate-mode', 'dragging');
    };
  }, [map, ready, mode]);

  // 360° spin: keeps turning until the user grabs the map or presses the button again
  useEffect(() => {
    if (!ready || !map || !spinning || playing) return;
    let raf: number;
    const turn = () => {
      map.setBearing(map.getBearing() + 0.18);
      raf = requestAnimationFrame(turn);
    };
    raf = requestAnimationFrame(turn);
    const stop = () => setSpinning(false);
    map.on('mousedown', stop);
    map.on('touchstart', stop);
    map.on('wheel', stop);
    return () => {
      cancelAnimationFrame(raf);
      map.off('mousedown', stop);
      map.off('touchstart', stop);
      map.off('wheel', stop);
    };
  }, [map, ready, spinning, playing]);

  // Arrow keys ← → rotate, ↑ ↓ tilt (ignored while typing in a field)
  useEffect(() => {
    if (!ready || !map) return;
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, [contenteditable]')) return;
      const step = {
        ArrowLeft: [-15, 0],
        ArrowRight: [15, 0],
        ArrowUp: [0, 8],
        ArrowDown: [0, -8],
      }[e.key];
      if (!step) return;
      e.preventDefault();
      setSpinning(false);
      map.easeTo({
        bearing: map.getBearing() + step[0],
        pitch: clamp(map.getPitch() + step[1], 0, map.getMaxPitch()),
        duration: 350,
      });
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [map, ready]);

  const rotateBy = (deg: number) => {
    if (!map) return;
    setSpinning(false);
    map.easeTo({ bearing: map.getBearing() + deg, duration: 600 });
  };
  const shownBearing = ((Math.round(bearing) % 360) + 360) % 360;

  return (
    <div className="map-nav">
      <div className="nav-mode" role="group" aria-label={t('mapNav.dragToMove')}>
        <button className={mode === 'move' ? 'on' : ''} onClick={() => setMode('move')} title={t('mapNav.dragToMove')}>
          <svg viewBox="0 0 24 24">
            <path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3" />
          </svg>
          {t('mapNav.move')}
        </button>
        <button
          className={mode === 'rotate' ? 'on' : ''}
          onClick={() => setMode('rotate')}
          title={t('mapNav.dragToRotate')}
        >
          <svg viewBox="0 0 24 24">
            <path d="M20 12a8 8 0 1 1-2.3-5.7" />
            <path d="M20 4v4h-4" />
          </svg>
          {t('mapNav.rotate')}
        </button>
      </div>

      <div className="nav-group">
        <button onClick={() => map?.zoomIn()} title={t('mapNav.zoomIn')} aria-label={t('mapNav.zoomIn')}>
          <svg viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button onClick={() => map?.zoomOut()} title={t('mapNav.zoomOut')} aria-label={t('mapNav.zoomOut')}>
          <svg viewBox="0 0 24 24">
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>

      <div className="nav-group">
        <button onClick={() => rotateBy(-45)} title={t('mapNav.rotateLeft')} aria-label={t('mapNav.rotateLeft')}>
          <svg viewBox="0 0 24 24">
            <path d="M4 12a8 8 0 1 0 2.3-5.7" />
            <path d="M4 4v4h4" />
          </svg>
        </button>
        <button
          className="compass"
          onClick={() => {
            if (!map) return;
            setSpinning(false);
            map.easeTo({ bearing: 0, pitch: 50, duration: 900 });
          }}
          title={t('mapNav.faceNorth')}
          aria-label={`Facing ${toDigits(shownBearing)}°, reset to north`}
        >
          <svg viewBox="0 0 24 24" style={{ transform: `rotate(${-bearing}deg)` }}>
            <path className="north" d="M12 3l3.5 9h-7z" />
            <path className="south" d="M12 21l-3.5-9h7z" />
          </svg>
        </button>
        <button onClick={() => rotateBy(45)} title={t('mapNav.rotateRight')} aria-label={t('mapNav.rotateRight')}>
          <svg viewBox="0 0 24 24">
            <path d="M20 12a8 8 0 1 1-2.3-5.7" />
            <path d="M20 4v4h-4" />
          </svg>
        </button>
      </div>

      <button
        className={'nav-spin' + (spinning ? ' on' : '')}
        onClick={() => setSpinning((s) => !s)}
        disabled={playing}
        title={t('mapNav.spin')}
      >
        <svg viewBox="0 0 24 24">
          <ellipse cx="12" cy="12" rx="9" ry="4" />
          <path d="M12 3v2M12 19v2" />
          <path d="M18 9.5l2.5-1.5M18 9.5l.5 2.8" />
        </svg>
        {toDigits('360')}°
      </button>

      <span className="nav-deg">{toDigits(shownBearing)}°</span>
    </div>
  );
}
