import { animate, useInView, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { cn } from '@/utils/format';

export interface CountUpProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  formatter?: (value: number) => string;
}

export function CountUp({
  value,
  duration = 1.2,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
  formatter,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => {
    if (formatter) return formatter(latest);
    return `${prefix}${latest.toFixed(decimals)}${suffix}`;
  });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.25, 0.1, 0.25, 1],
    });
    return controls.stop;
  }, [inView, motionValue, value, duration]);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (latest) => {
      if (ref.current) ref.current.textContent = latest;
    });
    return unsubscribe;
  }, [rounded]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      {decimals > 0 ? (0).toFixed(decimals) : '0'}
      {suffix}
    </span>
  );
}
