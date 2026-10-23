import { useTranslation } from '../../lib/i18n';

export type MobileTab = 'map' | 'districts' | 'details' | 'more';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
  selectedDistrictName?: string | null;
}

export default function MobileBottomNav({ activeTab, onChangeTab, selectedDistrictName }: MobileBottomNavProps) {
  const { t } = useTranslation();

  return (
    <nav className="mobile-bottom-nav" role="navigation" aria-label="Mobile Navigation">
      <button
        type="button"
        className={'mobile-nav-btn' + (activeTab === 'map' ? ' active' : '')}
        onClick={() => onChangeTab('map')}
        aria-selected={activeTab === 'map'}
      >
        <span className="mobile-nav-icon">🗺️</span>
        <span className="mobile-nav-label">{t('mobileNav.map')}</span>
      </button>

      <button
        type="button"
        className={'mobile-nav-btn' + (activeTab === 'districts' ? ' active' : '')}
        onClick={() => onChangeTab('districts')}
        aria-selected={activeTab === 'districts'}
      >
        <span className="mobile-nav-icon">📍</span>
        <span className="mobile-nav-label">{t('mobileNav.districts')}</span>
      </button>

      <button
        type="button"
        className={'mobile-nav-btn' + (activeTab === 'details' ? ' active' : '')}
        onClick={() => onChangeTab('details')}
        aria-selected={activeTab === 'details'}
      >
        <span className="mobile-nav-icon">📊</span>
        <span className="mobile-nav-label">{t('mobileNav.details')}</span>
        {selectedDistrictName && <span className="mobile-nav-badge" title={selectedDistrictName} />}
      </button>

      <button
        type="button"
        className={'mobile-nav-btn' + (activeTab === 'more' ? ' active' : '')}
        onClick={() => onChangeTab('more')}
        aria-selected={activeTab === 'more'}
      >
        <span className="mobile-nav-icon">⚙️</span>
        <span className="mobile-nav-label">{t('mobileNav.more')}</span>
      </button>
    </nav>
  );
}
