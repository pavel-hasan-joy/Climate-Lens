import { useMemo } from 'react';
import climateStats from '../data/analysis/climate-stats.json';
import dataStatus from '../data/analysis/data-status.json';
import yieldClimate from '../data/analysis/yield-climate.json';
import { useTranslation } from '../lib/i18n';

interface DataMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DataMethodsModal({ isOpen, onClose }: DataMethodsModalProps) {
  const { lang } = useTranslation();

  const sources = useMemo(
    () => [
      {
        name: 'NASA POWER (Prediction Of Worldwide Energy Resources)',
        short: 'NASA POWER',
        endpoint: 'https://power.larc.nasa.gov/api/temporal',
        license: 'NASA Open Data Policy (Public Domain)',
        fetchTime: climateStats.metadata.fetchedAt,
        recordCount: '64 districts × 25 years (2001–2025) daily & monthly',
        variables: 'T2M_MAX (Max Temp), PRECTOTCORR (Precipitation), GWETROOT (Root-zone wetness)',
        methodology:
          'Theil–Sen robust median slope per decade, Mann–Kendall rank correlation test for monotonic trend significance (α = 0.05), 2001–2010 baseline climatology deviation.',
      },
      {
        name: 'NASA NEX-GDDP-CMIP6 Downscaled Climate Projections',
        short: 'NEX-GDDP-CMIP6',
        endpoint: 'https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6',
        license: 'Creative Commons Attribution 4.0 (CC-BY 4.0)',
        fetchTime: '2026-09-28',
        recordCount: '64 districts × 2 scenarios × 5 models up to 2050',
        variables: 'tasmax (Daily Max Temperature), pr (Precipitation flux)',
        methodology:
          '5-model multi-model ensemble (GFDL-ESM4, MPI-ESM1-2-HR, MRI-ESM2-0, EC-Earth3, UKESM1). Delta baseline-adjustment bias-correction anchored to 2001–2010 observed baseline.',
      },
      {
        name: 'NASA EONET v3 (Earth Observatory Natural Event Tracker)',
        short: 'NASA EONET v3',
        endpoint: 'https://eonet.gsfc.nasa.gov/api/v3/events',
        license: 'NASA Open Data Policy (Public Domain)',
        fetchTime: dataStatus.sources.eonet.lastFetch,
        recordCount: `${dataStatus.sources.eonet.totalEvents} natural hazard events (BBox: 87.5, 27.0, 93.0, 20.0)`,
        variables: 'Floods, Severe Storms, Wildfires, Landslides, Droughts',
        methodology:
          'Real-time satellite detection and automated centroid normalization for active geospatial hazard monitoring.',
      },
      {
        name: 'World Bank Open Data (FAOSTAT) & BBS Agricultural Statistics',
        short: 'World Bank & BBS',
        endpoint: 'http://api.worldbank.org/v2/country/BGD/indicator/AG.YLD.CREL.KG',
        license: 'World Bank Open Data (CC-BY 4.0)',
        fetchTime: yieldClimate.metadata.fetchedAt,
        recordCount: '24 years national cereal and seasonal rice yield series (2001–2024)',
        variables: 'Cereal yield (kg/ha), Aus, Aman, Boro rice yields (MT/ha)',
        methodology:
          'Technology trend removal via linear regression, Spearman rank correlation test (ρ) with 95% confidence intervals against seasonal climate indicators.',
      },
      {
        name: 'GBIF (Global Biodiversity Information Facility)',
        short: 'GBIF Secretariat',
        endpoint: 'https://api.gbif.org/v1/occurrence/search',
        license: 'Creative Commons Attribution 4.0 (CC-BY 4.0)',
        fetchTime: dataStatus.sources.gbif.lastFetch,
        recordCount: '1,056 verified georeferenced occurrence records across Bangladesh',
        variables:
          'Panthera tigris, Platanista gangetica, Orcaella brevirostris, Tenualosa ilisha, Elephas maximus, Prionailurus viverrinus',
        methodology:
          'Point occurrence spatial mapping with explicit observer-effort disclosure and historical timeline aggregation.',
      },
      {
        name: 'IUCN Bangladesh Red List 2015',
        short: 'IUCN Red List',
        endpoint: 'https://www.iucn.org/regions/asia/countries/bangladesh',
        license: 'Official Government of Bangladesh & IUCN Publication',
        fetchTime: '2026-09-25',
        recordCount: '1,619 assessed taxa (31 regionally extinct, 390 threatened)',
        variables: 'Mammals, Birds, Reptiles, Amphibians, Freshwater Fishes, Crustaceans',
        methodology: 'IUCN Red List Categories and Criteria Version 3.1 regional assessment protocols.',
      },
    ],
    [],
  );

