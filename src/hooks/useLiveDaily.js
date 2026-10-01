import { useEffect, useState } from 'react';
import { districts } from '../lib/metrics.js';

const KEY = { rain: 'PRECTOTCORR', tmax: 'T2M_MAX', wet: 'GWETROOT' };
const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
const cache = new Map();

/**
 * Pulls the latest 60 days straight from NASA POWER for one district.
 * Falls back to the bundled snapshot while loading or if the request fails.
 */
export default function useLiveDaily(districtId, fallback) {
  const [live, setLive] = useState(null);

  useEffect(() => {
    setLive(null);
    if (!districtId) return;
    const d = districts.find((x) => x.id === districtId);
    let cancelled = false;

    const load = cache.get(districtId) ?? (async () => {
      const end = new Date();
      const start = new Date(end.getTime() - 66 * 864e5);
      const url = 'https://power.larc.nasa.gov/api/temporal/daily/point'
        + `?parameters=${Object.values(KEY).join(',')}&community=AG`
        + `&longitude=${d.anchor[0]}&latitude=${d.anchor[1]}&start=${ymd(start)}&end=${ymd(end)}&format=JSON`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.statusText);
      return (await res.json()).properties.parameter;
    })();
    cache.set(districtId, load);

    load.then((p) => {
      if (cancelled) return;
      const k = KEY[fallback.key];
      const dates = Object.keys(p[k]).filter((x) => p[k][x] > -900).slice(-60);
      setLive({ dates, values: dates.map((x) => p[k][x] * (fallback.key === 'wet' ? 100 : 1)), key: fallback.key, live: true });
    }).catch(() => cache.delete(districtId));

    return () => { cancelled = true; };
  }, [districtId, fallback.key]);

  return live && live.key === fallback.key ? live : fallback;
}
