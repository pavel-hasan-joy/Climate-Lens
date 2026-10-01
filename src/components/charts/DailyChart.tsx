import { Bar, Line } from 'react-chartjs-2';
import { TIME } from '../../lib/constants';
import { yyyymmdd } from '../../lib/format';
import { baseOptions, crosshairPlugin } from './setup';

const UNIT: Record<string, string> = { rain: 'mm', tmax: '°C', wet: '%' };
const NAME: Record<string, string> = { rain: 'Rain', tmax: 'Max temp', wet: 'Soil wetness' };

interface DailyChartProps {
  daily: {
    dates: string[];
    values: number[];
    key: string;
    live?: boolean;
  };
}

// The latest daily readings from NASA POWER
export default function DailyChart({ daily }: DailyChartProps) {
  const labels = daily.dates.map((d) => yyyymmdd(d).replace(/ \d{4}$/, ''));
  const ds = {
    label: NAME[daily.key] || daily.key,
    data: daily.values,
    borderColor: TIME.now.color,
    backgroundColor: TIME.now.color,
    borderRadius: 3,
    borderWidth: daily.key === 'rain' ? 0 : 2,
    pointRadius: 0,
    tension: 0.3,
    categoryPercentage: 0.9,
    barPercentage: 0.9,
  };
  const options = baseOptions(UNIT[daily.key] || '');
  return daily.key === 'rain' ? (
    <Bar data={{ labels, datasets: [ds] }} options={options} plugins={[crosshairPlugin]} />
  ) : (
    <Line data={{ labels, datasets: [ds] }} options={options} plugins={[crosshairPlugin]} />
  );
}
