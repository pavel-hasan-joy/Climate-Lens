# Climate Lens — Bangladesh: Technical Roadmap & Stage Plan

> **Project:** Climate Lens — Bangladesh (NASA Space Apps Challenge 2026)  
> **Role:** Lead Engineer  
> **Date:** October 2026 (6-Week Sprint to Hackathon Nov 14–15, 2026)  
> **Target Criteria:** Influence/Impact, Creativity, Scientific Validity, Relevance, Presentation.

---

## 1. Architecture Summary

```
                       ┌─────────────────────────────────────────────────────────┐
                       │                     NASA Earth Data                     │
                       │  NASA POWER (Meteorology) · NASA GIBS (Raster Tiles)    │
                       │  NEX-GDDP-CMIP6 (Projections) · SEDAC GPWv4 (Pop)       │
                       │  MODIS (NDVI Vigor) · EONET v3 (Hazards) · GBIF (Taxa)  │
                       └────────────────────────────┬────────────────────────────┘
                                                    │
                                                    ▼
                       ┌─────────────────────────────────────────────────────────┐
                       │           Offline & Automated Data Pipeline             │
                       │  scripts/build-data.mjs · scripts/analyze-all.mjs       │
                       │  scripts/backtest.mjs · scripts/validate-data.mjs       │
                       │  Output: Compact precomputed JSON in src/data/          │
                       └────────────────────────────┬────────────────────────────┘
                                                    │
                                                    ▼
                       ┌─────────────────────────────────────────────────────────┐
                       │             Client Application (React 19 + Vite)        │
                       │                                                         │
                       │  ┌───────────────────────┐   ┌───────────────────────┐  │
                       │  │   3D Geospatial Map   │   │  Web Worker Metrics   │  │
                       │  │   MapLibre GL v6      │   │  Mann-Kendall / Sen   │  │
                       │  │   3D Extrusions       │   │  Theil-Sen 2040       │  │
                       │  │   Drone Flight / GIBS │   │  Live Worker Engine   │  │
                       │  └───────────────────────┘   └───────────────────────┘  │
                       │  ┌───────────────────────────────────────────────────┐  │
                       │  │             Interactive Analytics Suite           │  │
                       │  │  DetailPanel · YearChart · SeasonChart · Stripes  │  │
                       │  │  HeatmapChart · AgriculturePanel · Wildlife       │  │
                       │  │  ImpactPanel · ValidationModal · DataMethodsModal │  │
                       │  └───────────────────────────────────────────────────┘  │
                       │  ┌───────────────────────────────────────────────────┐  │
                       │  │            State, i18n & Network Fallback         │  │
                       │  │  URL State Sync · Bilingual (EN/BN) Context       │  │
                       │  │  LocalStorage · IndexedDB/Cache · PWA Worker     │  │
                       │  └───────────────────────────────────────────────────┘  │
                       └─────────────────────────────────────────────────────────┘
```

### Core Technologies
- **Framework & Tooling:** React 19, TypeScript (`strict` mode), Vite v8, Vitest v5 (124+ unit tests), ESLint v9, Prettier v3.
- **Geospatial & 3D Rendering:** MapLibre GL v6 rendering 64 district polygons from geoBoundaries (gbOpen ADM2 simplified) with 3D polygon height extrusions (`fill-extrusion`), dynamic drone camera flights (`flyTo`), and live NASA GIBS raster basemap overlays (Black Marble Night Lights, Blue Marble 500m Surface, VIIRS True-Color, GPM IMERG 30-min Rain Radar).
- **Statistical & Analytical Engine:**
  - Non-parametric Theil–Sen slope estimation and Mann–Kendall trend significance test ($Z$-score, two-tailed $p$-value).
  - Out-of-sample back-testing validation: 2001–2015 historical training predicting 2016–2025 observations (evaluating MAE, RMSE, 95% uncertainty interval coverage).
  - Dedicated Web Worker (`src/workers/metrics.worker.ts`) offloading heavy iterative permutation tests from the browser's UI thread.
- **Charts & Visualization:** Chart.js v4 + `react-chartjs-2`, rendering multi-year trends, CMIP6 multi-model uncertainty ribbons (10th–90th percentile), seasonal profiles, climate stripes, and year $\times$ month anomaly heatmaps.
- **Internationalization (i18n):** Zero-dependency custom React Context with comprehensive English and Bangla dictionaries, localized district/division names, and native Bengali digit conversion (`০-৯`).
- **Offline & Reliability:** Custom Progressive Web App Service Worker (`sw.js`) and resilient API cache (`src/lib/apiCache.ts`) with automatic stale-while-revalidate fallbacks.

---

## 2. Bugs, Weak Spots & Technical Debt

