# 🤖 Master Engineering Prompts Blueprint — Climate Lens

> **NASA Space Apps Challenge 2026 • Full Technical Specification**  
> **Project:** Climate Lens — Bangladesh | **Team:** NovaByte | **Lead:** Pavel Hasan Joy  
> **Challenge:** *Be An Earth System Trend Detective!*  
> **Format:** Available as Markdown ([`AI-PROMPTS.md`](./AI-PROMPTS.md)) and formatted PDF ([`prompt.pdf`](./prompt.pdf) / [`docs/prompt.pdf`](./docs/prompt.pdf))

---

## 📌 Executive Architecture & Engineering Directive

These **30 structured master prompts** represent the primary architectural, mathematical, and full-stack engineering milestones required to construct **Climate Lens — Bangladesh**. 

- **Platform:** React 19 + TypeScript (strict mode) + MapLibre GL 3D (WebGL) + Tailwind CSS + Vite
- **Coverage:** All 64 Districts of Bangladesh (2001–2050 tri-temporal horizons)
- **Validation:** 14 Vitest Test Suites (129 Tests Passed)
- **Design Philosophy:** Zero runtime hallucination, deterministic rule-based synthesis, multi-threaded Web Worker computation, and full English / native Bangla localization.

---

## 📑 Table of Contents

