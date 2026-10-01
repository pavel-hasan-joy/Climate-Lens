import useTween from '../hooks/useTween.js';
import { formatNumber } from '../lib/format.js';

export default function AnimatedNumber({ value, digits = 0 }) {
  return <>{formatNumber(useTween(value, 700), digits)}</>;
}