1. **Git Working Tree Uncommitted on Main**:
   - *Issue:* Over 30 files are modified and dozens of new files sit untracked on `main`. No structured feature branches (`stage-01-polish`, `stage-02-validity`, etc.) are isolated in git history.
   - *Remediation:* Enforce the requested stage protocol: stage commits must be isolated in logical units on clean feature branches or structured tagged milestones with clear verification logs.

2. **Bundle Size & Chunk Code-Splitting**:
   - *Issue:* The production bundle outputs `dist/assets/index-*.js` (>3.6 MB raw, ~1.0 MB gzip). Heavy libraries (MapLibre GL, Chart.js, jsPDF) and heavy modals (`WildlifeGallery`, `ValidationModal`, `DataMethodsModal`, `SpeciesRecordsModal`) are currently packaged into monolithic bundles.
   - *Remediation:* Introduce `React.lazy()` and dynamic imports for secondary modals and PDF export generation to minimize initial parse time and improve mobile Largest Contentful Paint (LCP).

3. **Spatial Resolution Caveat of NASA POWER (~0.5°)**:
   - *Issue:* Small adjoining districts in Dhaka Division (e.g., Dhaka, Narayanganj, Gazipur) fall inside the same 0.5° grid box (~50 km), receiving identical meteorological readings at centroids.
   - *Remediation:* While documented in README and About modals, ensure UI tooltips in `DetailPanel` explicitly alert the user when neighboring districts share grid centroid values.

4. **World Bank National vs. District-Level Crop Yield Granularity**:
   - *Issue:* World Bank and FAOSTAT crop yield figures represent national aggregates ($n=24$), as open, citable district-level time series with official licenses do not exist in public open APIs.
   - *Remediation:* Visual disclaimers in `YieldClimateCard` must explicitly emphasize: *"National-scale data. Correlation does not prove district-level causation."*

5. **Mobile Touch & Gesture Conflicts**:
   - *Issue:* On narrow viewports ($\le 640\text{px}$), dragging the bottom sheet (`DetailPanel`) can trigger inadvertent 3D map tilts and pans in MapLibre.
   - *Remediation:* Partition touch handlers and tune CSS `touch-action` on the panel drag handle.

6. **External Network API Availability**:
   - *Issue:* Live calls to NASA POWER daily endpoints and EONET v3 can experience latency, network timeout, or CORS blocks.
   - *Remediation:* The app already provides `apiCache.ts` and fallback to prebuilt snapshots (`src/data/analysis/`), but must always prominently display *"Saved data from [date]"* rather than failing silently.

---

## 3. Stage Plan & Implementation Checklist

### STAGE 1 — Foundation and Polish [COMPLETED & VERIFIED]
- [x] Fix README vs code inconsistency: 2040 mid-century static horizon vs 2001→2050 play animation clearly harmonized.
- [x] Add MIT `LICENSE` file.
- [x] Configure ESLint + Prettier + TypeScript strict checks.
- [x] Set up Vitest with unit test suite for `src/lib/metrics.ts` and analytical utilities.
- [x] Configure GitHub Actions CI (`.github/workflows/ci.yml`) checking lint, typecheck, test, and build.
- [x] Implement lightweight i18n infrastructure (English + Bangla) with zero hardcoded UI strings.
- [x] Add "Limitations" section to `README.md` (0.5° resolution, statistical trend vs climate model, 2001 start rationale).
- [x] Add "Challenge & Approach" section in `README.md` with challenge title TODO.
- [x] Deployment readiness (`vercel.json`, `public/_redirects`), Open Graph meta tags, and favicon in `index.html`.
- [x] First-visit "How to read this map" modal (`AboutModal.tsx`) with localStorage persistence and interactive guided tour.

### STAGE 2 — Scientific Validity [COMPLETED & VERIFIED]
- [x] Implement back-testing script (`scripts/backtest.mjs`): train Theil–Sen on 2001–2015, evaluate on 2016–2025.
- [x] Compute Mean Absolute Error (MAE), Root Mean Square Error (RMSE), and 95% confidence interval coverage per district/metric.
- [x] Save back-test outputs to compact `src/data/validation.json`.
- [x] Compute Mann–Kendall test ($S$, $\tau$, $Z$, $p$-value) and Sen's slope per district & metric.
- [x] Display trend per decade with scientific significance labels (only state "statistically significant" if $p < 0.05$).
- [x] Build in-app "Methods & Validation" modal (`ValidationModal.tsx`) displaying back-test metrics, error bars, and limitations.
- [x] Write Vitest unit tests verifying statistical functions against verified reference values.