  if (!isOpen) return null;

  // Export handlers
  const handleDownloadJSON = (filename: string, dataObj: any) => {
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    // Generate CSV for district climate stats
    const rows = [
      [
        'District',
        'Division',
        'Metric',
        'Sens_Slope_Per_Decade',
        'MK_P_Value',
        'Significant',
        'Trend',
        'Baseline_2001_2010_Mean',
        'Latest_Anomaly',
        'Percentile',
      ],
    ];

    const dMap = (climateStats.districts || {}) as Record<string, any>;
    for (const [id, d] of Object.entries(dMap)) {
      for (const [metricKey, mStats] of Object.entries(d.metrics as Record<string, any>)) {
        rows.push([
          id,
          d.division,
          metricKey,
          String(mStats.sensSlopePerDecade),
          String(mStats.mannKendall.pValue),
          String(mStats.mannKendall.pValue < 0.05),
          mStats.mannKendall.trend,
          String(mStats.baseline2001_2010.mean),
          String(mStats.baseline2001_2010.latestYearAnomaly),
          String(mStats.recent12MoPercentile),
        ]);
      }
    }

    const csvContent = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bangladesh_district_climate_analysis_2001_2025.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content data-methods-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-methods-title"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="data-methods-badge">Scientific Rigor & Open Data</span>
            <h2 id="data-methods-title" className="modal-title">
              {lang === 'bn' ? 'তথ্যসূত্র, লাইসেন্স ও বিশ্লেষণ পদ্ধতি' : 'Data Sources, Licenses & Methodology'}
            </h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Data Download Action Bar */}
        <div className="data-download-bar">
          <span className="download-bar-label">
            {lang === 'bn' ? 'সম্পূর্ণ ডেটাসেট ডাউনলোড করুন:' : 'Download Verified Datasets:'}
          </span>
          <div className="download-btn-group">
            <button type="button" className="data-dl-btn primary" onClick={handleDownloadCSV}>
              📥 Download CSV (District Stats)
            </button>
            <button
              type="button"
              className="data-dl-btn"
              onClick={() => handleDownloadJSON('climate-lens-stats.json', climateStats)}
            >
              📄 Download Climate JSON
            </button>
            <button
              type="button"
              className="data-dl-btn"
              onClick={() => handleDownloadJSON('climate-lens-yield.json', yieldClimate)}
            >
              🌾 Download Yield JSON
            </button>
          </div>
        </div>

        {/* Sources & Methodology Scroll Area */}
        <div className="data-methods-scroll">
          {sources.map((src, idx) => (
            <div key={idx} className="source-detail-card card">
              <div className="source-card-head">
                <h3 className="source-name">{src.name}</h3>
                <span className="source-license-pill">{src.license}</span>
              </div>

              <div className="source-card-meta-grid">
                <div className="meta-cell">
                  <span className="meta-label">API Endpoint / Source:</span>
                  <a href={src.endpoint} target="_blank" rel="noopener noreferrer" className="meta-link">
                    {src.endpoint} &rarr;
                  </a>
                </div>
                <div className="meta-cell">
                  <span className="meta-label">Records / Coverage:</span>
                  <span className="meta-val">{src.recordCount}</span>
                </div>
                <div className="meta-cell">
                  <span className="meta-label">Fetch Timestamp:</span>
                  <span className="meta-val">{new Date(src.fetchTime).toLocaleString()}</span>
                </div>
                <div className="meta-cell">
                  <span className="meta-label">Variables / Parameters:</span>
                  <span className="meta-val">{src.variables}</span>
                </div>
              </div>

              <div className="source-method-box">
                <span className="method-label">Exact Analytical Method:</span>
                <p className="method-text">{src.methodology}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            borderTop: '1px solid var(--line)',
            marginTop: '16px',
            paddingTop: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
            Pipeline: Climate Lens Phase 9A & 9B Engine · Reproducible with <code>npm run data:analyze</code>
          </span>
          <button type="button" className="action-btn" onClick={onClose}>
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
