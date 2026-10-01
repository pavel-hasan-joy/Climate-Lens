import type { Map as MapLibreMap } from 'maplibre-gl';

/**
 * Tweens each district's height and colour through map feature-state,
 * so bars rise, fall and re-colour smoothly (data-driven paint can't transition by itself).
 */
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export interface AnimationTarget {
  h: number;
  c: [number, number, number];
  delay?: number;
}

interface AnimationJob {
  from: { h: number; c: [number, number, number] };
  to: AnimationTarget;
  start: number;
  dur: number;
}

export default class Animator {
  map: MapLibreMap;
  source: string;
  cur: Map<string | number, { h: number; c: [number, number, number] }>;
  jobs: Map<string | number, AnimationJob>;
  raf: number | null;

  constructor(map: MapLibreMap, source: string) {
    this.map = map;
    this.source = source;
    this.cur = new Map(); // id → { h, c: [r,g,b] }
    this.jobs = new Map(); // id → { from, to, start, dur }
    this.raf = null;
  }

  // targets: Map(id → { h, c, delay })
  animate(targets: Map<string | number, AnimationTarget>, duration: number = 1100): void {
    const now = performance.now();
    for (const [id, t] of targets) {
      const from = this.cur.get(id) ?? { h: 0, c: t.c };
      this.jobs.set(id, { from: { h: from.h, c: [...from.c] }, to: t, start: now + (t.delay || 0), dur: duration });
    }
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
  }

  tick = (now: number): void => {
    for (const [id, j] of this.jobs) {
      const p = Math.min(1, Math.max(0, (now - j.start) / j.dur));
      const e = easeInOut(p);
      const h = j.from.h + (j.to.h - j.from.h) * e;
      const c: [number, number, number] = [
        Math.round(j.from.c[0] + (j.to.c[0] - j.from.c[0]) * e),
        Math.round(j.from.c[1] + (j.to.c[1] - j.from.c[1]) * e),
        Math.round(j.from.c[2] + (j.to.c[2] - j.from.c[2]) * e),
      ];
      this.cur.set(id, { h, c });
      this.map.setFeatureState({ source: this.source, id }, { h, color: `rgb(${c[0]},${c[1]},${c[2]})` });
      if (p >= 1) this.jobs.delete(id);
    }
    this.raf = this.jobs.size ? requestAnimationFrame(this.tick) : null;
  };

  stop(): void {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
  }
}
