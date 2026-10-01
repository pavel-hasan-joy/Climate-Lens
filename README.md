# Climate Lens — Bangladesh

A 3D map of how Bangladesh's rainfall, heat and soil wetness **were**, **are**, and **may become** — district by district, from NASA Earth science data.

- Pick a **region** (8 divisions) and a **place** (64 districts). The borders are real, from geoBoundaries.
- Switch between **Past / Now / Future**. The 3D districts rise and fall, and the charts, rankings and labels update with them.
- Press **▶** to play 2001 → 2050 year by year while the camera flies over the region like a drone.
- Base maps and overlays are NASA GIBS imagery: Black Marble night lights, Blue Marble terrain, VIIRS satellite, GPM IMERG rain radar.

## Data

| What | Source |
|---|---|
| Rainfall, max temperature, root-zone soil wetness | [NASA POWER](https://power.larc.nasa.gov/) (`PRECTOTCORR`, `T2M_MAX`, `GWETROOT`), monthly 2001–2025 + daily for the last ~400 days |
| CMIP6 Climate Model Projections (2021–2050) | [NASA NEX-GDDP-CMIP6](https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6) (0.25° downscaled multi-model ensemble: GFDL-ESM4, MPI-ESM1-2-HR, MRI-ESM2-0, EC-Earth3, UKESM1-0-LL) |
| Division & district borders | [geoBoundaries](https://www.geoboundaries.org/) gbOpen BGD ADM1 / ADM2 (CC BY 4.0) |
| Map imagery | [NASA GIBS](https://earthdata.nasa.gov/gibs) |

- **Past**: the 2001–2010 multi-year average baseline.
- **Now**: the latest 12 complete months (from daily NASA POWER data). The *Last 60 days* chart is fetched live from NASA POWER for the selected district.
- **Future**: includes both empirical trends and real downscaled climate-model projections up to **2050**:
  - **Statistical Trend (Theil–Sen)**: Robust non-parametric regression extending 2001–2025 local NASA POWER trajectories, evaluated at **2040** with a ±95% (±1.96 standard deviation) spread.
  - **CMIP6 SSP2-4.5 (Middle of the Road)**: NASA NEX-GDDP-CMIP6 0.25° downscaled multi-model ensemble capturing moderate mitigation (~2.7°C warming by 2100).
  - **CMIP6 SSP5-8.5 (High Emissions)**: NASA NEX-GDDP-CMIP6 0.25° downscaled multi-model ensemble capturing fossil-fueled unconstrained growth (~4.4°C warming by 2100).
  - **Multi-Model Uncertainty Ribbon**: `YearChart` renders the multi-model median curve alongside a shaded 10th-to-90th percentile ensemble spread band, displayed directly adjacent to the statistical trend line for instant scientific comparison.
  - **Scenario Selector**: Switch scenarios seamlessly in Future mode and on the chart header; full state persists in URL query parameters (`?scenario=ssp245`).
- **Anomaly Mode**: Click **Anomaly** to toggle district deviations relative to the 2001–2010 baseline. Uses diverging color palettes (blue ↔ red for temperature; brown ↔ green for rainfall and soil wetness) across the 3D map, ranked district list, and DetailPanel.
- **Extreme-Event Indicators**: Tracks heatwave days (max temperature ≥ 36°C, configurable in `constants.js`), longest dry spell (consecutive days < 1 mm rain), and heavy rain days (precipitation ≥ 50 mm/day).
- **Climate Stripes & Heatmaps**: Visualizes long-term warming/drying stripes (2001–2025) and a 25-year × 12-month monthly matrix heatmap in both absolute and baseline anomaly views.
- **Statistical Significance**: YearChart computes the **Theil–Sen slope per decade** along with non-parametric **Mann–Kendall p-values** to label significant climate trends ($p < 0.05$).
- **Compare Mode**: Select two districts to inspect them side by side. Displays comparative hero metrics, split Past/Now/Future values, and overlaid two-color graphs on both `YearChart` (historical & projections) and `SeasonChart` (12-month annual cycle), with dual highlights on the 3D map.
- **URL Synchronization & Link Sharing**: Automatically mirrors application state (`division`, `district`, `compare`, `metric`, `time`, `year`, `anomaly`, `scenario`) to URL query parameters (`?dist=dhaka&comp=sylhet&m=heat&t=future&scenario=ssp245`), allowing any view to be copied, shared, and bookmarked. Full state is restored on page load.
- **Export & Reporting Options**:
  - **Chart PNG**: Export high-resolution chart images directly from the toolbar or individual chart headers.
  - **Data CSV**: Download complete 2001–2050 historical and projected district time-series along with the 12-month seasonal climatology.
  - **Summary Report PDF**: Generate a clean, publication-ready, one-page A4 PDF summary report containing baseline comparisons, decadal trends, Mann–Kendall significance, seasonal cycles, recent extreme events, and methodology notes.
- **Bilingual Support (English & Bangla)**:
  - Full internationalization (`i18n`) system with instant language switcher (`EN` / `বাং`) in the header and persistent `localStorage` selection.
  - All UI strings, all 8 divisions, and all 64 districts translated into native Bangla while keeping canonical geoBoundaries IDs unchanged.
  - Native Bengali numerals (`০-৯`) used throughout numbers, dates, coordinates, and chart metrics when Bangla is active.
  - Automated plain-language summaries generated in both English and Bangla (e.g., *"Over the last 25 years, the average max temperature in Rajshahi rose by 0.8°C (+0.32°C/decade)..."* and *"গত ২৫ বছরে রাজশাহী-এ গড় সর্বোচ্চ তাপমাত্রা ০.৮ °সে বৃদ্ধি পেয়েছে (+০.৩২ °সে/দশক)..."*).
  - Web font integration with Google Fonts `Noto Sans Bengali` alongside `Inter`, optimized with responsive typographic scale and line-heights to ensure layout robustness.
- **Agriculture Mode & Crop Calendars**:
  - Dedicated **Agriculture** tab in the DetailPanel featuring crop calendars for Bangladesh's three major rice staples: **Aman**, **Aus**, and **Boro**.
  - Interactive 12-month calendar visualizer tracking sowing, vegetative growth, flowering, and harvest windows with a live "Now" indicator.
  - Compares growing-season rainfall and root-zone soil wetness against the 2001–2010 baseline, with 2040 trajectory projections.
  - Assigns simple, actionable agro-climatic risk classifications (**Low** / **Medium** / **High**; কম / মাঝারি / উচ্চ) accompanied by transparent, plain-language reasoning.
  - **"Unusual now" Alert Badge**: Evaluates whether the last 30–60 days deviate significantly from the district's historical normal range ($|z| \ge 1.5$ for precipitation, temperature, or soil wetness) with quick navigation to agricultural diagnostics.
  - Explicitly labeled as an indicative agro-climatic advisory based on NASA Earth observations (not an official DAE / BMD meteorological forecast).
- Years before 2001 are excluded because NASA POWER's precipitation record has a known data source transition around that period.

## Limitations & Scientific Notes

- **Spatial Resolution**: NASA POWER parameters are provided on a ~0.5° × 0.5° latitude/longitude grid (~55 km × 55 km). Consequently, adjacent or smaller districts (such as Dhaka and Narayanganj) that fall within or near the same grid cell may show very similar or identical raw climate readings. CMIP6 projections are downscaled at 0.25° (~27 km).
- **Statistical Trend vs. Physical Models**: Climate Lens offers side-by-side comparison between **empirical statistical trends** (Theil–Sen regression on recent 2001–2025 observations) and **physics-based downscaled GCM ensembles** (NASA NEX-GDDP-CMIP6). While empirical trends reflect current local momentum, CMIP6 projections capture radiative forcing, GHG warming, and thermodynamic moisture holding capacity under defined emission scenarios (SSP2-4.5 and SSP5-8.5).
- **Ensemble Spread**: The shaded model range reflects the 10th to 90th percentile across the 5 top-performing GCMs for the South Asian monsoon, illustrating inter-model uncertainty.
- **Extreme Events**: Annual and monthly aggregations smooth out short-duration hyper-local convective cloudbursts and flash flood pulses.

- **Technical Quality & Offline Architecture**:
  - **Full TypeScript Migration**: The entire application (`src/lib`, `src/hooks`, `src/components`, `src/workers`) is strictly typed with TypeScript, delivering complete type-safety across GeoJSON geometry, climate datasets, and CMIP6 structures.
  - **Progressive Web App (PWA) & Offline Mode**: Configured with Web App Manifest (`manifest.webmanifest`), adaptive icons (`icon.svg`), and custom Service Worker (`sw.js`). Employs Stale-While-Revalidate and Cache-First strategies to enable instant offline exploration of all 64 districts and NASA projections without network access.
  - **Automated Monthly Ingestion Action**: GitHub Action workflow (`.github/workflows/data-update.yml`) runs on the 1st of every month to ingest the latest NASA POWER observations, execute automated data validation and physical outlier checks (`scripts/validate-data.mjs`), and open a pull request when updates are detected.
  - **Web Worker Statistical Offloading**: Intensive mathematical operations (Mann–Kendall trend tests, Theil–Sen decadal slope regressions) can be dispatched to dedicated background Web Workers (`src/workers/metrics.worker.ts`) with transparent main-thread fallback, keeping the 3D MapLibre canvas silky smooth.

## Run & Test

```bash
npm install
npm run dev             # Start Vite dev server (http://localhost:5173)
npm run typecheck       # Verify TypeScript type correctness (tsc --noEmit)
npm run test            # Run Vitest unit test suite (50+ tests)
npm run lint            # Run ESLint checks
npm run format:check    # Check code style with Prettier
npm run build           # Build optimized production PWA bundle
npm run data            # Fetch latest NASA POWER + borders → src/data/
npm run validate:data   # Run dataset integrity and physical outlier validator
```

## License

This project is licensed under the MIT License - see the [LICENSE](file:///d:/projects/nasa%202/nasa.zip/LICENSE) file for details.

## Structure

```
scripts/
├── build-data.mjs            fetches NASA POWER + geoBoundaries → src/data/*.json
├── build-cmip6.mjs           preprocesses NASA NEX-GDDP-CMIP6 downscaled ensemble → src/data/cmip6.json
└── validate-data.mjs         validates district counts, array integrity, and physical outlier bounds
public/
├── manifest.webmanifest      PWA web application manifest
├── sw.js                     offline caching Service Worker
└── icon.svg                  vector lens application icon
src/
├── App.tsx                   app state, URL sync, compare mode orchestration
├── lib/
│   ├── types.ts              canonical TypeScript interfaces & union types
│   ├── metrics.ts            Past / Now / Future values, CMIP6 & Theil–Sen projection, Mann–Kendall, seasonal cycles
│   ├── constants.ts          metrics, thresholds, scenarios (SSP2-4.5/5-8.5), time colours, ramps
│   ├── export.ts             client-side PNG, CSV, and jsPDF 1-page report generators
│   ├── urlState.ts           query parameter parser, serializer, and history syncer
│   ├── agriculture.ts        crop calendars (Aman/Aus/Boro), agro-climate risk, and 60-day unusual alert
│   ├── workerMetrics.ts      Web Worker wrapper for async statistical processing with fallback
│   ├── i18n/                 i18n Context provider, en/bn dictionaries, automated summary engine
│   └── format.ts             number, anomaly, date and Bangla numeral formatters
├── components/
│   ├── map/                  ClimateMap (MapLibre 3D + drone flight), mapStyle (NASA GIBS), animator, MapNav
│   ├── charts/               YearChart (CMIP6 ribbon + trend compare), SeasonChart, DailyChart, StripesChart, HeatmapChart
│   ├── AgriculturePanel.tsx  interactive crop calendar timeline, risk cards, and 60-day anomaly chips
│   ├── DivisionPicker.tsx    mini-map region tiles
│   ├── DistrictList.tsx      ranked districts with quick compare badges
│   ├── DetailPanel.tsx       headline values, scenario selector, side-by-side compare, charts, export toolbar
│   ├── Timeline.tsx          Past · Now · Future + play
│   ├── MetricTabs.tsx, MapControls.tsx, Stamp.tsx, AnimatedNumber.tsx
├── workers/
│   └── metrics.worker.ts     background Web Worker for heavy statistical calculations
├── hooks/                    useTween, useIsMobile, useLiveDaily
├── data/                     climate.json, cmip6.json, districts.geo.json, divisions.geo.json
└── styles/global.css
```
