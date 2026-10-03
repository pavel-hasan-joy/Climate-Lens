# Climate Lens — Bangladesh
## NASA Space Apps Challenge 2026 — Comprehensive Project Summary & Scientific Dossier

---

### A. One-Sentence Pitch (Max 25 Words)
An interactive 3D geospatial observatory transforming NASA Earth observations and CMIP6 climate models into district-level, evidence-grounded climate intelligence for Bangladesh's 64 districts. *(23 words)*

---

### B. Short Summary (~100 Words)
**Climate Lens — Bangladesh** is a dual-language (English and Bangla) 3D geospatial observatory designed for frontline climate resilience. Grounded in NASA POWER meteorological observations (2001–2025), NASA NEX-GDDP-CMIP6 downscaled models (to 2050), NASA MODIS vegetation health, and NASA SEDAC gridded population, it enables planners, agricultural extension officers, researchers, and citizens to inspect empirical climate shifts across all 64 districts. Users can navigate Past, Now, and Future horizons, inspect agricultural crop risks (Aman, Aus, Boro rice), cross-reference 14 peer-reviewed climate impact studies, visualize live NASA EONET hazard feeds, and run live statistical analysis via background Web Workers. *(98 words)*

---

### C. Project Description (NASA Space Apps Submission)

#### 1. The Problem
Bangladesh is globally recognized as one of the most climate-vulnerable frontline nations, regularly confronting catastrophic monsoon floods, agricultural droughts, and saltwater intrusion. Yet, sub-national planners, agricultural extension officers, journalists, and students have lacked an accessible, localized tool to understand climate trajectories. Complex satellite archives (NetCDF/HDF5) and scientific literature remain locked in academic journals, while public portals offer either national averages or unverified speculative forecasts. Local decision-makers need empirical, district-scale evidence showing what has changed over the past 25 years, what the physical climate models project, and what is scientifically documented on the ground.

#### 2. Who It Helps
- **Agricultural Extension Officers & Farmers**: Timing sowing and harvesting calendars for Aman, Aus, and Boro rice against shifting monsoon onsets, seasonal dry spells, and reproductive heatwaves ($T_{\text{max}} \ge 36^\circ\text{C}$).
- **Regional & Urban Planners**: Prioritizing climate adaptation resources based on empirical Mann–Kendall trend significance and gridded human exposure data (NASA SEDAC GPWv4).
- **Researchers, Educators & Students**: Exploring verifiable Earth science data, comparing empirical Theil–Sen trends with CMIP6 multi-model physics, and studying documented ecological shifts.
- **Journalists & Citizen Advocates**: Communicating climate realities through interactive 3D visualizations, bilingual plain-language summaries, and publication-ready PDF/CSV reports.

