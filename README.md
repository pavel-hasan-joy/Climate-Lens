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
| Division & district borders | [geoBoundaries](https://www.geoboundaries.org/) gbOpen BGD ADM1 / ADM2 (CC BY 4.0) |
| Map imagery | [NASA GIBS](https://earthdata.nasa.gov/gibs) |

- **Past**: the 2001–2010 average.
- **Now**: the latest 12 complete months. The *Last 60 days* chart is fetched live from NASA POWER for the selected district.
- **Future**: our own projection. It is a robust Theil–Sen trend through 2001–2025, extended to 2040 with a 95% range. It is a statistical trend, not a climate model.
- Years before 2001 are left out because NASA POWER's rainfall record has a source discontinuity there.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run data     # re-download NASA POWER + borders → src/data/
npm run build
```

## Structure

```
scripts/build-data.mjs        fetches NASA POWER + geoBoundaries → src/data/*.json
src/
├── App.jsx                   selection state: division, district, metric, time, year/play
├── lib/
│   ├── metrics.js            Past / Now / Future values, trend projection, seasonal cycles
│   ├── constants.js          metrics, time colours, colour ramps
│   └── format.js
├── components/
│   ├── map/                  ClimateMap (MapLibre 3D + drone flight), mapStyle (NASA GIBS), animator
│   ├── charts/               YearChart, SeasonChart, DailyChart
│   ├── DivisionPicker.jsx    mini-map region tiles
│   ├── DistrictList.jsx      ranked districts
│   ├── DetailPanel.jsx       headline value, Past/Now/Future, charts, method
│   ├── Timeline.jsx          Past · Now · Future + play
│   ├── MetricTabs.jsx, MapControls.jsx, Stamp.jsx, AnimatedNumber.jsx
├── hooks/                    useTween, useIsMobile, useLiveDaily
├── data/                     climate.json, districts.geo.json, divisions.geo.json
└── styles/global.css
```
