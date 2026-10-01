import { Line } from 'react-chartjs-2';
import { METRIC, TIME, TIMES } from '../../lib/constants';
import { monthName } from '../../lib/format';
import { baseOptions, crosshairPlugin } from './setup';
import type { DistrictStats, MetricId, TimeId } from '../../lib/types';

interface SeasonChartProps {
  stats: DistrictStats;
  compareStats?: DistrictStats | null;
  metric: MetricId;
  time: TimeId;
  districtName?: string;
  compareName?: string;
}

// The 12-month cycle for Past, Now and Future on one chart
// Supports overlaid two-district comparison when compareStats is provided
export default function SeasonChart({
  stats,
  compareStats = null,
  metric,
  time,
  districtName = 'District 1',
  compareName = 'District 2',
}: SeasonChartProps) {
  const { unit } = METRIC[metric];
  const isCompare = !!compareStats;
  const labels = [...Array(12).keys()].map((i) => monthName(i));

  let datasets: Record<string, unknown>[] = [];

  if (isCompare && compareStats) {
    const d1Color = '#3987e5';
    const d2Color = '#f59e0b';
    const curTimeLabel = TIME[time]?.label || 'Now';

    datasets = [
      {
        label: `${districtName} (${curTimeLabel})`,
        data: stats.cycle[time],
        borderColor: d1Color,
        backgroundColor: 'rgba(57, 135, 229, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
        order: 0,
      },
      {
        label: `${compareName} (${curTimeLabel})`,
        data: compareStats.cycle[time],
        borderColor: d2Color,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
        order: 0,
      },
    ];

    if (time !== 'past') {
      datasets.push(
        {
          label: `${districtName} (Past baseline)`,
          data: stats.cycle.past,
          borderColor: d1Color + '80',
          borderWidth: 1.5,
          borderDash: [5, 4],
          fill: false,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 3,
          order: 1,
        },
        {
          label: `${compareName} (Past baseline)`,
          data: compareStats.cycle.past,
          borderColor: d2Color + '80',
          borderWidth: 1.5,
          borderDash: [5, 4],
          fill: false,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 3,
          order: 1,
        },
      );
    }
  } else {
    datasets = TIMES.map((t) => ({
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
    }));
  }

  const data = { labels, datasets };
  return <Line data={data as any} options={baseOptions(unit)} plugins={[crosshairPlugin]} />;
}