#### 3. What It Does
Climate Lens visualizes historical shifts (2001–2010 baseline), current observed conditions (latest 12 complete months and rolling 400-day daily records), and future projections (2040 horizon and continuous 2001 $\to$ 2050 timeline animation) across all 64 districts. Key features include:
- **Interactive 3D Choropleth Canvas**: MapLibre GL 3D vector map with 360° rotation, pitch tilting, drone flight mode, and NASA GIBS satellite basemaps (Black Marble, Blue Marble, VIIRS, and GPM IMERG rain radar).
- **Tri-Temporal & Anomaly Modes**: Instant toggling between absolute climatological values and baseline anomalies using diverging palettes.
- **Side-by-Side District Compare Mode**: Synchronized comparative analysis of any two districts across all metrics and time horizons.
- **Comprehensive Chart Suite**: Historical trajectories with CMIP6 multi-model uncertainty bands (`YearChart`), 12-month annual cycles (`SeasonChart`), rolling 60-day daily records (`DailyChart`), warming stripes 2001–2025 (`StripesChart`), and 25-year $\times$ 12-month anomaly heatmaps (`HeatmapChart`).
- **Agro-Climatic Intelligence**: Seasonal crop calendars for Aman, Aus, and Boro rice with rule-based Low/Medium/High risk cards and a 60-day "Unusual Now" anomaly detection badge.
- **National Crop Yield & Climate Association** (`YieldClimateCard.tsx`): Evaluates 24-year national cereal yields (World Bank / FAOSTAT, 2000–2023) against detrended seasonal climate with non-parametric Spearman rank correlation ($\rho$ and $p$-value), accompanied by an explicit non-causality disclosure.
- **District Insights Engine** (`DistrictInsightsPanel.tsx`): Deterministic, rule-based plain-language narrative synthesis generating 3 distinct sentences in English and Bangla (decadal trend with Mann–Kendall significance, baseline anomaly, extreme-day counts, and latest 12-month percentile ranking).
- **Human Climate Exposure Card**: Quantifies population exposure using NASA SEDAC GPWv4 gridded data filtered by statistically verified Mann–Kendall trends.
- **NASA MODIS Vegetation Vigor**: 25-year monthly NDVI tracking photosynthetic canopy health across agricultural seasons.
- **Live District Analysis & NASA EONET Feed**: Live NASA POWER daily API queries processed in background Web Workers, paired with live natural hazard event tracking (floods, cyclones, severe storms) plotted on the 3D map.
- **System Status Bar** (`SystemStatusBar.tsx`): In-app footer displaying the pipeline's last data update timestamp alongside an automated live reachability health probe (Operational 🟢, Checking 🟡, Degraded 🟠, Offline 🔴).
- **Biodiversity & Extinction Gallery**: 1,056 GBIF species records for 6 indicator species and the IUCN Bangladesh 2015 Red List assessment of 1,619 species.
- **Evidence-Based Impact Knowledge Base**: 14 peer-reviewed studies linking climate variables directly to observed agricultural and ecological shifts.
- **Methods & Validation Observatory**: In-app empirical backtesting results, division tables, and methodological disclosures.
- **Guided 30-Second Impact Story Tour**: Interactive case study of Rajshahi district (NASA POWER trend $\to$ documented impacts $\to$ limitation disclosure).

#### 4. How It Works (Data & Method)
1. **Automated Pipeline**: Offline Node.js scripts (`scripts/build-data.mjs`, `scripts/validate-data.mjs`) ingest open data from NASA POWER, NASA NEX-GDDP-CMIP6, NASA SEDAC, NASA MODIS, NASA EONET v3, GBIF, and the World Bank.
2. **Robust Statistical Processing**:
   - **Theil–Sen Robust Estimator**: Calculates median pairwise slopes per decade, resistant to non-normality and extreme outliers.
   - **Mann–Kendall Non-Parametric Test**: Evaluates the rank correlation score $S$, variance $\text{Var}(S)$, normalized $Z$, and two-tailed $p$-value to verify trend significance ($p < 0.05$).
   - **Spearman Rank Correlation**: Non-parametric $\rho$ and $p$-value evaluating detrended historical climate vs. national crop yields ($n = 24$).
   - **CMIP6 Ensemble**: Computes multi-model median and 10th–90th percentile uncertainty ribbons across 5 GCMs (GFDL-ESM4, MPI-ESM1-2-HR, MRI-ESM2-0, EC-Earth3, UKESM1-0-LL) under SSP2-4.5 and SSP5-8.5.
   - **Web Worker Architecture**: Heavy calculations run asynchronously in `src/workers/metrics.worker.ts`, preserving 60fps UI responsiveness.
3. **Resilient Client Runtime**: Progressive Web App (PWA) with Service Worker offline caching, IndexedDB live request cache, and automatic static fallback.

#### 5. What Makes It Different
- **Zero Hallucinated Numbers**: No generative AI text or synthetic placeholders. All numbers stem directly from published datasets or validated mathematical code.
- **Radical Transparency**: Every chart, card, and risk classification explicitly shows its formula, thresholds, and provenance metadata.
- **Empirical Back-Testing**: We do not merely claim models work; we rigorously test them. We trained our Theil–Sen estimator on 2001–2015 and evaluated it on 2016–2025 actual observations across all 64 districts ($n = 640$ district-years), publishing MAE, RMSE, and 95% interval coverage in-app.
- **Native Dual-Language Localization**: Full English and Bangla translation, including Bengali numerals (`০-৯`) across all charts, maps, dates, and tables.
- **Offline-First PWA**: Completely functional without an active internet connection once installed.

