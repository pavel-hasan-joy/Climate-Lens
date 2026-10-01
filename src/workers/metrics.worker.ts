/**
 * Heavy statistical & climate model computation worker.
 * Offloads Theil-Sen regression, Mann-Kendall trend tests, and multi-district
 * CMIP6 projection matrix aggregations off the browser main UI thread.
 */

// Normal CDF approximation (Abramowitz & Stegun)
function normalCdf(x: number): number {
  const b1 = 0.31938153;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  if (x >= 0) {
    const t = 1.0 / (1.0 + p * x);
    return 1.0 - c * Math.exp((-x * x) / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  }
  const t = 1.0 / (1.0 - p * x);
  return c * Math.exp((-x * x) / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
}

function median(a: number[]): number {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const h = s.length >> 1;
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
}

function mean(a: number[]): number {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
}

function mannKendall(ys: number[]) {
  const n = ys.length;
  if (n < 4) return { s: 0, z: 0, p: 1, significant: false };

  let s = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const diff = ys[j] - ys[i];
      if (diff > 0) s += 1;
      else if (diff < 0) s -= 1;
    }
  }

  const counts = new Map<number, number>();
  ys.forEach((y) => counts.set(y, (counts.get(y) || 0) + 1));
  let tieSum = 0;
  for (const t of counts.values()) {
    if (t > 1) tieSum += t * (t - 1) * (2 * t + 5);
  }

  const varS = (n * (n - 1) * (2 * n + 5) - tieSum) / 18;
  const sdS = Math.sqrt(varS);
  let z = 0;
  if (s > 0) z = (s - 1) / sdS;
  else if (s < 0) z = (s + 1) / sdS;

  const p = 2 * (1 - normalCdf(Math.abs(z)));
  return { s, z: Math.round(z * 100) / 100, p: Math.round(p * 1000) / 1000, significant: p < 0.05 };
}

function theilSen(xs: number[], ys: number[]) {
  const slopes: number[] = [];
  for (let i = 0; i < xs.length; i++) {
    for (let j = i + 1; j < xs.length; j++) {
      slopes.push((ys[j] - ys[i]) / (xs[j] - xs[i]));
    }
  }
  const slope = median(slopes);
  const intercept = median(ys.map((y, i) => y - slope * xs[i]));
  const resid = ys.map((y, i) => y - (intercept + slope * xs[i]));
  const sd = Math.sqrt(mean(resid.map((r) => r * r)));
  return { slope, intercept, sd };
}

self.onmessage = (e: MessageEvent) => {
  const { id, type, payload } = e.data;

  try {
    let result: unknown;
    if (type === 'MANN_KENDALL') {
      result = mannKendall(payload.ys);
    } else if (type === 'THEIL_SEN') {
      result = theilSen(payload.xs, payload.ys);
    } else {
      throw new Error(`Unknown worker command type: ${type}`);
    }

    self.postMessage({ id, success: true, result });
  } catch (err: any) {
    self.postMessage({ id, success: false, error: err?.message || String(err) });
  }
};
