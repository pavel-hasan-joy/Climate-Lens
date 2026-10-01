import { Line } from 'react-chartjs-2';
import { METRIC, TIMES } from '../../lib/constants.js';
import { monthName } from '../../lib/format.js';
import { baseOptions, crosshairPlugin } from './setup.js';

// The 12-month cycle for Past, Now and Future on one chart
export default function SeasonChart({ stats, metric, time }) {
  const { unit } = METRIC[metric];
  const data = {
    labels: [...Array(12).keys()].map(monthName),
    datasets: TIMES.map((t) => ({
      label: t.label,
      data: stats.cycle[t.id],
      borderColor: t.color,
      backgroundColor: t.color,
      borderWidth: t.id === time ? 3 : 1.5,
      borderDash: t.id === 'future' ? [6, 4] : [],
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 4,
      order: t.id === time ? 0 : 1,
      segment: { borderColor: t.id === time ? undefined : t.color + '80' },
    })),
  };
  return <Line data={data} options={baseOptions(unit)} plugins={[crosshairPlugin]} />;
}
