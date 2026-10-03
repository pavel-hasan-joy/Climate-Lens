import React from 'react';
import { useSystemStatus } from '../hooks/useSystemStatus';
import { useTranslation } from '../lib/i18n';

interface SystemStatusBarProps {
  className?: string;
  compact?: boolean;
}

export const SystemStatusBar: React.FC<SystemStatusBarProps> = ({ className = '', compact = false }) => {
  const { lastUpdatedFormatted, reachability, checkReachability } = useSystemStatus();
  const { t } = useTranslation();

  const getStatusConfig = () => {
    switch (reachability) {
      case 'operational':
        return {
          label: t('systemStatus.operational'),
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.35)',
          dotClass: 'status-dot-green',
        };
      case 'checking':
        return {
          label: t('systemStatus.checking'),
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.35)',
          dotClass: 'status-dot-amber pulse',
        };
      case 'degraded':
        return {
          label: t('systemStatus.degraded'),
          color: '#f97316',
          bg: 'rgba(249, 115, 22, 0.12)',
          border: 'rgba(249, 115, 22, 0.35)',
          dotClass: 'status-dot-amber',
        };
      case 'offline':
      default:
        return {
          label: t('systemStatus.offline'),
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.35)',
          dotClass: 'status-dot-red',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const dateText = t('systemStatus.dataUpdated', { date: lastUpdatedFormatted });

  return (
    <div
      role="status"
      aria-live="polite"
      className={`system-status-bar ${compact ? 'compact' : ''} ${className}`}
      title={t('systemStatus.tooltip')}
    >
      <div className="status-meta">
        <span className="status-clock-icon" aria-hidden="true">
          🕒
        </span>
        <span className="status-date-label">{dateText}</span>
      </div>

      <div className="status-divider" aria-hidden="true">
        •
      </div>

      <button
        type="button"
        className="status-pill-btn"
        onClick={() => checkReachability()}
        style={{
          background: statusConfig.bg,
          borderColor: statusConfig.border,
          color: statusConfig.color,
        }}
        title={t('systemStatus.tooltip')}
      >
        <span
          className={`status-indicator-dot ${statusConfig.dotClass}`}
          style={{ background: statusConfig.color }}
          aria-hidden="true"
        />
        <span className="status-source-tag">{t('systemStatus.liveFeeds')}:</span>
        <span className="status-state-text">{statusConfig.label}</span>
      </button>
    </div>
  );
};

export default SystemStatusBar;
