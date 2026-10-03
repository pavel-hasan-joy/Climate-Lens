import { useState, useEffect, useCallback } from 'react';
import dataStatus from '../data/analysis/data-status.json';
import { useTranslation } from '../lib/i18n';
import { monthName, toBanglaDigits } from '../lib/format';

export type LiveSourceStatus = 'checking' | 'operational' | 'degraded' | 'offline';

export interface SystemStatusState {
  lastUpdatedIso: string;
  lastUpdatedFormatted: string;
  reachability: LiveSourceStatus;
  pipelineSuccess: boolean;
  totalSources: number;
  checkReachability: () => Promise<void>;
}

export function formatStatusDate(isoString: string, lang: 'en' | 'bn'): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = d.getUTCDate();
    const month = monthName(d.getUTCMonth(), lang);
    const year = d.getUTCFullYear();
    const formattedDay = lang === 'bn' ? toBanglaDigits(day) : day;
    const formattedYear = lang === 'bn' ? toBanglaDigits(year) : year;
    return `${formattedDay} ${month} ${formattedYear}`;
  } catch {
    return isoString;
  }
}

export function useSystemStatus(): SystemStatusState {
  const { lang } = useTranslation();
  const [reachability, setReachability] = useState<LiveSourceStatus>('checking');

  const checkReachability = useCallback(async () => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
      setReachability('offline');
      return;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);

      // Probe NASA EONET v3 events (CORS enabled open endpoint)
      const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?limit=1', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);

      if (res.ok) {
        setReachability('operational');
      } else {
        setReachability('degraded');
      }
    } catch {
      // If browser is online but request failed/timed out, mark as degraded
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setReachability('offline');
      } else {
        setReachability('degraded');
      }
    }
  }, []);

  useEffect(() => {
    checkReachability();

    const handleOnline = () => {
      setReachability('checking');
      checkReachability();
    };

    const handleOffline = () => {
      setReachability('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodically re-check every 3 minutes
    const interval = setInterval(
      () => {
        checkReachability();
      },
      3 * 60 * 1000,
    );

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkReachability]);

  const lastUpdatedIso = dataStatus?.timestamp || '2026-10-02T16:33:32.499Z';
  const lastUpdatedFormatted = formatStatusDate(lastUpdatedIso, lang);
  const totalSources = dataStatus?.sources ? Object.keys(dataStatus.sources).length : 4;
  const pipelineSuccess = Boolean(dataStatus?.overallSuccess);

  return {
    lastUpdatedIso,
    lastUpdatedFormatted,
    reachability,
    pipelineSuccess,
    totalSources,
    checkReachability,
  };
}
