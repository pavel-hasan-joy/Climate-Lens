import useTween from '../hooks/useTween';
import { formatNumber } from '../lib/format';
import { useTranslation } from '../lib/i18n';

interface AnimatedNumberProps {
  value: number;
  digits?: number;
}

export default function AnimatedNumber({ value, digits = 0 }: AnimatedNumberProps) {
  const { lang } = useTranslation();
  return <>{formatNumber(useTween(value, 700), digits, lang)}</>;
}