#### 6. Honest Limitations
- **NASA POWER Spatial Resolution**: Data is sampled on a ~0.5° (~50 km) grid at district centroids. Smaller neighboring districts (e.g. Dhaka, Narayanganj, Gazipur) share identical raw meteorological grid values; intra-cell elevation and microclimates are smoothed out.
- **Statistical Trend vs. Physics-Based GCMs**: Theil–Sen trends assume recent historical momentum continues linearly, whereas CMIP6 GCMs simulate physical greenhouse gas forcing and monsoon dynamics.
- **Small-Sample Crop Yield Correlation ($n = 24$)**: World Bank / FAOSTAT national cereal yields (2000–2023) correlate with detrended climate, but correlation does NOT prove causation. Non-climatic agronomic inputs (HYV adoption, groundwater irrigation, fertilizer subsidies) dominate long-term production.
- **GBIF Observer Bias**: Species sightings reflect human accessibility and smartphone recording density, not true biological abundance.
- **Indicative Decision Support**: The platform is an educational and analytical observatory; it does not replace official forecasts from the Bangladesh Meteorological Department (BMD) or DAE.

#### 7. What's Next
- Integrating higher-resolution satellite soil moisture from NASA SMAP (9 km) and high-resolution precipitation from NASA GPM IMERG (0.1° / 10 km).
- Ingesting official district-level crop production statistics if open API access is released by the Bangladesh Bureau of Statistics (BBS).
- Partnering with local agricultural universities (BAU, BSMRAU) to expand peer-reviewed microclimate response curves for domestic fruits and horticultural crops.

---

### D. "How We Used NASA Data" (Complete Inventory)

