/**
 * Tweens each district's height and colour through map feature-state,
 * so bars rise, fall and re-colour smoothly (data-driven paint can't transition by itself).
 */
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default class Animator {
  constructor(map, source) {
    this.map = map;
    this.source = source;
    this.cur = new Map(); // id → { h, c: [r,g,b] }
    this.jobs = new Map(); // id → { from, to, start, dur }
    this.raf = null;
  }

  // targets: Map(id → { h, c, delay })
  animate(targets, duration = 1100) {
    const now = performance.now();
    for (const [id, t] of targets) {
      const from = this.cur.get(id) ?? { h: 0, c: t.c };
      this.jobs.set(id, { from: { h: from.h, c: [...from.c] }, to: t, start: now + (t.delay || 0), dur: duration });
    }
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
  }

  tick = (now) => {
    for (const [id, j] of this.jobs) {
      const p = Math.min(1, Math.max(0, (now - j.start) / j.dur));
      const e = easeInOut(p);
      const h = j.from.h + (j.to.h - j.from.h) * e;
      const c = j.from.c.map((v, k) => Math.round(v + (j.to.c[k] - v) * e));
      this.cur.set(id, { h, c });
      this.map.setFeatureState({ source: this.source, id }, { h, color: `rgb(${c})` });
      if (p >= 1) this.jobs.delete(id);
    }
    this.raf = this.jobs.size ? requestAnimationFrame(this.tick) : null;
  };

  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = null;
  }
}
