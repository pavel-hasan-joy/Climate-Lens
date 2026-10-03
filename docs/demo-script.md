# Climate Lens — Bangladesh
## 2-Minute Video Demonstration Script (120 Seconds)

**Target Duration**: 02:00 (120 seconds)  
**Presenter Persona**: Confident, scientific, front-facing lead engineer  
**Visual Style**: Live interactive screen recording with high-contrast 3D MapLibre graphics and live audio  

---

### [00:00 – 00:15] Hook: Frontline Climate Reality
- **Screen**: Fullscreen 3D view of Bangladesh rotating with Black Marble night lights. Rain radar overlay active.
- **Voiceover**: 
  > *"Bangladesh is on the frontlines of the global climate crisis. But while global discussions focus on national averages, farmers, urban planners, and agricultural extension agents live and work in specific districts. Welcome to **Climate Lens — Bangladesh**, an interactive 3D geospatial observatory transforming raw NASA Earth observations into actionable, sub-national intelligence for all 64 districts."*

---

### [00:15 – 00:35] Core Platform: 3D Geospatial Tri-Temporal Engine
- **Screen**: Click **Rajshahi** on the map; the camera smoothly zooms and pitches in 3D. Switch between **Past (2001–2010)**, **Now (Latest 12 Months)**, and **Future (2040)**. Click **▶ Play** to demonstrate continuous 2001→2050 timeline flight. Toggle **বাং (Bangla)** in header to show instantaneous Bengali numerals and text.
- **Voiceover**: 
  > *"Built with React 19, TypeScript, and MapLibre GL, Climate Lens allows users to explore 25 years of NASA POWER surface meteorology across three temporal horizons: our 2001 to 2010 historical baseline, near-real-time observations, and mid-century 2040 projections. Pressing play animates the entire 2001 to 2050 trajectory. The interface is completely bilingual in English and native Bangla, featuring localized Bengali numerals across all maps, charts, and dates."*

---

### [00:35 – 00:55] Scientific Rigor: CMIP6 Ensembles & Empirical Validation
- **Screen**: Scroll to `YearChart` in `DetailPanel`. Toggle scenario from **Statistical (Theil–Sen)** to **CMIP6 SSP2-4.5** and **SSP5-8.5**. Highlight the 10th–90th percentile multi-model uncertainty ribbon. Click the `🔬` icon to briefly show `ValidationModal` with the 2001–2015 train vs. 2016–2025 test evaluation.
- **Voiceover**: 
  > *"Scientific validity is our non-negotiable core. We don't just compute empirical Theil–Sen decadal trends and Mann–Kendall significance; we integrate downscaled NASA NEX-GDDP-CMIP6 climate physics across five global circulation models. Users see the multi-model median alongside a shaded 10th-to-90th percentile uncertainty ribbon. Furthermore, we empirically back-tested our models against actual 2016 to 2025 observations across all 64 districts, publishing MAE, RMSE, and 95% band coverage directly in the app."*

---

### [00:55 – 01:20] Real-World Action: Agriculture, Crop Risks & MODIS Vigor
- **Screen**: Click the **Agriculture** tab. Show the **Aman, Aus, and Boro** crop calendar cards. Highlight the **High Risk** decision pill for Boro rice, showing the transparent formula. Scroll to `NdviVigorCard` showing the 12-month MODIS vegetation health cycle and season bars.
- **Voiceover**: 
  > *"To deliver real-world impact, our dedicated Agriculture Panel matches NASA satellite observations directly to Bangladesh's staple rice seasons: Aus, Aman, and Boro. In northwestern Rajshahi, severe dry-season soil moisture deficits trigger an automated High Risk alert for irrigated Boro rice. There are zero black boxes: every threshold and mathematical rule is displayed transparently alongside NASA MODIS NDVI vegetation vigor tracking canopy health."*

---

### [01:20 – 01:45] Human Impact, Live Feeds & Wildlife
- **Screen**: Switch to Overview tab to show `PopulationImpactCard` (162M people in wetting surge). Click the live hazard icon `Happening Now` to display active NASA EONET events plotted on the 3D map. Click `🐾 Species Records` to show 1,056 GBIF records with the observer-effort disclosure.
- **Voiceover**: 
  > *"Using NASA SEDAC Gridded Population data calibrated to the 2022 Census, we quantify human exposure: 162 million citizens reside in districts experiencing statistically significant monsoon wetting surges. We stream live natural hazard events directly from NASA EONET, and track 1,056 GBIF species observations across six indicator species—always maintaining scientific honesty by disclosing observer effort."*

---

### [01:45 – 02:00] Closing: Open Science, Reliability & Impact
- **Screen**: Click **Export PDF** to show the instant one-page publication-ready summary. Point to the live **System Status** bar in the footer showing `Operational 🟢`. Return to the wide 3D view of Bangladesh.
- **Voiceover**: 
  > *"Every view can be exported as a publication-ready PDF, CSV dataset, or shared via persistent URLs. Powered by automated monthly GitHub Actions and designed as an offline-first Progressive Web App, Climate Lens is open-source, reproducible, and ready to empower Bangladesh's climate resilience today. Thank you."*
