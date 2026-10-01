import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  ChartOptions,
  Plugin,
} from 'chart.js';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip);

Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
Chart.defaults.color = '#8b93a7';

export const INK = {
  primary: '#f5f7fb',
  secondary: '#b4bccd',
  muted: '#6f7890',
  grid: 'rgba(255,255,255,.06)',
};

export const baseOptions = (unit: string): ChartOptions<any> => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 800, easing: 'easeOutQuart' },
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0b0f19',
      borderColor: 'rgba(255,255,255,.12)',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 10,
      titleColor: INK.primary,
      bodyColor: INK.secondary,
      boxWidth: 8,
      boxHeight: 8,
      boxPadding: 4,
      usePointStyle: true,
      filter: (item: any) => item.raw != null && !(item.dataset as any).hideInTooltip,
      callbacks: {
        label: (c: any) =>
          ` ${c.dataset.label}: ${Math.round((c.raw as number) * 10) / 10}${unit === '%' ? '%' : ' ' + unit}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { maxRotation: 0, autoSkipPadding: 14, font: { size: 10 } },
    },
    y: {
      grid: { color: INK.grid },
      border: { display: false },
      ticks: { maxTicksLimit: 5, font: { size: 10 } },
    },
  },
});

// Shades an x-range (e.g. the 2001–2010 "past" window) behind the data
export const shadePlugin: Plugin = {
  id: 'shade',
  beforeDatasetsDraw(chart, _args, opts) {
    const { ctx, chartArea, scales } = chart;
    const ranges =
      (opts as { ranges?: Array<{ from: number | string; to: number | string; color: string }> })?.ranges || [];
    ranges.forEach(({ from, to, color }) => {
      const x0 = scales.x.getPixelForValue(from as number) - 4;
      const x1 = scales.x.getPixelForValue(to as number) + 4;
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x0, chartArea.top, x1 - x0, chartArea.bottom - chartArea.top, 6);
      ctx.fill();
      ctx.restore();
    });
  },
};

// Vertical hover line
export const crosshairPlugin: Plugin = {
  id: 'crosshair',
  afterDatasetsDraw(chart) {
    const a = chart.tooltip?.getActiveElements?.();
    if (!a?.length) return;
    const { ctx, chartArea } = chart;
    const x = a[0].element.x;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  },
};
