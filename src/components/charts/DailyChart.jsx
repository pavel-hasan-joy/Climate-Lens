import { Bar, Line } from 'react-chartjs-2';
import { TIME } from '../../lib/constants.js';
import { yyyymmdd } from '../../lib/format.js';
import { baseOptions, crosshairPlugin } from './setup.js';

const UNIT = { rain: 'mm', tmax: '°C', wet: '%' };
const NAME = { rain: 'Rain', tmax: 'Max temp', wet: 'Soil wetness' };

// The latest daily readings from NASA POWER
export default function DailyChart({ daily }) {
  const labels = daily.dates.map((d) => yyyymmdd(d).replace(/ \d{4}$/, ''));
  const ds = {
    label: NAME[daily.key],
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
  const options = baseOptions(UNIT[daily.key]);
  const Chart = daily.key === 'rain' ? Bar : Line;
  return <Chart data={{ labels, datasets: [ds] }} options={options} plugins={[crosshairPlugin]} />;
}