### STAGE 3 — Anomaly and Extremes [COMPLETED & VERIFIED]
- [x] Implement Anomaly mode calculated against 2001–2010 multi-year baseline.
- [x] Diverging color scales: Blue ↔ Red for temperature; Brown ↔ Green for rainfall and soil wetness.
- [x] Update 3D map extrusions, color ramps, legend, district rankings, and DetailPanel in Anomaly mode.
- [x] Compute extreme climate indicators:
  - [x] Heatwave days ($T_{\text{max}} \ge 36^\circ\text{C}$ per Bangladesh Meteorological Department definition).
  - [x] Longest dry spell (consecutive days with rainfall $< 1\text{ mm}$).
  - [x] Heavy rain days (precipitation $\ge 50\text{ mm/day}$).
- [x] Climate stripes visualization (`StripesChart.tsx`).
- [x] Year $\times$ Month heatmap visualization (`HeatmapChart.tsx`).
- [x] "Unusual right now" badge based on empirical percentiles of the last 30–60 days with explicit numbers.

### STAGE 4 — Online Data Pipeline (`npm run data`) [COMPLETED & VERIFIED]
- [x] Verify API specifications, rate limits, and licenses for open data providers before ingestion.
- [x] NASA POWER: automated per-district historical monthly and near-real-time daily ingestion.
- [x] GBIF Occurrences API (`https://api.gbif.org/v1`): Bangladesh records for 6 verified priority species (Bengal tiger, Ganges dolphin, Irrawaddy dolphin, Hilsa, Asian elephant, Fishing cat).
- [x] Aggregate GBIF data to yearly counts and spatial coordinates; enforce required GBIF dataset citations.
- [x] NASA EONET v3 (`https://eonet.gsfc.nasa.gov/api/v3/events`): historical and active natural hazards in Bangladesh bounding box.
- [x] Crop Yield data: World Bank / FAOSTAT national time series (2000–2023) across Aus, Aman, Boro rice seasons.
- [x] Detrended yield vs. climate Spearman rank correlation with sample size ($n=24$), $p$-value, and confidence intervals.
- [x] Generate `src/data/analysis/data-status.json` with execution timestamps, record counts, URLs, and licenses.
- [x] Enforce fallback to cached JSON on network fetch failures with loud error logging.

### STAGE 5 — Impact Knowledge Base and Wildlife [COMPLETED & VERIFIED]
- [x] Create `src/data/impacts.json` strictly verified from peer-reviewed literature and official reports.
- [x] Create JSON schema (`src/data/impacts.schema.json`) and validator (`scripts/validate-impacts.mjs`).
- [x] Seed verified records with required fields:
  - S2772411525000631 (Boro heat/moisture stress review).
  - 10.1080/23311932.2024.2447903 (Rice & heat 1980–2020, Sylhet monsoon rainfall).
  - PLOS Climate `pclm.0000009` (Rice extremes & yields).
  - PMC10569571 & Springer `s00704-021-03909-1` (Mixed evidence in seasonal rainfall).
  - Mango & Lychee temperature thresholds and 2024 heatwave field reports.
  - Hilsa migration drivers (siltation, overfishing, monsoon delays).
  - Bengal tiger Sundarbans habitat projection (Mukul et al. 2019).
  - Ganges & Irrawaddy river dolphins (IUCN national vs global classifications).
  - IUCN Red List of Bangladesh 2015 (31 regionally extinct species: 11 mammals, 19 birds, 1 reptile; 390 threatened; 278 data-deficient).
- [x] Build "What this means" Impact panel in `DetailPanel` with category filters (All, Crops, Fruits, Fish, Wildlife).
- [x] Evidence badges, confidence indicators, and prominent disclaimer: *"Documented research shown for context, not localized predictions."*
- [x] Build Wildlife Gallery (`WildlifeGallery.tsx`): Lost species, At-risk species, 2000→2015 change, and data-deficient species note. Zero copyrighted photographs.

### STAGE 6 — Insights Presentation and Live Analysis [COMPLETED & VERIFIED]
- [x] "Insights" panel (`DistrictInsightsPanel.tsx`): trend per decade, significance label, baseline anomaly, extreme days count, latest-12-months percentile.
- [x] Deterministic 3-sentence plain-language summary in English and Bangla (strictly template-based, zero LLM runtime hallucinations). Explicitly notes non-significant trends.
- [x] "Climate vs. Rice Yield" scatter plot card (`YieldClimateCard.tsx`) with $r_s$, $p$, $n$, and visible disclaimer: *"Correlation, not proof of cause."*
- [x] "Species Records" modal (`SpeciesRecordsModal.tsx`) with map of GBIF observations, annual frequency chart, and observer effort notice.
- [x] "Data & Methods" modal (`DataMethodsModal.tsx`) detailing every dataset, URL, query parameter, license, and JSON/CSV download links.
- [x] "Analyze This District" live engine (`LiveDistrictAnalysis.tsx`): on-demand NASA POWER fetch processed via Web Worker.
- [x] "Happening Now" NASA EONET feed (`HappeningNowFeed.tsx`) rendering active natural hazards directly on the 3D map.
- [x] Freshness indicators (`Live` vs `Saved Snapshot from [date]`) across all panels.

