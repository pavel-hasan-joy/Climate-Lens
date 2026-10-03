# Climate Lens — Bangladesh
## NASA Space Apps Challenge 2026 — 6-Slide Pitch Deck Outline

Optimized for the NASA Space Apps judging rubric: **Influence/Impact, Creativity, Scientific Validity, Relevance, and Presentation**.

---

### Slide 1: Frontline Volatility, Localized Intelligence
- **Title**: Climate Lens — Bangladesh: Grounding Sub-National Climate Adaptation in NASA Earth Science
- **Subtitle**: A 3D Geospatial Observatory & Agro-Climatic Intelligence Platform for all 64 Districts
- **Visuals**: Fullscreen 3D extruded choropleth of Bangladesh with NASA Black Marble night lights basemap, highlighted Barind and Haor zones, live timestamp stamp.
- **Key Talking Points**:
  - Bangladesh is one of the world's most vulnerable frontline nations to accelerating climate volatility.
  - While global climate models predict national changes, farmers, planners, and extension officers live and farm at the **district** level.
  - Climate Lens transforms raw, complex NASA satellite observations into actionable, sub-national intelligence.

---

### Slide 2: The Problem — The Sub-National Climate Data Void
- **Title**: High Volatility, Locked Data, Unactionable Averages
- **Visuals**: Split graphic — on the left, opaque NetCDF archives, academic journals, and generic countrywide averages; on the right, localized reality on the ground (flash floods in Sylhet vs. groundwater depletion in Rajshahi).
- **Key Talking Points**:
  - **The Dilemma**: Earth science data is locked in raw scientific formats (NetCDF/HDF5) or opaque academic literature that local stakeholders cannot access or interpret.
  - **National Averages Mislead**: Bangladesh’s climate is acutely heterogeneous: northeastern Sylhet experiences torrential pre-monsoon flash floods, while northwestern Barind faces severe winter aquifer exhaustion and $T_{\text{max}} \ge 36^\circ\text{C}$ heatwaves.
  - **Decision-Making Gap**: Agricultural extension agents lack localized crop-cycle climate tracking for Aman, Aus, and Boro rice.

---

### Slide 3: Our Solution — 3D Geospatial Tri-Temporal Observatory
- **Title**: Past · Now · Future: Democratizing NASA Earth Observation
- **Visuals**: UI overview showcasing the 3D MapLibre vector canvas, the Past/Now/Future horizon slider, the 2001→2050 timeline flight, and side-by-side district comparison mode.
- **Key Talking Points**:
  - **Tri-Temporal Horizon**: Compare the 2001–2010 historical baseline against the latest rolling observations ("Now") and mid-century 2040 / 2050 projections.
  - **NASA Satellite Ecosystem**: Seamless integration of NASA POWER (`PRECTOTCORR`, `T2M_MAX`, `GWETROOT`), NASA GIBS imagery (Black Marble, VIIRS, GPM IMERG rain radar), NASA MODIS NDVI vegetation vigor, and NASA EONET live hazard tracking.
  - **Dual-Language & Accessible**: Complete English and Bangla localization with native Bengali numerals (`০–৯`), WCAG AA accessibility, and offline PWA functionality.

---

### Slide 4: Scientific Validity — Zero Hallucinations, Radical Transparency
- **Title**: Empirical Back-Testing & Climate-Physics Ensembles
- **Visuals**: `YearChart` showing the 10th–90th percentile NEX-GDDP-CMIP6 uncertainty ribbon adjacent to the Theil–Sen empirical trend line; in-app `ValidationModal` backtesting matrix.
- **Key Talking Points**:
  - **Rigorous Mathematics**: Robust Theil–Sen decadal slope estimator paired with non-parametric Mann–Kendall significance testing ($p < 0.05$).
  - **NEX-GDDP-CMIP6 Physics**: 5-model GCM ensemble (GFDL-ESM4, MPI-ESM1-2-HR, MRI-ESM2-0, EC-Earth3, UKESM1-0-LL) under SSP2-4.5 and SSP5-8.5.
  - **Empirical Back-Testing**: We trained the model on 2001–2015 and evaluated it against real 2016–2025 observations across all 64 districts ($n = 640$ district-years), publishing MAE, RMSE, and 95% band coverage in-app.
  - **Scientific Honesty**: Explicit non-causality disclaimers (World Bank rice yields vs. climate), GBIF observer effort disclosures, and documentation of gaps (e.g. unverified domestic fruits excluded).

---

### Slide 5: Tangible Impact — Agro-Climatic & Human Exposure Intelligence
- **Title**: Actionable Decision Support for 165 Million Citizens
- **Visuals**: `AgriculturePanel` crop calendar card (Aus, Aman, Boro) with transparent mathematical decision rules; `PopulationImpactCard` breaking down human exposure via NASA SEDAC GPWv4.11.
- **Key Talking Points**:
  - **Crop Calendars & Phenology**: Season-matched temperature, rainfall, and root-zone soil wetness evaluated against BRRI and DAE agronomic thresholds (Low / Medium / High Risk with zero black boxes).
  - **Human Climate Exposure**: Calibrated against the BBS 2022 National Census, identifying 162.3 Million people (98.4%) exposed to statistically significant monsoon wetting surges and flash flooding.
  - **MODIS NDVI Vigor**: 25-year monthly canopy greenness tracking vegetative health across agricultural cycles.
  - **Live Edge Processing**: NASA POWER on-demand queries processed via client Web Workers with IndexedDB caching.

---

### Slide 6: Reliability, Sustainability & Open Science Legacy
- **Title**: Automated, Reproducible, and Built for Longevity
- **Visuals**: GitHub Actions workflow diagram, System Status live reachability badge, and one-page PDF/CSV export previews.
- **Key Talking Points**:
  - **Continuous Automation**: Scheduled monthly GitHub Actions workflow (`data-update.yml`) automatically ingests new NASA POWER observations, executes schema/outlier sanity gates, and submits automated pull requests.
  - **Open Science Infrastructure**: 100% open source under MIT License, reproducible build scripts, comprehensive documentation (`sources.md`, `summary.md`, `ROADMAP.md`), and automated CI testing.
  - **Direct Utility**: One-click publication-ready A4 PDF summaries, chart PNG exports, and CSV datasets for researchers and agricultural planners.
