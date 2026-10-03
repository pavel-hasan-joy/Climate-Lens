import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../lib/i18n';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreDistrict?: (districtId: string) => void;
}

export default function AboutModal({ isOpen, onClose, onExploreDistrict }: AboutModalProps) {
  const { t, toDigits } = useTranslation();
  const [activeTab, setActiveTab] = useState<'guide' | 'story'>('guide');
  const [storyStep, setStoryStep] = useState<1 | 2 | 3>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 30000 ms
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 30-second automated timer for the impact story
  useEffect(() => {
    if (!isOpen || activeTab !== 'story' || !isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = 100;
    const totalMs = 30000;
    const stepDurationMs = 10000;

    timerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + intervalMs;
        if (next >= totalMs) {
          setIsPlaying(false);
          setStoryStep(3);
          return totalMs;
        }
        // Advance steps at 10s (10000ms) and 20s (20000ms)
        const nextStep = Math.min(3, Math.floor(next / stepDurationMs) + 1) as 1 | 2 | 3;
        setStoryStep(nextStep);
        return next;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, activeTab, isPlaying]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (dontShowAgain) {
      localStorage.setItem('climate-lens-about-seen', 'true');
    }
    onClose();
  };

  const togglePlay = () => {
    if (progress >= 30000) {
      setProgress(0);
      setStoryStep(1);
    }
    setIsPlaying((prev) => !prev);
  };

  const goToStep = (step: 1 | 2 | 3) => {
    setIsPlaying(false);
    setStoryStep(step);
    setProgress((step - 1) * 10000);
  };

  const handleExploreRajshahi = () => {
    onExploreDistrict?.('rajshahi');
    onClose();
  };

  return (
    <div className="modal-backdrop fade" onClick={onClose}>
      <div
        className="modal-card about-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label={t('aboutModal.close')}>
          ✕
        </button>

        <header className="about-header">
          <div className="about-icon">
            <span className="pulse-dot" />
          </div>
          <div>
            <h2 id="about-title">{t('aboutModal.title')}</h2>
            <p className="about-subtitle">{t('aboutModal.subtitle')}</p>
          </div>
        </header>

        {/* Tab Switcher: Overview Guide vs 30s Guided Impact Story */}
        <nav className="about-nav-tabs" role="tablist">
          <button
            type="button"
            className={'about-tab-btn' + (activeTab === 'guide' ? ' on' : '')}
            onClick={() => {
              setActiveTab('guide');
              setIsPlaying(false);
            }}
            role="tab"
            aria-selected={activeTab === 'guide'}
          >
            📖 {t('aboutModal.tabGuide')}
          </button>
          <button
            type="button"
            className={'about-tab-btn' + (activeTab === 'story' ? ' on' : '')}
            onClick={() => {
              setActiveTab('story');
              setIsPlaying(true);
            }}
            role="tab"
            aria-selected={activeTab === 'story'}
          >
            🎬 {t('aboutModal.tabStory')}
          </button>
        </nav>

        {/* MODE 1: Standard Overview Guide */}
        {activeTab === 'guide' && (
          <div className="about-guide-view fade">
            {/* Quick Launcher Banner for 30s Impact Story */}
            <div
              className="about-story-banner"
              onClick={() => {
                setActiveTab('story');
                setIsPlaying(true);
              }}
            >
              <div className="story-banner-icon">🎬</div>
              <div className="story-banner-text">
                <strong>{t('aboutModal.tabStory')}</strong>
                <span> — {t('aboutModal.storySubtitle')}</span>
              </div>
              <button type="button" className="story-banner-btn">
                ▶ Start 30s Tour
              </button>
            </div>

            <div className="about-sections">
              <div className="about-card">
                <div className="about-card-badge">1</div>
                <div>
                  <h3>{t('aboutModal.section1Title')}</h3>
                  <p>{t('aboutModal.section1Text')}</p>
                </div>
              </div>

              <div className="about-card">
                <div className="about-card-badge">2</div>
                <div>
                  <h3>{t('aboutModal.section2Title')}</h3>
                  <p>{t('aboutModal.section2Text')}</p>
                </div>
              </div>

              <div className="about-card">
                <div className="about-card-badge">3</div>
                <div>
                  <h3>{t('aboutModal.section3Title')}</h3>
                  <p>{t('aboutModal.section3Text')}</p>
                </div>
              </div>
            </div>

            <div className="about-footer-sources">
              <small>{t('aboutModal.dataSources')}</small>
            </div>

            <footer className="about-footer">
              <label className="dont-show-toggle">
                <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} />
                <span>{t('aboutModal.dontShowAgain')}</span>
              </label>
              <button type="button" className="action-btn primary" onClick={handleConfirm}>
                {t('aboutModal.gotIt')}
              </button>
            </footer>
          </div>
        )}

        {/* MODE 2: 30-Second Guided Impact Story (Rajshahi) */}
        {activeTab === 'story' && (
          <div className="about-story-view fade">
            <div className="story-header-bar">
              <div>
                <h3 className="story-main-title">{t('aboutModal.storyTitle')}</h3>
                <p className="story-main-subtitle">{t('aboutModal.storySubtitle')}</p>
              </div>

              <div className="story-controls">
                <button
                  type="button"
                  className={'story-play-btn' + (isPlaying ? ' is-playing' : '')}
                  onClick={togglePlay}
                  title={isPlaying ? t('aboutModal.storyPauseBtn') : t('aboutModal.storyPlayBtn')}
                >
                  {isPlaying ? '⏸ ' + t('aboutModal.storyPauseBtn') : '▶ ' + t('aboutModal.storyPlayBtn')}
                </button>
                <span className="story-timer-digits">{toDigits(Math.ceil((30000 - progress) / 1000))}s</span>
              </div>
            </div>

            {/* 30-Second Progress Bar */}
            <div className="story-progress-track">
              <div className="story-progress-fill" style={{ width: `${Math.min(100, (progress / 30000) * 100)}%` }} />
            </div>

            {/* Step Selector Pills */}
            <div className="story-steps-nav">
              <button
                type="button"
                className={'story-step-pill' + (storyStep === 1 ? ' on' : '')}
                onClick={() => goToStep(1)}
              >
                1. NASA POWER Trend
              </button>
              <button
                type="button"
                className={'story-step-pill' + (storyStep === 2 ? ' on' : '')}
                onClick={() => goToStep(2)}
              >
                2. Regional Impacts
              </button>
              <button
                type="button"
                className={'story-step-pill' + (storyStep === 3 ? ' on' : '')}
                onClick={() => goToStep(3)}
              >
                3. Honest Limits
              </button>
            </div>

            {/* Story Step 1: NASA POWER Trend */}
            {storyStep === 1 && (
              <div className="story-step-box card fade">
                <div className="story-step-head">
                  <span className="story-badge">Step 1 of 3</span>
                  <span className="story-district-tag">📍 Rajshahi (Barind Tract)</span>
                </div>
                <h4 className="story-step-title">{t('aboutModal.step1Title')}</h4>
                <p className="story-step-desc">{t('aboutModal.step1Desc')}</p>

                <div className="story-kpi-grid">
                  <div className="story-kpi-card hot">
                    <span className="kpi-num">{t('aboutModal.step1WarmingStat')}</span>
                    <span className="kpi-lbl">{t('aboutModal.step1WarmingLabel')}</span>
                  </div>
                  <div className="story-kpi-card alert">
                    <span className="kpi-num">{t('aboutModal.step1HeatwavesStat')}</span>
                    <span className="kpi-lbl">{t('aboutModal.step1HeatwavesLabel')}</span>
                  </div>
                  <div className="story-kpi-card dry">
                    <span className="kpi-num">{t('aboutModal.step1DryingStat')}</span>
                    <span className="kpi-lbl">{t('aboutModal.step1DryingLabel')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Story Step 2: Documented Field Impacts */}
            {storyStep === 2 && (
              <div className="story-step-box card fade">
                <div className="story-step-head">
                  <span className="story-badge">Step 2 of 3</span>
                  <span className="story-district-tag">📚 Verified Impact Literature</span>
                </div>
                <h4 className="story-step-title">{t('aboutModal.step2Title')}</h4>
                <p className="story-step-desc">{t('aboutModal.step2Desc')}</p>

                <div className="story-impact-cards">
                  <div className="story-impact-item">
                    <h5>{t('aboutModal.step2MangoTitle')}</h5>
                    <p>{t('aboutModal.step2MangoDesc')}</p>
                    <small>Source: PreventionWeb / Dialogue Earth & BMD (2024)</small>
                  </div>
                  <div className="story-impact-item">
                    <h5>{t('aboutModal.step2BoroTitle')}</h5>
                    <p>{t('aboutModal.step2BoroDesc')}</p>
                    <small>Source: Nature-Based Solutions (2025) & Cogent Food & Agriculture (2025)</small>
                  </div>
                </div>
              </div>
            )}

            {/* Story Step 3: Honest Limitation Message */}
            {storyStep === 3 && (
              <div className="story-step-box card fade">
                <div className="story-step-head">
                  <span className="story-badge">Step 3 of 3</span>
                  <span className="story-district-tag">⚖️ Scientific Integrity Notice</span>
                </div>
                <h4 className="story-step-title">{t('aboutModal.step3Title')}</h4>

                <div className="story-honest-banner">
                  <div className="banner-icon">⚠️</div>
                  <div className="banner-body">
                    <strong>{t('aboutModal.step3LimitationBanner')}</strong>
                    <p>{t('aboutModal.step3Desc')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Story Footer Controls */}
            <footer className="story-footer">
              <div className="story-step-btns">
                {storyStep > 1 && (
                  <button type="button" className="story-nav-btn" onClick={() => goToStep((storyStep - 1) as 1 | 2)}>
                    ← {t('aboutModal.storyPrevBtn')}
                  </button>
                )}
                {storyStep < 3 && (
                  <button
                    type="button"
                    className="story-nav-btn primary"
                    onClick={() => goToStep((storyStep + 1) as 2 | 3)}
                  >
                    {t('aboutModal.storyNextBtn')} →
                  </button>
                )}
              </div>

              <button type="button" className="story-explore-map-btn" onClick={handleExploreRajshahi}>
                {t('aboutModal.storyExploreBtn')}
              </button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}
