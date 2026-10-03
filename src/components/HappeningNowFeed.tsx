import { useState } from 'react';
import { useEonetFeed, type EonetHazardEvent } from '../hooks/useEonetFeed';
import { useTranslation } from '../lib/i18n';

interface HappeningNowFeedProps {
  onSelectEvent?: (event: EonetHazardEvent) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  floods: '🌊',
  severeStorms: '🌀',
  wildfires: '🔥',
  landslides: '⛰️',
  drought: '☀️',
  tempExtremes: '🌡️',
};

const CATEGORY_NAMES_BN: Record<string, string> = {
  floods: 'বন্যা',
  severeStorms: 'তীব্র ঘূর্ণিঝড়/ঝড়',
  wildfires: 'দাবানল/আগুন',
  landslides: 'ভূমিধস',
  drought: 'খরা',
  tempExtremes: 'চরম তাপমাত্রা',
};

export default function HappeningNowFeed({ onSelectEvent }: HappeningNowFeedProps) {
  const [filterCat, setFilterCat] = useState<string>('all');
  const { events, loading, error, isLive, isFallback, fetchedAt, source, refetch } = useEonetFeed(30);
  const { lang, toDigits } = useTranslation();

  const categories = Array.from(new Set(events.flatMap((e) => e.categories)));
  const filteredEvents = filterCat === 'all' ? events : events.filter((e) => e.categories.includes(filterCat));

  return (
    <div className="happening-now-card card">
      {/* Header */}
      <div className="happening-header">
        <div className="happening-title-group">
          <span className="live-radar-dot" />
          <div>
            <h4 className="card-title" style={{ margin: 0 }}>
              {lang === 'bn' ? 'চলমান দুর্যোগ ও ঘটনা' : 'Happening Now — Natural Hazards'}
            </h4>
            <span className="happening-subtitle">
              {lang === 'bn'
                ? `নাসা ইওনেট (EONET v3) বাংলাদেশ অঞ্চল (${toDigits(events.length)}টি ঘটনা)`
                : `NASA EONET v3 Bangladesh Region (${toDigits(events.length)} events)`}
            </span>
          </div>
        </div>

        <div className="happening-badges">
          {isLive && (
            <span className="live-status-tag live">
              <span className="tag-dot" />
              {lang === 'bn' ? 'লাইভ ফিড' : 'LIVE FEED'}
            </span>
          )}
          {isFallback && (
            <span className="live-status-tag fallback">
              <span className="tag-dot" />
              {lang === 'bn' ? 'সংরক্ষিত স্ন্যাপশট' : 'SAVED SNAPSHOT'}
            </span>
          )}
          {fetchedAt && (
            <span className="live-timestamp" title={`Source: ${source}`}>
              {toDigits(fetchedAt)}
            </span>
          )}
          <button
            type="button"
            className="happening-refresh-btn"
            onClick={() => refetch()}
            disabled={loading}
            title="Refresh EONET feed"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      {categories.length > 0 && (
        <div className="hazard-filter-chips">
          <button
            type="button"
            className={`filter-chip ${filterCat === 'all' ? 'on' : ''}`}
            onClick={() => setFilterCat('all')}
          >
            {lang === 'bn' ? 'সব' : 'All'} ({toDigits(events.length)})
          </button>
          {categories.map((cat) => {
            const count = events.filter((e) => e.categories.includes(cat)).length;
            const icon = CATEGORY_ICONS[cat] || '⚠️';
            const name = lang === 'bn' ? CATEGORY_NAMES_BN[cat] || cat : cat;
            return (
              <button
                key={cat}
                type="button"
                className={`filter-chip ${filterCat === cat ? 'on' : ''}`}
                onClick={() => setFilterCat(cat)}
              >
                <span>
                  {icon} {name}
                </span>
                <span className="chip-count">{toDigits(count)}</span>
              </button>
            );
          })}
        </div>
      )}

      {error && !isFallback && (
        <div className="live-error-banner">
          <span>{error}</span>
        </div>
      )}

      {/* Event Cards List */}
      <div className="hazard-events-scroll">
        {loading && events.length === 0 ? (
          <div className="hazard-loading">
            <span className="spinner-border" />
            <span>
              {lang === 'bn' ? 'নাসা ইওনেট থেকে তথ্য নেওয়া হচ্ছে...' : 'Fetching active events from NASA EONET...'}
            </span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="hazard-empty">
            <span>
              {lang === 'bn'
                ? 'গত ৩০ দিনে কোনো সক্রিয় দুর্যোগের রেকর্ড নেই।'
                : 'No active hazards recorded in the last 30 days.'}
            </span>
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const primaryCat = ev.categories[0] || 'hazard';
            const icon = CATEGORY_ICONS[primaryCat] || '⚠️';
            const dateStr = ev.date ? new Date(ev.date).toLocaleDateString() : '';

            return (
              <div
                key={ev.id}
                className="hazard-event-item"
                onClick={() => ev.coordinates && onSelectEvent?.(ev)}
                style={{ cursor: ev.coordinates ? 'pointer' : 'default' }}
                title={ev.coordinates ? 'Click to show on map' : ''}
              >
                <div className="hazard-item-icon">{icon}</div>
                <div className="hazard-item-content">
                  <div className="hazard-item-top">
                    <span className="hazard-title">{ev.title}</span>
                    <span className={`hazard-status-pill ${ev.closed ? 'closed' : 'open'}`}>
                      {ev.closed ? (lang === 'bn' ? 'সম্পন্ন' : 'RESOLVED') : lang === 'bn' ? 'সক্রিয়' : 'OPEN'}
                    </span>
                  </div>

                  <div className="hazard-item-meta">
                    <span className="hazard-date">{toDigits(dateStr)}</span>
                    {ev.coordinates && (
                      <span className="hazard-coords">
                        📍 {toDigits(ev.coordinates[1].toFixed(2))}°N, {toDigits(ev.coordinates[0].toFixed(2))}°E
                      </span>
                    )}
                    {ev.sources?.[0]?.url && (
                      <a
                        href={ev.sources[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hazard-source-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {lang === 'bn' ? 'উৎস' : 'Source'} ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
