import { useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import SystemStatusBar from '../SystemStatusBar';

interface MobileMoreHubProps {
  canInstall?: boolean;
  isInstalled?: boolean;
  onInstall?: () => void;
  onOpenSpeciesRecords: () => void;
  onOpenDataMethods: () => void;
  onOpenWildlife: () => void;
  onOpenValidation: () => void;
  onOpenAbout: () => void;
}

export default function MobileMoreHub({
  canInstall,
  isInstalled,
  onInstall,
  onOpenSpeciesRecords,
  onOpenDataMethods,
  onOpenWildlife,
  onOpenValidation,
  onOpenAbout,
}: MobileMoreHubProps) {
  const { lang, setLang, t } = useTranslation();
  const [showIosTip, setShowIosTip] = useState(false);

  const handleInstallClick = () => {
    if (canInstall && onInstall) {
      onInstall();
    } else {
      setShowIosTip(true);
    }
  };

  return (
    <div className="mobile-more-hub" role="region" aria-label="More Features and Settings">
      {/* PWA Install Card */}
      <div className="mobile-hub-card install-card">
        <div className="hub-card-icon">📱</div>
        <div className="hub-card-content">
          <h4>{isInstalled ? t('mobileNav.installed') : t('mobileNav.installApp')}</h4>
          <p>
            {isInstalled
              ? lang === 'bn'
                ? 'অ্যাপটি আপনার ডিভাইসে যুক্ত রয়েছে'
                : 'App is running in standalone mode'
              : t('mobileNav.installSubtitle')}
          </p>
          {!isInstalled && (
            <button type="button" className="hub-install-btn" onClick={handleInstallClick}>
              {canInstall ? t('mobileNav.installAction') : lang === 'bn' ? 'কীভাবে ইনস্টল করবেন?' : 'How to Install'}
            </button>
          )}
          {showIosTip && (
            <div className="hub-ios-tip">
              <p>💡 {t('mobileNav.iosInstallHint')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Explorers & Data Tools */}
      <h3 className="hub-section-title">{lang === 'bn' ? 'তথ্য ও গবেষণা টুলস' : 'Research & Analytics Tools'}</h3>
      <div className="hub-grid">
        <button type="button" className="hub-tile" onClick={onOpenSpeciesRecords}>
          <span className="hub-tile-icon">🐾</span>
          <div className="hub-tile-text">
            <strong>{lang === 'bn' ? 'প্রজাতি পর্যবেক্ষণ রেকর্ড' : 'Species Occurrence Records'}</strong>
            <small>GBIF · Biodiversity Occurrence</small>
          </div>
          <span className="hub-tile-arrow">›</span>
        </button>

        <button type="button" className="hub-tile" onClick={onOpenDataMethods}>
          <span className="hub-tile-icon">📊</span>
          <div className="hub-tile-text">
            <strong>{lang === 'bn' ? 'তথ্য ও বিশ্লেষণ পদ্ধতি' : 'Data & Analytical Methods'}</strong>
            <small>NASA POWER · CMIP6 · Bias Correction</small>
          </div>
          <span className="hub-tile-arrow">›</span>
        </button>

        <button type="button" className="hub-tile" onClick={onOpenWildlife}>
          <span className="hub-tile-icon">🐅</span>
          <div className="hub-tile-text">
            <strong>{t('wildlifeGallery.btnTitle')}</strong>
            <small>IUCN Red List · Extinction Pressures</small>
          </div>
          <span className="hub-tile-arrow">›</span>
        </button>

        <button type="button" className="hub-tile" onClick={onOpenValidation}>
          <span className="hub-tile-icon">🔬</span>
          <div className="hub-tile-text">
            <strong>{t('validationModal.btnTitle')}</strong>
            <small>NASA Satellite vs BMD Weather Stations</small>
          </div>
          <span className="hub-tile-arrow">›</span>
        </button>

        <button type="button" className="hub-tile" onClick={onOpenAbout}>
          <span className="hub-tile-icon">ℹ️</span>
          <div className="hub-tile-text">
            <strong>{t('aboutModal.btnTitle')}</strong>
            <small>Guide · Impact Story · NASA POWER</small>
          </div>
          <span className="hub-tile-arrow">›</span>
        </button>
      </div>

      {/* Language Selector */}
      <div className="mobile-hub-card lang-card">
        <div className="hub-card-content">
          <h4>{t('app.switchLang')}</h4>
          <div className="hub-lang-switch">
            <button
              type="button"
              className={'hub-lang-btn' + (lang === 'en' ? ' on' : '')}
              onClick={() => setLang('en')}
            >
              English
            </button>
            <button
              type="button"
              className={'hub-lang-btn' + (lang === 'bn' ? ' on' : '')}
              onClick={() => setLang('bn')}
            >
              বাংলা (Bengali)
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="mobile-hub-card status-card">
        <SystemStatusBar />
      </div>
    </div>
  );
}