### STAGE 7 — Reach and Sharing [COMPLETED & VERIFIED]
- [x] Complete bilingual localization (English & Bangla) across all 64 districts, 8 divisions, metrics, UI tabs, and modals.
- [x] Localized numerals: English `0–9` automatically rendered as Bengali `০–৯` in Bangla mode.
- [x] Typography: Noto Sans Bengali font styling for clean Bangla rendering.
- [x] Language switcher with `localStorage` and URL state sync.
- [x] Compare mode: side-by-side district comparison in 3D map and analytics.
- [x] URL state synchronization: division, district, comparison, metric, time, year, anomaly, scenario, language.
- [x] Data exports: CSV download, chart PNG export, and one-page PDF summary export via jsPDF (`src/lib/export.ts`).
- [x] Accessibility: WCAG AA focus rings, semantic ARIA labels, colorblind-safe color ramps, and `prefers-reduced-motion` compliance.

### STAGE 8 — Agriculture and Risk
- [x] Dedicated Agriculture panel (`AgriculturePanel.tsx`) with Aus, Aman, and Boro crop calendars (sowing, vegetative, harvesting).
- [x] Season-matched historical baseline vs. observed vs. projected rainfall, temperature, and root-zone soil wetness.
- [x] Agro-climatic vulnerability rating (Low / Moderate / High) with transparent mathematical criteria.
- [x] Plain-language district agricultural narrative card (3 sentences).
- [x] Visible decision-support notice: *"Indicative agro-climatic decision support, not an official agrometeorological forecast."*

### STAGE 9 — Extra NASA Datasets and Climate-Model Projections
- [x] NASA NEX-GDDP-CMIP6 downscaled climate models:
  - Scenarios: SSP2-4.5 (moderate emissions) and SSP5-8.5 (high emissions).
  - 5-model ensemble: GFDL-ESM4, MPI-ESM1-2-HR, MRI-ESM2-0, EC-Earth3, UKESM1-0-LL.
  - Multi-model uncertainty ribbon (10th–90th percentile) rendered directly adjacent to the Theil–Sen statistical trend line.
- [x] NASA SEDAC GPWv4.11 Gridded Population of the World:
  - Population density and total exposed population per district calibrated to BBS 2022 National Census.
  - Human climate risk exposure card (`PopulationImpactCard.tsx`).
- [x] NASA MODIS Vegetation Health Index (`MOD13C2` / `MOD13A2` NDVI):
  - Monthly vegetation vigor tracking across Aus, Aman, and Boro seasons (`NdviVigorCard.tsx`).

### STAGE 10 — Automation and Reliability
- [x] Monthly + manual GitHub Actions workflow (`.github/workflows/data-update.yml`).
- [x] Automated data validation script (`scripts/validate-data.mjs`): checks schema, missing values, plausible value ranges, and provenance.
- [x] Automated impact validation script (`scripts/validate-impacts.mjs`).
- [x] System Status footer bar (`SystemStatusBar.tsx`): shows last data update date, NASA POWER reachability, and EONET API health.
- [x] Documented data pipeline architecture and failure recovery procedures in `README.md`.

### STAGE 11 — Demo and Presentation Readiness
- [x] 90-Second Guided Tour: automated drone camera fly-over visiting representative climate zones (Rajshahi heat, Sylhet rain, Khulna saline vulnerability), toggling Past/Now/Future with narrative highlights and skip control.
- [x] Clean presentation mode toggle.
- [x] Comprehensive documentation:
  - `README.md`: Problem, solution, NASA datasets, methods, validation, limitations, and reproducible run instructions.
  - `docs/sources.md`: Full scientific bibliography, DOI references, and dataset citations.
  - `docs/summary.md`: Complete NASA Space Apps submission brief and factual reference table.
  - [ ] `docs/pitch-outline.md`: 6-slide hackathon presentation pitch deck outline.
  - [ ] `docs/demo-script.md`: 2-minute spoken video demonstration script.
- [ ] Code-splitting performance pass: lazy-load `jspdf`, `WildlifeGallery`, and modal heavy components.
- [ ] Stage branch hygiene: organize git branches and tag releases according to project protocol.

---

## 4. Immediate Next Step
- **Status:** Step 0 complete. Awaiting user review and explicit `"go"` before executing code modifications or branch operations.
