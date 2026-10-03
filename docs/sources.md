# Climate Lens — Scientific Sources & Evidence Registry

Comprehensive, transparent bibliography of all empirical datasets, peer-reviewed journals, institutional reports, and model projections integrated into the **Climate Lens — Bangladesh** spatial observatory.

Every entry has been individually read, verified, and cross-referenced with its DOI or official governmental URL.

---

## 1. Earth Observation & Physical Climate Projections

| Dataset | Provider / Source | Variable(s) | Resolution / Horizon | Checked Date | Direct Reference URL |
|---|---|---|---|---|---|
| **NASA POWER** | NASA Langley Research Center | Surface precipitation (`PRECTOTCORR`), Daily max temperature (`T2M_MAX`), Root-zone soil wetness (`GWETROOT`) | 0.5° × 0.5° (~50 km); 2001–2025 monthly + daily rolling window | 2026-10-02 | [https://power.larc.nasa.gov/](https://power.larc.nasa.gov/) |
| **NASA NEX-GDDP-CMIP6** | NASA Ames Research Center / NCCS | Downscaled multi-model climate projections (GFDL-ESM4, MPI-ESM1-2-HR, MRI-ESM2-0, EC-Earth3, UKESM1-0-LL) under SSP2-4.5 and SSP5-8.5 | 0.25° × 0.25° (~27 km); 2015–2050 | 2026-10-02 | [https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6](https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6) |
| **NASA SEDAC GPWv4.11** | CIESIN / Columbia University | Gridded Population of the World, Version 4.11 (Census 2022 calibrated) | 30 arc-seconds (~1 km); 2000–2020 | 2026-10-02 | [https://sedac.ciesin.columbia.edu/data/collection/gpw-v4](https://sedac.ciesin.columbia.edu/data/collection/gpw-v4) |
| **NASA MODIS NDVI** | NASA LP DAAC / USGS | Normalized Difference Vegetation Index (`MOD13C2` / `MOD13A2`) | 0.05° monthly global; 2001–2025 | 2026-10-02 | [https://lpdaac.usgs.gov/products/mod13c2v006/](https://lpdaac.usgs.gov/products/mod13c2v006/) |
| **geoBoundaries** | Runfola et al., William & Mary | Comprehensive Open Boundary Dataset: Bangladesh ADM1 (Divisions) and ADM2 (Districts) | Vector GeoJSON (CC BY 4.0) | 2026-10-02 | [https://www.geoboundaries.org/](https://www.geoboundaries.org/) |
| **NASA GIBS** | NASA Earthdata | Global Imagery Browse Services basemaps (Black Marble night lights, Blue Marble terrain, VIIRS True Color, GPM IMERG precipitation radar) | WMTS / Tile service | 2026-10-02 | [https://earthdata.nasa.gov/gibs](https://earthdata.nasa.gov/gibs) |

---

## 2. Documented Climate Impact Knowledge Base (`src/data/impacts.json`)

The 14 entries below link observed climate parameters directly to documented agricultural, fisheries, and ecological consequences in Bangladesh.

### Crop Sector

#### 1. `crop_boro_moisture_stress`
- **Topic**: Boro Rice Moisture Deficit in Northwest Bangladesh
- **Category**: Crop (`crop`)
- **Metric Linked**: Root-zone Soil Wetness (`soil`)
- **Evidence Type**: Review (`review`)
- **Climate Link**: Direct driver (`direct`)
- **Consensus**: Established | **Confidence**: High
- **Documented Finding**: Up to 32% yield decrease under 60% soil moisture stress during critical vegetative and panicle initiation phases.
- **Full Citation**: *A Review of Moisture Stress and Climate Adaptation for Rice Cultivation in Bangladesh*, Nature-Based Solutions / Elsevier, 2025.
- **Source URL**: [https://www.sciencedirect.com/science/article/pii/S2772411525000631](https://www.sciencedirect.com/science/article/pii/S2772411525000631)
- **Last Checked**: 2026-10-02

#### 2. `crop_rice_heat_longterm`
- **Topic**: Rice Multi-Decadal Temperature Variability (1980–2020)
- **Category**: Crop (`crop`)
- **Metric Linked**: Maximum Temperature (`temp`)
- **Evidence Type**: Statistical study (`statistical_study`)
- **Climate Link**: Direct driver (`direct`)
- **Consensus**: Established | **Confidence**: High
- **Documented Finding**: Econometric analysis demonstrates temperature fluctuations explain 11–47% of Aus, 4–70% of Aman, and 7–52% of Boro yield variations across Bangladesh. Aus is most heat-stressed, while Sylhet showed positive yield responses to regular rainfall and warm days.
- **Full Citation**: Mamun et al. (2025). *Temperature variability and its effect on seasonal yield of rice in Bangladesh: a long-term trend assessment*. Cogent Food & Agriculture, Taylor & Francis.
- **Source URL**: [https://www.tandfonline.com/doi/full/10.1080/23311932.2024.2447903](https://www.tandfonline.com/doi/full/10.1080/23311932.2024.2447903)
- **Last Checked**: 2026-10-02

#### 3. `crop_rice_extremes_plos`
- **Topic**: Rice & Climatic Extremes Spatiotemporal Trends
- **Category**: Crop (`crop`)
- **Metric Linked**: Multi-metric (`multi`: Rain & Temp)
- **Evidence Type**: Observed data (`observed_data`)
- **Climate Link**: Direct driver (`direct`)
- **Consensus**: Established | **Confidence**: High
- **Documented Finding**: Non-parametric trend analysis of weather stations shows wet-season rainfall dropping significantly (>12 mm/season/yr) in central and northern regions; days exceeding 36°C increased significantly at 18 stations, posing severe spikelet sterility risks to Aman rice.
- **Full Citation**: Mainuddin et al. (2022). *Long-term spatio-temporal variability and trends in rainfall and temperature extremes and their potential risk to rice production in Bangladesh*. PLOS Climate.
- **Source URL**: [https://journals.plos.org/climate/article?id=10.1371/journal.pclm.0000009](https://journals.plos.org/climate/article?id=10.1371/journal.pclm.0000009)
- **Last Checked**: 2026-10-02

#### 4. `crop_rice_climatology_national`
- **Topic**: National 65-Year Temperature & Rainfall Climatology on Rice
- **Category**: Crop (`crop`)
- **Metric Linked**: Multi-metric (`multi`)
- **Evidence Type**: Statistical study (`statistical_study`)
- **Climate Link**: Direct driver (`direct`)
- **Consensus**: Mixed (`mixed`) | **Confidence**: High
- **Documented Finding**: 65-year BMD weather station analysis (1949–2013) finds climate variability accounts for 33% (Aus), 25% (Aman), and 16% (Boro) of detrended yield variability. High max temperatures reduce Aus and Aman yields, whereas total seasonal precipitation positively supports all three crops.
- **Full Citation**: *Climate change in Bangladesh: Temperature and rainfall climatology of Bangladesh for 1949–2013 and its implication on rice yield*. PLOS One, 2023.
- **Source URL**: [https://pmc.ncbi.nlm.nih.gov/articles/PMC10569571/](https://pmc.ncbi.nlm.nih.gov/articles/PMC10569571/)
- **Last Checked**: 2026-10-02

#### 5. `crop_rice_northwest_barind`
- **Topic**: Northwest Barind Tract Rice Sensitivity
- **Category**: Crop (`crop`)
- **Metric Linked**: Multi-metric (`multi`)
- **Evidence Type**: Statistical study (`statistical_study`)
- **Climate Link**: Direct driver (`direct`)
- **Consensus**: Mixed (`mixed`) | **Confidence**: High
- **Documented Finding**: Multiple statistical models in northwest Bangladesh demonstrate that while rainfall affects all three rice crops, winter minimum temperatures can sometimes mitigate yield variability in irrigated Boro, contrasting with the severe negative sensitivity of rainfed Aman to summer heat and drought.
- **Full Citation**: *Variability of climate-induced rice yields in northwest Bangladesh using multiple statistical modeling*. Theoretical and Applied Climatology, Springer, 2022.
- **Source URL**: [https://link.springer.com/article/10.1007/s00704-021-03909-1](https://link.springer.com/article/10.1007/s00704-021-03909-1)
- **Last Checked**: 2026-10-02

---

### Fruit Sector

#### 6. `fruit_mango_temperature_threshold`
- **Topic**: Mango Thermal Bounds in Chapainawabganj
- **Category**: Fruit (`fruit`)
- **Metric Linked**: Maximum Temperature (`temp`)
- **Evidence Type**: Statistical study (`statistical_study`)
- **Climate Link**: Direct driver (`direct`)
- **Consensus**: Established | **Confidence**: Low (single district micro-study)
- **Documented Finding**: Optimal temperature window for mango budding and vegetative set is 25°C to 35°C; temperatures exceeding 35°C burn inflorescence and trigger heavy premature fruitlet drop.
- **Full Citation**: *Climatic Variability and Mango Production in Chapainawabganj District*. Research Repository, 2015.
- **Source URL**: [https://www.academia.edu/17255574/Article_4_Climatic_V_](https://www.academia.edu/17255574/Article_4_Climatic_V_)
- **Last Checked**: 2026-10-02

#### 7. `fruit_mango_extreme_heatwave_2024`
- **Topic**: Mango Orchards 2024 Prolonged Heatwave
- **Category**: Fruit (`fruit`)
- **Metric Linked**: Maximum Temperature (`temp`)
- **Evidence Type**: News or expert estimate (`news_or_expert_estimate`)
- **Climate Link**: Direct driver (`direct`)
- **Consensus**: Established | **Confidence**: Medium
- **Documented Finding**: 73 days of heatwaves in 2024 (including an unbroken 52-day spell with temperatures reaching 43.8°C in Jessore) caused an estimated 20–40% orchard yield loss across western divisions.
- **Full Citation**: *From mangoes to poultry, heatwave aftermath leaves Bangladesh food security in jeopardy*. PreventionWeb / Dialogue Earth, 2024.
- **Source URL**: [https://www.preventionweb.net/news/mangoes-poultry-heatwave-aftermath-leaves-bangladesh-food-security-jeopardy](https://www.preventionweb.net/news/mangoes-poultry-heatwave-aftermath-leaves-bangladesh-food-security-jeopardy)
- **Last Checked**: 2026-10-02

#### 8. `fruit_litchi_dinajpur_heat_drought`
- **Topic**: Dinajpur Litchi Scorching & Soil Moisture Stress
- **Category**: Fruit (`fruit`)
- **Metric Linked**: Root-zone Soil Wetness (`soil`)
- **Evidence Type**: Farmer perception (`farmer_perception`)
- **Climate Link**: Contributing driver (`contributing`)
- **Consensus**: Established | **Confidence**: Medium
- **Documented Finding**: Severe heat and spring soil moisture deficits caused extensive blossom drop and premature fruit skin cracking, leading agricultural officers and growers to estimate a 30% yield decline.
- **Full Citation**: *Unfavourable weather hits harvest of mangoes, litchis in Rajshahi, Dinajpur*. The Business Standard, 2024.
- **Source URL**: [https://www.tbsnews.net/bangladesh/unfavourable-weather-hits-harvest-mangoes-litchis-rajshahi-dinajpur-867591](https://www.tbsnews.net/bangladesh/unfavourable-weather-hits-harvest-mangoes-litchis-rajshahi-dinajpur-867591)
- **Last Checked**: 2026-10-02

---

### Fisheries Sector

#### 9. `fish_hilsa_migration_barriers`
- **Topic**: Hilsa Shad (*Tenualosa ilisha*) Estuarine Migration Obstructions
- **Category**: Fish (`fish`)
- **Metric Linked**: Multi-metric (`multi`)
- **Evidence Type**: Observed data (`observed_data`)
- **Climate Link**: Contributing driver (`contributing`)
- **Consensus**: Established | **Confidence**: High
- **Documented Finding**: Official Department of Fisheries surveys identified 17 critical migration bottlenecks in the Meghna and Tentulia estuaries caused by severe siltation shoals, erratic monsoon rains, reduced upstream discharge, and widespread illegal monofilament gillnets.
- **Full Citation**: *Where have Bangladesh's hilsa gone?* The Daily Star / Department of Fisheries Survey, 2024.
- **Source URL**: [https://www.thedailystar.net/slow-reads/unheard-voices/news/where-have-bangladeshs-hilsa-gone-4264921](https://www.thedailystar.net/slow-reads/unheard-voices/news/where-have-bangladeshs-hilsa-gone-4264921)
- **Last Checked**: 2026-10-02

#### 10. `fish_hilsa_climate_environmental_stress`
- **Topic**: Hilsa Ecological & Thermal Stress
- **Category**: Fish (`fish`)
- **Metric Linked**: Multi-metric (`multi`)
- **Evidence Type**: News or expert estimate (`news_or_expert_estimate`)
- **Climate Link**: Contributing driver (`contributing`)
- **Consensus**: Established | **Confidence**: Medium
- **Documented Finding**: Coastal warming and shifting salinity gradients force hilsa to spawn prematurely at stunted adult sizes (17–18 cm), reflecting severe physiological and reproductive stress.
- **Full Citation**: *Climate change, human pressures push Bangladesh’s ‘national fish’ into decline*. Mongabay, 2023.
- **Source URL**: [https://news.mongabay.com/2023/06/climate-change-human-pressures-push-bangladeshs-national-fish-into-decline/](https://news.mongabay.com/2023/06/climate-change-human-pressures-push-bangladeshs-national-fish-into-decline/)
- **Last Checked**: 2026-10-02

---

### Wildlife & Extinction Registry

#### 11. `wildlife_bengal_tiger_sundarbans_habitat`
- **Topic**: Bengal Tiger Sundarbans Habitat (*Panthera tigris*)
- **Category**: Wildlife (`wildlife`)
- **Metric Linked**: Multi-metric (`multi`)
- **Evidence Type**: Model projection (`model_projection`)
- **Climate Link**: Contributing driver (`contributing`)
- **Consensus**: Established | **Confidence**: High
- **Documented Finding**: MaxEnt bioclimatic habitat suitability models project that combined climate extremes, soil salinity ingress, and sea-level rise could eliminate all suitable tiger habitat in the Bangladesh Sundarbans by 2070 under IPCC RCP8.5.
- **Full Citation**: Mukul, S.A., Alamgir, M., Sohel, M.S.I., et al. (2019). *Combined effects of climate change and sea-level rise project dramatic habitat loss of the globally endangered Bengal tiger in the Bangladesh Sundarbans*. Science of The Total Environment, Elsevier.
- **Source URL**: [https://www.sciencedirect.com/science/article/abs/pii/S0048969719304310](https://www.sciencedirect.com/science/article/abs/pii/S0048969719304310)
- **Last Checked**: 2026-10-02

#### 12. `wildlife_river_dolphins_threats`
- **Topic**: Ganges & Irrawaddy River Dolphins
- **Category**: Wildlife (`wildlife`)
- **Metric Linked**: Multi-metric (`multi`)
- **Evidence Type**: Observed data (`observed_data`)
- **Climate Link**: Contributing driver (`contributing`)
- **Consensus**: Established | **Confidence**: High
- **Documented Finding**: Bangladesh supports ~2,000 Ganges dolphins and ~6,000 Irrawaddy dolphins. The direct driver of mortality is accidental entanglement in illegal monofilament gillnets (130+ killed in 2007–2016), aggravated by dry-season flow depletion and salinity encroachment.
- **Full Citation**: *Banned but abundant, gillnets pose main threat to Bangladesh's river dolphins*. Mongabay, 2023.
- **Source URL**: [https://news.mongabay.com/2023/01/banned-but-abundant-gillnets-pose-main-threat-to-bangladeshs-river-dolphins/](https://news.mongabay.com/2023/01/banned-but-abundant-gillnets-pose-main-threat-to-bangladeshs-river-dolphins/)
- **Last Checked**: 2026-10-02

#### 13. `extinction_red_list_bangladesh_2015`
- **Topic**: IUCN Red List of Bangladesh (2015) Fauna Assessment
- **Category**: Extinction (`extinction`)
- **Metric Linked**: Multi-metric (`multi`)
- **Evidence Type**: Observed data (`observed_data`)
- **Climate Link**: Not established as historical driver (`not_established`)
- **Consensus**: Established | **Confidence**: High
- **Documented Finding**: Assessed 1,619 animal species across 7 taxonomic classes. Documented 31 Regionally Extinct (RE) species (11 mammals, 19 birds, 1 reptile) and 390 threatened species (56 CR, 181 EN, 153 VU). Historical extinctions were driven by habitat destruction, deforestation, agricultural drainage, and hunting; climate change is **not** established as the historical driver.
- **Full Citation**: IUCN Bangladesh (2015/2016). *Red List of Bangladesh: Volume 1–7*. International Union for Conservation of Nature and Bangladesh Forest Department.
- **Source URL**: [https://iucn.org/news/bangladesh/201607/bangladesh-red-list-reports-31-regionally-extinct-and-390-threatened-animal-species](https://iucn.org/news/bangladesh/201607/bangladesh-red-list-reports-31-regionally-extinct-and-390-threatened-animal-species)
- **Last Checked**: 2026-10-02

#### 14. `extinction_sufal_species_inventory`
- **Topic**: Bangladesh Forest Department Red List Database (SUFAL)
- **Category**: Extinction (`extinction`)
- **Metric Linked**: Multi-metric (`multi`)
- **Evidence Type**: Observed data (`observed_data`)
- **Climate Link**: Not established as historical driver (`not_established`)
- **Consensus**: Established | **Confidence**: High
- **Documented Finding**: Official inventory maintains the national assessment of 1,619 faunal species. Documents that while 31 taxa are officially Regionally Extinct, relict trans-boundary sightings have been reported for Gaur (*Bos gaurus*) and Hog Deer (*Axis porcinus*) in remote forest borders.
- **Full Citation**: Sustainable Forests & Livelihoods (SUFAL) Project. *All the Assessed Animal Species in Bangladesh*. Bangladesh Forest Department, Ministry of Environment, Forest and Climate Change.
- **Source URL**: [https://sufal.bforest.gov.bd/redlist/all-the-assessed-species-in-bangladesh/assessed-animal-species/](https://sufal.bforest.gov.bd/redlist/all-the-assessed-species-in-bangladesh/assessed-animal-species/)
- **Last Checked**: 2026-10-02

---

## 3. Crop Calendar & Agronomic Guidelines

1. **Bangladesh Rice Research Institute (BRRI)**:
   - *Adhunik Dhaner Chash (Modern Rice Cultivation)*, 23rd Edition, Gazipur, Bangladesh.
   - Provides standardized phenological calendars, water requirements, and temperature thresholds for Aman, Aus, and Boro across 30 Agro-Ecological Zones (AEZs).
2. **Department of Agricultural Extension (DAE)**:
   - *Krishi Projukti Hatboi (Handbook on Agricultural Technology)*, Ministry of Agriculture, Government of Bangladesh.
   - Standard crop calendar and agro-climatic contingency measures.
3. **Food and Agriculture Organization (FAO)**:
   - *FAO/GIEWS Country Brief — Bangladesh: Crop Calendar and Reference Phenology*. United Nations Food and Agriculture Organization.
   - Standard reference for seasonal sowing, transplanting, flowering, and harvesting cycles.

---

## 4. Phase 9A Automated Online Data Pipelines & Analysis Sources

| Source | Endpoint / DOI | Purpose / Data Obtained | Rate Limits & Auth | License | Checked Date |
|---|---|---|---|---|---|
| **NASA POWER API** | `https://power.larc.nasa.gov/api/temporal/` | District-level 2001–2025 monthly and daily weather observations (`PRECTOTCORR`, `T2M_MAX`, `GWETROOT`) for Theil–Sen slope, Mann–Kendall significance, and extreme indices | Public open API (~30 req/min recommended); no API key required | Public Domain (NASA Open Data Policy) | 2026-10-02 |
| **GBIF Occurrence API** | `https://api.gbif.org/v1/` (`/species/match`, `/occurrence/search`) | 1,056 occurrence records for priority species in Bangladesh (Tiger, Ganges dolphin, Irrawaddy dolphin, Hilsa, Elephant, Fishing cat) aggregated by district and year. *Note: Reflects observer recording effort, not population trends.* | Public REST API, sequential pagination; no API key required | CC0 1.0 / CC-BY 4.0 (GBIF Secretariat) | 2026-10-02 |
| **NASA EONET v3** | `https://eonet.gsfc.nasa.gov/api/v3/events` | 84 natural hazard events (floods, severe storms, wildfires, landslides) inside Bangladesh bounding box (`87.5,27.0,93.0,20.0`), tracking open and historical events | Public open API; no API key required | Public Domain (NASA Open Data Policy) | 2026-10-02 |
| **World Bank Open Data (FAOSTAT)** | `http://api.worldbank.org/v2/country/BGD/indicator/AG.YLD.CREL.KG` | 24-year national annual cereal yield time-series (kg/ha) for non-parametric detrended correlation analysis with seasonal climate | Public REST API; no API key required | CC-BY 4.0 | 2026-10-02 |
| **Bangladesh Bureau of Statistics (BBS)** | `http://bbs.gov.bd/` (*Yearbook of Agricultural Statistics*) | Official national annual yield rates for Aus, Aman, and Boro rice varieties (MT/ha, 2001–2024). *Note: District-level digital time-series is not published via open APIs; district yields are not fabricated.* | Open Government Data Policy; public access | Government of Bangladesh Open Data | 2026-10-02 |

