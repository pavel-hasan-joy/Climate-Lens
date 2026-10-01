import { useEffect, useRef, useState } from 'react';

const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

// Smoothly animates from the previous value to `target`.
export default function useTween(target: number, duration: number = 600): number {
  const [value, setValue] = useState<number>(target);
  const current = useRef<number>(target);

  useEffect(() => {
    const from = current.current;
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      current.current = from + (target - from) * easeOut(t);
      setValue(current.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