| NASA Dataset / API | NASA Center / Program | Resolution & Time Horizon | Exact Role & Implementation in Climate Lens |
|---|---|---|---|
| **NASA POWER API** | Langley Research Center | 0.5° grid; 2001–2025 monthly + 400-day daily | Primary meteorological backbone. Supplies surface precipitation (`PRECTOTCORR`), maximum 2m air temperature (`T2M_MAX`), and root-zone soil wetness (`GWETROOT`) across all 64 districts for Past/Now/Future calculations, seasonal cycles, warming stripes, and extreme-day counts. Queried live in-browser with Web Worker statistical analysis. |
| **NASA NEX-GDDP-CMIP6** | Ames Research Center / NCCS | 0.25° downscaled; 2015–2050 | Physics-based future projections for all 64 districts under SSP2-4.5 (moderate) and SSP5-8.5 (high emissions). 5 vetted GCMs (GFDL-ESM4, MPI-ESM1-2-HR, MRI-ESM2-0, EC-Earth3, UKESM1-0-LL) power the multi-model median curve and 10th–90th percentile uncertainty ribbon on `YearChart`. |
| **NASA SEDAC GPWv4.11** | CIESIN / Columbia University | 30 arc-seconds (~1 km); calibrated to 2022 Census | Quantifies human climate exposure in `PopulationImpactCard.tsx`. Cross-referenced with Mann–Kendall trend significance ($p < 0.05$) to establish that 163.1 Million people (98.9% of Bangladesh's population) live in districts experiencing statistically verified monsoon intensification and flood risk. |
| **NASA MODIS NDVI (`MOD13C2` / `MOD13A2`)** | LP DAAC / USGS | 0.05° monthly; 2001–2025 | Satellite-derived vegetation index in `NdviVigorCard.tsx`. Evaluates photosynthetic canopy vigor and moisture stress across 25 years for the Aman, Aus, and Boro cropping cycles relative to the 2001–2010 baseline. |
| **NASA GIBS** | Earth Science Data Systems | WMTS Global Tile Service | High-performance raster basemaps and dynamic environmental overlays: Black Marble (night lights), Blue Marble (bathymetry/topography), VIIRS True Color satellite imagery, and GPM IMERG near-real-time precipitation radar. |
| **NASA EONET v3 API** | Earth Observatory Natural Event Tracker | Real-time & historical records | Tracks natural hazard events (floods, severe storms, landslides, cyclones) within Bangladesh's geographical bounding box ($87.5^\circ\text{E}$–$93.0^\circ\text{E}$, $20.0^\circ\text{N}$–$27.0^\circ\text{N}$). Displayed as interactive 3D map markers and live hazard feed cards. |

---

### E. "What We Built vs. What We Reused"

#### 1. What We Built (Original Code & Analysis)
- **Geospatial Pipeline (`scripts/`)**: Node.js scripts for automated ingestion, rate-limited fetching with exponential backoff, disk caching, GeoJSON polygon centroid mapping, and data assembly.
- **Statistical Computation Engine (`scripts/analysis/stats.mjs`, `src/lib/metrics.ts`)**: Pure TypeScript/JavaScript implementations of Theil–Sen median slope estimation, Mann–Kendall $S$ variance and $Z$ score calculation, two-tailed $p$-values, Spearman rank correlation, and Z-score anomaly detection.
- **Empirical Backtesting Engine (`scripts/backtest.mjs`)**: 10-year predictive validation system (train 2001–2015 $\to$ test 2016–2025) computing MAE, RMSE, and 95% interval coverage for all 64 districts.
- **Automated Validation Suite (`scripts/validate-data.mjs`, `scripts/validate-impacts.mjs`)**: Comprehensive schema, physical bound, and citation verification gatekeepers running in CI.
- **Web Worker Statistical Offloader (`src/workers/metrics.worker.ts`)**: Background Web Worker processing live NASA POWER queries without UI thread jank.
- **Deterministic Bilingual Narrative Generator (`src/lib/narrative.ts`)**: Rule-based template synthesizer delivering plain-language insight sentences in English and Bangla with zero generative AI hallucinations.
- **Interactive 3D UI & Visualization Suite (`src/components/`)**:
  - Custom MapLibre 3D extruded choropleth implementation with camera drone flights and layer shaders.
  - Specialized climate charts: `YearChart` (with dual-trend comparison and CMIP6 ribbons), `SeasonChart`, `DailyChart`, `StripesChart`, and `HeatmapChart`.
  - Agricultural crop calendar engine (`AgriculturePanel.tsx`) with transparent rule evaluations for Aman, Aus, and Boro rice.
  - Interactive Wildlife & Extinction Gallery (`WildlifeGallery.tsx`) and Species Sightings Map (`SpeciesRecordsModal.tsx`).
  - System Status Bar (`SystemStatusBar.tsx`) with live reachability health probe.
  - 30-Second Guided Impact Story Tour (`AboutModal.tsx`) and In-App Methods Observatory (`ValidationModal.tsx`).
- **Complete Bilingual System (`src/lib/i18n/`)**: Custom React i18n context provider with English and Bangla dictionaries, localized date/anomaly formatters, and full Bengali numeral conversion (`০-৯`).
- **Client-Side Export Engine (`src/lib/export.ts`)**: Canvas-to-PNG chart exporter, district CSV time-series generator, and 1-page A4 summary PDF compiler (`jspdf`).

#### 2. What We Reused (Open Data, Libraries & Licenses)
- **React 19 & TypeScript**: UI framework and type-safety system (MIT License).
- **Vite 8**: Modern build tool and development server (MIT License).
- **MapLibre GL JS**: Open-source WebGL/WebGPU vector map library (BSD-3-Clause).
- **Chart.js 4 & react-chartjs-2**: HTML5 canvas charting library (MIT License).
- **jsPDF & html2canvas**: Client-side PDF generation and canvas rasterization (MIT License).
- **geoBoundaries (Runfola et al., William & Mary)**: Open boundary vector polygons for Bangladesh ADM1 (Divisions) and ADM2 (Districts) (CC BY 4.0).
- **GBIF (Global Biodiversity Information Facility)**: Open occurrence records for indicator species (CC0 / CC BY 4.0).
- **World Bank Open Data / FAOSTAT**: Historical national cereal yields (CC BY 4.0).
- **IUCN Bangladesh (2015)**: Red List of Bangladesh national extinction baseline.
- **BBS (Bangladesh Bureau of Statistics)**: 2022 Population and Housing Census statistics.
- **Google Fonts**: `Inter` and `Noto Sans Bengali` typography (SIL Open Font License).

---

### F. Bangla Version of A, B and C (বাংলা সংস্করণ)

#### A. এক বাক্যের মূল বক্তব্য (Pitch)
নাসা (NASA)-এর উপগ্রহ উপাত্ত ও সিএমআইপি৬ (CMIP6) জলবায়ু মডেলের ওপর ভিত্তি করে তৈরি একটি ইন্টারেক্টিভ থ্রিডি জিওস্প্যাশিয়াল মানমন্দির, যা বাংলাদেশের ৬৪টি জেলার বাস্তব জলবায়ু পরিবর্তন ও কৃষির ঝুঁকি তুলে ধরে।

#### B. সংক্ষিপ্ত বিবরণ (Short Summary — প্রায় ১০০ শব্দ)
**ক্লাইমেট লেন্স — বাংলাদেশ** হলো একটি দ্বিভাষিক (বাংলা ও ইংরেজি) থ্রিডি ভূ-স্থানিক প্ল্যাটফর্ম, যা সরাসরি নাসা আর্থ সায়েন্সের তথ্যের ওপর প্রতিষ্ঠিত। এতে নাসা পাওয়ার (POWER) থেকে ২০০১–২০২৫ সালের আবহাওয়া উপাত্ত, সিএমআইপি৬ (CMIP6) জলবায়ু প্রক্ষেপণ (২০৫০ সাল পর্যন্ত), মোডিস (MODIS) উদ্ভিজ্জ স্বাস্থ্য এবং সিডাক (SEDAC) জনসংখ্যার উপাত্ত ব্যবহার করে ৬৪টি জেলার অতীত, বর্তমান ও ভবিষ্যৎ দৃশ্যপট উপস্থাপন করা হয়েছে। প্ল্যাটফর্মটিতে আমন, আউশ ও বোরো ধানের জন্য স্বয়ংক্রিয় কৃষি ঝুঁকি বিশ্লেষণ, ১৪টি আন্তর্জাতিক গবেষণাপত্রের সরাসরি তথ্যসূত্র, নাসার ইওনেট (EONET) লাইভ দুর্যোগ ট্র্যাকার এবং ব্যাকগ্রাউন্ড ওয়েব ওয়ার্কারের মাধ্যমে তাৎক্ষণিক পরিসংখ্যান যাচাইয়ের সুবিধা রয়েছে।

#### C. বিস্তারিত প্রকল্প বিবরণ (Project Description — Space Apps ফরমের জন্য)

##### ১. সমস্যা
জলবায়ু পরিবর্তনের ঝুঁকিতে থাকা দেশগুলোর শীর্ষে রয়েছে বাংলাদেশ। ঘন ঘন আকস্মিক বন্যা, অনাবৃষ্টি, তীব্র তাপপ্রবাহ এবং উপকূলীয় লবণাক্ততা প্রতিনিয়ত লাখ লাখ মানুষের জীবন ও কৃষিকে ক্ষতিগ্রস্ত করছে। অথচ নাসা ও আন্তর্জাতিক জলবায়ু মডেলের উচ্চমানের উপাত্তগুলো সাধারণ মানুষ, কৃষি কর্মকর্তা, গবেষক ও সাংবাদিকদের কাছে পৌঁছায় না; এগুলো জটিল বৈজ্ঞানিক ফরম্যাটে (NetCDF) অথবা দূরবোধ্য গবেষণাপত্রে সীমাবদ্ধ থাকে। স্থানীয় নীতিনির্ধারকদের কাছে এমন কোনো সহজ ও বাস্তবসম্মত প্ল্যাটফর্ম ছিল না, যার মাধ্যমে জেলার নির্দিষ্ট জলবায়ু প্রবণতা ও ভবিষ্যৎ মডেলের তথ্য এক নজরে দেখা সম্ভব।

##### ২. কাদের সাহায্য করে?
- **কৃষি সম্প্রসারণ কর্মকর্তা ও কৃষক**: আউশ, আমন ও বোরো ধানের চারা রোপণ, সেচ ও ফসল কাটার সঠিক সময় নির্ধারণ এবং চরম তাপপ্রবাহের ($T_{\text{max}} \ge ৩৬^\circ\text{সে}$) ঝুঁকি মোকাবেলায়।
- **আঞ্চলিক পরিকল্পনাবিদ ও গবেষক**: মান–কেন্ডাল পরিসংখ্যানিক যাচাইয়ের ভিত্তিতে অগ্রাধিকারভুক্ত জেলা চিহ্নিতকরণ এবং মানুষের জলবায়ু ঝুঁকি প্রশমনে কার্যকর পদক্ষেপ গ্রহণে।
- **শিক্ষার্থী, সাংবাদিক ও পরিবেশকর্মী**: নাসার উপগ্রহ উপাত্ত বিশ্লেষণ, ইন্টারেক্টিভ থ্রিডি মানচিত্র, বাংলা-ইংরেজি প্রতিবেদন এবং পিডিএফে তথ্য যাচাই করতে।

##### ৩. এটি কী করে?
- **থ্রিডি মানচিত্র ও ড্রোন ফ্লাইট**: ম্যাপলিব্রে (MapLibre GL) ইঞ্জিনে বাংলাদেশের মানচিত্র ৩৬০° ঘোরানো, তিন মাত্রার ভূ-উচ্চতা এবং ২০০১ থেকে ২০৫০ সাল পর্যন্ত স্বয়ংক্রিয় অ্যানিমেশন প্রদর্শন।
- **অতীত, বর্তমান ও ভবিষ্যৎ মোড**: ২০০১–২০১০ ভিত্তি বছরের তুলনায় সাম্প্রতিক অবস্থা এবং ২০৪০ সালের প্রক্ষেপণ সরাসরি পর্যবেক্ষণ।
- **কৃষি আবহাওয়া প্যানেল**: ব্রি (BRRI) ও ডিএই (DAE) ফসলি ক্যালেন্ডারের ভিত্তিতে আমন, আউশ ও বোরো ধানের জন্য স্বচ্ছ নিয়মে কম/মাঝারি/উচ্চ ঝুঁকির সতর্কবার্তা এবং ৬০ দিনের অনিয়মিত আবহাওয়া নোটিফিকেশন।
- **জাতীয় ফসলের ফলন ও জলবায়ু সম্পর্ক**: বিশ্বব্যাংক ও ফাও (FAOSTAT)-এর ২৪ বছরের জাতীয় দানাদার শস্যের ফলনের সাথে জলবায়ুর স্পিয়ারম্যান র‍্যাংক কোরিলেশন বিশ্লেষণ।
- **স্বয়ংক্রিয় সহজবোধ্য বিবরণী**: কৃত্রিম বুদ্ধিমত্তার ভুল তথ্য এড়িয়ে গণিতভিত্তিক সূত্রের সাহায্যে বাংলা ও ইংরেজিতে জেলার সুনির্দিষ্ট ৩টি সারসংক্ষেপ বাক্য উপস্থাপন।
- **জনসংখ্যা ও মানব ঝুঁকি**: নাসার সিডাক (SEDAC) ও ২০২২ আদমশুমারি উপাত্ত মিলিয়ে দেখা গেছে, বৃষ্টিপাত ও প্লাবনের তীব্রতার কারণে দেশের ১৬৩.১ মিলিয়ন মানুষ (৯৮.৯%) জলবায়ুগত ঝুঁকির মুখে রয়েছে।
- **নাসার মোডিস ও ইওনেট**: ২৫ বছরের উদ্ভিজ্জ সূচক (NDVI) এবং দেশের ভেতরে চলমান বন্যা, ঘূর্ণিঝড় ও বজ্রঝড়ের লাইভ ট্র্যাকিং।
- **সিস্টেম স্ট্যাটাস বার**: ডেটা আপডেটের তারিখ এবং লাইভ ফিডের সার্বক্ষণিক সংযোগ স্থিতি (সক্রিয় 🟢, যাচাই হচ্ছে 🟡, সীমিত 🟠, অফলাইন 🔴)।
- **বন্যপ্রাণী ও গবেষণা নিবন্ধ**: আইইউসিএন লাল তালিকার ১,৬১৯টি বন্যপ্রাণীর অবস্থা, ১০৫৬টি জিবিআইএফ (GBIF) রেকর্ড এবং ১৪টি পিয়ার-রিভিউড আন্তর্জাতিক গবেষণার তথ্যসূত্র।

##### ৪. এটি কীভাবে কাজ করে?
নাসার ওপেন এপিআই থেকে সরাসরি উপাত্ত এনে নোড জেএস (Node.js) স্ক্রিপ্টে থেইল–সেন (Theil–Sen) ট্রেন্ড এবং মান–কেন্ডাল (Mann–Kendall) দ্বি-পার্শ্বীয় তাৎপর্য পরীক্ষা ($p < ০.০৫$) করা হয়। ব্রাউজারের মূল স্ক্রিনকে মসৃণ রাখতে ভারী হিসাবগুলো ব্যাকগ্রাউন্ড ওয়েব ওয়ার্কারে পরিচালিত হয়।

##### ৫. আমাদের বিশেষত্ব ও সততা
এখানে কোনো সংখ্যা বা তথ্য কৃত্রিম বা অনুমাননির্ভর নয়। আমরা আমাদের গাণিতিক মডেলের ওপর ১০ বছরের অতীত-পরীক্ষা (Back-test: ২০০১–২০১৫ প্রশিক্ষিত $\to$ ২০১৬–২০২৫ পরীক্ষিত) চালিয়ে তার সঠিকতা ও ত্রুটির পরিমাপ সরাসরি অ্যাপের ভেতর উন্মুক্ত করেছি। সাইটের প্রতিটি সংখ্যা, চার্ট ও সূত্রের পেছনের বৈজ্ঞানিক সত্যতা যাচাইযোগ্য।

##### ৬. বাস্তব সীমাবদ্ধতা
- নাসার পাওয়ার ডেটার রেজোলিউশন ~০.৫° (~৫০ কিমি); ফলে পার্শ্ববর্তী ছোট জেলাগুলোর কাঁচা আবহাওয়া মান একই থাকে।
- বিশ্বব্যাংকের ফলন উপাত্ত জাতীয় পর্যায়ের ($n = ২৪$), যা কোরিলেশন নির্দেশ করে তবে একক কার্যকারণ নয়।
- জিবিআইএফ বন্যপ্রাণীর উপস্থিতি রেকর্ড মানুষের পর্যবেক্ষণ প্রচেষ্টার ওপর নির্ভরশীল, যা প্রাণীর প্রকৃত মোট সংখ্যা নয়।
- প্ল্যাটফর্মটি শিক্ষামূলক ও সিদ্ধান্ত সহযোগিতামূলক মানমন্দির; এটি আবহাওয়া অধিদপ্তর (BMD) বা কৃষি সম্প্রসারণের সরকারি জরুরি সতর্কবার্তার বিকল্প নয়।

##### ৭. ভবিষ্যতের পরিকল্পনা
নাসা এসএমএপি (SMAP) থেকে ৯ কিমি সূক্ষ্ম মৃত্তিকা আর্দ্রতা এবং জিপিএম (GPM IMERG) থেকে ১০ কিমি উচ্চ-রেজোলিউশন বৃষ্টিপাত উপাত্ত যুক্ত করা।

---

### G. 60-Second Spoken Demo Script

*(Video / Live presentation script — 60 seconds / ~140 words)*

> "Welcome to **Climate Lens — Bangladesh**.
> 
> Bangladesh's climate data shouldn't be locked inside NetCDF files. We turned 25 years of NASA Earth observations into an interactive 3D observatory for all 64 districts.
> 
> On the 3D map, you can rotate, inspect real geoBoundaries, and switch between **Past**, **Now**, and **Future**. Pressing Play triggers an automated drone flight animating climate shifts from 2001 through 2050.
> 
> Select any district, like Rajshahi. The dashboard shows real Theil–Sen decadal slopes and Mann–Kendall significance, alongside CMIP6 multi-model uncertainty ribbons.
> 
> Switch to the **Agriculture tab**: automated crop calendars for Aman, Aus, and Boro rice evaluate temperature and soil wetness against BRRI thresholds with zero black boxes.
> 
> We integrated NASA SEDAC gridded population, live NASA EONET hazard feeds, NASA MODIS vegetation health, and 14 peer-reviewed studies.
> 
> Everything runs offline as a PWA in full English and Bangla. Transparent, verified, and grounded in real NASA science."

---

### H. Self-Check: Factual Claims & Codebase Proof

| # | Factual Claim in Summary | Exact File / Line Proof in Repository | Verification Method |
|---|---|---|---|
| 1 | 64 districts and 8 divisions with real geoBoundaries | `src/data/districts.geo.json`, `src/data/divisions.geo.json`, `src/lib/constants.ts:L31-L97` | GeoJSON features verified; `scripts/validate-data.mjs` lines 27–42 pass. |
| 2 | NASA POWER 2001–2025 monthly + daily rolling data | `src/data/climate.json`, `scripts/build-data.mjs`, `src/hooks/useLiveDaily.ts` | 64 districts $\times$ (60 daily points + 300 monthly points) validated in `validate-data.mjs:L44-L68`. |
| 3 | CMIP6 downscaled ensemble with 5 models and 2 SSPs (2015–2050) | `src/data/cmip6.json`, `scripts/build-cmip6.mjs:L15-L21`, `src/lib/metrics.ts:L29-L48` | GFDL-ESM4, MPI-ESM1-2-HR, MRI-ESM2-0, EC-Earth3, UKESM1-0-LL validated in `cmip6.test.js:L1-L80`. |
| 4 | 163.1M exposed population (98.9%) across 63 districts experiencing significant wetting ($p < 0.05$) | `src/data/population.json`, `src/lib/metrics.ts:L458-L506`, `src/components/PopulationImpactCard.tsx` | Sum of district populations with `dStatsRain.mk.significant && dStatsRain.slope > 0`; verified in `metrics.test.js`. |
| 5 | Empirical 10-year backtesting results (Heat MAE 2.07°C, Monsoon MAE 639.8 mm, etc.) | `src/data/validation.json:L1-L37`, `scripts/backtest.mjs`, `src/components/ValidationModal.tsx` | Computed from $n = 640$ district-years; exact JSON output matches to 2 decimal places. |
| 6 | 14 peer-reviewed impact studies with DOIs/URLs | `src/data/impacts.json:L1-L248`, `docs/sources.md:L22-L175`, `scripts/validate-impacts.mjs` | `npm run validate:impacts` exits code 0, verifying all 14 entries and citations. |
| 7 | 1,056 GBIF species records across 6 priority indicator species | `src/data/analysis/gbif-occurrences.json:L1-L50`, `scripts/fetch-gbif.mjs`, `src/components/SpeciesRecordsModal.tsx` | 1,056 occurrence coordinates verified in `scripts/validate-data.mjs:L116-L135`. |
| 8 | IUCN Bangladesh 2015 Red List (1,619 assessed, 31 extinct, 390 threatened, 278 data deficient) | `src/data/wildlife.json:L1-L60`, `src/components/WildlifeGallery.tsx:L45-L65` | Exact numbers from IUCN Bangladesh 2015 Red List verified in `wildlife.test.ts:L1-L85`. |
| 9 | 24-year national cereal yield series from World Bank / FAOSTAT (2000–2023) | `src/data/analysis/yield-climate.json:L1-L35`, `scripts/fetch-yield.mjs`, `src/components/YieldClimateCard.tsx` | 24 years of yields (1,500–8,000 kg/ha) validated in `scripts/validate-data.mjs:L157-L182`. |
| 10 | Background Web Worker statistical offloading | `src/workers/metrics.worker.ts`, `src/lib/workerMetrics.ts` | Unit tested in `src/lib/workerMetrics.test.ts` (3 tests pass). |
| 11 | NASA GIBS 4 basemap layers (Black Marble, Blue Marble, VIIRS, GPM IMERG) | `src/components/map/mapStyle.ts:L1-L120`, `src/components/MapControls.tsx` | Active WMTS endpoints verified in MapLibre style JSON. |
| 12 | NASA EONET v3 natural hazard events within BD bounding box | `src/data/analysis/eonet-events.json`, `src/hooks/useEonetFeed.ts`, `src/components/HappeningNowFeed.tsx` | Coordinate normalization and bounding box tested in `apiCache.test.ts`. |
| 13 | Full bilingual English & Bangla localization with Bengali numerals | `src/lib/i18n/index.tsx`, `src/lib/i18n/en.ts`, `src/lib/i18n/bn.ts`, `src/lib/format.ts:L4-L10` | 100% dictionary key parity verified in `i18n.test.js:L1-L65`. |
| 14 | Automated monthly GitHub Actions workflow with data validator | `.github/workflows/data-update.yml`, `scripts/validate-data.mjs` | Monthly cron (`0 3 1 * *`) and `node scripts/validate-data.mjs` passing cleanly. |
| 15 | Client-side export to PNG, CSV, and 1-page PDF | `src/lib/export.ts:L1-L280`, `src/components/DetailPanel.tsx` | Implemented using `html2canvas`, canvas blobs, and `jspdf`. |
| 16 | Deterministic bilingual narrative synthesis engine (zero LLM hallucinations) | `src/lib/narrative.ts:L1-L130`, `src/components/DistrictInsightsPanel.tsx` | Unit tested in `src/lib/narrative.test.ts` (3 tests pass). |
| 17 | System status bar with real-time pipeline date and live health probe | `src/components/SystemStatusBar.tsx`, `src/hooks/useSystemStatus.ts` | Unit tested in `src/hooks/useSystemStatus.test.ts` (3 tests pass). |
