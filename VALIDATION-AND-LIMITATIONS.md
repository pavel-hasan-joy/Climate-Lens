# Climate Lens — Bangladesh: Empirical Validation & Scientific Limitations Dossier

> **NASA International Space Apps Challenge 2026 Submission Document**  
> **Official Screen Evidence for Section 09 — Validation & Limitations (03:00–03:18 · 18 Seconds)**  
> **Team:** NovaByte | **Lead Architect & Scientific Formulation:** Pavel Hasan Joy | **AI Pair-Programmer:** Claude (Anthropic)  
> **Direct PDF Download:** [VALIDATION-AND-LIMITATIONS.pdf](./VALIDATION-AND-LIMITATIONS.pdf) · [docs/VALIDATION-AND-LIMITATIONS.pdf](./docs/VALIDATION-AND-LIMITATIONS.pdf)

---

## 🎥 Section 09 Video Screen Recording & Voiceover Script (18s)

```text
Timecode: 03:00 – 03:18 (18.0 seconds)
English Voiceover Script:
"I also test the analysis against held-out years. Current prediction ranges still need better calibration. So, future results are exploratory projections, not exact local forecasts."
```

### Video Recording Synchronization Beat Sheet

| Timecode | On-Screen Visual Action | Spoken Voiceover Synchronization |
| :--- | :--- | :--- |
| **03:00 – 03:04** | Show Part 1: Temporal Backtesting Split (2001–2015 Train vs. 2016–2025 Test, 640 District-Years). | *"I also test the analysis against held-out years..."* |
| **03:05 – 03:09** | Highlight Part 2: National Error Metrics (Monsoon MAE: 639.8 mm, Heat MAE: 2.07 °C). | *"...Current prediction ranges..."* |
| **03:10 – 03:14** | Focus on Part 3: Honest Calibration Disclosure (Empirical coverage 20.2%–55.0% vs 95% nominal). | *"...still need better calibration..."* |
| **03:15 – 03:18** | Display Part 4: Scientific Limitations Box (*"Exploratory Projections, not exact forecasts"*). | *"...So, future results are exploratory projections, not exact local forecasts."* |

---

## Part 1: Out-of-Sample Empirical Backtesting Framework

To prevent model over-fitting and avoid synthetic overconfidence, Climate Lens subjects its statistical trend models to **strict temporal out-of-sample backtesting** using authentic NASA POWER satellite assimilations across all 64 districts of Bangladesh (2001–2025):

- **Training Period (2001 – 2015 · 15 Years):**  
  Used exclusively to train robust non-parametric **Theil–Sen linear regressions** and calculate historical residual standard deviations ($\sigma_{\text{res}}$). The model was blinded to post-2015 observations.
- **Held-Out Test Period (2016 – 2025 · 10 Years):**  
  Unseen ground truth observations used to evaluate the trained model across 64 administrative districts $\times$ 10 test years = **640 out-of-sample district-year evaluations**.
- **Source Code Implementation:**  
  Reproducible via `scripts/backtest.mjs`, reading raw climate series from `src/data/climate.json` and generating `src/data/validation.json`.

---

## Part 2: National Test-Period Error Summary (2016–2025 Ground Truth)

All metrics represent national aggregates across all 64 districts and 10 held-out evaluation years ($N = 640$ evaluations):

| Climate Indicator | Observed Baseline (Mean) | Mean Absolute Error (MAE) | Root Mean Sq. Error (RMSE) | 95% Nominal Interval Coverage | Empirical Calibration Assessment |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Monsoon Precipitation (Jun–Sep)** | 1,531 mm | **639.78 mm** | **778.12 mm** | **47.3%** | Substantial inter-annual monsoon volatility; requires ensemble ribbons. |
| **Annual Total Precipitation** | 2,240 mm | **1,129.34 mm** | **1,300.52 mm** | **20.2%** | Severe non-stationary variance; poorly bounded by linear models. |
| **Summer Peak Heat (Mar–May Tmax)** | 35.8 °C | **2.07 °C** | **2.53 °C** | **55.0%** | Stable thermal momentum; accurately tracks regional planetary warming. |
| **Root-Zone Soil Wetness (0–100 cm)** | 62.4% | **8.97%** | **9.57%** | **21.1%** | Heavily influenced by regional deep tube-well irrigation & canal drainage. |

---

## Part 3: Prediction Interval Calibration Disclosure (Scientific Honesty)

> ### ⚖️ Scientific Integrity Statement: Why Empirical Coverage is 20.2%–55.0% vs Nominal 95%
> A conventional Gaussian linear regression assumes that a $\pm 1.96 \sigma_{\text{res}}$ prediction envelope encompasses 95.0% of future observations. Under real-world South Asian meteorological dynamics, our empirical backtest achieves only **20.2% to 55.0%** coverage across the test period.
> 
> **We deliberately disclose this limitation rather than hiding it:**
> 1. **Chaotic Monsoon Variance:** Rainfall extremes in Bangladesh are driven by oceanic oscillations (ENSO, Indian Ocean Dipole). Extreme outlier deluges (e.g., the 2022 Sylhet deluge where interval coverage dropped to 5.0%) break linear Gaussian assumptions.
> 2. **Physical Ensemble Mitigation:** To address statistical band under-dispersion, Climate Lens supplements Theil–Sen baselines with **NASA NEX-GDDP-CMIP6 downscaled physical climate model ensembles** (5 GCMs: GFDL-ESM4, MPI-ESM1-2-HR, MRI-ESM2-0, EC-Earth3, UKESM1-0-LL), providing dynamic 10th-to-90th percentile physical uncertainty bands.

