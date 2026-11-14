import { useTranslation } from '../lib/i18n';

interface CleanMapToggleProps {
  active: boolean;
  onToggle: () => void;
  compact?: boolean;
  className?: string;
}

/**
 * CleanMapToggle — Eye-icon bar to toggle Clean Map / Focus Mode.
 * In Clean Map Mode, UI overlays and detail panels slide away smoothly,
 * allowing full immersion in the 3D Map.
 */
export default function CleanMapToggle({ active, onToggle, compact = false, className = '' }: CleanMapToggleProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`clean-map-bar ${active ? 'is-active' : ''} ${compact ? 'is-compact' : ''} ${className}`}
      role="region"
      aria-label="Map View Controls"
    >
      <button
        type="button"
        className="clean-map-toggle-btn"
        onClick={onToggle}
        aria-pressed={active}
        title={active ? t('cleanMap.tooltipRestore') : t('cleanMap.tooltipFocus')}
        aria-label={active ? t('cleanMap.restore') : t('cleanMap.focus')}
      >
        <span className="clean-map-icon" aria-hidden="true">
          {active ? (
            /* EyeOff (crossed-out eye) icon */
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor">
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" y1="2" x2="22" y2="22" />
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            </svg>
          ) : (
            /* Open eye icon */
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </span>
        <span className="clean-map-label">{active ? t('cleanMap.restore') : t('cleanMap.focus')}</span>
        {!compact && (
          <span className="clean-map-badge" aria-hidden="true">
            {active ? t('cleanMap.exitShortcut') : t('cleanMap.shortcut')}
          </span>
        )}
      </button>
    </div>
  );
}
