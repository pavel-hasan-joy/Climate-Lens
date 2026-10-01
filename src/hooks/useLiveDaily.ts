import { useEffect, useState } from 'react';
import { districts } from '../lib/metrics';

interface DailyPayload {
  dates: string[];
  values: number[];
  key: string;
  live?: boolean;
}

const KEY: Record<string, string> = { rain: 'PRECTOTCORR', tmax: 'T2M_MAX', wet: 'GWETROOT' };
const ymd = (d: Date): string => d.toISOString().slice(0, 10).replace(/-/g, '');
const cache = new Map<string, Promise<Record<string, Record<string, number>>>>();

/**
 * Pulls the latest 60 days straight from NASA POWER for one district.
 * Falls back to the bundled snapshot while loading or if the request fails.
 */
export default function useLiveDaily(districtId: string | null | undefined, fallback: DailyPayload): DailyPayload {
  const [live, setLive] = useState<DailyPayload | null>(null);
  const [lastDistrictId, setLastDistrictId] = useState<string | null | undefined>(districtId);

  // If districtId changed, reset live during render
  if (districtId !== lastDistrictId) {
    setLastDistrictId(districtId);
    setLive(null);
  }

  useEffect(() => {
    if (!districtId) return;
    const d = districts.find((x) => x.id === districtId);
    if (!d) return;
    let cancelled = false;

    const load =
      cache.get(districtId) ??
      (async () => {
        const end = new Date();
        const start = new Date(end.getTime() - 66 * 864e5);
        const url =
          'https://power.larc.nasa.gov/api/temporal/daily/point' +
          `?parameters=${Object.values(KEY).join(',')}&community=AG` +
          `&longitude=${d.anchor[0]}&latitude=${d.anchor[1]}&start=${ymd(start)}&end=${ymd(end)}&format=JSON`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        return data.properties.parameter as Record<string, Record<string, number>>;
      })();
    cache.set(districtId, load);

    load
      .then((p) => {
        if (cancelled) return;
        const k = KEY[fallback.key];
        if (!p[k]) return;
        const dates = Object.keys(p[k])
          .filter((x) => p[k][x] > -900)
          .slice(-60);
        setLive({
          dates,
          values: dates.map((x) => p[k][x] * (fallback.key === 'wet' ? 100 : 1)),
          key: fallback.key,
          live: true,
        });
      })
      .catch(() => cache.delete(districtId));

    return () => {
      cancelled = true;
    };
  }, [districtId, fallback.key]);

  return live && live.key === fallback.key ? live : fallback;
}