---

## Part 4: Division-Level Empirical Validation Matrix

Empirical validation metrics across all 8 administrative divisions of Bangladesh (2016–2025 ground truth):

| Division | Districts | Monsoon MAE | Monsoon Coverage | Summer Heat MAE | Summer Heat Coverage | Annual Rain MAE | Annual Rain Coverage | Regional Hydro-Climate Character |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Khulna** | 10 | **357.67 mm** | **81.0%** | **1.60 °C** | **64.0%** | **634.49 mm** | **43.0%** | Highest calibration fidelity; stable coastal delta dynamics. |
| **Chittagong** | 11 | **841.32 mm** | **48.2%** | **1.47 °C** | **65.5%** | **1,241.80 mm** | **34.5%** | High thermal predictability; moderate orographic rain variation. |
| **Dhaka** | 13 | **598.12 mm** | **46.9%** | **2.04 °C** | **63.1%** | **1,203.88 mm** | **8.5%** | Dense river basin; annual precipitation severely non-linear. |
| **Rajshahi** | 8 | **414.15 mm** | **45.0%** | **2.24 °C** | **57.5%** | **768.56 mm** | **10.0%** | Barind tract semi-arid region; vulnerable to heatwaves. |
| **Barisal** | 6 | **1,032.22 mm** | **45.0%** | **1.44 °C** | **58.3%** | **1,659.10 mm** | **28.3%** | Coastal estuary; cyclonic storm surge rainfall spikes. |
| **Rangpur** | 8 | **429.62 mm** | **43.8%** | **3.11 °C** | **30.0%** | **793.85 mm** | **13.8%** | Teesta floodplain; cold waves and heat shocks elevate MAE. |
| **Mymensingh** | 4 | **735.98 mm** | **20.0%** | **3.37 °C** | **20.0%** | **1,536.30 mm** | **0.0%** | Piedmont floodplains; strong localized cloudburst volatility. |
| **Sylhet** | 4 | **1,112.97 mm** | **5.0%** | **2.28 °C** | **52.5%** | **2,005.91 mm** | **2.5%** | Meghalaya orographic runoff; catastrophic 2022 flash flood outlier. |

---

## Part 5: Fundamental Scientific Limitations & Methodological Boundaries

### 1. Spatial Grid Resolution (~50 km)
NASA POWER meteorological datasets are delivered on a 0.5° × 0.5° latitude-longitude grid (~55 km). Smaller neighboring districts (such as Dhaka, Narayanganj, and Gazipur) that fall within the same grid cell exhibit identical meteorological readings. Micro-scale urban heat islands, localized convective cloudbursts, and urban drainage bottlenecks cannot be resolved at this spatial scale.

### 2. Statistical Trend Extrapolation vs. Physics-Based GCMs
Theil–Sen non-parametric linear regressions assume that historical 2001–2025 observational momentum continues linearly. For non-linear greenhouse gas radiative forcing, atmospheric dynamics, and monsoon shifts, users must evaluate the integrated NASA NEX-GDDP-CMIP6 downscaled ensemble projections (SSP2-4.5 and SSP5-8.5).

### 3. Exploratory Scenario Projections vs. Deterministic Weather Forecasts
All 2040 and 2050 trajectories generated by Climate Lens are **exploratory scenario projections** for long-term adaptation planning, risk assessment, and education. They are **NOT deterministic local weather forecasts** and must never replace official real-time meteorological advisories or cyclone warnings issued by the Bangladesh Meteorological Department (BMD).

### 4. Sensor Transition Baseline (2001 Start Year)
The dataset initiates in 2001 to ensure sensor homogeneity following the operational assimilation of TRMM and MODIS satellites in NASA POWER, preventing artificial pre-2001 instrumental step-changes.

### 5. Confounding Factors in Climate Impacts
Documented changes in rice crop yields, mango flowering, and fish catches in Bangladesh are heavily confounded by non-climatic determinants: High-Yielding Variety (HYV) seed adoption, deep tube well irrigation expansion, upstream barrages (Farakka), coastal embankments, and fishing gear regulations. Observed statistical associations do not imply single-variable climate causality.

---

## Verification & Reproducibility Command

To independently reproduce the empirical validation dataset from raw NASA POWER observations:

```bash
# Execute out-of-sample backtest script across all 64 districts
node scripts/backtest.mjs

# Compile high-resolution PDF dossier via Chrome Headless
chrome --headless=new --disable-gpu --print-to-pdf="VALIDATION-AND-LIMITATIONS.pdf" "docs/validation-report.html"
```