- [Topic 1: Core Foundation, Tooling, Architecture & Localization (Prompts 01–05)](#topic-1-core-foundation-tooling-architecture--localization)
- [Topic 2: 3D Geospatial Engine, Satellite Overlays & Drone Navigation (Prompts 06–10)](#topic-2-3d-geospatial-engine-satellite-overlays--drone-navigation)
- [Topic 3: Statistical Rigor, Anomaly Detection & Empirical Backtesting (Prompts 11–15)](#topic-3-statistical-rigor-anomaly-detection--empirical-backtesting)
- [Topic 4: Extreme Climate Indicators, Data Pipelines & Species Mapping (Prompts 16–20)](#topic-4-extreme-climate-indicators-data-pipelines--species-mapping)
- [Topic 5: Agro-Climatic Intelligence, Peer-Reviewed Impacts & NASA Models (Prompts 21–25)](#topic-5-agro-climatic-intelligence-peer-reviewed-impacts--nasa-models)
- [Topic 6: Decision Support, Multi-Platform UI, PWA & Hackathon Delivery (Prompts 26–30)](#topic-6-decision-support-multi-platform-ui-pwa--hackathon-delivery)

---

## Topic 1: Core Foundation, Tooling, Architecture & Localization
*Foundational repository setup, strict type definitions, continuous integration, zero-dependency bilingual localization, and user onboarding.*

### PROMPT 01: Project Setup & Multi-Horizon Spatial Architecture
- **Tags:** `React 19` `Vite` `TypeScript` `Architecture`

```text
Initialize a client-side geospatial web observatory named "Climate Lens — Bangladesh" using React 19, TypeScript (strict mode), and Vite. Structure the application to analyze sub-national climate data across all 64 districts using geoBoundaries ADM2 simplified polygons. Architect three discrete temporal horizons: Past (2001–2010 baseline climatology), Now (rolling 12-month and daily observations), and Future (2040/2050 CMIP6 downscaled projections). Establish a modular directory layout separating presentation components, geospatial engines, data stores, statistical libraries, and TypeScript interfaces.
```

---

### PROMPT 02: Tooling, Linting, Prettier & Strict Type Configuration
- **Tags:** `Tooling` `ESLint` `Prettier` `TypeScript`

```text
Configure robust development tooling for the repository. Set up tsconfig.json with strict type-checking flags (strict: true, noImplicitAny: true, noUnusedLocals: true). Configure ESLint v9 with React and React Hooks plugins. Add Prettier v3 with single quotes, 120 print width, trailing commas, and endOfLine set to auto. Create .gitattributes to enforce consistent LF line endings across operating systems. Add an open-source MIT LICENSE and update package.json with scripts for dev, build, preview, typecheck, lint, and format:check.
```

---

### PROMPT 03: Continuous Integration & Automated Quality Gates
- **Tags:** `CI/CD` `GitHub Actions` `Automation`

```text
Create an automated GitHub Actions CI workflow in .github/workflows/ci.yml triggered on all pushes and pull requests to main. The workflow must run on ubuntu-latest using Node.js 20 with npm ci. Implement strict sequential verification gates: (1) Prettier code formatting check (npm run format:check), (2) TypeScript static type check without emission (npm run typecheck), (3) ESLint linting (npm run lint), (4) Vitest unit and integration test suite execution (npm run test), (5) scientific dataset schema validation (npm run validate:impacts), and (6) production bundle compilation (npm run build).
```

---

### PROMPT 04: Zero-Dependency Bilingual i18n Engine & Bengali Numerals
- **Tags:** `i18n` `Localization` `Bengali` `React Context`

```text
Build a custom, zero-dependency internationalization (i18n) engine for English and Bengali. Create a typed React Context (I18nContext) providing translation helper functions, active locale state, and synchronization with LocalStorage and URL parameters. Author exhaustive bilingual dictionaries (src/lib/i18n/en.ts and bn.ts) covering navigation labels, all 64 district names, 8 divisions, chart legends, and climate indicators. Implement an automated numeral converter converting Arabic digits (0–9) to native Bengali numerals (০–৯) and configure the Noto Sans Bengali font.
```

---

### PROMPT 05: First-Time User Onboarding & Interactive Guided Tour Modal
- **Tags:** `UI/UX` `Onboarding` `Modal`

```text
Develop an interactive first-visit onboarding modal (AboutModal.tsx) to introduce users to the 3D geospatial observatory. Include an illustrative step-by-step tour explaining: (1) navigating 3D district extrusions and choropleths, (2) interpreting the historical baseline vs current observations, (3) understanding statistical decadal trends vs physical climate models, and (4) switching between temperature, rainfall, and soil moisture metrics. Store tour completion in LocalStorage and add an accessible toolbar button to re-open the guided modal at any time.
```

---

## Topic 2: 3D Geospatial Engine, Satellite Overlays & Drone Navigation
*MapLibre GL 3D vector map integration, 3D polygon height extrusions, NASA GIBS satellite basemaps, and automated drone camera flights.*

### PROMPT 06: MapLibre GL 3D Extrusion & Vector District Polygon Rendering
- **Tags:** `MapLibre GL` `3D WebGL` `Choropleth` `GeoJSON`

```text
Integrate MapLibre GL v6 into ClimateMap.tsx to render 64 Bangladesh district boundaries from geoBoundaries ADM2 GeoJSON. Implement 3D polygon height extrusions (fill-extrusion layer) where district polygon height is dynamically proportional to the selected climate value (temperature, precipitation, soil wetness, or anomaly). Design continuous, accessible color interpolation ramps (smooth choropleth shading) that reactively re-render when switching metrics or temporal horizons. Add interactive hover tooltips, click selection, and division highlight boundaries.
```

---

### PROMPT 07: NASA GIBS Multi-Layer Satellite Basemaps & Opacity Controller
- **Tags:** `NASA GIBS` `Satellite Imagery` `WMTS` `Basemap`

```text
Incorporate NASA GIBS (Global Imagery Browse Services) raster basemaps into the MapLibre 3D canvas. Provide interactive toggling between: (1) NASA Black Marble (night lights at 500m resolution), (2) NASA Blue Marble (true-color surface reflectance), (3) VIIRS True-Color daily surface imagery, and (4) GPM IMERG 30-minute precipitation radar. Configure proper EPSG:3857 WMTS tile matrix endpoints, smooth opacity transitions with an interactive slider, and seamless depth-sorting beneath semi-transparent 3D district vectors.
```

---

### PROMPT 08: 3D Camera Controls, Pitch Tilting & Responsive Viewport Adjustments
- **Tags:** `Camera Controls` `3D Pitch` `Map Navigation`

```text
Build high-precision 3D camera navigation controls in MapNav.tsx. Implement smooth pitch adjustments (from 0° flat 2D choropleth to 60° dramatic 3D perspective), bearing rotation controls, zoom toggles, and a reset-to-north compass button. Add responsive viewport bounds logic that automatically re-centers and fits the camera to Bangladesh's national extent upon initialization and smoothly frames selected districts upon user click.
```

---

### PROMPT 09: Automated 90-Second Drone Flight Tour & Zone Traversal
- **Tags:** `Camera Animation` `FlyTo` `Automated Tour`

```text
Build an automated 90-second drone camera tour across Bangladesh (src/components/map/animator.ts). Use MapLibre's flyTo API to smoothly transition camera coordinates, pitch, and bearing across critical climate frontline zones: the Barind tract in Rajshahi (heatwaves & aquifer stress), northeastern Sylhet (monsoon flash floods), and the coastal Sundarbans in Khulna (salinity & sea-level risk). Display synchronized bilingual narrative cards during flight with play, pause, resume, and skip controls.
```

---

### PROMPT 10: Production Web Worker Bundling for MapLibre WebGL Extrusions
- **Tags:** `MapLibre` `Vite` `Web Worker` `Production Fix`

```text
Configure Vite and MapLibre GL to properly bundle the internal maplibre-gl web worker during production builds. Prevent CDN-dependent worker loading issues on hosts like Vercel by importing the MapLibre worker directly as a bundled inline asset or using proper worker-loader configuration. Verify that 3D polygon fill-extrusions, camera gestures, and satellite tile rendering initialize immediately without console errors or worker timeout exceptions in production.
```

---

## Topic 3: Statistical Rigor, Anomaly Detection & Empirical Backtesting
*Non-parametric trend analysis, out-of-sample empirical backtesting, scientific transparency modals, and off-thread web worker computation.*

### PROMPT 11: Theil–Sen Robust Slope & Mann–Kendall Significance Testing
- **Tags:** `Theil-Sen` `Mann-Kendall` `Statistics` `Non-Parametric`

```text
Implement a robust, non-parametric statistical engine in src/lib/metrics.ts. Compute decadal trends using the Theil–Sen robust estimator (calculating the median of slopes between all pairwise points) for 25 years of NASA POWER records. Implement the Mann–Kendall test calculating the S statistic, tie-corrected variance Var(S), normalized Z-score, and exact two-tailed p-value. Strictly enforce scientific reporting standards: only classify and display a trend as 'Statistically Significant' if p < 0.05, labeling other trends as 'Non-Significant Trend' or 'Stable'.
```

---

### PROMPT 12: Empirical Out-of-Sample Backtesting Pipeline
- **Tags:** `Backtesting` `Validation` `MAE / RMSE` `Node.js`

```text
Develop an out-of-sample empirical back-testing script (scripts/backtest.mjs) to evaluate model validity against historical observations. Partition NASA POWER records: train the Theil–Sen slope model on 2001–2015 observations and predict annual climate values for the out-of-sample 2016–2025 period across all 64 districts (n = 640 district-years). Compute Mean Absolute Error (MAE), Root Mean Square Error (RMSE), and empirical 95% confidence interval coverage percentage per district and division. Save results to src/data/validation.json.
```

---

### PROMPT 13: In-App Scientific Validation Observatory Modal
- **Tags:** `ValidationModal` `Scientific Transparency` `Error Bounds`

```text
Build an in-app transparency modal (ValidationModal.tsx) showcasing empirical backtesting benchmarks. Display division-level error metric tables (MAE, RMSE, 95% coverage rate), scatter plots comparing predicted values against actual observations, and distribution histograms of decadal slopes. Provide clear scientific disclosure statements highlighting: (1) NASA POWER 0.5° spatial grid resolution, (2) linear statistical trend assumptions versus coupled physical climate models, and (3) confidence score criteria.
```

---

### PROMPT 14: Multi-Threaded Statistical Web Worker Architecture
- **Tags:** `Web Worker` `Multi-Threading` `Performance` `Off-Thread`

```text
Implement a dedicated Web Worker (src/workers/metrics.worker.ts) and a consumer hook (src/lib/workerMetrics.ts) to offload intensive statistical computations from the main UI thread. Execute heavy iterative operations off-thread: multi-year percentile distributions, rolling 400-day baseline deviations, permutation tests, and on-demand Mann–Kendall calculations. Establish typed request-response message contracts, guaranteeing 60fps UI animations without frame drops during rapid district selection.
```

---

### PROMPT 15: Baseline Anomaly Calculation & Diverging Color Scales
- **Tags:** `Anomaly Mode` `Diverging Color` `Cartography`

```text
Build an Anomaly Mode allowing users to toggle between absolute climatological values and baseline anomalies (Delta = Observed_Current - Baseline_Mean) calculated against the 2001–2010 multi-year reference period. Configure diverging color palettes: Blue ↔ Red for temperature; Brown ↔ Green for precipitation and soil wetness. Ensure that 3D polygon extrusion heights, chart y-axes, district ranking cards, and color legends reactively adapt to display positive and negative deviations.
```

---

## Topic 4: Extreme Climate Indicators, Data Pipelines & Species Mapping
*BMD-standard extreme climate indicators, warming stripes, multi-source ingestion pipelines, GBIF species mapping, and resilient API caching.*

### PROMPT 16: BMD-Standard Extreme Weather Indicators Calculation
- **Tags:** `Extreme Weather` `BMD Standards` `Heatwaves` `Drought`

```text
Implement extreme climate indicator calculators conforming to official Bangladesh Meteorological Department (BMD) criteria. Process daily NASA POWER records to calculate: (1) Heatwave Days per year (days where T2M_MAX >= 36°C, distinguishing mild, moderate, and severe tiers), (2) Consecutive Dry Spell length (maximum consecutive days with precipitation < 1.0 mm), and (3) Heavy Precipitation Days (days with rainfall >= 50 mm/day). Present indicator frequencies and decadal shifts inside the District Insights panel.
```

---

### PROMPT 17: Climate Warming Stripes & Multi-Decadal Climatological Heatmaps
- **Tags:** `StripesChart` `HeatmapChart` `Chart.js` `Data Visualization`

```text
Build specialized climate visualizers: (1) an annual warming stripes chart (StripesChart.tsx) showing vertical temperature anomaly bars from 2001 to 2025 using Ed Hawkins-style diverging color palettes, and (2) a multi-decadal monthly heatmap (HeatmapChart.tsx) rendering a 25-year x 12-month matrix of anomalies. Add hover tooltips displaying exact dates, recorded values, baseline deviations, and percentile ranks. Include bilingual axis titles and image export actions.
```

---

### PROMPT 18: Automated NASA POWER Pipeline & Precomputed District Bundles
- **Tags:** `NASA POWER` `Data Pipeline` `Node.js` `Batching`

```text
Create a reproducible data ingestion pipeline in scripts/build-data.mjs. Script automated queries to NASA POWER Climatology and Daily APIs for all 64 district centroids, extracting monthly and daily time series for precipitation (PRECTOTCORR), maximum temperature (T2M_MAX), and root-zone soil wetness (GWETROOT). Implement rate-limiting, exponential backoff retries, and disk caching. Precompute 2001–2010 monthly baselines, annual aggregates, and recent 400-day rolling feeds into optimized JSON files (src/data/climate.json).
```

---

### PROMPT 19: GBIF Species Occurrences Ingestion & National Indicator Species
- **Tags:** `GBIF` `Biodiversity` `Occurrences API` `Ecology`

```text
Extend the data ingestion pipeline to query the GBIF (Global Biodiversity Information Facility) Occurrences API for Bangladesh coordinates. Ingest occurrence records for 6 verified national indicator species: Panthera tigris (Bengal Tiger), Platanista gangetica (Ganges River Dolphin), Orcaella brevirostris (Irrawaddy Dolphin), Tenualosa ilisha (Hilsa Shad), Elephas maximus (Asian Elephant), and Prionailurus viverrinus (Fishing Cat). Filter valid coordinates, aggregate annual sightings, and bundle official GBIF dataset citations and DOIs.
```

---

### PROMPT 20: Client-Side API Caching, Queuing & Stale-While-Revalidate Engine
- **Tags:** `API Cache` `IndexedDB` `Offline-First` `Resilience`

```text
Build a client-side API resilience layer in src/lib/apiCache.ts. Implement an asynchronous request queue with concurrency limits and a Stale-While-Revalidate caching strategy backed by IndexedDB and localStorage. In case of network drops, NASA API downtime, or CORS interruptions, seamlessly serve precomputed static snapshots from src/data/analysis/. Always render a clear status indicator in the UI: "Live NASA Feed" when online, or "Saved Snapshot from [date]" when serving cached data.
```

---

## Topic 5: Agro-Climatic Intelligence, Peer-Reviewed Impacts & NASA Models
*Seasonal rice crop calendars, World Bank yield correlations, peer-reviewed impact curation, CMIP6 downscaled models, and SEDAC population exposure.*

### PROMPT 21: Rice Crop Calendars (Aman, Aus, Boro) & Agro-Climatic Risk Scoring
- **Tags:** `Agriculture` `BRRI / DAE` `Crop Calendars` `Risk Model`

```text
Develop an Agriculture panel (AgriculturePanel.tsx) based on BRRI (Bangladesh Rice Research Institute) and DAE (Department of Agricultural Extension) crop calendars. Support Bangladesh's three major rice seasons: Aus (pre-monsoon), Aman (monsoon wet season), and Boro (winter irrigated dry season). For each crop and district, extract season-matched temperature, rainfall, and root-zone soil wetness across baseline, current, and future periods. Compute transparent, rule-based Agro-Climatic Vulnerability Ratings (Low, Moderate, High) with explicit mathematical criteria (e.g. reproductive heat stress >= 35°C, germination dry spells).
```

---

### PROMPT 22: National Crop Yield vs Climate Spearman Rank Correlation Analysis
- **Tags:** `World Bank` `Spearman` `Crop Yield` `Scientific Rigor`

```text
Integrate historical 24-year national crop yield time series (2000–2023) from World Bank and FAOSTAT records. Build YieldClimateCard.tsx featuring a scatter plot comparing detrended seasonal climate anomalies against cereal yields. Calculate non-parametric Spearman rank correlation coefficients (rho), p-values, and sample size (n = 24). Add a visible scientific disclaimer: "National-scale statistical association. Correlation does not prove district-level causation; agronomic inputs (HYV seeds, irrigation, fertilizer) dominate long-term production."
```

---

### PROMPT 23: Peer-Reviewed Climate Impact Knowledge Base & Schema Validator
- **Tags:** `Impacts` `JSON Schema` `Literature Review` `Peer-Reviewed`

```text
Curate a peer-reviewed climate impact knowledge base in src/data/impacts.json and an automated validation test in scripts/validate-impacts.mjs. Compile 14 peer-reviewed scientific studies documenting climate impacts in Bangladesh (e.g., Boro heat stress, Sundarbans tiger habitat loss, Hilsa migration disruptions, Dinajpur lychee heat damage). Enforce strict schema validation: every entry must include validated source URLs, publication year, evidence type (observed, modeled, review), climate link classification (direct, contributing), and confidence level. Integrate category filters (Crops, Fruits, Fish, Wildlife) inside DetailPanel.
```

---

### PROMPT 24: NASA NEX-GDDP-CMIP6 Downscaled Projections & Uncertainty Ribbons
- **Tags:** `CMIP6` `Climate Models` `SSP2-4.5` `SSP5-8.5` `Uncertainty`

```text
Integrate high-resolution 0.25° downscaled NASA NEX-GDDP-CMIP6 climate projections for Bangladesh through 2050. Support two shared socioeconomic pathways: SSP2-4.5 (moderate stabilization) and SSP5-8.5 (high emissions). Incorporate a 5-model general circulation ensemble: GFDL-ESM4, MPI-ESM1-2-HR, MRI-ESM2-0, EC-Earth3, and UKESM1-0-LL. In YearChart.tsx, plot the multi-model median projection alongside an uncertainty ribbon representing the 10th to 90th percentile model spread, displayed directly adjacent to the empirical Theil–Sen statistical trend line.
```

---

### PROMPT 25: NASA SEDAC Population Exposure & MODIS NDVI Vegetation Vigor
- **Tags:** `NASA SEDAC` `MODIS NDVI` `Population Risk` `Demographics`

```text
Integrate NASA SEDAC GPWv4.11 (Gridded Population of the World) density data calibrated to the BBS 2022 National Census, and NASA MODIS 0.05° monthly Normalized Difference Vegetation Index (MOD13C2 / MOD13A2) time series (2001–2025). Construct PopulationImpactCard.tsx to calculate total population exposed to statistically significant warming and heavy precipitation trends. Construct NdviVigorCard.tsx to track multi-year vegetative canopy health across seasonal rice cycles and display greenness dips during drought years.
```

---

## Topic 6: Decision Support, Multi-Platform UI, PWA & Hackathon Delivery
*Deterministic plain-language insights, dual-district comparison, multi-format client export, dedicated mobile responsive UX, and hackathon presentation suite.*

### PROMPT 26: Deterministic Plain-Language District Insights Generator
- **Tags:** `NLG` `Deterministic` `Zero Hallucination` `Bilingual`

```text
Develop a deterministic, rule-based natural language generator in DistrictInsightsPanel.tsx that synthesizes a 3-sentence executive climate brief for any selected district in English and Bangla. The generator must adhere strictly to mathematical templates with zero generative runtime hallucinations: Sentence 1 states the 25-year decadal trend with its exact Mann–Kendall significance label; Sentence 2 reports the current rolling anomaly compared to the 2001–2010 baseline; Sentence 3 highlights extreme event counts (heatwaves, heavy rain days) and historical percentile rankings.
```

---

### PROMPT 27: Dual-District Comparative Mode & Bi-Directional URL State Sync
- **Tags:** `Compare Mode` `URL State Sync` `Deep Linking` `State Management`

```text
Build a side-by-side District Compare Mode allowing users to select two districts simultaneously and evaluate their 3D map extrusions, seasonal profiles, warming stripes, and crop vulnerability ratings side-by-side. Implement bi-directional deep-link URL state synchronization (src/lib/urlState.ts) encoding all active parameters: selected districts, primary metric, temporal horizon, year, anomaly mode, CMIP6 scenario, and language. Ensure URLs are compact, shareable, and support browser forward/back history.
```

---

### PROMPT 28: Multi-Format Client-Side Reporting (PDF, High-Res PNG, CSV)
- **Tags:** `Export` `jsPDF` `CSV Exporter` `Client-Side`

```text
Implement a multi-format client-side export engine in src/lib/export.ts. Support three high-fidelity export formats: (1) CSV Export generating clean tabular data of 25-year monthly and annual climate records with metadata headers, (2) High-Resolution PNG export capturing the active Chart.js canvas with timestamp watermarks, and (3) a publication-ready single-page executive PDF dossier built with jsPDF containing district metadata, key trend statistics, CMIP6 projections, and agro-climatic risk summaries.
```

---

### PROMPT 29: Dedicated Mobile Responsive Architecture, Bottom Nav & PWA Support
- **Tags:** `Mobile UX` `PWA` `Bottom Nav` `Service Worker`

```text
Re-architect the user interface for mobile devices (< 768px) with a dedicated responsive layout. Implement MobileTopBar.tsx, MobileBottomNav.tsx, and a swipeable bottom sheet (MobileDistrictPeek.tsx) preventing touch conflicts with MapLibre's 3D gestures. Build full Progressive Web App (PWA) capabilities: register a custom Service Worker (sw.js) caching core assets, generate valid web manifests (manifest.webmanifest) with 192px/512px icons, implement usePwaInstall install prompt hook, and write comprehensive Vitest integration tests (pwaMobile.test.js).
```

---

### PROMPT 30: Code-Splitting, Performance Hardening & NASA Space Apps Submission Dossier
- **Tags:** `Performance` `Code Splitting` `Submission Dossier` `Pitch Deck`

```text
Conduct a final production optimization and documentation pass. Implement React.lazy() and dynamic code-splitting for heavy secondary modals (WildlifeGallery, ValidationModal, SpeciesRecordsModal) and jsPDF export libraries to drastically reduce initial bundle size and enhance mobile LCP. Write the official NASA Space Apps submission suite: (1) a 6-slide executive pitch deck outline (docs/pitch-outline.md), (2) a 2-minute video demonstration script (docs/demo-script.md), (3) a complete project dossier (docs/summary.md), and (4) an exhaustive scientific bibliography (docs/sources.md). Verify that 100% of CI checks pass.
```
