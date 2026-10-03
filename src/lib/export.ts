import { FUTURE_YEAR, HEATWAVE_THRESHOLD, HEAVY_RAIN_THRESHOLD, METRICS, PAST_YEARS } from './constants';
import { ALL_YEARS, climate, extremesFor, statsFor } from './metrics';
import { formatValue, monthName } from './format';
import type { DistrictProperties } from './types';

/**
 * Downloads arbitrary string data as a file in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the current Chart.js canvas as a clean PNG image.
 */
export function exportChartAsPNG(
  chartElementOrCanvas: HTMLElement | HTMLCanvasElement | null,
  filename = 'climate-chart.png',
): void {
  if (!chartElementOrCanvas) return;
  const canvas =
    chartElementOrCanvas.tagName === 'CANVAS'
      ? (chartElementOrCanvas as HTMLCanvasElement)
      : chartElementOrCanvas.querySelector('canvas');

  if (!canvas) return;
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Generates and downloads a tidy CSV of historical + projected climate values for a district.
 */
export function exportDistrictCSV(district: DistrictProperties | null | undefined): void {
  if (!district) return;
  const id = district.id;
  const raw = climate.districts[id];
  if (!raw) return;

  const monsoonStats = statsFor([id], 'monsoon');
  const rainStats = statsFor([id], 'rain');
  const heatStats = statsFor([id], 'heat');
  const wetStats = statsFor([id], 'wet');

  // CSV Header
  const rows: (string | number)[][] = [
    ['Year', 'Type', 'Monsoon_Rain_mm', 'Yearly_Rain_mm', 'Peak_Heat_degC', 'Soil_Wetness_pct'],
  ];

  ALL_YEARS.forEach((yr, idx) => {
    const isProjected = yr > climate.lastFullYear;
    const type = isProjected ? 'Projected_TheilSen' : 'Observed_NASA_POWER';
    const mRain = monsoonStats.byYear[idx]?.toFixed(1) ?? '';
    const yRain = rainStats.byYear[idx]?.toFixed(1) ?? '';
    const pHeat = heatStats.byYear[idx]?.toFixed(2) ?? '';
    const sWet = wetStats.byYear[idx]?.toFixed(1) ?? '';
    rows.push([yr, type, mRain, yRain, pHeat, sWet]);
  });

  // Also include 12-month seasonal climatology
  rows.push([]);
  rows.push(['--- Seasonal 12-Month Cycles ---']);
  rows.push([
    'Month',
    'Past_Rain_mm',
    'Now_Rain_mm',
    'Future_Rain_mm',
    'Past_Heat_degC',
    'Now_Heat_degC',
    'Future_Heat_degC',
  ]);
  for (let m = 0; m < 12; m++) {
    rows.push([
      monthName(m),
      rainStats.cycle.past[m]?.toFixed(1) ?? '',
      rainStats.cycle.now[m]?.toFixed(1) ?? '',
      rainStats.cycle.future[m]?.toFixed(1) ?? '',
      heatStats.cycle.past[m]?.toFixed(2) ?? '',
      heatStats.cycle.now[m]?.toFixed(2) ?? '',
      heatStats.cycle.future[m]?.toFixed(2) ?? '',
    ]);
  }

  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\r\n');
  downloadFile(csv, `climate-lens-${id}-data.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Generates a clean, professional, single-page PDF summary report for a district.
 */
export async function exportDistrictPDF(
  district: DistrictProperties | null | undefined,
  divisionName?: string | null,
): Promise<void> {
  if (!district) return;
  const id = district.id;

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const mStats = {
    monsoon: statsFor([id], 'monsoon'),
    rain: statsFor([id], 'rain'),
    heat: statsFor([id], 'heat'),
    wet: statsFor([id], 'wet'),
  };

  // Header Banner
  doc.setFillColor(11, 15, 25);
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(57, 135, 229);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Climate Lens — Bangladesh', 16, 16);

  doc.setTextColor(245, 247, 251);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`District Climate Profile: ${district.name} (${divisionName || ''} Division)`, 16, 26);

  doc.setTextColor(140, 150, 175);
  doc.setFontSize(9);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · Sources: NASA POWER & geoBoundaries`,
    16,
    33,
  );

  // Section: Overview
  let y = 48;
  doc.setTextColor(20, 25, 35);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Historical Baseline vs. Current & Future Projections', 16, y);

  y += 7;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 65, 80);
  doc.text(
    `This report summarizes district-level climate metrics evaluated against the 2001–2010 multi-year baseline. ` +
      `Future projections are calculated using robust Theil–Sen linear regressions extended to ${FUTURE_YEAR}.`,
    16,
    y,
    { maxWidth: 178 },
  );

  y += 14;

  // Table of 4 Key Metrics
  doc.setFillColor(240, 244, 250);
  doc.rect(16, y, 178, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 40, 60);
  doc.text('Metric', 20, y + 5.5);
  doc.text(`Past (${PAST_YEARS[0]}–${PAST_YEARS[1]})`, 70, y + 5.5);
  doc.text('Now (Recent 12 mo)', 110, y + 5.5);
  doc.text(`Future (${FUTURE_YEAR} Trend)`, 150, y + 5.5);

  y += 8;
  METRICS.forEach((m, idx) => {
    const s = mStats[m.id];
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 253);
      doc.rect(16, y, 178, 8, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 45, 55);
    doc.text(m.label, 20, y + 5.5);
    doc.text(formatValue(m.id, s.past), 70, y + 5.5);
    doc.text(formatValue(m.id, s.now), 110, y + 5.5);
    doc.text(`${formatValue(m.id, s.future)} (±${formatValue(m.id, s.band)})`, 150, y + 5.5);
    y += 8;
  });

  y += 6;

  // Section 2: Trends and Statistical Significance
  doc.setTextColor(20, 25, 35);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Decadal Trends & Mann–Kendall Significance', 16, y);

  y += 7;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 65, 80);

  METRICS.forEach((m) => {
    const s = mStats[m.id];
    const decadal = (s.slope * 10).toFixed(m.id === 'heat' ? 2 : 1);
    const sign = s.slope >= 0 ? '+' : '';
    const p = s.mk.p.toFixed(3);
    const sigLabel = s.mk.significant
      ? 'Statistically significant (p < 0.05)'
      : 'Not statistically significant (p ≥ 0.05)';
    doc.text(`• ${m.label}: ${sign}${decadal} ${m.unit}/decade — ${sigLabel} (Mann–Kendall p = ${p})`, 18, y);
    y += 6;
  });

  y += 4;

  // Section 3: Seasonal Analysis
  doc.setTextColor(20, 25, 35);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Seasonal Shifts & Climatology', 16, y);

  y += 6;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 65, 80);
  doc.text(
    `Rainfall distribution shows that monsoon precipitation (June–September) accounts for the majority of the annual ` +
      `inflow. Peak temperatures are recorded between March and May, where higher warming trajectories increase evapotranspiration.`,
    16,
    y,
    { maxWidth: 178 },
  );

  y += 12;

  // Section 4: Recent Extreme Events
  const extremes = extremesFor([id], HEATWAVE_THRESHOLD, HEAVY_RAIN_THRESHOLD);
  doc.setTextColor(20, 25, 35);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Recent Extreme Events (Last 60 Days)', 16, y);

  y += 6;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 65, 80);
  doc.text(
    `• Heatwave days (T_max > ${HEATWAVE_THRESHOLD}°C): ${extremes.heatwaveDays} days\n` +
      `• Longest consecutive dry spell (rain < 1mm): ${extremes.longestDrySpell} days\n` +
      `• Heavy rain days (precipitation > ${HEAVY_RAIN_THRESHOLD}mm): ${extremes.heavyRainDays} days`,
    18,
    y,
  );

  y += 18;

  // Section 5: Scientific Notes & Methodology
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(16, y, 178, 38, 2, 2, 'F');
  doc.setDrawColor(215, 225, 238);
  doc.roundedRect(16, y, 178, 38, 2, 2, 'S');

  doc.setTextColor(25, 35, 55);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Scientific Limitations & Methodology Notes', 20, y + 6);

  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 75, 90);
  const notes =
    '1. Spatial Resolution: NASA POWER data has ~0.5° (~55 km) horizontal resolution; contiguous or adjacent districts may share identical or interpolated climate grid values.\n' +
    '2. Projection Model: Projections utilize Theil–Sen non-parametric median-slope linear regression fitted over 2001–2025. They represent statistical trends, not coupled CMIP6 climate models.\n' +
    '3. Baseline Period: Baseline corresponds to 2001–2010. Discontinuities in satellite precipitation before 2001 are excluded.';
  doc.text(notes, 20, y + 12, { maxWidth: 170 });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 155, 170);
  doc.text('Climate Lens — Bangladesh Open Science Platform · Powered by NASA Earth Science Data', 105, 287, {
    align: 'center',
  });

  doc.save(`climate-lens-${id}-report.pdf`);
}
